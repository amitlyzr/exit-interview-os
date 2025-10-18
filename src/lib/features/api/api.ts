/**
 * RTK Query API - Exit interview sessions, messages, sentiment, and analytics
 */

"use client";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

/** Create session request */
export interface CreateSessionRequest {
  session_id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  interview_level: string;
  tenure: number;
}

/** Create session response */
export interface CreateSessionResponse {
  message: string;
  session: {
    session_id: string;
    name: string;
    email: string;
    role: string;
    interview_level: string;
    tenure: number;
    status: string;
    created_at: string;
    started_at?: string;
  };
}

/** Update session request */
export interface UpdateSessionRequest {
  status?: string;
  started_at?: string;
  completed_at?: string;
  duration_minutes?: number;
}

/** Session response */
export interface SessionResponse {
  session: {
    session_id: string;
    user_id: string;
    name: string;
    email: string;
    role: string;
    interview_level: string;
    tenure: number;
    status: string;
    created_at: string;
    updated_at: string;
    started_at?: string;
    completed_at?: string;
    duration_minutes?: number;
    feedback?: StructuredFeedback;
  };
}

/** Update session response */
export interface UpdateSessionResponse {
  message: string;
  session: {
    session_id: string;
    user_id: string;
    name: string;
    email: string;
    role: string;
    interview_level: string;
    tenure: number;
    status: string;
    created_at: string;
    updated_at: string;
    started_at?: string;
    completed_at?: string;
    duration_minutes?: number;
    feedback?: StructuredFeedback;
  };
}

/** Create message request */
export interface CreateMessageRequest {
  role: string;
  content: string;
  session_id: string;
}

/** Create message response */
export interface CreateMessageResponse {
  message: string;
  data: {
    _id: string;
    role: string;
    content: string;
    session_id: string;
    created_at: string;
  };
}

/** Get messages response */
export interface GetMessagesResponse {
  messages: Array<{
    _id: string;
    role: string;
    content: string;
    session_id: string;
    created_at: string;
  }>;
  pagination: {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
  };
}

/** Generate feedback request */
export interface GenerateFeedbackRequest {
  session_id: string;
  user_id: string;
}

/** Structured feedback data */
export interface StructuredFeedback {
  expectations_vs_reality: string;
  challenges_faced: string;
  growth_and_learning: string;
  relationship_with_manager: string;
  recognition_and_value: string;
  highlights: string;
  transparency_and_policies: string;
  rejoin_recommendation: {
    would_rejoin: boolean;
    would_recommend: boolean;
    conditions_to_rejoin: string;
    conditions_to_recommend: string;
  };
  feedback_experience: string;
  additional_insights: string;
}

/** Generate feedback response */
export interface GenerateFeedbackResponse {
  success: boolean;
  feedback: StructuredFeedback;
  session_info: {
    session_id: string;
    technology: string;
    level: string;
    duration_minutes?: number;
    total_messages: number;
    user_responses: number;
    ai_questions: number;
  };
}

/** Sentiment data */
export interface SentimentData {
  session_id: string;
  question_number: string;
  question: string;
  response?: string;
  sentiment: "positive" | "negative" | "neutral";
  confidence: number;
  themes?: string[];
  created_at: string;
  updated_at: string;
}

/** Create sentiment request */
export interface CreateSentimentRequest {
  session_id: string;
  question_number: string;
  question: string;
  response?: string;
  sentiment: "positive" | "negative" | "neutral";
  confidence: number;
  themes?: string[];
}

/** Create sentiment response */
export interface CreateSentimentResponse {
  success: boolean;
  message: string;
  data: SentimentData;
}

/** Get sentiments response */
export interface GetSentimentsResponse {
  success: boolean;
  data: {
    sentiments: SentimentData[];
    pagination: {
      total: number;
      limit: number;
      skip: number;
      hasMore: boolean;
    };
  };
}

/** Send invitation request */
export interface SendInvitationRequest {
  session_id: string;
  user_id: string;
}

/** Send invitation response */
export interface SendInvitationResponse {
  message: string;
  session_id: string;
  email: string;
  interview_url: string;
}

/** Analytics response */
export interface AnalyticsResponse {
  success: boolean;
  data: {
    responses: Array<{
      id: string;
      sessionId: string;
      question_number: string;
      question: string;
      response: string;
      timestamp: string;
      role: string;
      level: string;
      sentiment: "positive" | "negative" | "neutral";
      confidence: number;
      themes: string[];
    }>;
    feedbackSummaries: Array<{
      session_id: string;
      expectations_vs_reality: string;
      challenges_faced: string;
      growth_and_learning: string;
      relationship_with_manager: string;
      recognition_and_value: string;
      highlights: string;
      transparency_and_policies: string;
      rejoin_recommendation: {
        would_rejoin: boolean;
        would_recommend: boolean;
        conditions_to_rejoin: string;
        conditions_to_recommend: string;
      };
      feedback_experience: string;
      additional_insights: string;
    }>;
    analytics: {
      totalResponses: number;
      totalSessions: number;
      sentimentStats: Record<string, number>;
      themeStats: Record<string, number>;
      avgConfidence: number;
      roleSentimentMap: Record<
        string,
        Array<{ sentiment: string; confidence: number; level: string }>
      >;
      trendData: Array<{
        date: string;
        positive: number;
        negative: number;
        neutral: number;
      }>;
    };
  };
}

/**
 * RTK Query API instance
 * Provides hooks for all API operations with automatic caching and state management
 */
const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
    credentials: "include",
  }),
  tagTypes: ["Session", "Message"],
  endpoints: (builder) => ({
    /** Create a new exit interview session */
    createSession: builder.mutation<
      CreateSessionResponse,
      CreateSessionRequest
    >({
      query: (body) => ({
        url: "/sessions",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Session"],
    }),

    /** Get session by ID */
    getSession: builder.query<SessionResponse, string>({
      query: (sessionId) => `/sessions/${sessionId}`,
      providesTags: ["Session"],
    }),

    /** Get multiple sessions with filters */
    getSessions: builder.query<
      { sessions: SessionResponse["session"][] },
      { status?: string; limit?: number }
    >({
      query: ({ status, limit = 50 }) => {
        const params = new URLSearchParams();
        if (status) params.append("status", status);
        params.append("limit", limit.toString());
        return `/sessions?${params.toString()}`;
      },
      providesTags: ["Session"],
    }),

    /** Update session details */
    updateSession: builder.mutation<
      UpdateSessionResponse,
      { sessionId: string; updates: UpdateSessionRequest }
    >({
      query: ({ sessionId, updates }) => ({
        url: `/sessions/${sessionId}`,
        method: "PATCH",
        body: updates,
      }),
      invalidatesTags: ["Session"],
    }),

    /** Delete a session */
    deleteSession: builder.mutation<{ message: string }, string>({
      query: (sessionId) => ({
        url: `/sessions/${sessionId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Session"],
    }),

    /** Create a new message in conversation */
    createMessage: builder.mutation<
      CreateMessageResponse,
      CreateMessageRequest
    >({
      query: (body) => ({
        url: "/messages",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Message"],
    }),

    /** Get messages for a session */
    getMessages: builder.query<
      GetMessagesResponse,
      { sessionId: string; limit?: number; skip?: number }
    >({
      query: ({ sessionId, limit = 50, skip = 0 }) =>
        `/messages?session_id=${sessionId}&limit=${limit}&skip=${skip}`,
      providesTags: ["Message"],
    }),

    /** Generate AI feedback for session */
    generateFeedback: builder.mutation<
      GenerateFeedbackResponse,
      GenerateFeedbackRequest
    >({
      query: (body) => ({
        url: "/feedback",
        method: "POST",
        body,
      }),
    }),

    /** Create sentiment analysis record */
    createSentiment: builder.mutation<
      CreateSentimentResponse,
      CreateSentimentRequest
    >({
      query: (body) => ({
        url: "/sentiment",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Session"],
    }),

    /** Get sentiment data with filters */
    getSentiments: builder.query<
      GetSentimentsResponse,
      {
        session_id?: string;
        sentiment?: string;
        min_confidence?: number;
        themes?: string;
        limit?: number;
        skip?: number;
      }
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, value.toString());
          }
        });
        return `/sentiment?${searchParams.toString()}`;
      },
    }),

    /** Get analytics data */
    getAnalytics: builder.query<
      AnalyticsResponse,
      { timeFilter?: string; roleFilter?: string }
    >({
      query: ({ timeFilter, roleFilter }) => {
        const params = new URLSearchParams();
        if (timeFilter) params.append("timeFilter", timeFilter);
        if (roleFilter) params.append("roleFilter", roleFilter);
        return `/analytics?${params.toString()}`;
      },
    }),

    /** Send email invitation to employee */
    sendInvitation: builder.mutation<
      SendInvitationResponse,
      SendInvitationRequest
    >({
      query: (body) => ({
        url: "/send-invitation",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useCreateSessionMutation,
  useGetSessionQuery,
  useGetSessionsQuery,
  useUpdateSessionMutation,
  useDeleteSessionMutation,
  useCreateMessageMutation,
  useGetMessagesQuery,
  useGenerateFeedbackMutation,
  useCreateSentimentMutation,
  useGetSentimentsQuery,
  useGetAnalyticsQuery,
  useSendInvitationMutation,
} = api;

export default api;
