"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tags, Star } from "lucide-react"

interface ThemeStats {
    [key: string]: number
}

interface ThemeSentimentStats {
    [key: string]: {
        positive: number
        negative: number
        neutral: number
        total: number
    }
}

interface ThemesAnalysisProps {
    themeStats?: ThemeStats
    themeSentimentStats?: ThemeSentimentStats
    isLoading?: boolean
}

const themeDisplayNames: Record<string, string> = {
    "Role Expectations": "Role Expectations",
    "Workload": "Workload Management",
    "Communication": "Communication",
    "Management": "Management Quality",
    "Work-Life Balance": "Work-Life Balance",
    "Career Growth": "Career Development",
    "Company Culture": "Company Culture",
    "Benefits": "Benefits & Compensation",
    "Support": "Team Support",
    "Mentorship": "Mentorship & Guidance"
}

const themeColors: Record<string, string> = {
    "Role Expectations": "bg-chart-1/10 text-chart-1 border-chart-1/20",
    "Workload": "bg-chart-5/10 text-chart-5 border-chart-5/20",
    "Communication": "bg-destructive/10 text-destructive border-destructive/20",
    "Management": "bg-chart-2/10 text-chart-2 border-chart-2/20",
    "Work-Life Balance": "bg-chart-4/10 text-chart-4 border-chart-4/20",
    "Career Growth": "bg-primary/10 text-primary border-primary/20",
    "Company Culture": "bg-chart-3/10 text-chart-3 border-chart-3/20",
    "Benefits": "bg-chart-2/10 text-chart-2 border-chart-2/20",
    "Support": "bg-chart-1/10 text-chart-1 border-chart-1/20",
    "Mentorship": "bg-primary/10 text-primary border-primary/20"
}

// Star Rating Component
const StarRating = ({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) => {
    const starSize = size === "sm" ? "h-4 w-4" : size === "md" ? "h-5 w-5" : "h-6 w-6"
    
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`${starSize} ${
                        star <= rating 
                            ? "fill-chart-4 text-chart-4" 
                            : "fill-muted text-muted-foreground"
                    }`}
                />
            ))}
        </div>
    )
}

export function ThemesAnalysis({ themeStats, themeSentimentStats, isLoading }: ThemesAnalysisProps) {
    // Calculate star rating based on sentiment (1-5 stars)
    const calculateStarRating = (theme: string): number => {
        const sentiment = themeSentimentStats?.[theme]
        if (!sentiment || sentiment.total === 0) return 3 // Default neutral rating
        
        const positiveRatio = sentiment.positive / sentiment.total
        const negativeRatio = sentiment.negative / sentiment.total
        const neutralRatio = sentiment.neutral / sentiment.total
        
        // Calculate weighted score (0-1 range)
        const score = (positiveRatio * 1) + (neutralRatio * 0.5) + (negativeRatio * 0)
        
        // Convert to 1-5 star rating
        return Math.round(score * 4) + 1 // Maps 0-1 to 1-5
    }

    const getSatisfactionLevel = (rating: number): { text: string; color: string } => {
        if (rating >= 4.5) return { text: "Excellent", color: "text-chart-2" }
        if (rating >= 3.5) return { text: "Good", color: "text-chart-4" }
        if (rating >= 2.5) return { text: "Average", color: "text-muted-foreground" }
        if (rating >= 1.5) return { text: "Poor", color: "text-chart-5" }
        return { text: "Critical", color: "text-destructive" }
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Tags className="h-5 w-5" />
                        Employee Satisfaction by Theme
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                                <div className="flex items-center gap-3">
                                    <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                                    <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                                    <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!themeStats || Object.keys(themeStats).length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Tags className="h-5 w-5" />
                        Employee Satisfaction by Theme
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <Star className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No satisfaction data available yet.</p>
                        <p className="text-sm">Complete some interviews to see theme ratings.</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Sort themes by frequency and get top themes
    const sortedThemes = Object.entries(themeStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8) // Show top 8 themes for better layout

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Tags className="h-5 w-5" />
                    Employee Satisfaction by Theme
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                    Based on sentiment analysis of {Object.values(themeStats).reduce((a, b) => a + b, 0)} mentions across interviews
                </p>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sortedThemes.map(([theme, count]) => {
                        const displayName = themeDisplayNames[theme] || theme
                        const colorClass = themeColors[theme] || "bg-muted/10 text-muted-foreground border-border"
                        const rating = calculateStarRating(theme)
                        const satisfaction = getSatisfactionLevel(rating)
                        const sentiment = themeSentimentStats?.[theme]
                        
                        return (
                            <div 
                                key={theme} 
                                className="flex flex-col gap-3 p-4 border rounded-lg bg-card hover:bg-muted/20 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <Badge variant="outline" className={colorClass}>
                                        {displayName}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        {count} mention{count !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <StarRating rating={rating} size="sm" />
                                        <span className={`text-sm font-medium ${satisfaction.color}`}>
                                            {satisfaction.text}
                                        </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {rating.toFixed(1)}/5.0
                                    </div>
                                </div>

                                {sentiment && sentiment.total > 0 && (
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <div className="flex gap-3">
                                            <span className="text-chart-2">
                                                {sentiment.positive} positive
                                            </span>
                                            <span className="text-muted-foreground">
                                                {sentiment.neutral} neutral
                                            </span>
                                            <span className="text-destructive">
                                                {sentiment.negative} negative
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
                
                {Object.keys(themeStats).length > 8 && (
                    <div className="mt-6 text-center">
                        <span className="text-sm text-muted-foreground">
                            Showing top 8 of {Object.keys(themeStats).length} themes
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
