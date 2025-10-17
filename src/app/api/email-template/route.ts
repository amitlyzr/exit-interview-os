import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/mongdb";
import { EmailTemplate } from "@/lib/mongodb/schemas";

const defaultEmailTemplate = {
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
    .button { display: inline-block; background: #007bff; color: #f8f9fa !important; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
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


export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    // Get the user-specific template
    const template = await EmailTemplate.findOne({ user_id });

    if (!template) {
      return NextResponse.json({
        ...defaultEmailTemplate,
        isDefault: true,
        isConfigured: false
      }, { status: 200 });
    }

    return NextResponse.json({
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent,
      isDefault: false,
      isConfigured: true
    }, { status: 200 });
  }
  catch (error) {
    console.error("Error fetching email template:", error);
    return NextResponse.json(
      { error: "Failed to fetch email template" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { subject, htmlContent, textContent, user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    if (!subject || !htmlContent || !textContent) {
      return NextResponse.json(
        { error: "Missing required fields: subject, htmlContent, textContent" },
        { status: 400 }
      );
    }

    // Use findOneAndUpdate with upsert to avoid duplicate key errors
    const updatedTemplate = await EmailTemplate.findOneAndUpdate(
      { user_id },
      {
        subject,
        htmlContent,
        textContent,
        updated_at: new Date()
      },
      { 
        upsert: true, // Create if doesn't exist, update if exists
        new: true,    // Return the updated document
        runValidators: true
      }
    );

    return NextResponse.json(
      { 
        message: "Email template saved successfully",
        template: {
          subject: updatedTemplate.subject,
          htmlContent: updatedTemplate.htmlContent,
          textContent: updatedTemplate.textContent,
          isDefault: false,
          isConfigured: true
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error saving email template:", error);
    return NextResponse.json(
      { error: "Failed to save email template" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    await EmailTemplate.deleteMany({ user_id });

    return NextResponse.json(
      { 
        message: "Email template reset to default",
        template: {
          ...defaultEmailTemplate,
          isDefault: true,
          isConfigured: false
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error resetting email template:", error);
    return NextResponse.json(
      { error: "Failed to reset email template" },
      { status: 500 }
    );
  }
}
