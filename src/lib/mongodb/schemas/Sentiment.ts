/**
 * Sentiment Schema
 * 
 * Stores AI-powered sentiment analysis results for interview responses.
 * Analyzes employee emotions, confidence, and themes from conversation data.
 * 
 * @module mongodb/schemas/Sentiment
 */

import mongoose, { Schema, Document } from "mongoose";

/**
 * Sentiment Document Interface
 * 
 * Represents sentiment analysis for a specific interview question/response pair.
 * Powered by Lyzr AI agents to extract emotional insights and themes.
 */
export interface ISentiment extends Document {
  /** Associated interview session ID */
  session_id: string;
  /** HR user who owns the session */
  user_id: string;
  /** Sequential question identifier (e.g., "1", "2", "3") */
  question_number: string;
  /** The interview question text */
  question: string;
  /** Employee's response text (optional) */
  response?: string;
  /** AI-classified sentiment: positive, negative, or neutral */
  sentiment: "positive" | "negative" | "neutral";
  /** AI confidence score for sentiment classification (0-1) */
  confidence: number;
  /** Extracted themes and topics from the response */
  themes?: string[];
  /** Timestamp when sentiment analysis was created */
  created_at: Date;
  /** Timestamp of last sentiment update */
  updated_at: Date;
}

/**
 * Mongoose schema definition for Sentiment model
 */
const SentimentSchema: Schema = new Schema({
  session_id: {
    type: String,
    required: true,
    index: true,
  },
  user_id: {
    type: String,
    required: true,
    index: true,
  },
  question_number: {
    type: String,
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  response: {
    type: String,
    required: false,
  },
  sentiment: {
    type: String,
    required: true,
    enum: ["positive", "negative", "neutral"],
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
  },
  themes: {
    type: [String],
    required: false,
    default: [],
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

/**
 * Pre-save hook to automatically update the updated_at timestamp
 */
SentimentSchema.pre<ISentiment>("save", function (next) {
  this.updated_at = new Date();
  next();
});

/**
 * Unique compound index to prevent duplicate sentiment entries for same question
 */
SentimentSchema.index({ user_id: 1, session_id: 1, question_number: 1 }, { unique: true });

/**
 * Index for filtering sentiments by type and confidence
 */
SentimentSchema.index({ user_id: 1, sentiment: 1, confidence: -1 });

/**
 * Index for theme-based queries and analytics
 */
SentimentSchema.index({ user_id: 1, themes: 1 });

/**
 * Index for chronological sentiment queries
 */
SentimentSchema.index({ user_id: 1, created_at: -1 });

/**
 * Sentiment Model
 * 
 * Mongoose model for sentiment analysis operations.
 * Automatically reuses existing model in development to prevent re-compilation issues.
 */
export default mongoose.models.Sentiment ||
  mongoose.model<ISentiment>("Sentiment", SentimentSchema);
