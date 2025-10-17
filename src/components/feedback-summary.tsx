/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react"

interface FeedbackSummary {
    session_id: string
    expectations_vs_reality: string
    highlights: string
    challenges_faced: string
    manager_and_team_support: string
    recognition_and_value: string
    growth_and_learning: string
    feedback_experience: string
    transparency_and_policies: string
    relationship_with_manager: string
    benefits_and_compensation: string
    reason_for_exit: string
    rejoin_recommendation: {
        would_rejoin: boolean
        conditions_to_rejoin: string
        would_recommend: boolean
        conditions_to_recommend: string
    }
    additional_insights: string
}

interface FeedbackSummaryProps {
    feedbackSummaries: FeedbackSummary[]
    isLoading?: boolean
}

export function FeedbackSummaryComponent({ feedbackSummaries, isLoading }: FeedbackSummaryProps) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Feedback Summaries
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="p-4 border rounded-lg">
                                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-3" />
                                <div className="space-y-2">
                                    <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
                                    <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!feedbackSummaries || feedbackSummaries.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Feedback Summaries
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        No feedback summaries available yet.
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Feedback Summaries ({feedbackSummaries.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {feedbackSummaries.map((summary, index) => (
                        <div key={summary.session_id} className="p-4 border rounded-lg space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm text-muted-foreground">
                                    Session: {summary.session_id}
                                </h4>
                                <div className="flex gap-2">
                                    {summary.rejoin_recommendation.would_rejoin ? (
                                        <Badge className="bg-green-100 text-green-800">
                                            <TrendingUp className="h-3 w-3 mr-1" />
                                            Would Rejoin
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-red-100 text-red-800">
                                            <TrendingDown className="h-3 w-3 mr-1" />
                                            Won&apos;t Rejoin
                                        </Badge>
                                    )}
                                    {!summary.rejoin_recommendation.would_recommend && (
                                        <Badge className="bg-yellow-100 text-yellow-800">
                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                            Won&apos;t Recommend
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                {summary.reason_for_exit && (
                                    <div>
                                        <h5 className="font-medium text-foreground mb-1">Reason for Exit</h5>
                                        <p className="text-muted-foreground">{summary.reason_for_exit}</p>
                                    </div>
                                )}
                                
                                {summary.expectations_vs_reality && (
                                    <div>
                                        <h5 className="font-medium text-foreground mb-1">Expectations vs Reality</h5>
                                        <p className="text-muted-foreground">{summary.expectations_vs_reality}</p>
                                    </div>
                                )}

                                {summary.challenges_faced && (
                                    <div>
                                        <h5 className="font-medium text-foreground mb-1">Main Challenges</h5>
                                        <p className="text-muted-foreground">{summary.challenges_faced}</p>
                                    </div>
                                )}

                                {summary.highlights && summary.highlights !== "The employee didn't mention specific highlights, indicating a lack of positive experiences." && (
                                    <div>
                                        <h5 className="font-medium text-foreground mb-1">Highlights</h5>
                                        <p className="text-muted-foreground">{summary.highlights}</p>
                                    </div>
                                )}
                            </div>

                            {summary.rejoin_recommendation.conditions_to_recommend && (
                                <div className="mt-4 p-3 bg-card rounded-lg">
                                    <h5 className="font-medium text-foreground mb-1">Conditions to Recommend</h5>
                                    <p className="text-sm text-muted-foreground">{summary.rejoin_recommendation.conditions_to_recommend}</p>
                                </div>
                            )}

                            {summary.additional_insights && (
                                <div className="mt-4 p-3 bg-card rounded-lg">
                                    <h5 className="font-medium text-foreground mb-1">Additional Insights</h5>
                                    <p className="text-sm text-muted-foreground">{summary.additional_insights}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
