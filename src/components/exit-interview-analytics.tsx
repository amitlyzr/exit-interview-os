"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, MessageCircle, TrendingUp, BarChart3 } from "lucide-react"

interface AnalyticsData {
  totalResponses: number
  totalSessions: number
  sentimentStats: {
    positive?: number
    negative?: number
    neutral?: number
  }
  avgConfidence: number
}

interface ExitInterviewAnalyticsProps {
  analyticsData?: AnalyticsData
  isLoading?: boolean
}

export function ExitInterviewAnalytics({ analyticsData, isLoading }: ExitInterviewAnalyticsProps) {
    const totalSessions = analyticsData?.totalSessions || 0
    const totalResponses = analyticsData?.totalResponses || 0
    const sentimentStats = analyticsData?.sentimentStats || {}
    const avgConfidence = analyticsData?.avgConfidence || 0
    
    // Calculate positive sentiment percentage
    const totalSentiments = (sentimentStats.positive || 0) + (sentimentStats.negative || 0) + (sentimentStats.neutral || 0)
    const positivePercentage = totalSentiments > 0 ? Math.round(((sentimentStats.positive || 0) / totalSentiments) * 100) : 0
    
    // Calculate average confidence percentage
    const confidencePercentage = Math.round(avgConfidence * 100)

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2" />
                            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Total Sessions
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalSessions}</div>
                    <p className="text-xs text-muted-foreground">
                        Active interview sessions
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Total Responses
                    </CardTitle>
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalResponses}</div>
                    <p className="text-xs text-muted-foreground">
                        Questions answered
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Avg Confidence
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{confidencePercentage}%</div>
                    <p className="text-xs text-muted-foreground">
                        Response confidence level
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Positive Sentiment
                    </CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{positivePercentage}%</div>
                    <p className="text-xs text-muted-foreground">
                        Of all responses
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
