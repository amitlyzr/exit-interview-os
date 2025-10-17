/* eslint-disable import/no-anonymous-default-export */
import connectDB from "@/lib/mongodb/mongdb";
import User from "@/lib/mongodb/schemas/User";
import GmailAuthService from "@/lib/gmail-auth";

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class GmailEmailService {
  /**
   * Send email using user's connected Gmail account
   */
  async sendEmailAsUser(userId: string, emailOptions: EmailOptions): Promise<SendResult> {
    try {
      await connectDB();

      // Get user's Gmail credentials
      const credentials = await this.getUserGmailCredentials(userId);
      
      if (!credentials) {
        return {
          success: false,
          error: 'User has not connected their Gmail account'
        };
      }

      // Check if token needs refresh
      let accessToken = credentials.access_token;
      if (GmailAuthService.isTokenExpired(credentials.expires_at)) {
        try {
          const newTokens = await GmailAuthService.refreshAccessToken(credentials.refresh_token);
          
          if (!newTokens.access_token) {
            throw new Error('Failed to get new access token');
          }

          // Update stored credentials
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

      // Create Gmail client and send email
      const gmail = GmailAuthService.createGmailClient(accessToken);
      
      // Create email message
      const message = this.createEmailMessage({
        from: credentials.email,
        to: emailOptions.to,
        subject: emailOptions.subject,
        text: emailOptions.text,
        html: emailOptions.html
      });

      // Send email
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
   * Check if user has Gmail connected
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
   * Get user's Gmail credentials from database
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
   * Update user's Gmail credentials in database
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
   * Create RFC 2822 formatted email message with proper HTML preservation
   */
  private createEmailMessage(options: {
    from: string;
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }): string {
    const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const message = [
      `From: ${options.from}`,
      `To: ${options.to}`,
      `Subject: ${options.subject}`,
      `MIME-Version: 1.0`
    ];

    // HTML Priority Logic: HTML > Text > Empty
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
      message.push(
        `Content-Type: text/plain; charset=utf-8`,
        `Content-Transfer-Encoding: 8bit`,
        '',
        options.text
      );
    } else {
      message.push(
        `Content-Type: text/plain; charset=utf-8`,
        `Content-Transfer-Encoding: 8bit`,
        '',
        ''
      );
    }

    const rawMessage = message.join('\r\n');
    
    // Encode to base64url for Gmail API
    return Buffer.from(rawMessage, 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * Test Gmail connection by sending a test email to the connected account
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
        to: "nhce.amit@gmail.com",
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

export default new GmailEmailService();
