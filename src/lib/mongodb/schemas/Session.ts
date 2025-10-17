import mongoose, { Schema, Document } from "mongoose";

export interface IFeedback {
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

export interface ISession extends Document {
  session_id: string;
  user_id: string; // HR user who created this session
  name: string; // Employee name
  email: string; // Employee email
  role: string; // Employee role (manager, developer, designer, analyst, etc.)
  interview_level: string; // Employee level (junior, mid-level, senior, lead, director)
  tenure: number; // Employee tenure in months (e.g., 2.5)
  status: string; // pending, active, completed, paused, cancelled
  created_at: Date;
  updated_at: Date;
  started_at?: Date;
  completed_at?: Date;
  duration_minutes?: number;
  feedback?: IFeedback;
}

const SessionSchema: Schema = new Schema({
  session_id: {
    type: String,
    required: true,
    unique: true,
  },
  user_id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  role: {
    type: String,
    required: true,
    enum: [
      "manager",
      "developer",
      "designer",
      "analyst",
      "marketing",
      "sales",
      "hr",
      "finance",
      "operations",
      "other",
    ],
  },
  interview_level: {
    type: String,
    required: true,
    enum: [
      "junior",
      "mid-level",
      "senior",
      "lead",
      "director",
      "vp",
      "c-level",
    ],
  },
  tenure: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    required: true,
    enum: ["pending", "active", "completed", "paused", "cancelled"],
    default: "pending",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  started_at: {
    type: Date,
  },
  completed_at: {
    type: Date,
  },
  duration_minutes: {
    type: Number,
    default: 0,
  },
  feedback: {
    type: Object,
    required: false,
  },
});

// Update the updated_at field before saving
SessionSchema.pre<ISession>("save", function (next) {
  this.updated_at = new Date();

  // Calculate duration if session is completed and both timestamps exist
  if (this.status === "completed" && this.started_at && this.completed_at) {
    const startTime = new Date(this.started_at);
    const endTime = new Date(this.completed_at);
    const durationMs = endTime.getTime() - startTime.getTime();
    this.duration_minutes = Math.round(durationMs / (1000 * 60)); // Convert to minutes and round
  }

  next();
});

// Create indexes for better query performance
SessionSchema.index({ user_id: 1, status: 1, created_at: -1 });
SessionSchema.index({ user_id: 1, role: 1, interview_level: 1 });
SessionSchema.index({ session_id: 1, user_id: 1 });

export default mongoose.models.Session ||
  mongoose.model<ISession>("Session", SessionSchema);
