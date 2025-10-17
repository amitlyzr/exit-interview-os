import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/mongdb";
import User from "@/lib/mongodb/schemas/User";

// POST /api/users - Create user if doesn't exist, handle HR permissions
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error("Invalid JSON in request body:", jsonError);
      return NextResponse.json(
        { error: "Invalid JSON format in request body" },
        { status: 400 }
      );
    }

    const { user_id, org_id, email, token } = body;

    if (!user_id || !token) {
      return NextResponse.json(
        { error: "user_id and token are required" },
        { status: 400 }
      );
    }

    // Step 1: Check if user already exists
    const existingUser = await User.findOne({ user_id });

    if (existingUser) {
      // User exists, verify org_id matches
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

    // Step 2: Determine if this should be the HR user for the org BEFORE creating user
    // let isHR = false;
    // if (org_id) {
    //   // Count other users in the same org
    //   const otherUsersInOrg = await User.countDocuments({ org_id });

    //   // If no other users exist in this org, make this user HR
    //   if (otherUsersInOrg === 0) {
    //     isHR = true;
    //   }
    // }

    let isHR = false;

    if (org_id) {
      const hrOrgIds = ["b385ab96-1dd1-489b-8f7e-f5d10f9edd7e"];
      if (hrOrgIds.includes(org_id)) {
        isHR = true;
      } else {
        const otherUsersInOrg = await User.countDocuments({ org_id });
        if (otherUsersInOrg === 0) {
          isHR = true;
        }
      }
    }

    // Step 3: Create new user with correct HR status
    const newUser = new User({
      user_id,
      email,
      token,
      org_id,
      is_hr: isHR
    });

    await newUser.save();

    // Create Lyzr agent for the new user
    // const agentData = await createLyzrAgent(token, user_id);

    // if (agentData) {
    //   // Update user with agent information
    //   newUser.agent_id = agentData.agent_id;
    //   newUser.agent_name = agentData.agent_name;
    //   newUser.agent_description = agentData.agent_description;
    //   await newUser.save();
    // }

    return NextResponse.json({
      success: true,
      user: newUser,
      isNewUser: true,
      isHR: newUser.is_hr
      // agent_created: !!agentData
    });
  } catch (error) {
    console.error("Error in POST /api/users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/users - Get user by user_id (from query params)
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const org_id = searchParams.get('org_id');

    if (!user_id && !org_id) {
      return NextResponse.json(
        { error: "user_id or org_id is required" },
        { status: 400 }
      );
    }

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

    if (org_id) {
      const users = await User.find({ org_id });
      return NextResponse.json({
        success: true,
        users
      });
    }
  } catch (error) {
    console.error("Error in GET /api/users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
