/**
 * Messages API - Store and retrieve interview conversation messages
 * 
 * @access Public during active interview, HR after completion
 * 
 * POST /api/messages - Store new message
 * curl -X POST http://localhost:3000/api/messages \
 *   -H "Content-Type: application/json" \
 *   -d '{"role":"user","content":"Better opportunities elsewhere","session_id":"session_123"}'
 * 
 * GET /api/messages?session_id=session_123 - Retrieve conversation (supports ?limit, ?skip)
 * curl http://localhost:3000/api/messages?session_id=session_123&limit=50
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/mongdb";
import Message from "@/lib/mongodb/schemas/Message";
import Session from "@/lib/mongodb/schemas/Session";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { role, content, session_id } = body;

    // Validate required fields
    if (!role || !content || !session_id) {
      return NextResponse.json(
        { error: "Missing required fields: role, content, session_id" },
        { status: 400 }
      );
    }

    // Validate role is one of allowed values
    if (!["user", "assistant", "system"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be one of: user, assistant, system" },
        { status: 400 }
      );
    }

    // Verify session exists before creating message
    const session = await Session.findOne({ session_id });
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Create new message linked to session
    const message = new Message({
      role,
      content,
      session_id,
      user_id: session.user_id, // Link to the session's user
      created_at: new Date(),
    });

    await message.save();

    return NextResponse.json(
      {
        message: "Message stored successfully",
        data: {
          _id: message._id,
          role: message.role,
          content: message.content,
          session_id: message.session_id,
          created_at: message.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get("session_id");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    // session_id is required for retrieving messages
    if (!session_id) {
      return NextResponse.json(
        { error: "session_id is required" },
        { status: 400 }
      );
    }

    // Verify session exists
    const session = await Session.findOne({ session_id });
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Retrieve messages for the session
    // Sort by created_at ascending (oldest first) for proper conversation flow
    const messages = await Message.find({ session_id })
      .sort({ created_at: 1 })
      .skip(skip)
      .limit(Math.min(limit, 100)); // Cap at 100 messages per request

    // Get total count for pagination
    const totalMessages = await Message.countDocuments({ session_id });

    return NextResponse.json({
      messages,
      pagination: {
        total: totalMessages,
        limit,
        skip,
        hasMore: skip + messages.length < totalMessages,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
