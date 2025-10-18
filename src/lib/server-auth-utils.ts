/**
 * Server-Side Authentication Utilities
 * 
 * Provides server-side authentication helper functions for Next.js API routes and server components.
 * Handles cookie reading, database user verification, and permission checks.
 * 
 * @module lib/server-auth-utils
 */

import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb/mongdb";
import User, { IUser } from "@/lib/mongodb/schemas/User";

/**
 * User authentication data structure
 */
export interface UserData {
  /** Unique user identifier from Lyzr authentication system */
  user_id: string;
  /** User's email address (optional) */
  email?: string;
  /** Authentication token/API key from Lyzr */
  token: string;
  /** Organization identifier for multi-tenant support (optional) */
  org_id?: string;
  /** Whether user has HR/admin privileges (optional) */
  is_hr?: boolean;
}

/**
 * Retrieves user authentication data from server-side cookies
 * 
 * Used in server components and API routes that don't have access to NextRequest.
 * Reads cookies using Next.js 15's async cookies() API.
 * 
 * @returns Promise resolving to user data if authenticated, null otherwise
 * 
 * @example
 * ```typescript
 * // In a Server Component
 * export default async function DashboardPage() {
 *   const userData = await getUserDataFromServerCookies();
 *   if (!userData) {
 *     redirect('/login');
 *   }
 *   // ...
 * }
 * ```
 */
export const getUserDataFromServerCookies = async (): Promise<UserData | null> => {
  try {
    const cookieStore = await cookies();
    const user_id = cookieStore.get('user_id')?.value;
    const token = cookieStore.get('token')?.value;
    const org_id = cookieStore.get('organization_id')?.value;
    const email = cookieStore.get('email')?.value;

    // Both user_id and token are required for valid authentication
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
 * Retrieves user authentication data from NextRequest object
 * 
 * Used in API routes and middleware that have access to the request object.
 * Synchronous alternative to getUserDataFromServerCookies.
 * 
 * @param request - Next.js request object
 * @returns User data if authenticated, null otherwise
 * 
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const userData = getUserDataFromHeaders(request);
 *   if (!userData) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   }
 *   // ...
 * }
 * ```
 */
export const getUserDataFromHeaders = (request: NextRequest): UserData | null => {
  try {
    const user_id = request.cookies.get('user_id')?.value;
    const token = request.cookies.get('token')?.value;
    const org_id = request.cookies.get('organization_id')?.value;
    const email = request.cookies.get('email')?.value;

    // Both user_id and token are required for valid authentication
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
 * Retrieves and validates current user from database
 * 
 * Fetches user from cookies, then verifies against database.
 * Performs token validation to ensure cookie hasn't been tampered with.
 * 
 * @param request - Optional NextRequest for API routes, omit for server components
 * @returns Promise resolving to IUser document if valid, null otherwise
 * 
 * @example
 * ```typescript
 * // In API Route
 * export async function POST(request: NextRequest) {
 *   const user = await getCurrentUserFromDB(request);
 *   if (!user) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   }
 *   // Use user.user_id, user.is_hr, etc.
 * }
 * 
 * // In Server Component
 * export default async function Page() {
 *   const user = await getCurrentUserFromDB();
 *   // ...
 * }
 * ```
 */
export const getCurrentUserFromDB = async (request?: NextRequest): Promise<IUser | null> => {
  try {
    await connectDB();

    // Extract user data from cookies (request-based or server-side)
    let userData: UserData | null = null;
    
    if (request) {
      userData = getUserDataFromHeaders(request);
    } else {
      userData = await getUserDataFromServerCookies();
    }

    if (!userData?.user_id) {
      return null;
    }

    // Fetch user from database
    const user = await User.findOne({ user_id: userData.user_id });
    
    if (!user) {
      console.warn(`User not found in database: ${userData.user_id}`);
      return null;
    }

    // Verify token matches to prevent cookie tampering
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
 * Retrieves user by ID from database
 * 
 * Direct database lookup by user_id without cookie validation.
 * Useful for OAuth callbacks where user_id is in URL state parameter.
 * 
 * @param user_id - User identifier to lookup
 * @returns Promise resolving to IUser document if found, null otherwise
 * 
 * @example
 * ```typescript
 * // In OAuth callback handler
 * const user = await getUserById(stateParams.user_id);
 * if (!user) {
 *   return NextResponse.json({ error: 'User not found' }, { status: 404 });
 * }
 * ```
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
 * Creates a new user or updates existing user in database
 * 
 * Performs upsert operation (update if exists, insert if new).
 * Automatically updates the updated_at timestamp.
 * 
 * @param userData - User data to create or update
 * @returns Promise resolving to created/updated IUser document, null on error
 * 
 * @example
 * ```typescript
 * const newUser = await createOrUpdateUser({
 *   user_id: 'user_123',
 *   email: 'user@example.com',
 *   token: 'api_key_xyz',
 *   org_id: 'org_456'
 * });
 * ```
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
        upsert: true, // Create if doesn't exist
        new: true, // Return updated document
        runValidators: true // Validate against schema
      }
    );

    return user;
  } catch (error) {
    console.error('Error creating/updating user:', error);
    return null;
  }
};

/**
 * Checks if a user has HR/admin access privileges
 * 
 * Verifies user's HR status by querying the database.
 * Optionally validates user belongs to specific organization.
 * 
 * @param user_id - User ID to check for HR access
 * @param org_id - Optional organization ID to verify same-org access
 * @returns Promise resolving to true if user has HR access, false otherwise
 * 
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const userData = getUserDataFromHeaders(request);
 *   const hasAccess = await checkHRAccess(userData.user_id, userData.org_id);
 *   
 *   if (!hasAccess) {
 *     return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 *   }
 *   // Allow HR-only operations
 * }
 * ```
 */
export const checkHRAccess = async (user_id: string, org_id?: string): Promise<boolean> => {
  try {
    await connectDB();
    const user = await User.findOne({ user_id });
    
    if (!user) {
      return false;
    }

    // Verify user is HR and belongs to the same organization (if org_id provided)
    return user.is_hr === true && (!org_id || user.org_id === org_id);
  } catch (error) {
    console.error('Error checking HR access:', error);
    return false;
  }
};
