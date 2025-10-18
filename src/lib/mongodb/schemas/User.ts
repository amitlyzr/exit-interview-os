/**
 * User Schema
 * 
 * Represents system users with authentication, organization, and email configuration.
 * Supports both Gmail OAuth and SMTP email delivery methods.
 * 
 * @module mongodb/schemas/User
 */

import mongoose, { Schema, Document } from "mongoose";

/**
 * SMTP Configuration Interface
 * Configuration for SMTP-based email delivery
 */
export interface ISMTPConfig {
  /** SMTP server hostname (e.g., smtp.gmail.com) */
  host: string;
  /** SMTP server port (typically 587 for TLS, 465 for SSL) */
  port: number;
  /** Whether to use TLS/SSL encryption */
  secure?: boolean;
  /** SMTP authentication username */
  user: string;
  /** SMTP authentication password or app-specific password */
  pass: string;
  /** Default 'from' email address for sent emails */
  from: string;
}

/**
 * Gmail OAuth Configuration Interface
 * OAuth 2.0 credentials for Gmail API access
 */
export interface IGmailOAuth {
  /** OAuth access token for API requests */
  access_token: string;
  /** OAuth refresh token for obtaining new access tokens */
  refresh_token: string;
  /** Expiration timestamp for the access token */
  expires_at: Date;
  /** Authenticated Gmail email address */
  email: string;
  /** Timestamp when Gmail was connected */
  connected_at: Date;
}

/**
 * User Document Interface
 * 
 * Represents a user in the exit interview system.
 * Users can be HR (first user in org) or employees.
 */
export interface IUser extends Document {
  /** Unique user identifier from Lyzr authentication system */
  user_id: string;
  /** User's email address (optional) */
  email?: string;
  /** API key/token from Lyzr for authentication */
  token: string;
  /** Organization identifier from Lyzr (for multi-tenant support) */
  org_id?: string;
  /** Whether user has HR/admin privileges (first user in org becomes HR) */
  is_hr: boolean;
  /** SMTP email configuration (fallback email delivery method) */
  smtp_config?: ISMTPConfig;
  /** Gmail OAuth credentials (primary email delivery method) */
  gmail_oauth?: IGmailOAuth;
  /** Timestamp when user record was created */
  created_at: Date;
  /** Timestamp when user record was last updated */
  updated_at: Date;
}

/**
 * Mongoose schema definition for User model
 */
const UserSchema: Schema = new Schema({
  user_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
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
    index: true,
  },
  is_hr: {
    type: Boolean,
    default: false,
    index: true,
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

/**
 * Pre-save hook to automatically update the updated_at timestamp
 */
UserSchema.pre<IUser>("save", function (next) {
  this.updated_at = new Date();
  next();
});

/**
 * Compound index for efficient HR user queries within organizations
 */
UserSchema.index({ org_id: 1, is_hr: 1 });

/**
 * Index for sorting users by creation date
 */
UserSchema.index({ created_at: -1 });

/**
 * User Model
 * 
 * Mongoose model for user operations.
 * Automatically reuses existing model in development to prevent re-compilation issues.
 */
export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
