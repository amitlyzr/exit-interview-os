import mongoose, { Schema, Document } from "mongoose";

export interface ISentiment extends Document {
  session_id: string;
  user_id: string; // HR user who owns this session
  question_number: string;
  question: string;
  response?: string;
  sentiment: "positive" | "negative" | "neutral";
  confidence: number;
  themes?: string[];
  created_at: Date;
  updated_at: Date;
}

const SentimentSchema: Schema = new Schema({
  session_id: {
    type: String,
    required: true,
  },
  user_id: {
    type: String,
    required: true,
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

// Update the updated_at field before saving
SentimentSchema.pre<ISentiment>("save", function (next) {
  this.updated_at = new Date();
  next();
});

// Create indexes for better query performance
SentimentSchema.index({ user_id: 1, session_id: 1, question_number: 1 }, { unique: true });
SentimentSchema.index({ user_id: 1, sentiment: 1, confidence: -1 });
SentimentSchema.index({ user_id: 1, themes: 1 });
SentimentSchema.index({ user_id: 1, created_at: -1 });

export default mongoose.models.Sentiment ||
  mongoose.model<ISentiment>("Sentiment", SentimentSchema);
