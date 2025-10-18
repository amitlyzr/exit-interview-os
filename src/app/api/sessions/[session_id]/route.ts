/**
 * Session API - Manage individual exit interview sessions
 * 
 * @access HR users or session participants
 * 
 * GET /api/sessions/:session_id - Retrieve session details
 * curl http://localhost:3000/api/sessions/session_123
 * 
 * PATCH /api/sessions/:session_id - Update session (status, duration, etc.)
 * curl -X PATCH http://localhost:3000/api/sessions/session_123 \
 *   -H "Content-Type: application/json" \
 *   -d '{"status":"completed","duration_minutes":15}'
 * 
 * DELETE /api/sessions/:session_id - Delete session
 * curl -X DELETE http://localhost:3000/api/sessions/session_123
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/mongdb";
import Session from "@/lib/mongodb/schemas/Session";
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ session_id: string }> }
) {
  try {
    await connectDB();

    const { session_id } = await params;
    const body = await request.json();

    // Verify session exists before updating
    const session = await Session.findOne({ session_id });
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Build updates object with allowed fields only
    const allowedUpdates = ["status", "completed_at", "duration_minutes"];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: any = {};

    for (const field of allowedUpdates) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // Automatically set completion timestamp when status changes to completed
    if (updates.status === "completed" && !updates.completed_at) {
      updates.completed_at = new Date();
    }

    // Update session with new values
    const updatedSession = await Session.findOneAndUpdate(
      { session_id },
      { $set: updates },
      { new: true } // Return updated document
    );

    return NextResponse.json({
      message: "Session updated successfully",
      session: {
        session_id: updatedSession.session_id,
        user_id: updatedSession.user_id,
        name: updatedSession.name,
        email: updatedSession.email,
        role: updatedSession.role,
        interview_level: updatedSession.interview_level,
        tenure: updatedSession.tenure,
        status: updatedSession.status,
        created_at: updatedSession.created_at,
        updated_at: updatedSession.updated_at,
        started_at: updatedSession.started_at,
        completed_at: updatedSession.completed_at,
        duration_minutes: updatedSession.duration_minutes,
        feedback: updatedSession.feedback,
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ session_id: string }> }
) {
  try {
    await connectDB();

    const { session_id } = await params;

    // Retrieve session from database
    const session = await Session.findOne({ session_id });
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ session });
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ session_id: string }> }
) {
  try {
    await connectDB();

    const { session_id } = await params;

    // Attempt to delete session
    const session = await Session.findOneAndDelete({ session_id });
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Session deleted successfully",
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
