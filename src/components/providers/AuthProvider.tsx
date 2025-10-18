/**
 * Authentication Provider Component
 * 
 * Manages global authentication state using Lyzr Agent SDK.
 * Provides authentication context to all child components.
 * Handles automatic user creation/retrieval and session management.
 * 
 * @module components/providers/AuthProvider
 */

/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { createOrGetUser } from '@/lib/auth-utils';
import { useRouter } from 'next/navigation';

/**
 * Token data structure from Lyzr Agent SDK
 */
export interface TokenData {
    /** MongoDB document ID */
    _id: string;
    /** API key for Lyzr authentication */
    api_key: string;
    /** Unique user identifier */
    user_id: string;
    /** Organization identifier */
    organization_id: string;
    /** Usage tracking ID */
    usage_id: string;
}

/**
 * Authentication context data structure
 */
interface AuthContextType {
    /** Whether user is authenticated */
    isAuthenticated: boolean;
    /** Whether authentication check is in progress */
    isLoading: boolean;
    /** Current user ID, null if not authenticated */
    userId: string | null;
    /** Current user's API token, null if not authenticated */
    token: string | null;
    /** Current user's email, null if not authenticated */
    email: string | null;
    /** Current user's organization ID, null if not authenticated */
    organizationId: string | null;
    /** Function to manually trigger auth check */
    checkAuth: () => Promise<void>;
}

/**
 * Authentication context - must be used within AuthProvider
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Hook to access authentication context
 * 
 * @throws {Error} If used outside of AuthProvider
 * @returns Authentication context with user data and methods
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isAuthenticated, userId, email } = useAuth();
 *   
 *   if (!isAuthenticated) {
 *     return <div>Please log in</div>;
 *   }
 *   
 *   return <div>Welcome, {email}!</div>;
 * }
 * ```
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

/**
 * Authentication Provider Component
 * 
 * Wraps the application to provide authentication state and methods.
 * Initializes Lyzr Agent SDK and manages user session lifecycle.
 * 
 * Features:
 * - Automatic authentication state synchronization
 * - Cookie-based session persistence
 * - User creation/retrieval from database
 * - Organization-based access control
 * 
 * @param {Object} props
 * @param {ReactNode} props.children - Child components to wrap with auth context
 * 
 * @example
 * ```tsx
 * // In app layout
 * export default function RootLayout({ children }) {
 *   return (
 *     <AuthProvider>
 *       {children}
 *     </AuthProvider>
 *   );
 * }
 * ```
 */
export function AuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    const [organizationId, setOrganizationId] = useState<string | null>(null);

    /**
     * Clears authentication data from state and cookies
     */
    const clearAuthData = () => {
        Cookies.remove('user_id');
        Cookies.remove('token');
        Cookies.remove('organization_id');
        setIsAuthenticated(false);
        setUserId(null);
        setToken(null);
        setEmail(null);
        setOrganizationId(null);
    };

    /**
     * Sets authentication data in state and cookies
     * 
     * @param userData - Token data from Lyzr authentication
     */
    const setAuthData = (userData: TokenData) => {
        Cookies.set('user_id', userData.user_id, { expires: 7 }); // 7 days
        Cookies.set('token', userData.api_key, { expires: 7 });
        Cookies.set('organization_id', userData.organization_id, { expires: 7 });
        setIsAuthenticated(true);
        setUserId(userData.user_id);
        setToken(userData.api_key);
        setOrganizationId(userData.organization_id);
    };

    /**
     * Checks current authentication status and syncs with database
     * 
     * Workflow:
     * 1. Retrieves tokens from Lyzr SDK
     * 2. Fetches user email and organization data
     * 3. Creates/updates user in database
     * 4. Updates local state and cookies
     * 5. Redirects to dashboard if successful
     */
    const checkAuth = async () => {
        if (typeof window === 'undefined') {
            setIsLoading(false);
            return;
        }

        try {
            const { default: lyzr } = await import('lyzr-agent');
            const tokenData = await lyzr.getKeys() as unknown as TokenData[];

            if (tokenData && tokenData[0]) {
                try {
                    // Fetch extended user data including email and org_id
                    const userKeys = await lyzr.getKeysUser();
                    const email = userKeys?.data?.user?.email;
                    
                    const userData = {
                        user_id: tokenData[0].user_id,
                        token: tokenData[0].api_key,
                        org_id: userKeys?.data?.org_id,
                        email: email
                    };

                    // Create or retrieve user from database
                    await createOrGetUser(userData);

                    // Set authentication cookies and state
                    Cookies.set('user_id', tokenData[0].user_id);
                    Cookies.set('token', tokenData[0].api_key);
                    Cookies.set('organization_id', userKeys?.data?.org_id);
                    setIsAuthenticated(true);
                    setUserId(tokenData[0].user_id);
                    setToken(tokenData[0].api_key);
                    setEmail(email);
                    setOrganizationId(userKeys?.data?.org_id);
                    router.push('/dashboard');
                } catch {
                    // Fallback to basic token data if extended fetch fails
                    setAuthData(tokenData[0]);
                }
            } else {
                clearAuthData();
            }
        } catch {
            clearAuthData();
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Initialize Lyzr SDK and set up auth state listener
     */
    useEffect(() => {
        const init = async () => {
            if (typeof window === 'undefined') return;

            try {
                const { default: lyzr } = await import('lyzr-agent');
                
                // Initialize with public Lyzr project key
                await lyzr.init('pk_c14a2728e715d9ea67bf');

                // Subscribe to authentication state changes
                const unsubscribe = lyzr.onAuthStateChange((isAuthenticated: boolean) => {
                    if (isAuthenticated) {
                        checkAuth();
                    } else {
                        clearAuthData();
                        setIsLoading(false);
                    }
                });

                // Perform initial authentication check
                await checkAuth();

                return () => unsubscribe();
            } catch {
                clearAuthData();
                setIsLoading(false);
            }
        };

        init();
    }, []);

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            isLoading,
            userId,
            token,
            checkAuth,
            email,
            organizationId
        }}>
            {children}
        </AuthContext.Provider>
    );
}