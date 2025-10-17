export interface Session {
    session_id: string;
    name: string;
    email: string;
    role: string;
    interview_level: string;
    tenure: number;
    created_at?: string;
    createdAt?: string;
}

export interface SessionResponse {
    id: string;
    sessionId: string;
    name: string;
    email: string;
    question_number: string;
    question: string;
    response: string;
    timestamp: string;
    role: string;
    level: string;
    sentiment: string;
    confidence: number;
    themes: string[];
}

export interface FeedbackSummary {
    session_id: string;
    expectations_vs_reality: string;
    highlights: string;
    challenges_faced: string;
    manager_and_team_support: string;
    recognition_and_value: string;
    growth_and_learning: string;
    feedback_experience: string;
    transparency_and_policies: string;
    relationship_with_manager: string;
    benefits_and_compensation: string;
    reason_for_exit: string;
    rejoin_recommendation: {
        would_rejoin: boolean;
        conditions_to_rejoin: string;
        would_recommend: boolean;
        conditions_to_recommend: string;
    };
    additional_insights: string;
}

export interface ApiResponseData {
    responses: SessionResponse[];
    feedbackSummaries: FeedbackSummary[];
    analytics: {
        totalResponses: number;
        totalSessions: number;
        sentimentStats: Record<string, number>;
        themeStats: Record<string, number>;
        themeSentimentStats: Record<
            string,
            { positive: number; negative: number; neutral: number; total: number }
        >;
        avgConfidence: number;
        roleSentimentMap: Record<string, unknown[]>;
        trendData: Array<{
            date: string;
            positive: number;
            negative: number;
            neutral: number;
            total: number;
            positivePercentage: number;
            negativePercentage: number;
            neutralPercentage: number;
        }>;
        weeklyTrends: Array<{
            week: string;
            startDate: string;
            endDate: string;
            positive: number;
            negative: number;
            neutral: number;
            total: number;
            positivePercentage: number;
            negativePercentage: number;
            neutralPercentage: number;
        }>;
    };
}