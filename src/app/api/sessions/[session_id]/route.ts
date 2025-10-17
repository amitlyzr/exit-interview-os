import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/mongdb";
import Session from "@/lib/mongodb/schemas/Session";

// PATCH - Update session
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ session_id: string }> }
) {
  try {
    await connectDB();

    const { session_id } = await params;
    const body = await request.json();

    // Find the session
    const session = await Session.findOne({ session_id });
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Update allowed fields
    const allowedUpdates = ["status", "completed_at", "duration_minutes"];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: any = {};

    for (const field of allowedUpdates) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // If status is being changed to completed, set completed_at
    if (updates.status === "completed" && !updates.completed_at) {
      updates.completed_at = new Date();
    }

    // Update the session
    const updatedSession = await Session.findOneAndUpdate(
      { session_id },
      { $set: updates },
      { new: true }
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
    console.error("Error updating session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Get single session by session_id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ session_id: string }> }
) {
  try {
    await connectDB();

    const { session_id } = await params;

    const session = await Session.findOne({ session_id });
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete session (optional)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ session_id: string }> }
) {
  try {
    await connectDB();

    const { session_id } = await params;

    const session = await Session.findOneAndDelete({ session_id });
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Session deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
