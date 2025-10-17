/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { createOrGetUser } from '@/lib/auth-utils';
import { useRouter } from 'next/navigation';

export interface TokenData {
    _id: string;
    api_key: string;
    user_id: string;
    organization_id: string;
    usage_id: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    userId: string | null;
    token: string | null;
    email: string | null;
    organizationId: string | null;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    const [organizationId, setOrganizationId] = useState<string | null>(null);

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

    const setAuthData = (userData: TokenData) => {
        Cookies.set('user_id', userData.user_id, { expires: 7 }); // 7 days
        Cookies.set('token', userData.api_key, { expires: 7 });
        Cookies.set('organization_id', userData.organization_id, { expires: 7 });
        setIsAuthenticated(true);
        setUserId(userData.user_id);
        setToken(userData.api_key);
        setOrganizationId(userData.organization_id);
    };

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
                    const userKeys = await lyzr.getKeysUser();
                    const email = userKeys?.data?.user?.email;
                    console.log(userKeys);
                    
                    const userData = {
                        user_id: tokenData[0].user_id,
                        token: tokenData[0].api_key,
                        org_id: userKeys?.data?.org_id,
                        email: email
                    };

                    const userResult = await createOrGetUser(userData);
                    console.log('User creation/retrieval result:', userResult);

                    Cookies.set('user_id', tokenData[0].user_id);
                    Cookies.set('token', tokenData[0].api_key);
                    Cookies.set('organization_id', userKeys?.data?.org_id);
                    setIsAuthenticated(true);
                    setUserId(tokenData[0].user_id);
                    setToken(tokenData[0].api_key);
                    setEmail(email);
                    setOrganizationId(userKeys?.data?.org_id);
                    router.push('/dashboard');
                } catch (error) {
                    console.error('Error fetching user keys:', error);
                    setAuthData(tokenData[0]);
                }
            } else {
                clearAuthData();
            }
        } catch (err) {
            console.error('Auth check failed:', err);
            clearAuthData();
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            if (typeof window === 'undefined') return;

            try {
                const { default: lyzr } = await import('lyzr-agent');
                await lyzr.init('pk_c14a2728e715d9ea67bf');

                // Subscribe to auth state changes
                const unsubscribe = lyzr.onAuthStateChange((isAuthenticated: boolean) => {
                    if (isAuthenticated) {
                        checkAuth();
                    } else {
                        clearAuthData();
                        setIsLoading(false);
                    }
                });

                // Initial auth check
                await checkAuth();

                return () => unsubscribe();
            } catch (err) {
                console.error('Lyzr init failed:', err);
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