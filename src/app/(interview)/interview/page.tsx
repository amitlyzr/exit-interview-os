"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChatMessage } from "@/types/chat-types";
import VoiceChat from "@/components/voice-chat";
import { Button } from "@/components/ui/button";
import {
  useGetMessagesQuery,
  useUpdateSessionMutation,
  useGenerateFeedbackMutation,
  useGetSessionQuery,
} from "@/lib/features/api/api";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const agentId = "68ece7bf0e07afd8b00318fd";

function InterviewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const { data: sessionData } = useGetSessionQuery(sessionId!, { skip: !sessionId });

  const role = sessionData?.session?.role;
  const level = sessionData?.session?.interview_level;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const setIsResponseLoading = () => { };
  const [isVoiceChatActive, setIsVoiceChatActive] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);
  const [accumulatedTime, setAccumulatedTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use the HR user's userId from the session instead of generating a random one
  const userId = sessionData?.session?.user_id;
  const [updateSession] = useUpdateSessionMutation();
  const [generateFeedback] = useGenerateFeedbackMutation();



  // Fetch existing messages for this session
  const { data: existingMessages, isLoading: isLoadingMessages } =
    useGetMessagesQuery(
      { sessionId: sessionId!, limit: 100 },
      { skip: !sessionId }
    );

  // End interview confirmation modal state
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);

  // Redirect if session_id is missing or session is invalid
  useEffect(() => {
    if (!sessionId) {
      router.push("/");
      return;
    }
  }, [sessionId, router]);

  // Activate session when employee first accesses via email link
  useEffect(() => {
    if (sessionData?.session && sessionData.session.status === "pending") {
      // Activate the session by updating status to active and setting started_at
      updateSession({
        sessionId: sessionId!,
        updates: {
          status: "active",
          started_at: new Date().toISOString(),
        },
      }).catch((error) => {
        console.error("Error activating session:", error);
        toast.error("Failed to activate interview session.");
      });
    }
  }, [sessionData, sessionId, updateSession]);

  // Timer effect - only runs when voice chat is active
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isVoiceChatActive) {
      // Start timer
      if (!timerStartTime) {
        setTimerStartTime(new Date());
      }

      interval = setInterval(() => {
        setSessionTime((prev) => prev + 1);
      }, 1000);
    } else {
      // Pause timer and accumulate time
      if (timerStartTime) {
        const currentTime = new Date();
        const sessionDuration = Math.floor(
          (currentTime.getTime() - timerStartTime.getTime()) / 1000
        );
        setAccumulatedTime((prev) => prev + sessionDuration);
        setTimerStartTime(null);
      }
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isVoiceChatActive, timerStartTime]);

  // Update session time display to include accumulated time
  useEffect(() => {
    if (!isVoiceChatActive && timerStartTime) {
      // Calculate current session time including accumulated time
      const currentTime = new Date();
      const currentSessionDuration = Math.floor(
        (currentTime.getTime() - timerStartTime.getTime()) / 1000
      );
      setSessionTime(accumulatedTime + currentSessionDuration);
    } else if (!isVoiceChatActive) {
      // Show only accumulated time when not active
      setSessionTime(accumulatedTime);
    }
  }, [isVoiceChatActive, timerStartTime, accumulatedTime]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getRoleName = (roleId: string | undefined) => {
    const roles: Record<string, string> = {
      manager: "Manager",
      developer: "Developer",
      designer: "Designer",
      analyst: "Analyst",
      marketing: "Marketing",
      sales: "Sales",
      hr: "Human Resources",
      finance: "Finance",
      operations: "Operations",
      other: "Other",
    };
    return roleId ? roles[roleId] || roleId : "Unknown";
  };

  const getLevelName = (lvl: string | undefined) => {
    const levels: Record<string, string> = {
      junior: "Junior",
      "mid-level": "Mid-Level",
      senior: "Senior",
      lead: "Lead",
      director: "Director",
      vp: "VP",
      "c-level": "C-Level",
    };
    return lvl ? levels[lvl] || lvl : "Unknown";
  };


  const getLevelStars = (lvl: string | undefined) => {
    const starCounts: Record<string, number> = {
      junior: 1,
      "mid-level": 2,
      senior: 3,
      lead: 4,
      director: 5,
      vp: 6,
      "c-level": 7,
    };
    return lvl ? starCounts[lvl] || 1 : 1;
  };

  const handleEndInterview = () => {
    setShowEndConfirmation(true);
  };

  const handleConfirmEndInterview = async () => {
    try {
      // Calculate actual duration based on accumulated voice chat time
      let totalSessionTime = accumulatedTime;

      // Add current session time if voice chat is active
      if (isVoiceChatActive && timerStartTime) {
        const currentTime = new Date();
        const currentSessionDuration = Math.floor(
          (currentTime.getTime() - timerStartTime.getTime()) / 1000
        );
        totalSessionTime += currentSessionDuration;
      }

      const actualDurationMinutes = Math.round(totalSessionTime / 60);

      // Update session status and duration
      const endTime = new Date();
      await updateSession({
        sessionId: sessionId!, // We know sessionId is not null due to early return
        updates: {
          status: "completed",
          duration_minutes: actualDurationMinutes,
          completed_at: endTime.toISOString(),
        },
      }).unwrap();

      // Close confirmation modal
      setShowEndConfirmation(false);

      // Generate feedback for admin purposes (but don't show to employee)
      toast.loading("Processing your interview...");
      try {
        await generateFeedback({
          session_id: sessionId!,
          user_id: userId!,
        }).unwrap();
      } catch (feedbackError) {
        console.error("Error generating feedback:", feedbackError);
        // Continue anyway - feedback generation failure shouldn't block completion
      }

      toast.dismiss();
      toast.success(
        "Interview completed successfully! Thank you for your time."
      );

      // Redirect directly to home without showing feedback
      router.push("/");
    } catch (error) {
      console.error("Error completing interview:", error);
      toast.dismiss();
      toast.error("Failed to complete interview. Please try again.");
      setShowEndConfirmation(false);
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load existing messages
  useEffect(() => {
    if (!messagesLoaded && !isLoadingMessages && sessionId) {
      if (existingMessages && existingMessages.messages.length > 0) {
        // Convert API messages to ChatMessage format, filtering out system messages
        const convertedMessages: ChatMessage[] = existingMessages.messages
          .filter((msg) => msg.role === "user" || msg.role === "assistant")
          .map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          }));
        setMessages(convertedMessages);
      } else {
        // No existing messages, start with empty array
        setMessages([]);
      }
      setMessagesLoaded(true);
    }
  }, [existingMessages, isLoadingMessages, messagesLoaded, sessionId]);

  // Don't render if sessionId is null or while loading messages
  if (!sessionId) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-800">Loading...</p>
          <p className="text-sm text-slate-600">Redirecting to home page...</p>
        </div>
      </div>
    );
  }

  // Show loading while fetching messages
  if (isLoadingMessages) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-slate-800">
            Loading Interview...
          </p>
          <p className="text-sm text-slate-600">
            Fetching conversation history...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-96 bg-muted/30 border-r flex flex-col fixed h-full z-10">
        {/* Header */}
        <div className="p-6 border-b">
          {/* <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="size-4" />
            <span>Back</span>
          </Link> */}
          <div>
            <h1 className="text-xl font-semibold">AI Exit Interview</h1>
            <p className="text-sm text-muted-foreground">Powered by Lyzr AI</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm font-medium">{getRoleName(role)}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-sm font-medium">{getLevelName(level)}</span>
            </div>
          </div>
        </div>

        {/* Session Info */}
        <div className="p-6 space-y-6 flex-1">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12,6 12,12 16,14"></polyline>
              </svg>
              <span className="text-sm font-medium">Session Time</span>
            </div>
            <div className="text-2xl font-bold tabular-nums">{formatTime(sessionTime)}</div>
            <p className="text-xs text-muted-foreground">Timer runs only when mic is active</p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="text-sm font-medium">Interview Overview</span>
            </div>
            <div className="space-y-3">
              <div className="text-sm">
                <span className="font-medium">ROLE</span>
                <div>{getRoleName(role)}</div>
              </div>
              <div className="text-sm">
                <span className="font-medium">LEVEL</span>
                <div className="flex items-center gap-1">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`w-2 h-2 rounded-full ${i < getLevelStars(level) ? 'bg-primary' : 'bg-muted'}`} />
                    ))}
                  </div>
                  <span className="ml-2">{getLevelName(level)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* <div>
            <span className="text-sm font-medium mb-3 block">PROGRESS</span>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-xl font-bold">{messages.filter((m) => m.role === "assistant").length}</div>
                <div className="text-xs text-muted-foreground">Questions</div>
              </div>
              <div>
                <div className="text-xl font-bold">{messages.filter((m) => m.role === "user").length}</div>
                <div className="text-xs text-muted-foreground">Responses</div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isVoiceChatActive ? 'bg-green-500' : 'bg-muted'}`}></div>
              <span className="text-xs">{isVoiceChatActive ? 'Live Voice' : 'Voice Idle'}</span>
            </div>
          </div> */}

          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-sm font-medium mb-1">SESSION ID</div>
            <div className="font-mono text-xs text-muted-foreground">{sessionId?.slice(-8)}</div>
          </div>

          <div className="p-6 border-t">
            <Button className="w-full" size="sm" onClick={handleEndInterview}>
              End Interview
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-96">
        {/* Conversation Header */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <div>
              <h2 className="text-lg font-semibold">Interview Conversation</h2>
              <p className="text-sm text-muted-foreground">Speak naturally or use voice commands</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-6 space-y-4 overflow-y-auto pb-40">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-lg">
                {/* Welcome Message */}
                <h3 className="text-xl font-semibold mb-3">Ready to Start?</h3>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold mb-3">
                    Hey {sessionData?.session?.name?.split(' ')[0] || 'there'}, we are sad to see you go
                  </h1>
                  <div className="text-center mt-4">
                    <div className="text-sm text-muted-foreground mb-1">Time Spent at Organization</div>
                    <div className="text-base font-medium">
                      {sessionData?.session?.tenure ?
                        `${Math.floor(sessionData.session.tenure / 12)} years, ${sessionData.session.tenure % 12} months` :
                        'Not specified'
                      }
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    Your feedback is valuable to us. Please take a few minutes to share your experience.
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    This AI-powered interview will help us understand your experience and improve our workplace.
                  </p>
                </div>

                {/* Ready to Start Section */}
                <div className="text-center">
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {/* Click the microphone button below to begin your exit interview as a{" "} */}
                    <span className="font-semibold">{getRoleName(role)}</span> at{" "}
                    <span className="font-semibold">{getLevelName(level)}</span> level.
                  </p>
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-4 mb-6 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2z" clipRule="evenodd" />
                        </svg>
                        Confidential and secure
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        5-10 minutes
                      </div>
                    </div>
                    {/* Voice-powered interview experience • Timer starts with mic */}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}>
                  <div className={`max-w-2xl p-4 rounded-lg ${message.role === 'user'
                    ? 'bg-primary text-primary-foreground ml-8'
                    : 'bg-muted mr-8'
                    }`}>
                    <div className="text-sm leading-relaxed">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-current">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-base font-bold mb-2 text-current">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-bold mb-1 text-current">{children}</h3>,
                          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1 text-current">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1 text-current">{children}</ol>,
                          li: ({ children }) => <li className="text-current">{children}</li>,
                          code: ({ children }) => (
                            <code className={`px-1.5 py-0.5 rounded text-xs font-mono ${
                              message.role === 'user' 
                                ? 'bg-primary-foreground/20 text-primary-foreground' 
                                : 'bg-muted-foreground/20 text-muted-foreground'
                            }`}>
                              {children}
                            </code>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className={`border-l-4 pl-4 italic my-2 ${
                              message.role === 'user' 
                                ? 'border-primary-foreground/30' 
                                : 'border-muted-foreground/30'
                            }`}>
                              {children}
                            </blockquote>
                          ),
                          strong: ({ children }) => <strong className="font-semibold text-current">{children}</strong>,
                          em: ({ children }) => <em className="italic text-current">{children}</em>,
                          table: ({ children }) => (
                            <div className="overflow-x-auto my-2">
                              <table className={`min-w-full border-collapse border ${
                                message.role === 'user' 
                                  ? 'border-primary-foreground/30' 
                                  : 'border-muted-foreground/30'
                              }`}>
                                {children}
                              </table>
                            </div>
                          ),
                          th: ({ children }) => (
                            <th className={`border px-2 py-1 text-xs font-semibold text-left ${
                              message.role === 'user' 
                                ? 'border-primary-foreground/30 bg-primary-foreground/10' 
                                : 'border-muted-foreground/30 bg-muted-foreground/10'
                            }`}>
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className={`border px-2 py-1 text-xs ${
                              message.role === 'user' 
                                ? 'border-primary-foreground/30' 
                                : 'border-muted-foreground/30'
                            }`}>
                              {children}
                            </td>
                          )
                        }}
                      >
                        {message.content.replace(/\\n\\n/g, '\n\n').replace(/\\n/g, '\n')}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}

              {/* AI Thinking */}
              <div className="flex justify-start">
                <div className="bg-muted p-4 rounded-lg mr-8">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-current rounded-full animate-pulse animate-pulse-delay-0"></div>
                      <div className="w-1 h-1 bg-current rounded-full animate-pulse animate-pulse-delay-150"></div>
                      <div className="w-1 h-1 bg-current rounded-full animate-pulse animate-pulse-delay-300"></div>
                    </div>
                    <span className="text-xs">AI is thinking...</span>
                  </div>
                </div>
              </div>
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Voice Control */}
        <div className="fixed bottom-0 left-96 right-0 p-6 border-t bg-background z-20">
          <div className="flex items-center justify-center">
            <VoiceChat
              session_id={sessionId}
              user_id={userId!}
              agent_id={agentId}
              setMessages={setMessages}
              setIsResponseLoading={setIsResponseLoading}
              setIsVoiceChatActive={setIsVoiceChatActive}
              isStreaming={true}
            />
          </div>

          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground">
              {isVoiceChatActive ? (
                <>
                  <span className="text-red-600 font-medium">Listening...</span>
                  <br />
                  Voice-powered interview experience • Timer starts with mic
                </>
              ) : (
                <>
                  <span className="font-medium">Click to start voice conversation</span>
                  <br />
                  Voice-powered interview experience • Timer starts with mic
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* End Interview Confirmation Modal */}
      <Dialog open={showEndConfirmation} onOpenChange={setShowEndConfirmation}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-red-600 text-lg font-bold">!</span>
              </div>
              End Interview?
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-muted-foreground mb-6">
              Are you sure you want to end the interview? This action will
              complete your session and generate feedback.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <div className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-white text-xs font-bold">i</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Current Progress:
                  </p>
                  <p className="text-sm text-amber-700">
                    • Duration: {formatTime(sessionTime)}
                  </p>
                  <p className="text-sm text-amber-700">
                    • Responses:{" "}
                    {messages.filter((m) => m.role === "user").length}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowEndConfirmation(false)}
                className="flex-1"
              >
                Continue Interview
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmEndInterview}
                className="flex-1"
              >
                End Interview
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
}

// Loading component for Suspense fallback
function InterviewPageLoading() {
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-lg font-semibold text-slate-800">
          Loading Interview...
        </p>
        <p className="text-sm text-slate-600">Preparing your session...</p>
      </div>
    </div>
  );
}

// Main export with Suspense boundary
export default function InterviewPage() {
  return (
    <Suspense fallback={<InterviewPageLoading />}>
      <InterviewPageContent />
    </Suspense>
  );
}
