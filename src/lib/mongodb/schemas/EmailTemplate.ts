/**
 * Email Template Schema
 * 
 * Stores customizable email templates for interview invitations.
 * Each user can have their own personalized template with variable substitution support.
 * 
 * @module mongodb/schemas/EmailTemplate
 */

import mongoose, { Schema, Document } from "mongoose";

/**
 * Email Template Document Interface
 * 
 * Represents a customizable email template for exit interview invitations.
 * Supports variable substitution: {{name}}, {{role}}, {{level}}, {{tenure}}, {{interviewUrl}}
 */
export interface IEmailTemplate extends Document {
    /** User ID who owns this custom template */
    user_id: string;
    /** Email subject line (supports variable substitution) */
    subject: string;
    /** HTML version of email body (supports variable substitution) */
    htmlContent: string;
    /** Plain text version of email body (supports variable substitution) */
    textContent: string;
    /** Timestamp when template was created */
    created_at: Date;
    /** Timestamp of last template update */
    updated_at: Date;
}

/**
 * Mongoose schema definition for EmailTemplate model
 */
const EmailTemplateSchema: Schema = new Schema({
    user_id: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    subject: {
        type: String,
        required: true,
    },
    htmlContent: {
        type: String,
        required: true,
    },
    textContent: {
        type: String,
        required: true,
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
EmailTemplateSchema.pre<IEmailTemplate>("save", function (next) {
    this.updated_at = new Date();
    next();
});

/**
 * Index for sorting templates by creation date
 */
EmailTemplateSchema.index({ created_at: -1 });

/**
 * Email Template Model
 * 
 * Mongoose model for email template operations.
 * Automatically reuses existing model in development to prevent re-compilation issues.
 */
export default mongoose.models.EmailTemplate ||
    mongoose.model<IEmailTemplate>("EmailTemplate", EmailTemplateSchema);
