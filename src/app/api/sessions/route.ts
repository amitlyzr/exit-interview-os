import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/mongdb";
import Session from "@/lib/mongodb/schemas/Session";

// POST - Create a new session
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { session_id, user_id, name, email, role, interview_level, tenure } = body;

    // Validate required fields
    if (!session_id || !user_id || !name || !email || !role || !interview_level || tenure === undefined) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: session_id, user_id, name, email, role, interview_level, tenure",
        },
        { status: 400 }
      );
    }

    // Check if session already exists
    const existingSession = await Session.findOne({ session_id });
    if (existingSession) {
      return NextResponse.json(
        { error: "Session already exists" },
        { status: 409 }
      );
    }

    // Create new session
    const session = new Session({
      session_id,
      user_id,
      name,
      email,
      role,
      interview_level,
      tenure,
      status: "pending", // Sessions start as pending until employee clicks email link
    });

    await session.save();

    return NextResponse.json(
      {
        success: true,
        message: "Session created successfully",
        session: {
          session_id: session.session_id,
          user_id: session.user_id,
          name: session.name,
          email: session.email,
          role: session.role,
          interview_level: session.interview_level,
          tenure: session.tenure,
          status: session.status,
          created_at: session.created_at,
          started_at: session.started_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Retrieve sessions (optional - for listing sessions)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get("session_id");
    const user_id = searchParams.get("user_id");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    const query: Record<string, string> = {};

    if (session_id) {
      query.session_id = session_id;
    }

    if (user_id) {
      query.user_id = user_id;
    }

    if (status) {
      query.status = status;
    }

    const sessions = await Session.find(query)
      .sort({ created_at: -1 })
      .limit(limit);

    return NextResponse.json({ 
      success: true,
      sessions 
    });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
