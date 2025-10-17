import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  user_id: string; // From Lyzr auth system
  email?: string;
  token: string; // API key from Lyzr
  org_id?: string; // Organization ID from Lyzr
  is_hr: boolean; // First user from org becomes HR
  smtp_config?: {
    host: string;
    port: number;
    secure?: boolean;
    user: string;
    pass: string;
    from: string;
  };
  gmail_oauth?: {
    access_token: string;
    refresh_token: string;
    expires_at: Date;
    email: string;
    connected_at: Date;
  };
  created_at: Date;
  updated_at: Date;
}

const UserSchema: Schema = new Schema({
  user_id: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: false,
    trim: true,
    lowercase: true,
  },
  token: {
    type: String,
    required: true,
  },
  org_id: {
    type: String,
    required: false,
  },
  is_hr: {
    type: Boolean,
    default: false,
  },
  agent_id: {
    type: String,
    required: false,
  },
  agent_name: {
    type: String,
    required: false,
  },
  agent_description: {
    type: String,
    required: false,
  },
  smtp_config: {
    host: { type: String, required: false },
    port: { type: Number, required: false },
    secure: { type: Boolean, required: false },
    user: { type: String, required: false },
    pass: { type: String, required: false },
    from: { type: String, required: false }
  },
  gmail_oauth: {
    access_token: { type: String, required: false },
    refresh_token: { type: String, required: false },
    expires_at: { type: Date, required: false },
    email: { type: String, required: false },
    connected_at: { type: Date, required: false }
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
UserSchema.pre<IUser>("save", function (next) {
  this.updated_at = new Date();
  next();
});

// Create indexes for better query performance
UserSchema.index({ user_id: 1 }, { unique: true });
UserSchema.index({ email: 1 });
UserSchema.index({ token: 1 });
UserSchema.index({ org_id: 1, is_hr: 1 });
UserSchema.index({ created_at: -1 });

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
