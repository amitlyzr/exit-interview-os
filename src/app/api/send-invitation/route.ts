/**
 * Send Invitation API - Send exit interview invitations via email
 * 
 * @access HR users only
 * 
 * POST /api/send-invitation - Send email invitation to employee
 * curl -X POST http://localhost:3000/api/send-invitation \
 *   -H "Content-Type: application/json" \
 *   -d '{"session_id":"session_123","user_id":"user_456"}'
 * 
 * Attempts: 1) Gmail OAuth, 2) SMTP fallback, 3) Manual link generation
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/mongdb";
import { Session, EmailTemplate } from "@/lib/mongodb/schemas";
import GmailEmailService from "@/lib/gmail-email-service";

// Helper function to get email template for user
async function getEmailTemplate(user_id: string) {
  const template = await EmailTemplate.findOne({ user_id });
  
  if (!template) {
    // Return default template if none exists
    return {
      subject: "Exit Interview Invitation - Your Feedback Matters",
      htmlContent: `<!DOCTYPE html>
                    <html>
                      <head>
                        <meta charset="utf-8">
                        <title>Exit Interview Invitation</title>
                        <style>
                          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                          .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
                          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
                        </style>
                      </head>
                      <body>
                        <div class="container">
                          <div class="header">
                            <h1>Exit Interview Invitation</h1>
                          </div>
                          
                          <p>Dear {{name}},</p>
                          
                          <p>We would like to invite you to participate in an AI-powered exit interview. Your feedback is valuable to us and will help improve our workplace for future employees.</p>
                          
                          <p><strong>Interview Details:</strong></p>
                          <ul>
                            <li><strong>Role:</strong> {{role}}</li>
                            <li><strong>Level:</strong> {{level}}</li>
                            <li><strong>Tenure:</strong> {{tenure}} months</li>
                          </ul>
                          
                          <p>The interview is conducted by an AI assistant and typically takes 15-30 minutes. Your responses will be kept confidential and used only for internal improvement purposes.</p>
                          
                          <p>Click the button below to start your exit interview:</p>
                          
                          <a href="{{interviewUrl}}" class="button">Start Exit Interview</a>
                          
                          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                          <p><a href="{{interviewUrl}}">{{interviewUrl}}</a></p>
                          
                          <div class="footer">
                            <p>This invitation is valid for 30 days. If you have any questions, please contact HR.</p>
                            <p>Thank you for your time with our organization.</p>
                          </div>
                        </div>
                      </body>
                    </html>`,
      textContent: `Exit Interview Invitation
                    Dear {{name}},

                    We would like to invite you to participate in an AI-powered exit interview. Your feedback is valuable to us and will help improve our workplace for future employees.

                    Interview Details:
                    - Role: {{role}}
                    - Level: {{level}}
                    - Tenure: {{tenure}} months

                    The interview is conducted by an AI assistant and typically takes 5-10 minutes. Your responses will be kept confidential and used only for internal improvement purposes.

                    Click this link to start your exit interview:
                    {{interviewUrl}}

                    This invitation is valid for 30 days. If you have any questions, please contact HR.

                    Thank you for your time with our organization.`
    };
  }
  
  return {
    subject: template.subject,
    htmlContent: template.htmlContent,
    textContent: template.textContent
  };
}

// Helper function to replace template variables
function replaceTemplateVariables(template: string, variables: Record<string, string>) {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  });
  return result;
}

// POST - Send email invitation to employee
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { session_id, user_id } = body;

    // Validate required fields
    if (!session_id || !user_id) {
      return NextResponse.json(
        { error: "Missing required fields: session_id, user_id" },
        { status: 400 }
      );
    }

    // Find the session
    const session = await Session.findOne({ session_id });
    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Get user
    const { User } = await import("@/lib/mongodb/schemas");
    const user = await User.findOne({ user_id });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Generate interview URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const interviewUrl = `${baseUrl}/interview?session_id=${session_id}`;

    // Get email template from database
    const emailTemplate = await getEmailTemplate(user_id);

    // Prepare template variables
    const templateVariables = {
      name: session.name,
      role: session.role.charAt(0).toUpperCase() + session.role.slice(1),
      level: session.interview_level.charAt(0).toUpperCase() + session.interview_level.slice(1),
      tenure: session.tenure.toString(),
      interviewUrl: interviewUrl
    };

    // Replace variables in templates
    const emailHtml = replaceTemplateVariables(emailTemplate.htmlContent, templateVariables);
    const emailText = replaceTemplateVariables(emailTemplate.textContent, templateVariables);
    const emailSubject = replaceTemplateVariables(emailTemplate.subject, templateVariables);

    // Check if user has Gmail connected
    const gmailConnected = await GmailEmailService.checkUserGmailConnection(user_id);
    
    if (gmailConnected) {
      // Send email via Gmail API with HTML priority
      const result = await GmailEmailService.sendEmailAsUser(user_id, {
        to: session.email,
        subject: emailSubject,
        html: emailHtml, // HTML is prioritized
        text: emailText  // Text as fallback
      });

      if (result.success) {
        return NextResponse.json(
          {
            message: "Invitation email sent successfully via Gmail (HTML format)",
            method: "gmail",
            session_id: session.session_id,
            email: session.email,
            interview_url: interviewUrl,
            message_id: result.messageId
          },
          { status: 200 }
        );
      } else {
        // Gmail failed, try SMTP fallback if configured
        console.warn("Gmail sending failed:", result.error);
      }
    }

    // Fallback to SMTP if Gmail not connected or failed
    const smtpConfigured = user.smtp_config?.host && user.smtp_config?.user && user.smtp_config?.pass && user.smtp_config?.from;
    
    if (smtpConfigured) {
      try {
        // Dynamic import of nodemailer only when needed
        const nodemailer = await import("nodemailer");
        
        // Create email transporter using user's SMTP config
        const transporter = nodemailer.createTransport({
          host: user.smtp_config.host,
          port: user.smtp_config.port,
          secure: user.smtp_config.port == 465 || false,
          auth: {
            user: user.smtp_config.user,
            pass: user.smtp_config.pass,
          },
        });

        // Send email via SMTP with HTML priority
        const mailOptions = {
          from: user.smtp_config.from,
          to: session.email,
          subject: emailSubject,
          html: emailHtml, // HTML is prioritized
          text: emailText, // Text as fallback
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json(
          {
            message: "Invitation email sent successfully via SMTP (HTML format)",
            method: "smtp",
            session_id: session.session_id,
            email: session.email,
            interview_url: interviewUrl,
          },
          { status: 200 }
        );
      } catch (smtpError) {
        console.error("SMTP sending failed:", smtpError);
      }
    }

    // No email method available - return manual sending info
    return NextResponse.json(
      {
        message: "Session created. No email method configured - please send invitation manually.",
        session_id: session.session_id,
        email: session.email,
        interview_url: interviewUrl,
        requires_manual_send: true
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending invitation email:", error);
    return NextResponse.json(
      { error: "Failed to send invitation email" },
      { status: 500 }
    );
  }
}
