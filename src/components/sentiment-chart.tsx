"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

interface SentimentStats {
    positive?: number
    negative?: number
    neutral?: number
}

interface SentimentChartProps {
    sentimentStats?: SentimentStats
    totalResponses?: number
    isLoading?: boolean
}

export function SentimentChart({ sentimentStats, totalResponses = 0, isLoading }: SentimentChartProps) {
    const positive = sentimentStats?.positive || 0
    const negative = sentimentStats?.negative || 0
    const neutral = sentimentStats?.neutral || 0
    const total = positive + negative + neutral

    const sentimentData = [
        {
            name: "Positive",
            value: total > 0 ? Math.round((positive / total) * 100) : 0,
            count: positive,
            color: "bg-green-500"
        },
        {
            name: "Neutral",
            value: total > 0 ? Math.round((neutral / total) * 100) : 0,
            count: neutral,
            color: "bg-gray-500"
        },
        {
            name: "Negative",
            value: total > 0 ? Math.round((negative / total) * 100) : 0,
            count: negative,
            color: "bg-red-500"
        },
    ]

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Sentiment Analysis
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center space-x-3">
                                <div className="flex items-center space-x-2 min-w-20">
                                    <div className="w-3 h-3 rounded-full bg-gray-200 animate-pulse" />
                                    <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
                                </div>
                                <div className="flex-1 bg-gray-200 rounded-full h-2" />
                                <div className="h-4 w-8 bg-gray-200 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 text-center">
                        <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mx-auto mb-2" />
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mx-auto" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Sentiment Analysis
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {sentimentData.map((item) => (
                        <div key={item.name} className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2 min-w-20">
                                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                                <span className="text-sm font-medium">{item.name}</span>
                            </div>
                            <div className="flex-1 bg-gray-200 rounded-full h-2 relative overflow-hidden">
                                <div
                                    className={`h-2 rounded-full ${item.color} transition-all duration-500 ease-out`}
                                    style={{ width: `${item.value}%` }}
                                />
                            </div>
                            <span className="text-sm font-medium min-w-16 text-right">
                                {item.count} ({item.value}%)
                            </span>
                        </div>
                    ))}
                </div>

                {/* Summary */}
                <div className="mt-6 text-center">
                    <div className="text-2xl font-bold">{totalResponses}</div>
                    <div className="text-sm text-gray-600">Total Responses</div>
                </div>
            </CardContent>
        </Card>
    )
}