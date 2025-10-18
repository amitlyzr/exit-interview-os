/**
 * Gmail OAuth Authentication Service
 * Handles OAuth2 flow for Gmail API access (sending exit interview invitations)
 */

/* eslint-disable import/no-anonymous-default-export */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { google } from 'googleapis';

/**
 * Gmail authentication and authorization service
 */
export class GmailAuthService {
  private oauth2Client: any;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/gmail/callback`
    );
  }

  /**
   * Generate OAuth URL for Gmail authorization
   * @param userId - User ID to associate with the OAuth session
   * @returns Authorization URL for user to visit
   */
  getAuthUrl(userId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userId, // Pass user ID to identify later
      prompt: 'consent', // Force to show consent screen to get refresh token
      include_granted_scopes: true
    });
  }

  /**
   * Exchange authorization code for access and refresh tokens
   * @param code - Authorization code from OAuth callback
   * @returns Token credentials
   */
  async getTokens(code: string) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      return tokens;
    } catch (error) {
      console.error('Error getting tokens:', error);
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  /**
   * Refresh expired access token
   * @param refreshToken - Refresh token from initial authorization
   * @returns New access token credentials
   */
  async refreshAccessToken(refreshToken: string) {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken
      });
      
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      return credentials;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * Get user's email address from Google
   * @param accessToken - Valid OAuth access token
   * @returns User's email address
   */
  async getUserEmail(accessToken: string): Promise<string> {
    try {
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });
      
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const { data } = await oauth2.userinfo.get();
      
      return data.email || '';
    } catch (error) {
      console.error('Error getting user email:', error);
      throw new Error('Failed to get user email from Google');
    }
  }

  /**
   * Create Gmail API client instance
   * @param accessToken - Valid OAuth access token
   * @returns Configured Gmail API client
   */
  createGmailClient(accessToken: string) {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    return google.gmail({ version: 'v1', auth: oauth2Client });
  }

  /**
   * Check if access token has expired
   * @param expiresAt - Token expiration date
   * @returns True if token is expired
   */
  isTokenExpired(expiresAt: Date): boolean {
    return new Date() >= new Date(expiresAt);
  }

  /**
   * Validate OAuth environment configuration
   * @returns True if all required env vars are present
   */
  validateConfig(): boolean {
    return !!(
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.NEXT_PUBLIC_APP_URL
    );
  }
}

export default new GmailAuthService();
