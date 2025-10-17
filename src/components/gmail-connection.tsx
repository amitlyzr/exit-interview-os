"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  Trash2,
  // TestTube
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface GmailStatus {
  connected: boolean;
  email: string | null;
  connected_at: string | null;
  expires_at: string | null;
  needs_refresh: boolean;
}

export default function GmailConnection() {
  const [status, setStatus] = useState<GmailStatus>({
    connected: false,
    email: null,
    connected_at: null,
    expires_at: null,
    needs_refresh: false
  });
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  // const [testing, setTesting] = useState(false);

  // Check Gmail connection status on component mount
  useEffect(() => {
    checkGmailStatus();
  }, []);

  // Check for OAuth callback success/error in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const gmailConnected = urlParams.get('gmail_connected');
    const gmailError = urlParams.get('gmail_error');

    if (gmailConnected === 'true') {
      toast.success('Gmail connected successfully!');
      checkGmailStatus();
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (gmailError) {
      const errorMessages: Record<string, string> = {
        'access_denied': 'Gmail connection was cancelled',
        'invalid_request': 'Invalid OAuth request',
        'user_not_found': 'User not found',
        'token_exchange_failed': 'Failed to exchange OAuth tokens',
        'callback_failed': 'OAuth callback failed'
      };
      
      toast.error(errorMessages[gmailError] || 'Failed to connect Gmail');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const checkGmailStatus = async () => {
    try {
      setChecking(true);
      const response = await fetch('/api/auth/gmail/status');
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      } else {
        console.error('Failed to check Gmail status');
      }
    } catch (error) {
      console.error('Error checking Gmail status:', error);
    } finally {
      setChecking(false);
    }
  };

  const connectGmail = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/gmail/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok && data.authUrl) {
        // Redirect to Google OAuth
        window.location.href = data.authUrl;
      } else {
        toast.error(data.error || 'Failed to initiate Gmail connection');
      }
    } catch (error) {
      console.error('Error connecting Gmail:', error);
      toast.error('Failed to connect Gmail');
    } finally {
      setLoading(false);
    }
  };

  const disconnectGmail = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/gmail/status', {
        method: 'DELETE'
      });

      if (response.ok) {
        setStatus({
          connected: false,
          email: null,
          connected_at: null,
          expires_at: null,
          needs_refresh: false
        });
        toast.success('Gmail disconnected successfully');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to disconnect Gmail');
      }
    } catch (error) {
      console.error('Error disconnecting Gmail:', error);
      toast.error('Failed to disconnect Gmail');
    } finally {
      setLoading(false);
    }
  };

  // const testGmailConnection = async () => {
  //   try {
  //     setTesting(true);
      
  //     const response = await fetch('/api/auth/gmail/test', {
  //       method: 'POST'
  //     });

  //     const data = await response.json();
      
  //     if (response.ok && data.success) {
  //       toast.success('Test email sent successfully! Check your inbox.');
  //     } else {
  //       toast.error(data.error || 'Failed to send test email');
  //     }
  //   } catch (error) {
  //     console.error('Error testing Gmail connection:', error);
  //     toast.error('Failed to test Gmail connection');
  //   } finally {
  //     setTesting(false);
  //   }
  // };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (checking) {
    return (
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Mail className="h-5 w-5 mr-2" />
            Gmail Connection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Checking connection status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center">
            <Mail className="h-5 w-5 mr-2" />
            Gmail Connection
          </div>
          {status.connected && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!status.connected ? (
          <div className="text-center py-6">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Connect Your Gmail Account
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Connect your Gmail account to send exit interview invitations directly from your email. 
              This provides better deliverability and authenticity.
            </p>
            <Button 
              onClick={connectGmail}
              disabled={loading}
            >
              {loading ? (
                <>
                  Connecting...
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                </>
              ) : (
                <>
                  Connect Gmail
                  <ExternalLink className="h-4 w-4 mr-2" />
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-green-900 dark:text-green-100">Gmail Connected</h4>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Connected to: <strong>{status.email}</strong>
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Connected on {status.connected_at && formatDate(status.connected_at)}
                </p>
              </div>
            </div>

            {status.needs_refresh && (
              <div className="flex items-start space-x-3 p-4 bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-100">Token Refresh Needed</h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Your Gmail connection will be automatically refreshed when sending emails.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3">
              {/* <Button
                variant="outline"
                onClick={testGmailConnection}
                disabled={testing || loading}
                className="flex-1"
              >
                {testing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending Test...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Send Test Email
                  </>
                )}
              </Button> */}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={loading}
                    className="text-destructive hover:text-destructive/90"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Disconnect Gmail?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove your Gmail connection. You&apos;ll need to reconnect to send emails via Gmail.
                      SMTP configuration (if any) will still be available as a fallback.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={disconnectGmail}
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Disconnecting...
                        </>
                      ) : (
                        'Disconnect'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <strong className="text-foreground">Note:</strong> Gmail connection uses OAuth 2.0 for secure authentication. 
          Your Gmail password is never stored. You can revoke access anytime from your Google Account settings.
        </div>
      </CardContent>
    </Card>
  );
}
