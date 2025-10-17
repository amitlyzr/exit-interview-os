import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/mongdb";
// import { getCurrentUserFromDB } from "@/lib/server-auth-utils";
import GmailAuthService from "@/lib/gmail-auth";
import { cookies } from "next/headers";

export async function POST() {
  try {
    await connectDB();

    // Validate OAuth configuration
    if (!GmailAuthService.validateConfig()) {
      return NextResponse.json(
        { 
          error: "Gmail OAuth is not properly configured. Please check environment variables." 
        },
        { status: 500 }
      );
    }

    // Get user from database
    // const user = await getUserDataFromServerCookies();
    const cookieStore = await cookies();
    const user_id = cookieStore.get('user_id')?.value;
    
    if (!user_id) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Generate OAuth URL
    const authUrl = GmailAuthService.getAuthUrl(user_id);
    
    return NextResponse.json({ 
      success: true,
      authUrl 
    });

  } catch (error) {
    console.error("Error generating Gmail auth URL:", error);
    return NextResponse.json(
      { error: "Failed to generate authentication URL" },
      { status: 500 }
    );
  }
}
