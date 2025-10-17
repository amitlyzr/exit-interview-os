"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createOrGetUser, checkHRAccess } from "@/lib/auth-utils";
import { useAuth } from "./AuthProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";

interface HRAccessGuardProps {
    children: React.ReactNode;
}

export function HRAccessGuard({ children }: HRAccessGuardProps) {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading, userId, token, organizationId, email } = useAuth();
    const [isChecking, setIsChecking] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);

    useEffect(() => {
        const checkAccess = async () => {
            if (!isAuthenticated || !userId || !token) {
                if (!authLoading) {
                    router.push('/');
                }
                return;
            }

            try {
                setIsChecking(true);
                setAccessDenied(false);

                // Create or get user
                const userData = {
                    user_id: userId,
                    email: email || undefined,
                    token,
                    org_id: organizationId || undefined,
                };

                const userResult = await createOrGetUser(userData);
                
                if (!userResult) {
                    setAccessDenied(true);
                    setIsChecking(false);
                    return;
                }

                // Check HR access for organization
                if (!userResult.isHR) {
                    const hasHRAccess = await checkHRAccess(userId, organizationId || undefined);
                    if (!hasHRAccess) {
                        setAccessDenied(true);
                        setIsChecking(false);
                        return;
                    }
                }

                setHasAccess(true);
            } catch (err) {
                console.error("Error checking HR access:", err);
                setAccessDenied(true);
            } finally {
                setIsChecking(false);
            }
        };

        checkAccess();
    }, [isAuthenticated, userId, token, organizationId, email, router]);

    // Show loading state
    if (authLoading || (isAuthenticated && isChecking)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Card className="w-96">
                    <CardContent className="flex flex-col items-center justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                        <h2 className="text-lg font-semibold text-foreground mb-2">
                            Verifying Access
                        </h2>
                        <p className="text-sm text-muted-foreground text-center">
                            Checking your permissions...
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Show access denied state
    if (accessDenied) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Card className="w-96">
                    <CardContent className="flex flex-col items-center justify-center p-8">
                        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                        <h2 className="text-xl font-semibold text-foreground mb-2">
                            Access Denied
                        </h2>
                        <p className="text-sm text-muted-foreground text-center mb-6">
                            Only the first user from your organization can access the HR dashboard. 
                            Another user from your organization is already set as HR.
                        </p>
                        <Button onClick={async () => {
                            if (typeof window !== 'undefined') {
                                const { default: lyzr } = await import('lyzr-agent');
                                lyzr.logout();
                            }
                        }} className="w-full">
                            Go Back to Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Show not authenticated state
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Card className="w-96">
                    <CardContent className="flex flex-col items-center justify-center p-8">
                        <h2 className="text-xl font-semibold text-foreground mb-2">
                            Authentication Required
                        </h2>
                        <p className="text-sm text-muted-foreground text-center mb-6">
                            Please authenticate to access the HR dashboard.
                        </p>
                        <Button onClick={() => router.push('/dashboard')} className="w-full">
                            Go to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Only render children if user has access
    if (hasAccess) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <Card className="w-96">
                <CardContent className="flex flex-col items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-sm text-muted-foreground text-center">
                        Loading...
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}