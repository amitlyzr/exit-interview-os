/* eslint-disable import/no-anonymous-default-export */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { google } from 'googleapis';

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
   * Generate OAuth URL for user to connect their Gmail
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
   * Exchange authorization code for tokens
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
   * Refresh access token using refresh token
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
   * Get user email from Google using access token
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
   * Create Gmail client with access token
   */
  createGmailClient(accessToken: string) {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    return google.gmail({ version: 'v1', auth: oauth2Client });
  }

  /**
   * Check if tokens are expired
   */
  isTokenExpired(expiresAt: Date): boolean {
    return new Date() >= new Date(expiresAt);
  }

  /**
   * Validate OAuth configuration
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
