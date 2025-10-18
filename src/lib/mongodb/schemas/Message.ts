/**
 * Message Schema
 * 
 * Stores individual conversation messages from exit interview sessions.
 * Messages are linked to sessions and can be user, assistant, or system generated.
 * 
 * @module mongodb/schemas/Message
 */

import mongoose, { Schema, Document } from "mongoose";

/**
 * Message Document Interface
 * 
 * Represents a single message in an exit interview conversation.
 * Messages form the complete transcript of the interview dialogue.
 */
export interface IMessage extends Document {
  /** Message role: user (employee), assistant (AI), or system */
  role: string;
  /** Message content/text */
  content: string;
  /** Timestamp when message was created */
  created_at: Date;
  /** Associated interview session ID */
  session_id: string;
  /** HR user who owns the session this message belongs to */
  user_id: string;
}

/**
 * Mongoose schema definition for Message model
 */
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
    index: true,
  },
  user_id: {
    type: String,
    required: true,
    index: true,
  },
});

/**
 * Compound index for efficient session message retrieval in chronological order
 */
MessageSchema.index({ session_id: 1, created_at: 1 });

/**
 * Compound index for user-specific session queries
 */
MessageSchema.index({ user_id: 1, session_id: 1 });

/**
 * Message Model
 * 
 * Mongoose model for chat message operations.
 * Automatically reuses existing model in development to prevent re-compilation issues.
 */
export default mongoose.models.Message ||
  mongoose.model<IMessage>("Message", MessageSchema);
