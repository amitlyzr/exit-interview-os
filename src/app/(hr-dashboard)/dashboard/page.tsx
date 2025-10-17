"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Plus, BarChart3 } from "lucide-react";

import { useAuth } from "@/components/providers/AuthProvider";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { ThemesAnalysis } from "@/components/themes-analysis";
import { SentimentChart } from "@/components/sentiment-chart";
import { ExitSessionsTable } from "@/components/exit-sessions-table";
import { FeedbackSummaryComponent } from "@/components/feedback-summary";
import { ExitInterviewAnalytics } from "@/components/exit-interview-analytics";

import type { ApiResponseData, Session, SessionResponse } from "@/types/dashboard";

const useSessionsAnalyticsData = (timeFilter: string, roleFilter: string, user_id?: string) => {
    const [data, setData] = React.useState<ApiResponseData | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams();
                if (timeFilter !== "all") params.append("timeFilter", timeFilter);
                if (roleFilter !== "all") params.append("roleFilter", roleFilter);
                if (user_id) params.append("user_id", user_id);

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
    }, [timeFilter, roleFilter, user_id]);

    return { data, loading, error };
};

export default function DashboardPage() {
    const router = useRouter();
    const { userId } = useAuth();

    const [sessionsData, setSessionsData] = useState<{ sessions: Session[] } | null>(null);

    const timeFilter = "all";
    const roleFilter = "all";

    // Sessions analytics data hook (for analytics only, not table data)
    const { data: analyticsData, loading: analyticsLoading } = useSessionsAnalyticsData(timeFilter, roleFilter, userId || undefined);

    // Transform sessions data for display
    const transformedSessionsData = useMemo(() => {
        if (!sessionsData?.sessions) return [];

        return sessionsData.sessions.map((session: Session) => {
            const sessionResponses = analyticsData?.responses?.filter(
                (response: SessionResponse) => response.sessionId === session.session_id
            ) || [];

            const hasResponses = sessionResponses.length > 0;

            return {
                employeeName: session.name,
                email: session.email,
                role: session.role.charAt(0).toUpperCase() + session.role.slice(1),
                level: session.interview_level.charAt(0).toUpperCase() + session.interview_level.slice(1),
                status: hasResponses ? "Completed" : "Pending",
                duration: hasResponses ? `${sessionResponses.length} responses` : "Not started",
                created: new Date(session.created_at || session.createdAt || Date.now()).toLocaleDateString("en-US", {
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

    // Fetch sessions data on component mount
    useEffect(() => {
        if (userId) {
            fetchUserSessions(userId);
        }
    }, [userId]);

    const fetchUserSessions = async (user_id: string) => {
        try {
            const response = await fetch(`/api/sessions?user_id=${user_id}&limit=100`);
            const result = await response.json();

            if (result.success) {
                setSessionsData({ sessions: result.sessions });
            } else {
                console.error('Failed to fetch sessions:', result.message);
                setSessionsData({ sessions: [] });
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
            setSessionsData({ sessions: [] });
        }
    };

    return (
        <>
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-6 py-6">
                        {/* Page Header */}
                        <div className="px-4 lg:px-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-semibold">
                                        Exit Interview Dashboard
                                    </h1>
                                    <p className="text-muted-foreground text-sm">
                                        Manage and track your AI-powered exit interview sessions
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={() => router.push("/add-email")}>
                                        <Plus className="size-4" />
                                        Add Employees
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Analytics Cards */}
                        <div className="px-4 lg:px-6">
                            <ExitInterviewAnalytics
                                analyticsData={analyticsData?.analytics}
                                isLoading={analyticsLoading}
                            />
                        </div>

                        {/* Main Content Tabs */}
                        <div className="px-4 lg:px-6">
                            <Tabs defaultValue="overview" className="space-y-6">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="overview">Overview</TabsTrigger>
                                    <TabsTrigger value="feedback">Feedback</TabsTrigger>
                                    <TabsTrigger value="themes">Themes</TabsTrigger>
                                </TabsList>

                                <TabsContent value="overview" className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6 @5xl/main:grid-cols-2">
                                        <SentimentChart
                                            sentimentStats={analyticsData?.analytics?.sentimentStats}
                                            totalResponses={analyticsData?.analytics?.totalResponses}
                                            isLoading={analyticsLoading}
                                        />

                                        {/* Quick Stats */}
                                        <Card className="border bg-card shadow-sm">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                                                    <BarChart3 className="size-5" />
                                                    Quick Insights
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    {analyticsLoading ? (
                                                        <div className="space-y-3">
                                                            {[...Array(4)].map((_, i) => (
                                                                <div
                                                                    key={i}
                                                                    className="flex items-center justify-between"
                                                                >
                                                                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                                                                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm font-medium text-foreground">
                                                                    Active Sessions
                                                                </span>
                                                                <Badge
                                                                    variant="outline"
                                                                    className="bg-blue-100 text-blue-800"
                                                                >
                                                                    {analyticsData?.analytics?.totalSessions || 0}
                                                                </Badge>
                                                            </div>

                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm font-medium text-foreground">
                                                                    Response Rate
                                                                </span>
                                                                <Badge
                                                                    variant="outline"
                                                                    className="bg-green-100 text-green-800"
                                                                >
                                                                    {analyticsData?.analytics?.totalResponses
                                                                        ? Math.round(
                                                                            (analyticsData.analytics
                                                                                .totalResponses /
                                                                                (analyticsData.analytics
                                                                                    .totalSessions *
                                                                                    3)) *
                                                                            100
                                                                        )
                                                                        : 0}
                                                                    %
                                                                </Badge>
                                                            </div>

                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm font-medium text-foreground">
                                                                    Avg Confidence
                                                                </span>
                                                                <Badge
                                                                    variant="outline"
                                                                    className="bg-purple-100 text-purple-800"
                                                                >
                                                                    {Math.round(
                                                                        (analyticsData?.analytics?.avgConfidence ||
                                                                            0) * 100
                                                                    )}
                                                                    %
                                                                </Badge>
                                                            </div>

                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm font-medium text-foreground">
                                                                    Key Themes
                                                                </span>
                                                                <Badge
                                                                    variant="outline"
                                                                    className="bg-orange-100 text-orange-800"
                                                                >
                                                                    {
                                                                        Object.keys(
                                                                            analyticsData?.analytics?.themeStats || {}
                                                                        ).length
                                                                    }
                                                                </Badge>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>

                                <TabsContent value="feedback" className="space-y-6">
                                    <FeedbackSummaryComponent
                                        feedbackSummaries={analyticsData?.feedbackSummaries || []}
                                        isLoading={analyticsLoading}
                                    />
                                </TabsContent>

                                <TabsContent value="themes" className="space-y-6">
                                    <ThemesAnalysis
                                        themeStats={analyticsData?.analytics?.themeStats}
                                        themeSentimentStats={
                                            analyticsData?.analytics?.themeSentimentStats
                                        }
                                        isLoading={analyticsLoading}
                                    />
                                </TabsContent>
                            </Tabs>

                            <div className="mt-6">
                                <ExitSessionsTable data={transformedSessionsData} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
