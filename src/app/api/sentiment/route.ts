import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/mongdb";
import { Sentiment } from "@/lib/mongodb/schemas";

// GET - Fetch sentiments by session_id or all sentiments with filtering
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const url = new URL(request.url);
    const sessionId = url.searchParams.get("session_id");
    const user_id = url.searchParams.get("user_id");
    const sentiment = url.searchParams.get("sentiment");
    const minConfidence = url.searchParams.get("min_confidence");
    const themes = url.searchParams.get("themes");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const skip = parseInt(url.searchParams.get("skip") || "0");

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};

    if (sessionId) {
      query.session_id = sessionId;
    }

    if (user_id) {
      query.user_id = user_id;
    }

    if (sentiment) {
      query.sentiment = sentiment;
    }

    if (minConfidence) {
      query.confidence = { $gte: parseFloat(minConfidence) };
    }

    if (themes) {
      const themeArray = themes.split(",").map((t) => t.trim());
      query.themes = { $in: themeArray };
    }

    // Fetch sentiments with pagination
    const sentiments = await Sentiment.find(query)
      .sort({ created_at: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    // Get total count for pagination
    const total = await Sentiment.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: {
        sentiments,
        pagination: {
          total,
          limit,
          skip,
          hasMore: skip + sentiments.length < total,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching sentiments:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error fetching sentiments",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST - Create or update sentiment analysis
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      session_id,
      question_number,
      question,
      response,
      sentiment,
      confidence,
      themes,
    } = body;

    // Validate required fields
    if (
      !session_id ||
      !question_number ||
      !question ||
      !sentiment ||
      confidence === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Missing required fields: session_id, question_number, question, sentiment, confidence",
        },
        { status: 400 }
      );
    }

    // Validate sentiment value
    if (!["positive", "negative", "neutral"].includes(sentiment)) {
      return NextResponse.json(
        {
          success: false,
          message: "Sentiment must be one of: positive, negative, neutral",
        },
        { status: 400 }
      );
    }

    // Validate confidence range
    if (confidence < 0 || confidence > 1) {
      return NextResponse.json(
        {
          success: false,
          message: "Confidence must be between 0 and 1",
        },
        { status: 400 }
      );
    }

    // Get session to link user_id
    const { Session } = await import("@/lib/mongodb/schemas");
    const session = await Session.findOne({ session_id });
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Session not found",
        },
        { status: 404 }
      );
    }

    // Create or update sentiment
    const sentimentData = {
      session_id,
      user_id: session.user_id, // Link to session's user
      question_number,
      question,
      response,
      sentiment,
      confidence,
      themes: themes || [],
    };

    const result = await Sentiment.findOneAndUpdate(
      { session_id, question_number },
      sentimentData,
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    return NextResponse.json({
      success: true,
      message: "Sentiment analysis saved successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error saving sentiment:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error saving sentiment analysis",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete sentiment by session_id and question_number
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const url = new URL(request.url);
    const sessionId = url.searchParams.get("session_id");
    const questionNumber = url.searchParams.get("question_number");

    if (!sessionId || !questionNumber) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Missing required parameters: session_id and question_number",
        },
        { status: 400 }
      );
    }

    const result = await Sentiment.findOneAndDelete({
      session_id: sessionId,
      question_number: questionNumber,
    });

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          message: "Sentiment not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Sentiment deleted successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error deleting sentiment:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error deleting sentiment",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
