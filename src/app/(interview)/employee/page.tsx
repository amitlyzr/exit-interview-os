"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Building2,
    Shield,
    Users,
    MessageSquare,
    AlertCircle
} from "lucide-react";

const EmployeePage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 md:p-6 lg:p-8">
            <div className="w-full max-w-2xl space-y-8">
                {/* Header Section */}
                <div className="text-center space-y-4">
                    <div className="flex items-center justify-center space-x-3 mb-4">
                        <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                            <Building2 className="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-slate-900">AI-Powered Exit Interview</h1>
                        <p className="text-lg text-slate-600">
                            powered by Lyzr AI
                        </p>
                    </div>
                </div>

                {/* Main Content Card */}
                <Card className="shadow-lg border-0 bg-white gap-0">
                    <CardContent className="space-y-6">
                        {/* Status Badge */}
                        <div className="flex justify-center mb-6">
                            <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
                                Employee Access Level
                            </Badge>
                        </div>

                        {/* Information Sections */}
                        <div className="space-y-4">
                            {/* HR Dashboard Access */}
                            <div className="flex items-start space-x-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                <div className="flex items-center justify-center w-10 h-10 bg-amber-100 rounded-full flex-shrink-0 mt-0.5">
                                    <Shield className="h-5 w-5 text-amber-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-slate-900 mb-1">HR Dashboard Restricted</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        The HR dashboard and administrative features are exclusively available to HR personnel within your organization. This ensures data privacy and proper access control.
                                    </p>
                                </div>
                            </div>

                            {/* Interview Process */}
                            <div className="flex items-start space-x-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full flex-shrink-0 mt-0.5">
                                    <MessageSquare className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-slate-900 mb-1">Exit Interview Process</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        When you&apos;re eligible for an exit interview, you&apos;ll receive a personalized invitation via email with a direct link to participate in the AI-powered interview process.
                                    </p>
                                </div>
                            </div>

                            {/* Support Contact */}
                            <div className="flex items-start space-x-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full flex-shrink-0 mt-0.5">
                                    <Users className="h-5 w-5 text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-slate-900 mb-1">Need Assistance?</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        For questions about the exit interview process or if you believe you should have HR access, please contact your HR department directly.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Important Note */}
                        <div className="flex items-center space-x-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-slate-500 flex-shrink-0" />
                            <p className="text-sm text-slate-600">
                                This system maintains strict access controls to protect employee privacy and ensure compliance with organizational policies.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-6 border-t border-slate-200">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button 
                                    variant="outline"
                                    className="flex-1 h-12"
                                    onClick={() => { window.close(); }}
                                >
                                    Close This Page
                                </Button>
                            </div>
                        </div>

                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="text-center">
                    <p className="text-sm text-slate-500">
                        Powered by <span className="font-semibold text-slate-700">Lyzr AI</span> • Exit Interview System
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EmployeePage;
