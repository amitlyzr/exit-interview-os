/**
 * Sentiment API - AI-powered sentiment analysis for interview responses
 * 
 * @access HR users only
 * 
 * GET /api/sentiment - Retrieve sentiment data (supports ?session_id, ?user_id, ?sentiment, ?min_confidence, ?themes filters)
 * curl "http://localhost:3000/api/sentiment?session_id=session_123&sentiment=negative&min_confidence=0.7"
 * 
 * POST /api/sentiment - Create sentiment analysis record
 * curl -X POST http://localhost:3000/api/sentiment \
 *   -H "Content-Type: application/json" \
 *   -d '{"session_id":"session_123","question_number":"Q3","question":"What did you enjoy?","response":"Great team","sentiment":"positive","confidence":0.92,"themes":["company-culture"]}'
 * 
 * DELETE /api/sentiment - Delete sentiment record (requires ?session_id, ?question_number)
 * curl -X DELETE "http://localhost:3000/api/sentiment?session_id=session_123&question_number=Q3"
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/mongdb";
import { Sentiment } from "@/lib/mongodb/schemas";

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

    // Build dynamic query based on provided filters
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

    // Filter by minimum confidence threshold
    if (minConfidence) {
      query.confidence = { $gte: parseFloat(minConfidence) };
    }

    // Filter by themes (supports multiple themes)
    if (themes) {
      const themeArray = themes.split(",").map((t) => t.trim());
      query.themes = { $in: themeArray };
    }

    // Fetch sentiments with pagination, sorted by newest first
    const sentiments = await Sentiment.find(query)
      .sort({ created_at: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    // Get total count for pagination metadata
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

    // Validate sentiment is one of allowed values
    if (!["positive", "negative", "neutral"].includes(sentiment)) {
      return NextResponse.json(
        {
          success: false,
          message: "Sentiment must be one of: positive, negative, neutral",
        },
        { status: 400 }
      );
    }

    // Validate confidence is in valid range (0-1)
    if (confidence < 0 || confidence > 1) {
      return NextResponse.json(
        {
          success: false,
          message: "Confidence must be between 0 and 1",
        },
        { status: 400 }
      );
    }

    // Verify session exists and get user_id
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

    // Create or update sentiment record
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
