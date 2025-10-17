"use client";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Types for our API
export interface CreateSessionRequest {
  session_id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  interview_level: string;
  tenure: number;
}

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

export interface UpdateSessionRequest {
  status?: string;
  started_at?: string;
  completed_at?: string;
  duration_minutes?: number;
}

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

export interface CreateMessageRequest {
  role: string;
  content: string;
  session_id: string;
}

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

export interface GenerateFeedbackRequest {
  session_id: string;
  user_id: string;
}

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

export interface CreateSentimentRequest {
  session_id: string;
  question_number: string;
  question: string;
  response?: string;
  sentiment: "positive" | "negative" | "neutral";
  confidence: number;
  themes?: string[];
}

export interface CreateSentimentResponse {
  success: boolean;
  message: string;
  data: SentimentData;
}

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

export interface SendInvitationRequest {
  session_id: string;
  user_id: string;
}

export interface SendInvitationResponse {
  message: string;
  session_id: string;
  email: string;
  interview_url: string;
}

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

const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
    credentials: "include",
  }),
  tagTypes: ["Session", "Message"],
  endpoints: (builder) => ({
    // Session endpoints
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

    getSession: builder.query<SessionResponse, string>({
      query: (sessionId) => `/sessions/${sessionId}`,
      providesTags: ["Session"],
    }),

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

    deleteSession: builder.mutation<{ message: string }, string>({
      query: (sessionId) => ({
        url: `/sessions/${sessionId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Session"],
    }),

    // Message endpoints
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

    getMessages: builder.query<
      GetMessagesResponse,
      { sessionId: string; limit?: number; skip?: number }
    >({
      query: ({ sessionId, limit = 50, skip = 0 }) =>
        `/messages?session_id=${sessionId}&limit=${limit}&skip=${skip}`,
      providesTags: ["Message"],
    }),

    // Feedback endpoint
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

    // Sentiment endpoints
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

    // Analytics endpoint
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

    // Send invitation endpoint
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
