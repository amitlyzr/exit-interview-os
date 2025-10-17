import mongoose, { Schema, Document } from "mongoose";

export interface IEmailTemplate extends Document {
    user_id: string; // Link to user who owns this template
    subject: string;
    htmlContent: string;
    textContent: string;
    created_at: Date;
    updated_at: Date;
}

const EmailTemplateSchema: Schema = new Schema({
    user_id: {
        type: String,
        required: true,
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

// Update the updated_at field before saving
EmailTemplateSchema.pre<IEmailTemplate>("save", function (next) {
    this.updated_at = new Date();
    next();
});

// Create indexes for better query performance
EmailTemplateSchema.index({ user_id: 1 }, { unique: true });
EmailTemplateSchema.index({ created_at: -1 });

export default mongoose.models.EmailTemplate ||
    mongoose.model<IEmailTemplate>("EmailTemplate", EmailTemplateSchema);
