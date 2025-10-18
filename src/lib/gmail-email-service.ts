/**
 * Gmail Email Service
 * 
 * Manages email sending via Gmail API with OAuth 2.0 authentication.
 * Handles token refresh, email formatting, and connection management.
 * 
 * @module lib/gmail-email-service
 */

import connectDB from "@/lib/mongodb/mongdb";
import User from "@/lib/mongodb/schemas/User";
import GmailAuthService from "@/lib/gmail-auth";

/**
 * Email sending options
 */
interface EmailOptions {
  /** Recipient email address */
  to: string;
  /** Email subject line */
  subject: string;
  /** Plain text version of email body (optional) */
  text?: string;
  /** HTML version of email body (optional) */
  html?: string;
}

/**
 * Email sending result
 */
interface SendResult {
  /** Whether email was sent successfully */
  success: boolean;
  /** Gmail message ID if successful (optional) */
  messageId?: string;
  /** Error message if failed (optional) */
  error?: string;
}

/**
 * Gmail Email Service Class
 * 
 * Provides methods for sending emails via user's connected Gmail account.
 * Automatically handles token refresh and email formatting.
 */
export class GmailEmailService {
  /**
   * Sends an email using the user's connected Gmail account
   * 
   * Handles the complete email sending flow:
   * 1. Fetches user's Gmail OAuth credentials from database
   * 2. Checks token expiration and refreshes if needed
   * 3. Creates properly formatted RFC 2822 email message
   * 4. Sends email via Gmail API
   * 
   * @param userId - User ID who owns the Gmail connection
   * @param emailOptions - Email content and recipient information
   * @returns Promise resolving to send result with success status
   * 
   * @example
   * ```typescript
   * const result = await gmailService.sendEmailAsUser('user_123', {
   *   to: 'employee@company.com',
   *   subject: 'Exit Interview Invitation',
   *   html: '<p>Please complete your exit interview...</p>',
   *   text: 'Please complete your exit interview...'
   * });
   * 
   * if (result.success) {
   *   console.log(`Email sent! Message ID: ${result.messageId}`);
   * } else {
   *   console.error(`Failed to send: ${result.error}`);
   * }
   * ```
   */
  async sendEmailAsUser(userId: string, emailOptions: EmailOptions): Promise<SendResult> {
    try {
      await connectDB();

      // Retrieve user's stored Gmail OAuth credentials
      const credentials = await this.getUserGmailCredentials(userId);
      
      if (!credentials) {
        return {
          success: false,
          error: 'User has not connected their Gmail account'
        };
      }

      // Check token expiration and refresh if necessary
      let accessToken = credentials.access_token;
      if (GmailAuthService.isTokenExpired(credentials.expires_at)) {
        try {
          const newTokens = await GmailAuthService.refreshAccessToken(credentials.refresh_token);
          
          if (!newTokens.access_token) {
            throw new Error('Failed to get new access token');
          }

          // Update database with new access token and expiration
          await this.updateUserGmailCredentials(userId, {
            access_token: newTokens.access_token,
            expires_at: new Date(newTokens.expiry_date || Date.now() + 3600 * 1000)
          });
          
          accessToken = newTokens.access_token;
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          return {
            success: false,
            error: 'Gmail token expired and refresh failed. Please reconnect your Gmail account.'
          };
        }
      }

      // Initialize Gmail API client with current access token
      const gmail = GmailAuthService.createGmailClient(accessToken);
      
      // Create properly formatted email message
      const message = this.createEmailMessage({
        from: credentials.email,
        to: emailOptions.to,
        subject: emailOptions.subject,
        text: emailOptions.text,
        html: emailOptions.html
      });

      // Send email via Gmail API
      const result = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: message
        }
      });

      return {
        success: true,
        messageId: result.data.id || undefined
      };

    } catch (error) {
      console.error('Gmail send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email'
      };
    }
  }

  /**
   * Checks if user has Gmail account connected
   * 
   * @param userId - User ID to check
   * @returns Promise resolving to true if Gmail is connected, false otherwise
   * 
   * @example
   * ```typescript
   * const isConnected = await gmailService.checkUserGmailConnection('user_123');
   * if (!isConnected) {
   *   console.log('Please connect your Gmail account first');
   * }
   * ```
   */
  async checkUserGmailConnection(userId: string): Promise<boolean> {
    try {
      await connectDB();
      const credentials = await this.getUserGmailCredentials(userId);
      return !!credentials;
    } catch (error) {
      console.error('Error checking Gmail connection:', error);
      return false;
    }
  }

  /**
   * Retrieves user's Gmail OAuth credentials from database
   * 
   * Private method used internally to fetch stored credentials.
   * 
   * @param userId - User ID to fetch credentials for
   * @returns User's Gmail credentials or null if not connected
   * @private
   */
  private async getUserGmailCredentials(userId: string) {
    const user = await User.findOne({ user_id: userId });
    
    if (!user?.gmail_oauth?.access_token || !user?.gmail_oauth?.refresh_token) {
      return null;
    }

    return {
      access_token: user.gmail_oauth.access_token,
      refresh_token: user.gmail_oauth.refresh_token,
      expires_at: user.gmail_oauth.expires_at,
      email: user.gmail_oauth.email
    };
  }

  /**
   * Updates user's Gmail OAuth credentials in database
   * 
   * Private method used internally after token refresh.
   * 
   * @param userId - User ID to update credentials for
   * @param updates - New access token and/or expiration date
   * @private
   */
  private async updateUserGmailCredentials(userId: string, updates: {
    access_token?: string;
    expires_at?: Date;
  }) {
    await User.findOneAndUpdate(
      { user_id: userId },
      {
        $set: {
          'gmail_oauth.access_token': updates.access_token,
          'gmail_oauth.expires_at': updates.expires_at,
          updated_at: new Date()
        }
      }
    );
  }

  /**
   * Creates RFC 2822 formatted email message for Gmail API
   * 
   * Formats email message according to RFC 2822 standard with proper:
   * - MIME multipart handling for HTML + text versions
   * - Character encoding (UTF-8)
   * - Base64url encoding for Gmail API
   * 
   * Priority: HTML > Text > Empty
   * 
   * @param options - Email components (from, to, subject, text, html)
   * @returns Base64url-encoded email message ready for Gmail API
   * @private
   */
  private createEmailMessage(options: {
    from: string;
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }): string {
    const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Build email headers
    const message = [
      `From: ${options.from}`,
      `To: ${options.to}`,
      `Subject: ${options.subject}`,
      `MIME-Version: 1.0`
    ];

    // Add content based on what's provided (HTML has priority)
    if (options.html) {
      if (options.text) {
        // Multipart email with both HTML and text versions
        message.push(
          `Content-Type: multipart/alternative; boundary="${boundary}"`,
          '',
          `--${boundary}`,
          `Content-Type: text/plain; charset=utf-8`,
          `Content-Transfer-Encoding: 8bit`,
          '',
          options.text,
          '',
          `--${boundary}`,
          `Content-Type: text/html; charset=utf-8`,
          `Content-Transfer-Encoding: 8bit`,
          '',
          options.html,
          '',
          `--${boundary}--`
        );
      } else {
        // HTML only email - preserve exact HTML formatting
        message.push(
          `Content-Type: text/html; charset=utf-8`,
          `Content-Transfer-Encoding: 8bit`,
          '',
          options.html
        );
      }
    } else if (options.text) {
      // Plain text only email
      message.push(
        `Content-Type: text/plain; charset=utf-8`,
        `Content-Transfer-Encoding: 8bit`,
        '',
        options.text
      );
    } else {
      // Empty email body
      message.push(
        `Content-Type: text/plain; charset=utf-8`,
        `Content-Transfer-Encoding: 8bit`,
        '',
        ''
      );
    }

    const rawMessage = message.join('\r\n');
    
    // Encode to base64url format required by Gmail API
    return Buffer.from(rawMessage, 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * Tests Gmail connection by sending a test email
   * 
   * Sends a test email to verify the Gmail connection is working.
   * Uses a hardcoded recipient for testing purposes.
   * 
   * @param userId - User ID whose Gmail connection to test
   * @returns Promise resolving to send result
   * 
   * @example
   * ```typescript
   * const result = await gmailService.testGmailConnection('user_123');
   * if (result.success) {
   *   console.log('Gmail connection is working!');
   * }
   * ```
   */
  async testGmailConnection(userId: string): Promise<SendResult> {
    try {
      const credentials = await this.getUserGmailCredentials(userId);
      
      if (!credentials) {
        return {
          success: false,
          error: 'Gmail not connected'
        };
      }

      return await this.sendEmailAsUser(userId, {
        to: credentials.email, // Send test email to connected account
        subject: 'Gmail Connection Test - Exit Interview App',
        html: `
          <h2>Gmail Connection Successful!</h2>
          <p>Your Gmail account has been successfully connected to the Exit Interview application.</p>
          <p>You can now send invitation emails directly from your Gmail account.</p>
          <p><em>This is a test email sent at ${new Date().toLocaleString()}</em></p>
        `,
        text: `Gmail Connection Successful!\n\nYour Gmail account has been successfully connected to the Exit Interview application.\n\nYou can now send invitation emails directly from your Gmail account.\n\nThis is a test email sent at ${new Date().toLocaleString()}`
      });

    } catch (error) {
      console.error('Gmail connection test error:', error);
      return {
        success: false,
        error: 'Failed to test Gmail connection'
      };
    }
  }
}

/**
 * Default export: Singleton instance of GmailEmailService
 * 
 * Import this instance to use the service:
 * ```typescript
 * import gmailService from '@/lib/gmail-email-service';
 * await gmailService.sendEmailAsUser(...);
 * ```
 */
const gmailService = new GmailEmailService();
export default gmailService;
