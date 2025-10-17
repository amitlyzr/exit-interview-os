/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useMemo, useEffect } from "react";

import { Upload, Users, Plus, Download, AlertTriangle, Settings } from "lucide-react";

import { getUserDataFromCookies } from "@/lib/auth-utils";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadTrigger,
  FileUploadList,
  FileUploadItem,
  FileUploadItemPreview,
  FileUploadItemMetadata,
  FileUploadItemDelete,
} from "@/components/ui/file-upload";

import {
  useCreateSessionMutation,
  useGetSessionsQuery,
  useSendInvitationMutation,
} from "@/lib/features/api/api";

import { AddEmployeeModal } from "@/components/shared/add-employee-modal";
import { ExitSessionsTable } from "@/components/exit-sessions-table";
import type { Session, SessionResponse } from "@/types/dashboard";

// Analytics hook (copied from dashboard)
const useSessionsAnalyticsData = (timeFilter: string, roleFilter: string) => {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (timeFilter !== "all") params.append("timeFilter", timeFilter);
        if (roleFilter !== "all") params.append("roleFilter", roleFilter);

        const response = await fetch(`/api/analytics?${params.toString()}`);
        const result = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.message || "Failed to fetch analytics data");
        }
      } catch (err) {
        setError("Error fetching analytics data");
        console.error("Analytics fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeFilter, roleFilter]);

  return { data, loading, error };
};

interface Employee {
  name: string;
  email: string;
  role: string;
  interview_level: string;
  tenure: number;
}

export default function AddEmailPage() {
  const [createSession] = useCreateSessionMutation();
  const [sendInvitation] = useSendInvitationMutation();

  // User state
  const [currentUser, setCurrentUser] = useState<{ user_id: string; email?: string; is_hr: boolean } | null>(null);

  // Configuration state
  const [emailTemplateConfigured, setEmailTemplateConfigured] = useState(false);
  const [smtpConfigured, setSmtpConfigured] = useState(false);
  const [gmailConfigured, setGmailConfigured] = useState(false);
  const [configurationLoading, setConfigurationLoading] = useState(true);

  // CSV upload state
  const [csvEmployees, setCsvEmployees] = useState<Employee[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Get current user data from cookies
  useEffect(() => {
    const userData = getUserDataFromCookies();
    if (userData) {
      setCurrentUser({
        user_id: userData.user_id,
        email: userData.email,
        is_hr: userData.is_hr || true
      });
    }
  }, []);

  // Check configuration status
  useEffect(() => {
    const checkConfigurations = async () => {
      if (!currentUser?.user_id) return;

      try {
        setConfigurationLoading(true);

        // Check email template configuration
        const emailTemplateResponse = await fetch(`/api/email-template?user_id=${currentUser.user_id}`);
        if (emailTemplateResponse.ok) {
          const emailData = await emailTemplateResponse.json();
          setEmailTemplateConfigured(emailData.isConfigured || false);
        }

        // Check SMTP configuration
        const smtpResponse = await fetch(`/api/smtp-config?user_id=${currentUser.user_id}`);
        if (smtpResponse.ok) {
          const smtpData = await smtpResponse.json();
          setSmtpConfigured(!!smtpData.smtp_config?.configured);
        }

        // Check Gmail configuration
        const gmailResponse = await fetch('/api/auth/gmail/status');
        if (gmailResponse.ok) {
          const gmailData = await gmailResponse.json();
          setGmailConfigured(gmailData.authenticated || false);
        }
      } catch (error) {
        console.error('Error checking configurations:', error);
      } finally {
        setConfigurationLoading(false);
      }
    };

    checkConfigurations();
  }, [currentUser]);

  const [showAddModal, setShowAddModal] = useState(false);

  // Check if configurations are complete: email template AND (gmail OR smtp)
  const isConfigurationComplete = emailTemplateConfigured && (gmailConfigured || smtpConfigured);

  console.log("Configurations", isConfigurationComplete);


  // Unify employee object mapping for modal/manual add
  const handleAddEmployee = async (employee: {
    employeeName: string;
    email: string;
    tenure: string;
    role: string;
    level: string;
  }) => {
    if (!currentUser?.user_id) {
      toast.error('User not authenticated');
      return;
    }

    if (!isConfigurationComplete) {
      toast.error('Please configure email template and either Gmail or SMTP settings in Settings page before adding employees');
      return;
    }

    try {
      setIsProcessing(true);

      // Generate unique session ID
      const sessionId = `session_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Create session with unified mapping
      await createSession({
        session_id: sessionId,
        user_id: currentUser.user_id,
        name: employee.employeeName,
        email: employee.email,
        role: employee.role,
        interview_level: employee.level,
        tenure: parseFloat(employee.tenure) || 0,
      }).unwrap();

      // Send email invitation
      try {
        await sendInvitation({ 
          session_id: sessionId,
          user_id: currentUser.user_id 
        }).unwrap();
        toast.success(
          "Employee added successfully! Interview invitation sent to their email."
        );
      } catch (emailError) {
        console.error("Error sending invitation email:", emailError);
        toast.success(
          "Employee added successfully! Please send invitation manually."
        );
      }
    } catch (error) {
      console.error("Error adding employee:", error);
      toast.error("Failed to add employee. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (files: File[]) => {
    const file = files[0];
    if (!file) return;

    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    // Parse CSV
    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target?.result as string;
      const lines = csv.split("\n");
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

      // Validate headers
      const requiredHeaders = [
        "name",
        "email",
        "role",
        "interview_level",
        "tenure",
      ];
      const missingHeaders = requiredHeaders.filter(
        (h) => !headers.includes(h)
      );

      if (missingHeaders.length > 0) {
        toast.error(`Missing required columns: ${missingHeaders.join(", ")}`);
        return;
      }

      const employees: Employee[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(",").map((v) => v.trim());
        const employee: Employee = {
          name: values[headers.indexOf("name")] || "",
          email: values[headers.indexOf("email")] || "",
          role: values[headers.indexOf("role")] || "",
          interview_level: values[headers.indexOf("interview_level")] || "",
          tenure: parseFloat(values[headers.indexOf("tenure")]) || 0,
        };

        // Validate employee data
        if (
          employee.name &&
          employee.email &&
          employee.role &&
          employee.interview_level &&
          employee.tenure > 0
        ) {
          employees.push(employee);
        }
      }

      setCsvEmployees(employees);
      toast.success(`Parsed ${employees.length} employees from CSV`);
    };

    reader.readAsText(file);
  };

  // Unify CSV employee mapping and session creation
  const handleCsvSubmit = async () => {
    if (csvEmployees.length === 0) {
      toast.error("No valid employees found in CSV");
      return;
    }

    if (!currentUser?.user_id) {
      toast.error("User not authenticated");
      return;
    }

    if (!isConfigurationComplete) {
      toast.error('Please configure email template and either Gmail or SMTP settings in Settings page before adding employees');
      return;
    }

    try {
      setIsProcessing(true);
      let successCount = 0;
      let errorCount = 0;

      for (const employee of csvEmployees) {
        try {
          // Generate unique session ID
          const sessionId = `session_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;

          // Map CSV employee fields to unified structure
          await createSession({
            session_id: sessionId,
            user_id: currentUser.user_id,
            name: employee.name,
            email: employee.email,
            role: employee.role,
            interview_level: employee.interview_level,
            tenure: employee.tenure,
          }).unwrap();

          // Send email invitation
          try {
            await sendInvitation({ 
              session_id: sessionId,
              user_id: currentUser.user_id 
            }).unwrap();
          } catch (emailError) {
            console.error(
              `Error sending invitation to ${employee.email}:`,
              emailError
            );
          }

          successCount++;

          // Small delay to avoid overwhelming the server
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`Error adding employee ${employee.name}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully added ${successCount} employees!`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to add ${errorCount} employees`);
      }

      // Reset CSV state
      setCsvEmployees([]);
      setUploadedFiles([]);
    } catch (error) {
      console.error("Error processing CSV:", error);
      toast.error("Failed to process CSV file");
    } finally {
      setIsProcessing(false);
    }
  };

  const { data: sessionsData } = useGetSessionsQuery({ limit: 100 });

  // Analytics data for checking session completion status
  const { data: analyticsData } = useSessionsAnalyticsData("all", "all");

  const transformedSessionsData = useMemo(() => {
    if (!sessionsData?.sessions) return [];

    // Map sessions to table format
    return sessionsData.sessions.map((session: Session) => {
      // Check if this session has responses from analytics data
      const sessionResponses =
        analyticsData?.responses?.filter(
          (response: SessionResponse) =>
            response.sessionId === session.session_id
        ) || [];

      const hasResponses = sessionResponses.length > 0;

      return {
        employeeName: session.name,
        email: session.email,
        role: session.role.charAt(0).toUpperCase() + session.role.slice(1),
        level:
          session.interview_level.charAt(0).toUpperCase() +
          session.interview_level.slice(1),
        status: hasResponses ? "Completed" : "Pending",
        duration: hasResponses
          ? `${sessionResponses.length} responses`
          : "Not started",
        created: new Date(
          session.created_at || session.createdAt || Date.now()
        ).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        actions: hasResponses ? "View" : "Pending",
        sessionId: session.session_id,
      };
    });
  }, [sessionsData, analyticsData]);

  return (
    <div className="flex flex-col gap-6 py-6">
      {/* Page Header */}
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Add Employees</h1>
            <p className="text-muted-foreground text-sm">
              Add employees for exit interviews via CSV upload or manual entry
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const link = document.createElement('a');
                link.href = '/demo-employees.csv';
                link.download = 'demo-employees.csv';
                link.click();
              }}
            >
              <Download className="size-4 mr-2" />
              Download Demo CSV
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => {
                      if (!isConfigurationComplete || configurationLoading) {
                        return;
                      }
                      setShowAddModal(true);
                    }}
                    size="sm"
                    disabled={!isConfigurationComplete || configurationLoading}
                  >
                    <Plus className="size-4 mr-2" />
                    Add Employee
                  </Button>
                </TooltipTrigger>
                {!isConfigurationComplete && (
                  <TooltipContent>
                    <p>Configure email template and Gmail or SMTP settings first</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Configuration Warning */}
      {configurationLoading ? (
        <div className="px-4 lg:px-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Checking Configuration...</AlertTitle>
            <AlertDescription>
              Please wait while we verify your email template and SMTP settings.
            </AlertDescription>
          </Alert>
        </div>
      ) : !isConfigurationComplete && (
        <div className="px-4 lg:px-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Configuration Required</AlertTitle>
            <AlertDescription className="flex items-center gap-2">
              Please configure your settings:
              {!emailTemplateConfigured && (
                <Button
                  variant="link"
                  className="p-0 h-auto text-destructive underline"
                  onClick={() => window.location.href = '/settings'}
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Email Template
                </Button>
              )}
              {(!gmailConfigured && !smtpConfigured) && (
                <Button
                  variant="link"
                  className="p-0 h-auto text-destructive underline"
                  onClick={() => window.location.href = '/settings'}
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Gmail or SMTP Settings
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="px-4 lg:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* CSV Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="size-5" />
                CSV Upload
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUpload
                value={uploadedFiles}
                onValueChange={setUploadedFiles}
                onAccept={handleFileUpload}
                accept=".csv"
                maxFiles={1}
                maxSize={5 * 1024 * 1024} // 5MB
                disabled={!isConfigurationComplete || configurationLoading}
              >
                <FileUploadDropzone className="min-h-32">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Upload className="size-8 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Drop CSV file here or click to browse</p>
                      <p className="text-xs text-muted-foreground">
                        CSV should contain: name, email, role, interview_level, tenure
                      </p>
                    </div>
                    <FileUploadTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={!isConfigurationComplete || configurationLoading}
                      >
                        Browse Files
                      </Button>
                    </FileUploadTrigger>
                  </div>
                </FileUploadDropzone>

                <FileUploadList>
                  {uploadedFiles.map((file, index) => (
                    <FileUploadItem key={index} value={file}>
                      <FileUploadItemPreview />
                      <FileUploadItemMetadata />
                      <FileUploadItemDelete />
                    </FileUploadItem>
                  ))}
                </FileUploadList>
              </FileUpload>

              {csvEmployees.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Users className="size-4" />
                    {csvEmployees.length} employees ready to add
                  </div>
                  <div className="max-h-32 overflow-y-auto border rounded p-2 text-xs">
                    {csvEmployees.map((emp, idx) => (
                      <div key={idx} className="flex justify-between py-1">
                        <span>{emp.name}</span>
                        <span className="text-muted-foreground">
                          {emp.email}
                        </span>
                      </div>
                    ))}
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleCsvSubmit}
                          disabled={isProcessing || !isConfigurationComplete || configurationLoading}
                          className="w-full"
                        >
                          {isProcessing ? "Processing..." : "Add All Employees"}
                        </Button>
                      </TooltipTrigger>
                      {!isConfigurationComplete && (
                        <TooltipContent>
                          <p>Configure email template and Gmail or SMTP settings first</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CSV Format Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                CSV Format Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                readOnly
                value={`Required columns: name, email, role, interview_level, tenure

Valid roles: manager, developer, designer, analyst, marketing, sales, hr, finance, operations, other

Valid levels: junior, mid-level, senior, lead, director, vp, c-level

Note: tenure should be in months

Example:
name,email,role,interview_level,tenure
John Doe,john@company.com,developer,senior,24
Jane Smith,jane@company.com,manager,lead,36`}
                className="text-xs font-mono h-full min-h-[300px]"
              />
            </CardContent>
          </Card>
        </div>
        <ExitSessionsTable data={transformedSessionsData} />
        
        <AddEmployeeModal
          open={showAddModal && isConfigurationComplete}
          onOpenChange={setShowAddModal}
          onAddEmployee={handleAddEmployee}
        />
      </div>
    </div>
  );
}
