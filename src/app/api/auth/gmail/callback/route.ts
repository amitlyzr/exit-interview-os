import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/mongdb";
import { getUserById } from "@/lib/server-auth-utils";
import GmailAuthService from "@/lib/gmail-auth";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This is the user_id
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?gmail_error=access_denied`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?gmail_error=invalid_request`
      );
    }

    const userId = state;

    // Find user
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?gmail_error=user_not_found`
      );
    }

    try {
      // Exchange code for tokens
      const tokens = await GmailAuthService.getTokens(code);
      
      if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error('Missing required tokens');
      }

      // Get user email from Google
      const userEmail = await GmailAuthService.getUserEmail(tokens.access_token);

      // Calculate expiry date
      const expiresAt = tokens.expiry_date 
        ? new Date(tokens.expiry_date)
        : new Date(Date.now() + 3600 * 1000); // Default 1 hour

      // Store Gmail OAuth credentials
      user.gmail_oauth = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
        email: userEmail,
        connected_at: new Date()
      };

      await user.save();

      // Redirect to settings with success message
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?gmail_connected=true`
      );

    } catch (tokenError) {
      console.error('Token exchange error:', tokenError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?gmail_error=token_exchange_failed`
      );
    }

  } catch (error) {
    console.error('Gmail OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?gmail_error=callback_failed`
    );
  }
}
