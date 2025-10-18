/**
 * Users API - User management and HR access control
 * 
 * @access Public (authentication via Lyzr token)
 * @note First user in organization automatically becomes HR
 * 
 * POST /api/users - Create or retrieve user
 * curl -X POST http://localhost:3000/api/users \
 *   -H "Content-Type: application/json" \
 *   -d '{"user_id":"user_123","token":"lyzr_api_key","org_id":"org_456","email":"user@example.com"}'
 * 
 * GET /api/users?user_id=user_123 - Get user by ID
 * curl http://localhost:3000/api/users?user_id=user_123
 * 
 * GET /api/users?org_id=org_456 - Get all users in organization
 * curl http://localhost:3000/api/users?org_id=org_456
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/mongdb";
import User from "@/lib/mongodb/schemas/User";
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: `Invalid JSON format in request body: ${error}` },
        { status: 400 }
      );
    }

    const { user_id, org_id, email, token } = body;

    // Validate required fields
    if (!user_id || !token) {
      return NextResponse.json(
        { error: "user_id and token are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ user_id });

    if (existingUser) {
      // Verify organization ID matches for existing user
      if (org_id && existingUser.org_id !== org_id) {
        return NextResponse.json(
          { error: "Organization ID mismatch" },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        user: existingUser,
        isNewUser: false,
        isHR: existingUser.is_hr
      });
    }

    // Determine HR status for new user
    // First user in organization automatically gets HR privileges
    let isHR = false;

    if (org_id) {
      // Hardcoded HR organization IDs (can be moved to environment variables)
      const hrOrgIds = ["specify-hr-org-ids-here"];
      
      if (hrOrgIds.includes(org_id)) {
        isHR = true;
      } else {
        // Check if any other users exist in this organization
        const otherUsersInOrg = await User.countDocuments({ org_id });
        if (otherUsersInOrg === 0) {
          isHR = true;
        }
      }
    }

    // Create new user with determined HR status
    const newUser = new User({
      user_id,
      email,
      token,
      org_id,
      is_hr: isHR
    });

    await newUser.save();

    return NextResponse.json({
      success: true,
      user: newUser,
      isNewUser: true,
      isHR: newUser.is_hr
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const org_id = searchParams.get('org_id');

    // At least one parameter is required
    if (!user_id && !org_id) {
      return NextResponse.json(
        { error: "user_id or org_id is required" },
        { status: 400 }
      );
    }

    // Retrieve single user by user_id
    if (user_id) {
      const user = await User.findOne({ user_id });
      
      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        user
      });
    }

    // Retrieve all users in organization
    if (org_id) {
      const users = await User.find({ org_id });
      
      return NextResponse.json({
        success: true,
        users
      });
    }
  } catch (error) {
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
