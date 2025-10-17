"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Trash2,
  Save,
  RefreshCw,
  Edit3,
  Mail,
  Eye,
  Copy,
  Server,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getUserDataFromCookies } from "@/lib/auth-utils";
import GmailConnection from "@/components/gmail-connection";

interface EmailTemplate {
  subject: string;
  htmlContent: string;
  textContent: string;
}

const defaultEmailTemplate: EmailTemplate = {
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

Thank you for your time with our organization.`,
};

export default function SettingsPage() {
  const [emailTemplate, setEmailTemplate] =
    useState<EmailTemplate>(defaultEmailTemplate);
  const [smtpConfig, setSmtpConfig] = useState({
    host: "",
    port: 587,
    user: "",
    password: "",
    from: "",
  });
  const [sameAsUser, setSameAsUser] = useState(false);
  const [smtpConfigured, setSmtpConfigured] = useState(false);
  const [gmailConfigured, setGmailConfigured] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Sample data for email preview
  const sampleData = {
    name: "John Doe",
    role: "Senior Software Developer", 
    level: "Senior",
    tenure: "24",
    interviewUrl: typeof window !== 'undefined' 
      ? `${window.location.origin}/interview/sample_session_123`
      : "https://yourcompany.com/interview/sample_session_123"
  };

  // Email template functions
  const loadEmailTemplate = useCallback(async () => {
    try {
      const userData = getUserDataFromCookies();
      if (!userData?.user_id) {
        toast.error("User not authenticated");
        return;
      }

      const response = await fetch(`/api/email-template?user_id=${userData.user_id}`);
      if (response.ok) {
        const template = await response.json();
        setEmailTemplate(template);
      } else {
        console.error("Failed to load email template");
        toast.error("Failed to load email template");
      }
    } catch (error) {
      console.error("Error loading email template:", error);
      toast.error("Error loading email template");
    }
  }, []);

  // SMTP configuration functions
  const loadSmtpConfig = useCallback(async () => {
    try {
      const userData = getUserDataFromCookies();
      if (!userData?.user_id) {
        return;
      }

      const response = await fetch(`/api/smtp-config?user_id=${userData.user_id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.smtp_config) {
          setSmtpConfig({
            host: data.smtp_config.host,
            port: data.smtp_config.port,
            user: data.smtp_config.user,
            password: data.smtp_config.pass || "",
            from: data.smtp_config.from || "",
          });
          setSameAsUser(data.smtp_config.user === data.smtp_config.from);
          setSmtpConfigured(true);
        }
      }
    } catch (error) {
      console.error("Error loading SMTP config:", error);
    }
  }, []);

  // Gmail configuration functions
  const loadGmailConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/gmail/check');
      if (response.ok) {
        const data = await response.json();
        setGmailConfigured(data.authenticated || false);
      }
    } catch (error) {
      console.error("Error checking Gmail config:", error);
      setGmailConfigured(false);
    }
  }, []);

  // Load email template and SMTP config from API on component mount
  useEffect(() => {
    // Load email template and SMTP config from API
    loadEmailTemplate();
    loadSmtpConfig();
    loadGmailConfig();
  }, [loadEmailTemplate, loadSmtpConfig, loadGmailConfig]);

  // Update 'from' field when 'sameAsUser' is true and user field changes
  useEffect(() => {
    if (sameAsUser) {
      setSmtpConfig(prev => ({ ...prev, from: prev.user }));
    }
  }, [sameAsUser, smtpConfig.user]);

  const saveEmailTemplate = async () => {
    try {
      const userData = getUserDataFromCookies();
      if (!userData?.user_id) {
        toast.error("User not authenticated");
        return;
      }

      const response = await fetch("/api/email-template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...emailTemplate,
          user_id: userData.user_id
        }),
      });

      if (response.ok) {
        toast.success("Email template saved successfully!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save email template");
      }
    } catch (error) {
      console.error("Error saving email template:", error);
      toast.error(
        error instanceof Error ? error.message : "Error saving email template"
      );
    }
  };

  const resetEmailTemplate = async () => {
    try {
      const userData = getUserDataFromCookies();
      if (!userData?.user_id) {
        toast.error("User not authenticated");
        return;
      }

      const response = await fetch(`/api/email-template?user_id=${userData.user_id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const data = await response.json();
        setEmailTemplate(data.template);
        toast.success("Email template reset to default!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reset email template");
      }
    } catch (error) {
      console.error("Error resetting email template:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Error resetting email template"
      );
    }
  };

  // SMTP configuration save function
  const saveSmtpConfig = async () => {
    try {
      const userData = getUserDataFromCookies();
      if (!userData?.user_id) {
        toast.error("User not authenticated");
        return;
      }

      const response = await fetch("/api/smtp-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userData.user_id,
          host: smtpConfig.host,
          port: smtpConfig.port,
          user: smtpConfig.user,
          password: smtpConfig.password,
          from: sameAsUser ? smtpConfig.user : smtpConfig.from,
        }),
      });

      if (response.ok) {
        setSmtpConfigured(true);
        toast.success("SMTP configuration saved successfully!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save SMTP configuration");
      }
    } catch (error) {
      console.error("Error saving SMTP config:", error);
      toast.error(
        error instanceof Error ? error.message : "Error saving SMTP configuration"
      );
    }
  };

  const deleteSmtpConfig = async () => {
    try {
      const userData = getUserDataFromCookies();
      if (!userData?.user_id) {
        toast.error("User not authenticated");
        return;
      }

      const response = await fetch(`/api/smtp-config?user_id=${userData.user_id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSmtpConfig({
          host: "",
          port: 587,
          user: "",
          password: "",
          from: "",
        });
        setSameAsUser(false);
        setSmtpConfigured(false);
        toast.success("SMTP configuration removed successfully!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove SMTP configuration");
      }
    } catch (error) {
      console.error("Error removing SMTP config:", error);
      toast.error(
        error instanceof Error ? error.message : "Error removing SMTP configuration"
      );
    }
  };

  const copyVariableToClipboard = (variable: string) => {
    navigator.clipboard.writeText(`{{${variable}}}`);
    toast.success(`Variable {{${variable}}} copied to clipboard!`);
  };

  // Function to replace template variables with sample data
  const replaceTemplateVariables = (template: string) => {
    if (!template) return "";
    return template
      .replace(/\{\{name\}\}/g, sampleData.name)
      .replace(/\{\{role\}\}/g, sampleData.role)
      .replace(/\{\{level\}\}/g, sampleData.level)
      .replace(/\{\{tenure\}\}/g, sampleData.tenure)
      .replace(/\{\{interviewUrl\}\}/g, sampleData.interviewUrl);
  };

  return (
    <div className="flex flex-col gap-6 py-6">
      {/* Page Header */}
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
            <p className="text-muted-foreground text-sm">
              Configure your AI exit interview system
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6">
        {/* Settings Tabs */}
        <Tabs defaultValue="gmail" className="space-y-2">
          <TabsList className="grid w-full lg:w-[800px] grid-cols-3">
            <TabsTrigger value="gmail" className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>Gmail Connection</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>Email Templates</span>
            </TabsTrigger>
            <TabsTrigger value="smtp" className="flex items-center space-x-2">
              <Server className="h-4 w-4" />
              <span>SMTP Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Gmail Connection Tab */}
          <TabsContent value="gmail" className="space-y-6">
            <GmailConnection />
          </TabsContent>

          {/* Email Template Configuration Tab */}
          <TabsContent value="email" className="space-y-6">
            <Card className="border shadow-sm">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold flex items-center">
                      <Mail className="h-5 w-5 mr-2 text-muted-foreground" />
                      Email Template Configuration
                    </CardTitle>
                    <p className="text-muted-foreground mt-1">
                      Customize the email template sent to employees for exit interviews
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {isEditing ? (
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        className="flex items-center space-x-2"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Preview</span>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(true)}
                        className="flex items-center space-x-2"
                      >
                        <Edit3 className="h-4 w-4" />
                        <span>Edit Template</span>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={resetEmailTemplate}
                      className="flex items-center space-x-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>Reset to Default</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-6">
                <div className="space-y-6">
                  {!isEditing ? (
                    /* Email Preview Mode */
                    <div className="space-y-4">
                      {/* Subject Preview */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Email Subject:</Label>
                        <div className="p-3 bg-muted/50 border rounded-md">
                          <p className="font-medium">{replaceTemplateVariables(emailTemplate.subject)}</p>
                        </div>
                      </div>

                      {/* Email Preview */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Email Preview:</Label>
                        <div className="border rounded-md overflow-hidden bg-background min-h-[400px]">
                          <iframe
                            srcDoc={replaceTemplateVariables(emailTemplate.htmlContent)}
                            className="w-full h-[400px] border-0"
                            title="Email Preview"
                            sandbox="allow-same-origin"
                          />
                        </div>
                      </div>

                      {/* Preview Data Info */}
                      <div className="p-3 bg-muted/50 border rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          <strong className="text-foreground">Preview Data:</strong> This preview uses sample data (Name: {sampleData.name}, 
                          Role: {sampleData.role}, Level: {sampleData.level}, Tenure: {sampleData.tenure} months).
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Edit Mode */
                    <div className="space-y-6">
                      {/* Available Variables */}
                      <div className="bg-muted/50 border rounded-lg p-4">
                        <h3 className="font-semibold mb-3">
                          Available Variables
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Use these variables in your email template. They will be
                          automatically replaced with actual values when sending
                          emails.
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                          {["name", "role", "level", "tenure", "interviewUrl"].map(
                            (variable) => (
                              <Button
                                key={variable}
                                variant="outline"
                                size="sm"
                                onClick={() => copyVariableToClipboard(variable)}
                                className="flex items-center justify-between text-xs"
                              >
                                <span>{"{{" + variable + "}}"}</span>
                                <Copy className="h-3 w-3 ml-1" />
                              </Button>
                            )
                          )}
                        </div>
                      </div>

                      {/* Email Subject */}
                      <div className="space-y-2">
                        <Label htmlFor="email-subject">Email Subject</Label>
                        <input
                          id="email-subject"
                          type="text"
                          value={emailTemplate.subject}
                          onChange={(e) =>
                            setEmailTemplate({
                              ...emailTemplate,
                              subject: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="Enter email subject..."
                        />
                      </div>

                      {/* HTML Content */}
                      <div className="space-y-2">
                        <Label htmlFor="html-content">HTML Email Content</Label>
                        <Textarea
                          id="html-content"
                          value={emailTemplate.htmlContent}
                          onChange={(e) =>
                            setEmailTemplate({
                              ...emailTemplate,
                              htmlContent: e.target.value,
                            })
                          }
                          rows={15}
                          className="font-mono text-sm"
                          placeholder="Enter HTML email content..."
                        />
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end pt-4 border-t">
                    <Button
                      onClick={saveEmailTemplate}
                      className="flex items-center space-x-2"
                    >
                      <Save className="h-4 w-4" />
                      <span>Save Template</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SMTP Configuration Tab */}
          <TabsContent value="smtp" className="space-y-6">
            <Card className="border shadow-sm">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold flex items-center">
                      <Server className="h-5 w-5 mr-2 text-muted-foreground" />
                      SMTP Configuration (Optional or Fallback)
                    </CardTitle>
                    <p className="text-muted-foreground mt-1">
                      Configure your SMTP settings to send invitation emails
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {(smtpConfigured || gmailConfigured) && (
                      <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                        ✓ {gmailConfigured ? 'Gmail Configured' : 'SMTP Configured'}
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {gmailConfigured && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Gmail is already configured.</strong> You can still configure SMTP as a fallback option, or use SMTP as your primary email delivery method.
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-host">SMTP Host</Label>
                    <Input
                      id="smtp-host"
                      type="text"
                      placeholder="smtp.gmail.com"
                      value={smtpConfig.host}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-port">Port</Label>
                    <Input
                      id="smtp-port"
                      type="number"
                      placeholder="587"
                      value={smtpConfig.port}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, port: parseInt(e.target.value) || 587 })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-user">Username</Label>
                  <Input
                    id="smtp-user"
                    type="email"
                    placeholder="AKIA... or you-domain@gmail.com"
                    value={smtpConfig.user}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-password">Password / App Password</Label>
                  <Input
                    id="smtp-password"
                    type="password"
                    placeholder="Enter your email password or app password"
                    value={smtpConfig.password}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, password: e.target.value })}
                  />
                </div>
                
                {/* From Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="smtp-from">From Email Address</Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="same-as-user"
                        checked={sameAsUser}
                        onCheckedChange={(checked) => {
                          setSameAsUser(checked === true);
                          if (checked) {
                            setSmtpConfig({ ...smtpConfig, from: smtpConfig.user });
                          }
                        }}
                      />
                      <Label htmlFor="same-as-user" className="text-sm font-normal">
                        Use same as Username
                      </Label>
                    </div>
                    <Input
                      id="smtp-from"
                      type="email"
                      placeholder="from-email@domain.com"
                      value={sameAsUser ? smtpConfig.user : smtpConfig.from}
                      disabled={sameAsUser}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, from: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 pt-4">
                  <Button onClick={saveSmtpConfig} className="flex items-center space-x-2">
                    <Save className="h-4 w-4" />
                    <span>Save SMTP Settings</span>
                  </Button>
                  {smtpConfigured && (
                    <Button 
                      variant="outline" 
                      onClick={deleteSmtpConfig}
                      className="flex items-center space-x-2 text-destructive hover:text-destructive/90"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Remove Configuration</span>
                    </Button>
                  )}
                </div>
                <div className="mt-4 p-4 bg-muted/50 border rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Email Service Setup:</strong><br/>
                    • <strong>Gmail:</strong> Use App Password (enable 2FA and generate App Password in Google Account settings)<br/>
                    • <strong>AWS SES:</strong> Use SMTP credentials and ensure &apos;From Email&apos; is verified in SES console<br/>
                    • The &apos;From Email&apos; field determines who the email appears to be sent from
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Email Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="!max-w-[80vw] w-[80vw] h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
            <DialogTitle className="flex items-center space-x-2 text-lg">
              <Eye className="h-5 w-5" />
              <span>Email Preview</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <Tabs defaultValue="html" className="w-full flex flex-col h-full">
              <div className="px-6 pt-4 flex-shrink-0">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="html">HTML Preview</TabsTrigger>
                  <TabsTrigger value="text">Plain Text Preview</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="html" className="flex-1 flex flex-col px-6 pb-6 mt-4 overflow-hidden">
                <div className="space-y-4 flex flex-col h-full">
                  {/* Subject Line */}
                  <div className="flex-shrink-0">
                    <Label className="text-sm font-medium text-muted-foreground">Subject Line:</Label>
                    <div className="mt-2 p-3 bg-muted/50 border rounded-md">
                      <p className="font-medium">{replaceTemplateVariables(emailTemplate.subject)}</p>
                    </div>
                  </div>
                  
                  {/* HTML Email Body */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <Label className="text-sm font-medium text-muted-foreground mb-2">HTML Email Body:</Label>
                    <div className="flex-1 border rounded-md overflow-hidden bg-background">
                      <iframe
                        srcDoc={replaceTemplateVariables(emailTemplate.htmlContent)}
                        className="w-full h-full border-0"
                        title="Email HTML Preview"
                        sandbox="allow-same-origin"
                      />
                    </div>
                  </div>
                  
                  {/* Preview Data Info */}
                  <div className="flex-shrink-0 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Preview Data:</strong> This preview uses sample data (Name: {sampleData.name}, 
                      Role: {sampleData.role}, Level: {sampleData.level}, Tenure: {sampleData.tenure} months).
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="text" className="flex-1 flex flex-col px-6 pb-6 mt-4 overflow-hidden">
                <div className="space-y-4 flex flex-col h-full">
                  {/* Subject Line */}
                  <div className="flex-shrink-0">
                    <Label className="text-sm font-medium text-muted-foreground">Subject Line:</Label>
                    <div className="mt-2 p-3 bg-muted/50 border rounded-md">
                      <p className="font-medium">{replaceTemplateVariables(emailTemplate.subject)}</p>
                    </div>
                  </div>
                  
                  {/* Plain Text Email Body */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <Label className="text-sm font-medium text-muted-foreground mb-2">Plain Text Email Body:</Label>
                    <div className="flex-1 p-4 bg-muted/50 border rounded-md overflow-auto">
                      <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                        {replaceTemplateVariables(emailTemplate.textContent)}
                      </pre>
                    </div>
                  </div>
                  
                  {/* Preview Data Info */}
                  <div className="flex-shrink-0 p-3 bg-muted/50 border rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Preview Data:</strong> This preview uses sample data (Name: {sampleData.name}, 
                      Role: {sampleData.role}, Level: {sampleData.level}, Tenure: {sampleData.tenure} months).
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
