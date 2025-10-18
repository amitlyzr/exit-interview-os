/**
 * Analytics API - Comprehensive exit interview analytics and insights
 * 
 * @access HR users only
 * 
 * GET /api/analytics - Retrieve aggregated analytics (supports ?user_id, ?timeFilter, ?roleFilter)
 * curl "http://localhost:3000/api/analytics?user_id=user_456&timeFilter=30days&roleFilter=all"
 * 
 * Returns sentiment stats, theme analysis, trends, and feedback summaries
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/mongdb";
import Sentiment from "@/lib/mongodb/schemas/Sentiment";
import Session from "@/lib/mongodb/schemas/Session";

export async function GET(request: Request) {
  try {
    await connectDB();

    const url = new URL(request.url);
    const timeFilter = url.searchParams.get("timeFilter") || "all";
    const roleFilter = url.searchParams.get("roleFilter") || "all";
    const user_id = url.searchParams.get("user_id");

    // Build date filter
    let dateFilter = {};
    if (timeFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();

      switch (timeFilter) {
        case "7d":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "30d":
          filterDate.setDate(now.getDate() - 30);
          break;
        case "90d":
          filterDate.setDate(now.getDate() - 90);
          break;
      }

      dateFilter = { created_at: { $gte: filterDate } };
    }

    // Build session filter with user_id filtering
    const sessionFilter: Record<string, unknown> = { ...dateFilter };
    if (user_id) {
      sessionFilter.user_id = user_id;
    }
    if (roleFilter !== "all") {
      sessionFilter.role = roleFilter;
    }

    // Fetch sessions from database
    const sessions = await Session.find(sessionFilter)
      .sort({ created_at: -1 })
      .lean();

    // Fetch sentiment data for sessions with user_id filtering
    const sessionIds = sessions.map((s) => s.session_id);
    const sentimentFilter: Record<string, unknown> = {
      session_id: { $in: sessionIds },
    };
    if (user_id) {
      sentimentFilter.user_id = user_id;
    }
    
    const sentiments = await Sentiment.find(sentimentFilter).lean();

    // Prepare analyzed data from real sentiment data
    const analyzedData = sentiments.map((sentiment) => {
      const session = sessions.find(
        (s) => s.session_id === sentiment.session_id
      );
      return {
        id: String(sentiment._id),
        sessionId: sentiment.session_id,
        name: session?.name || "Unknown",
        email: session?.email || "Unknown",
        question_number: sentiment.question_number,
        question: sentiment.question,
        response: sentiment.response || "",
        timestamp: sentiment.created_at,
        role: session?.role || "unknown",
        level: session?.interview_level || "unknown",
        sentiment: sentiment.sentiment,
        confidence: sentiment.confidence,
        themes: sentiment.themes || [],
      };
    });

    // Calculate aggregate statistics from real data
    const sentimentStats = analyzedData.reduce((acc, item) => {
      acc[item.sentiment] = (acc[item.sentiment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const themeStats = analyzedData.reduce((acc, item) => {
      item.themes.forEach((theme: string) => {
        acc[theme] = (acc[theme] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    // Theme-based sentiment analysis
    const themeSentimentStats = analyzedData.reduce((acc, item) => {
      item.themes.forEach((theme: string) => {
        if (!acc[theme]) {
          acc[theme] = { positive: 0, negative: 0, neutral: 0, total: 0 };
        }
        acc[theme][item.sentiment as keyof (typeof acc)[typeof theme]]++;
        acc[theme].total++;
      });
      return acc;
    }, {} as Record<string, { positive: number; negative: number; neutral: number; total: number }>);

    const avgConfidence =
      analyzedData.length > 0
        ? analyzedData.reduce((sum, item) => sum + item.confidence, 0) /
          analyzedData.length
        : 0;

    // Role-based sentiment analysis from real data
    const roleSentimentMap = analyzedData.reduce((acc, item) => {
      if (!acc[item.role]) acc[item.role] = [];
      acc[item.role].push({
        sentiment: item.sentiment,
        confidence: item.confidence,
        level: item.level,
      });
      return acc;
    }, {} as Record<string, Array<{ sentiment: string; confidence: number; level: string }>>);

    // Generate comprehensive trend data from real data
    const trendData = [];
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split("T")[0];
    }).reverse();

    for (const date of last30Days) {
      const dayData = analyzedData.filter(
        (item) => new Date(item.timestamp).toISOString().split("T")[0] === date
      );

      const dayPositive = dayData.filter(
        (item) => item.sentiment === "positive"
      ).length;
      const dayNegative = dayData.filter(
        (item) => item.sentiment === "negative"
      ).length;
      const dayNeutral = dayData.filter(
        (item) => item.sentiment === "neutral"
      ).length;
      const dayTotal = dayData.length;

      trendData.push({
        date,
        positive: dayPositive,
        negative: dayNegative,
        neutral: dayNeutral,
        total: dayTotal,
        positivePercentage:
          dayTotal > 0 ? Math.round((dayPositive / dayTotal) * 100) : 0,
        negativePercentage:
          dayTotal > 0 ? Math.round((dayNegative / dayTotal) * 100) : 0,
        neutralPercentage:
          dayTotal > 0 ? Math.round((dayNeutral / dayTotal) * 100) : 0,
      });
    }

    // Weekly sentiment trends (last 12 weeks)
    const weeklyTrends = [];
    for (let i = 11; i >= 0; i--) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - i * 7);
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 6);

      const weekData = analyzedData.filter((item) => {
        const itemDate = new Date(item.timestamp);
        return itemDate >= startDate && itemDate <= endDate;
      });

      const weekPositive = weekData.filter(
        (item) => item.sentiment === "positive"
      ).length;
      const weekNegative = weekData.filter(
        (item) => item.sentiment === "negative"
      ).length;
      const weekNeutral = weekData.filter(
        (item) => item.sentiment === "neutral"
      ).length;
      const weekTotal = weekData.length;

      weeklyTrends.push({
        week: `Week ${12 - i}`,
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        positive: weekPositive,
        negative: weekNegative,
        neutral: weekNeutral,
        total: weekTotal,
        positivePercentage:
          weekTotal > 0 ? Math.round((weekPositive / weekTotal) * 100) : 0,
        negativePercentage:
          weekTotal > 0 ? Math.round((weekNegative / weekTotal) * 100) : 0,
        neutralPercentage:
          weekTotal > 0 ? Math.round((weekNeutral / weekTotal) * 100) : 0,
      });
    }

    // Get real feedback summaries from completed sessions
    const sessionsWithFeedback = sessions.filter((s) => s.feedback);
    const feedbackSummaries = sessionsWithFeedback.map((session) => ({
      session_id: session.session_id,
      ...session.feedback,
    }));

    return NextResponse.json({
      success: true,
      data: {
        responses: analyzedData,
        feedbackSummaries,
        analytics: {
          totalResponses: analyzedData.length,
          totalSessions: sessions.length,
          sentimentStats,
          themeStats,
          themeSentimentStats,
          avgConfidence: Number(avgConfidence.toFixed(2)),
          roleSentimentMap,
          trendData,
          weeklyTrends,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error fetching analytics data",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
