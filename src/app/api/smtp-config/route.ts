/**
 * SMTP Config API - Manage SMTP email server configuration
 * 
 * @access HR users only
 * 
 * GET /api/smtp-config?user_id=user_123 - Retrieve SMTP configuration
 * curl "http://localhost:3000/api/smtp-config?user_id=user_123"
 * 
 * POST /api/smtp-config - Save SMTP configuration
 * curl -X POST http://localhost:3000/api/smtp-config \
 *   -H "Content-Type: application/json" \
 *   -d '{"user_id":"user_123","host":"smtp.gmail.com","port":587,"user":"email@gmail.com","password":"app-password","from":"noreply@company.com"}'
 * 
 * DELETE /api/smtp-config?user_id=user_123 - Remove SMTP configuration
 * curl -X DELETE "http://localhost:3000/api/smtp-config?user_id=user_123"
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/mongdb";
import User from "@/lib/mongodb/schemas/User";

// Retrieve SMTP configuration
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const user_id = searchParams.get('user_id');

        if (!user_id) {
            return NextResponse.json(
                { error: "user_id is required" },
                { status: 400 }
            );
        }

        const user = await User.findOne({ user_id });
        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Return SMTP config (with password for editing)
        const smtpConfig = user.smtp_config ? {
            host: user.smtp_config.host,
            port: user.smtp_config.port,
            secure: user.smtp_config.secure,
            user: user.smtp_config.user,
            pass: user.smtp_config.pass,
            from: user.smtp_config.from,
            configured: true
        } : null;

        return NextResponse.json({
            success: true,
            smtp_config: smtpConfig
        });
    } catch (error) {
        console.error("Error getting SMTP config:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// Save or update SMTP configuration
export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const body = await request.json();
        const { user_id, host, port, user, password, from } = body;

        if (!user_id) {
            return NextResponse.json(
                { error: "user_id is required" },
                { status: 400 }
            );
        }

        if (!host || !port || !user || !password || !from) {
            return NextResponse.json(
                { error: "All SMTP fields are required: host, port, user, password, from" },
                { status: 400 }
            );
        }

        const userDoc = await User.findOne({ user_id });
        if (!userDoc) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Update SMTP configuration
        userDoc.smtp_config = {
            host,
            port: parseInt(port),
            user,
            pass: password,
            from: from
        };

        await userDoc.save();

        return NextResponse.json({
            success: true,
            message: "SMTP configuration updated successfully"
        });
    } catch (error) {
        console.error("Error updating SMTP config:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// Remove SMTP configuration
export async function DELETE(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const user_id = searchParams.get('user_id');

        if (!user_id) {
            return NextResponse.json(
                { error: "user_id is required" },
                { status: 400 }
            );
        }

        const user = await User.findOne({ user_id });
        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Remove SMTP configuration
        user.smtp_config = undefined;
        await user.save();

        return NextResponse.json({
            success: true,
            message: "SMTP configuration removed successfully"
        });
    } catch (error) {
        console.error("Error deleting SMTP config:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
