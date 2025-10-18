/**
 * Client-Side Authentication Utilities
 * 
 * Provides client-side authentication helper functions for browser environments.
 * Handles cookie-based session management and user role verification.
 * 
 * @module lib/auth-utils
 */

import Cookies from 'js-cookie';

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
 * Retrieves user authentication data from browser cookies
 * 
 * Reads authentication cookies set by the Lyzr authentication system.
 * Returns null if required cookies (user_id, token) are missing.
 * 
 * @returns User data object if authenticated, null otherwise
 * 
 * @example
 * ```typescript
 * const userData = getUserDataFromCookies();
 * if (userData) {
 *   console.log(`Logged in as: ${userData.user_id}`);
 * } else {
 *   console.log('Not authenticated');
 * }
 * ```
 */
export const getUserDataFromCookies = (): UserData | null => {
    try {
        const user_id = Cookies.get('user_id');
        const token = Cookies.get('token');
        const org_id = Cookies.get('organization_id');
        const email = Cookies.get('email');

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
        console.error('Error getting user data from cookies:', error);
        return null;
    }
};

/**
 * Creates a new user or retrieves existing user from the database
 * 
 * Makes an API call to POST /api/users which handles:
 * - Creating new user if doesn't exist
 * - Automatically assigning HR role to first user in organization
 * - Returning existing user data if already registered
 * 
 * @param userData - User authentication data from Lyzr
 * @returns Promise resolving to user object with HR status, or null on failure
 * 
 * @example
 * ```typescript
 * const userData = getUserDataFromCookies();
 * if (userData) {
 *   const result = await createOrGetUser(userData);
 *   if (result?.isHR) {
 *     console.log('User has HR access');
 *   }
 * }
 * ```
 */
export const createOrGetUser = async (userData: UserData): Promise<{ user: UserData & { is_hr: boolean; created_at: Date; updated_at: Date }; isHR: boolean } | null> => {
    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        const result = await response.json();

        if (result.success) {
            return {
                user: result.user,
                isHR: result.user.is_hr || result.isHR || false
            };
        } else {
            console.error('Failed to create/get user:', result.error);
            return null;
        }
    } catch (error) {
        console.error('Error creating/getting user:', error);
        return null;
    }
};

/**
 * Checks if a user has HR/admin access privileges
 * 
 * Verifies user's HR status by querying the database via API.
 * IMPORTANT: Always use API/database for permission checks, never trust cookies alone.
 * 
 * @param user_id - User ID to check for HR access
 * @param org_id - Optional organization ID to verify same-org access
 * @returns Promise resolving to true if user has HR access, false otherwise
 * 
 * @example
 * ```typescript
 * const hasAccess = await checkHRAccess('user_123', 'org_456');
 * if (hasAccess) {
 *   // Allow access to HR dashboard
 * } else {
 *   // Redirect to unauthorized page
 * }
 * ```
 */
export const checkHRAccess = async (user_id: string, org_id?: string): Promise<boolean> => {
    try {
        const response = await fetch(`/api/users?user_id=${user_id}`);
        const result = await response.json();

        if (result.success && result.user) {
            // Verify user is HR and belongs to the same organization (if org_id provided)
            return result.user.is_hr === true && (!org_id || result.user.org_id === org_id);
        }

        return false;
    } catch (error) {
        console.error('Error checking HR access:', error);
        return false;
    }
};
