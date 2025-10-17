import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/mongdb";
import { Message, Session, Sentiment } from "@/lib/mongodb/schemas";

const SENTIMENT_AGENT = process.env.LYZR_SENTIMENT_AGENT_ID || "";
const FEEDBACK_AGENT = process.env.LYZR_FEEDBACK_AGENT_ID || "";
const LYZR_API_KEY = process.env.LYZR_API_KEY || "";

interface LyzrInferenceResponse {
  response: string;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { session_id, user_id } = body;

    // Validate required fields
    if (!session_id || !user_id) {
      return NextResponse.json(
        { error: "Missing required fields: session_id, user_id" },
        { status: 400 }
      );
    }

    // Check if session exists
    const session = await Session.findOne({ session_id });
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Fetch all messages for the session (only role and content)
    const messages = await Message.find(
      { session_id },
      { role: 1, content: 1, _id: 0 } // Only select role and content fields
    ).sort({ created_at: 1 }); // Sort by creation time

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "No messages found for this session" },
        { status: 404 }
      );
    }

    // Format messages into a single conversation string
    const conversationText = messages
      .map(
        (msg) =>
          `${msg.role.charAt(0).toUpperCase() + msg.role.slice(1)}: ${
            msg.content
          }`
      )
      .join("\n\n");

    // Create the exit interview feedback prompt
    const feedbackPrompt = `Please analyze the following exit interview conversation and provide comprehensive feedback about the employee's experience. 
                            Exit Interview Conversation:
                            ${conversationText}
                            Provide specific, actionable insights based on the exit interview conversation.`;

    // Create the sentiment analysis prompt
    const sentimentPrompt = `Analyze the sentiment of each response in this exit interview conversation and extract key insights. For each user response, determine the sentiment (positive, negative, neutral), confidence level (0-1), and relevant themes.
                            Exit Interview Conversation:
                            ${conversationText}
                            Available themes: role-satisfaction, mentorship, communication, workload, management, support, work-life-balance, career-growth, company-culture, benefits.
                            Analyze only the user responses, not the interviewer questions.`;

    // Call both agents simultaneously (using user's agent for sentiment analysis)
    const [feedbackResponse, sentimentResponse] = await Promise.all([
      fetch("https://agent-prod.studio.lyzr.ai/v3/inference/chat/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": LYZR_API_KEY,
        },
        body: JSON.stringify({
          user_id: user_id,
          agent_id: FEEDBACK_AGENT,
          session_id: `${session_id}-feedback-${Date.now()}`,
          message: feedbackPrompt,
        }),
      }),
      fetch("https://agent-prod.studio.lyzr.ai/v3/inference/chat/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": LYZR_API_KEY,
        },
        body: JSON.stringify({
          user_id: user_id,
          agent_id: SENTIMENT_AGENT,
          session_id: `${session_id}-sentiment-${Date.now()}`,
          message: sentimentPrompt,
        }),
      }),
    ]);

    // Check if both requests were successful
    if (!feedbackResponse.ok || !sentimentResponse.ok) {
      const feedbackError = !feedbackResponse.ok
        ? await feedbackResponse.text()
        : null;
      const sentimentError = !sentimentResponse.ok
        ? await sentimentResponse.text()
        : null;

      console.error("Agent API errors:", { feedbackError, sentimentError });
      return NextResponse.json(
        {
          error:
            "Failed to generate feedback or sentiment analysis from AI service",
        },
        { status: 500 }
      );
    }

    const [feedbackData, sentimentData]: [
      LyzrInferenceResponse,
      LyzrInferenceResponse
    ] = await Promise.all([feedbackResponse.json(), sentimentResponse.json()]);

    // Parse the feedback response to structured format
    let structuredFeedback;
    try {
      structuredFeedback = JSON.parse(feedbackData.response);
      console.log("structuredFeedback", structuredFeedback);
    } catch (error) {
      console.error("Error parsing feedback response:", error);
    }

    // Parse sentiment analysis response
    let sentimentAnalysis = [];
    try {
      sentimentAnalysis = JSON.parse(sentimentData.response);
      console.log("sentimentAnalysis", sentimentAnalysis);
    } catch (error) {
      console.error("Error parsing sentiment response:", error);
      // Create basic sentiment data if parsing fails
      sentimentAnalysis = [
        {
          question_number: "Q1",
          question: "General feedback",
          response: "Unable to parse sentiment analysis",
          sentiment: "neutral",
          confidence: 0.5,
          themes: ["general"],
        },
      ];
    }

    // Save the structured feedback to the session
    await Session.findOneAndUpdate(
      { session_id },
      {
        $set: {
          feedback: structuredFeedback.summary,
          updated_at: new Date(),
        },
      }
    );

    // Save sentiment analysis data to the database
    const sentimentDocuments = [];
    for (const [index, sentiment] of sentimentAnalysis.results.entries()) {
      try {
        // Create or update sentiment document for each response
        const sentimentDoc = {
          session_id,
          user_id,
          question_number: sentiment.question_number || `Q${index + 1}`,
          question: sentiment.question || "Exit interview question",
          response: sentiment.response || "",
          sentiment: sentiment.sentiment as "positive" | "negative" | "neutral",
          confidence: Number(sentiment.confidence) || 0.5,
          themes: Array.isArray(sentiment.themes) ? sentiment.themes : [],
        };

        await Sentiment.findOneAndUpdate(
          {
            session_id,
            question_number: sentimentDoc.question_number,
          },
          sentimentDoc,
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          }
        );

        sentimentDocuments.push(sentimentDoc);
      } catch (error) {
        console.error(
          `Error saving sentiment for question ${sentiment.question_number}:`,
          error
        );
      }
    }

    // Return the feedback and sentiment data
    return NextResponse.json({
      success: true,
      feedback: structuredFeedback,
      sentiment_analysis: sentimentDocuments,
      session_info: {
        session_id: session.session_id,
        role: session.role,
        level: session.interview_level,
        duration_minutes: session.duration_minutes,
        total_messages: messages.length,
        user_responses: messages.filter((m) => m.role === "user").length,
        ai_questions: messages.filter((m) => m.role === "assistant").length,
      },
    });
  } catch (error) {
    console.error("Error generating feedback:", error);
    return NextResponse.json(
      { error: "Internal server error while generating feedback" },
      { status: 500 }
    );
  }
}
