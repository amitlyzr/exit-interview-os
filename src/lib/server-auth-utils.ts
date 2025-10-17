import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb/mongdb";
import User, { IUser } from "@/lib/mongodb/schemas/User";

export interface UserData {
  user_id: string;
  email?: string;
  token: string;
  org_id?: string;
  is_hr?: boolean;
}

/**
 * Get user data from server-side cookies
 */
export const getUserDataFromServerCookies = async (): Promise<UserData | null> => {
  try {
    const cookieStore = await cookies();
    const user_id = cookieStore.get('user_id')?.value;
    const token = cookieStore.get('token')?.value;
    const org_id = cookieStore.get('organization_id')?.value;
    const email = cookieStore.get('email')?.value;

    if (!user_id || !token) {
      return null;
    }

    return {
      user_id,
      token,
      org_id,
      email,
    };
  } catch (error) {
    console.error('Error getting user data from server cookies:', error);
    return null;
  }
};

/**
 * Get user data from request headers (alternative method)
 */
export const getUserDataFromHeaders = (request: NextRequest): UserData | null => {
  try {
    const user_id = request.cookies.get('user_id')?.value;
    const token = request.cookies.get('token')?.value;
    const org_id = request.cookies.get('organization_id')?.value;
    const email = request.cookies.get('email')?.value;

    if (!user_id || !token) {
      return null;
    }

    return {
      user_id,
      token,
      org_id,
      email,
    };
  } catch (error) {
    console.error('Error getting user data from headers:', error);
    return null;
  }
};

/**
 * Get current user from database with authentication
 */
export const getCurrentUserFromDB = async (request?: NextRequest): Promise<IUser | null> => {
  try {
    await connectDB();

    // Try to get user data from cookies
    let userData: UserData | null = null;
    
    if (request) {
      userData = getUserDataFromHeaders(request);
    } else {
      userData = await getUserDataFromServerCookies();
    }

    if (!userData?.user_id) {
      return null;
    }

    // Find user in database
    const user = await User.findOne({ user_id: userData.user_id });
    
    if (!user) {
      console.warn(`User not found in database: ${userData.user_id}`);
      return null;
    }

    // Verify token matches (basic security check)
    if (user.token !== userData.token) {
      console.warn(`Token mismatch for user: ${userData.user_id}`);
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error getting current user from DB:', error);
    return null;
  }
};

/**
 * Get user by ID from database (for OAuth callbacks where we have user_id in state)
 */
export const getUserById = async (user_id: string): Promise<IUser | null> => {
  try {
    await connectDB();
    const user = await User.findOne({ user_id });
    return user;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
};

/**
 * Create or update user in database
 */
export const createOrUpdateUser = async (userData: UserData): Promise<IUser | null> => {
  try {
    await connectDB();
    
    const user = await User.findOneAndUpdate(
      { user_id: userData.user_id },
      {
        user_id: userData.user_id,
        email: userData.email,
        token: userData.token,
        org_id: userData.org_id,
        updated_at: new Date()
      },
      { 
        upsert: true, 
        new: true,
        runValidators: true
      }
    );

    return user;
  } catch (error) {
    console.error('Error creating/updating user:', error);
    return null;
  }
};

/**
 * Check if user has HR access
 */
export const checkHRAccess = async (user_id: string, org_id?: string): Promise<boolean> => {
  try {
    await connectDB();
    const user = await User.findOne({ user_id });
    
    if (!user) {
      return false;
    }

    // Check if user is HR and from the same org (if org_id provided)
    return user.is_hr === true && (!org_id || user.org_id === org_id);
  } catch (error) {
    console.error('Error checking HR access:', error);
    return false;
  }
};
