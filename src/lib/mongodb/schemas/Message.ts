import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  role: string;
  content: string;
  created_at: Date;
  session_id: string;
  user_id: string; // HR user who owns this session
}

const MessageSchema: Schema = new Schema({
  role: {
    type: String,
    required: true,
    enum: ["user", "assistant", "system"],
  },
  content: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  session_id: {
    type: String,
    required: true,
  },
  user_id: {
    type: String,
    required: true,
  },
});

// Create indexes for better query performance
MessageSchema.index({ session_id: 1, created_at: 1 });
MessageSchema.index({ user_id: 1, session_id: 1 });

export default mongoose.models.Message ||
  mongoose.model<IMessage>("Message", MessageSchema);
