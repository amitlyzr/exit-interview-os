import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/mongdb";
import { getCurrentUserFromDB } from "@/lib/server-auth-utils";
import GmailAuthService from "@/lib/gmail-auth";

export async function GET() {
  try {
    await connectDB();

    // Get user from database
    const user = await getCurrentUserFromDB();
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const gmailOAuth = user.gmail_oauth;
    
    if (!gmailOAuth?.access_token || !gmailOAuth?.refresh_token) {
      return NextResponse.json({
        connected: false,
        email: null,
        connected_at: null
      });
    }

    // Check if token needs refresh
    const needsRefresh = GmailAuthService.isTokenExpired(gmailOAuth.expires_at);
    
    return NextResponse.json({
      connected: true,
      email: gmailOAuth.email,
      connected_at: gmailOAuth.connected_at,
      expires_at: gmailOAuth.expires_at,
      needs_refresh: needsRefresh
    });

  } catch (error) {
    console.error("Error checking Gmail status:", error);
    return NextResponse.json(
      { error: "Failed to check Gmail connection status" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await connectDB();

    // Get user from database
    const user = await getCurrentUserFromDB();
    
    if (!user?.user_id) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Remove Gmail OAuth credentials
    user.gmail_oauth = undefined;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Gmail connection removed successfully"
    });

  } catch (error) {
    console.error("Error removing Gmail connection:", error);
    return NextResponse.json(
      { error: "Failed to remove Gmail connection" },
      { status: 500 }
    );
  }
}
