"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Lightbulb,
  Sparkles,
  TrendingUp,
  RefreshCw,
  Calendar,
  AlertTriangle,
  Target,
  BarChart3
} from "lucide-react";
import { toast } from "sonner";
import { getUserDataFromCookies } from "@/lib/auth-utils";

interface RecentInterview {
  session_id: string;
  name: string;
  email: string;
  role: string;
  interview_level: string;
  tenure: number;
  completed_at: string;
  feedback: {
    expectations_vs_reality: string;
    highlights: string;
    challenges_faced: string;
    reason_for_exit: string;
    rejoin_recommendation: {
      would_rejoin: boolean;
      would_recommend: boolean;
      conditions_to_rejoin: string;
      conditions_to_recommend: string;
    };
  };
}

interface ImprovementSuggestion {
  category: string;
  priority: string;
  suggestion: string;
  expected_impact: string;
  implementation_difficulty: string;
  timeline: string;
  success_metrics: string[];
}

interface CriticalIssue {
  issue: string;
  frequency: string;
  impact: string;
  description: string;
  affected_roles: string[];
  sentiment_indicators: string[];
}

interface RetentionStrategy {
  strategy: string;
  description: string;
  target_roles: string[];
  expected_outcome: string;
}

interface RedFlags {
  immediate_attention_needed: string[];
  trending_concerns: string[];
  satisfaction_gaps: string[];
}

interface SuggestionsData {
  summary: {
    total_interviews_analyzed: number;
    common_departure_reasons: string[];
    overall_sentiment: string;
    key_themes: string[];
  };
  critical_issues: CriticalIssue[];
  improvement_suggestions: ImprovementSuggestion[];
  retention_strategies: RetentionStrategy[];
  red_flags: RedFlags;
}

export default function SuggestionsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ user_id: string } | null>(null);
  const [recentInterviews, setRecentInterviews] = useState<RecentInterview[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [numberOfInterviews, setNumberOfInterviews] = useState(10);
  const [filterRole, setFilterRole] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");

  // Get current user data
  useEffect(() => {
    const userData = getUserDataFromCookies();
    if (userData) {
      setCurrentUser({ user_id: userData.user_id });
    } else {
      router.push('/');
    }
  }, [router]);

  // Fetch recent interviews
  useEffect(() => {
    const fetchRecentInterviews = async () => {
      if (!currentUser?.user_id) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/suggestions?user_id=${currentUser.user_id}&count=20`);
        const result = await response.json();

        if (result.success) {
          setRecentInterviews(result.data.recent_interviews);
        } else {
          console.error('Failed to fetch recent interviews:', result.error);
        }
      } catch (error) {
        console.error('Error fetching recent interviews:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentInterviews();
  }, [currentUser]);

  const generateSuggestions = async () => {
    if (!currentUser?.user_id) {
      toast.error('User not authenticated');
      return;
    }

    if (recentInterviews.length === 0) {
      toast.error('No completed interviews found to analyze');
      return;
    }

    try {
      setIsGenerating(true);
      toast.loading('Analyzing interviews and generating suggestions...');

      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: currentUser.user_id,
          count: numberOfInterviews
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuggestions(result.data.suggestions);
        toast.dismiss();
        toast.success('AI suggestions generated successfully!');
      } else {
        throw new Error(result.error || 'Failed to generate suggestions');
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast.dismiss();
      toast.error('Failed to generate suggestions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-chart-4/10 text-chart-4 border-chart-4/20'; 
      case 'low': return 'bg-chart-2/10 text-chart-2 border-chart-2/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return 'text-chart-2';
      case 'negative': return 'text-destructive';
      case 'mixed': return 'text-chart-4';
      default: return 'text-muted-foreground';
    }
  };

  // Get unique roles and levels for filters
  const uniqueRoles = [...new Set(recentInterviews.map(interview => interview.role))];
  const uniqueLevels = [...new Set(recentInterviews.map(interview => interview.interview_level))];

  return (
    <div className="flex flex-col gap-6 py-6">
      {/* Page Header */}
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">AI-Generated Suggestions</h1>
            <p className="text-muted-foreground text-sm">
              Insights and recommendations based on exit interview analysis
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 space-y-6">
        {/* Latest Interview Insights */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Latest Interview Insights</h2>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-40 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recentInterviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No completed interviews found</p>
              <p className="text-sm">Complete some exit interviews to see insights</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentInterviews.slice(0, 3).map((interview) => (
                <Card key={interview.session_id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{interview.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {interview.role}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {interview.interview_level}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Developer
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        <strong>Cited:</strong> {interview.feedback.challenges_faced || "Growth opportunities and career progression concerns"}
                      </p>
                      <p>
                        <strong>Left due to:</strong> {interview.feedback.reason_for_exit}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="size-3" />
                      {new Date(interview.completed_at).toLocaleDateString()}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Generate AI Suggestions Section */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              <h2 className="text-lg font-semibold">Generate AI Suggestions</h2>
            </div>
            <p className="text-muted-foreground text-sm">
              Reveal critical organizational issues, dispassionate insights, reduces attrition and strengthens company culture through honest employee perspectives.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Number of Interviews</label>
                <Input 
                  type="number" 
                  value={numberOfInterviews}
                  onChange={(e) => setNumberOfInterviews(parseInt(e.target.value) || 10)}
                  min="1"
                  max="50"
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Filter by Role</label>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    {uniqueRoles.map((role) => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Filter by Level</label>
                <Select value={filterLevel} onValueChange={setFilterLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="All levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All levels</SelectItem>
                    {uniqueLevels.map((level) => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={generateSuggestions} 
              disabled={isGenerating || recentInterviews.length === 0}
              className="bg-gradient-to-r from-primary to-chart-2 hover:from-primary/90 hover:to-chart-2/90"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="size-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="size-4 mr-2" />
                  Generate Suggestions
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Analysis Results */}
        {suggestions && (
          <div className="space-y-6">
            {/* Summary Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="size-4 text-chart-1" />
                  <span className="text-sm font-medium">Interviews Analyzed</span>
                </div>
                <div className="text-2xl font-bold">{suggestions.summary.total_interviews_analyzed}</div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="size-4 text-chart-2" />
                  <span className="text-sm font-medium">Overall Sentiment</span>
                </div>
                <div className={`text-2xl font-bold capitalize ${getSentimentColor(suggestions.summary.overall_sentiment)}`}>
                  {suggestions.summary.overall_sentiment}
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="size-4 text-destructive" />
                  <span className="text-sm font-medium">Critical Issues</span>
                </div>
                <div className="text-2xl font-bold">{suggestions.critical_issues?.length || 0}</div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="size-4 text-chart-4" />
                  <span className="text-sm font-medium">Suggestions</span>
                </div>
                <div className="text-2xl font-bold">{suggestions.improvement_suggestions?.length || 0}</div>
              </Card>
            </div>

            {/* Red Flags - Immediate Attention */}
            {suggestions.red_flags && (
              <Card className="border-destructive/20 bg-destructive/5">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="size-5 text-destructive" />
                    <h3 className="text-lg font-semibold text-destructive">Red Flags - Immediate Attention Required</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {suggestions.red_flags.immediate_attention_needed.length > 0 && (
                      <div>
                        <h4 className="font-medium text-destructive mb-2">Immediate Attention:</h4>
                        <ul className="space-y-1">
                          {suggestions.red_flags.immediate_attention_needed.map((item, index) => (
                            <li key={index} className="text-sm text-destructive/80 flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-destructive rounded-full mt-2 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {suggestions.red_flags.trending_concerns.length > 0 && (
                      <div>
                        <h4 className="font-medium text-destructive mb-2">Trending Concerns:</h4>
                        <ul className="space-y-1">
                          {suggestions.red_flags.trending_concerns.map((item, index) => (
                            <li key={index} className="text-sm text-destructive/80 flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-chart-4 rounded-full mt-2 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {suggestions.red_flags.satisfaction_gaps.length > 0 && (
                      <div>
                        <h4 className="font-medium text-destructive mb-2">Satisfaction Gaps:</h4>
                        <ul className="space-y-1">
                          {suggestions.red_flags.satisfaction_gaps.map((item, index) => (
                            <li key={index} className="text-sm text-destructive/80 flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-chart-5 rounded-full mt-2 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Critical Issues */}
            {suggestions.critical_issues && suggestions.critical_issues.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Critical Issues</h3>
                <div className="space-y-4">
                  {suggestions.critical_issues.map((issue, index) => (
                    <Card key={index} className="border-chart-5/20">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="size-5 text-chart-5" />
                            <h4 className="font-semibold text-lg">{issue.issue}</h4>
                          </div>
                          <div className="flex gap-2">
                            <Badge className={getPriorityColor(issue.impact)}>
                              {issue.impact} impact
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {issue.frequency}
                            </Badge>
                          </div>
                        </div>
                        
                        <p className="text-muted-foreground mb-4">{issue.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="font-medium text-sm">Affected Roles:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {issue.affected_roles.map((role, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium text-sm">Sentiment Indicators:</span>
                            <ul className="mt-1 space-y-1">
                              {issue.sentiment_indicators.slice(0, 2).map((indicator, idx) => (
                                <li key={idx} className="text-sm text-muted-foreground">
                                  • {indicator}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Improvement Suggestions */}
            <div>
              <h3 className="text-lg font-semibold mb-4">AI-Generated Improvement Suggestions</h3>
              <div className="space-y-4">
                {suggestions.improvement_suggestions?.map((suggestion, index) => (
                  <Card key={index} className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <TrendingUp className="size-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg">{suggestion.category}</h4>
                            <Badge className={getPriorityColor(suggestion.priority)}>
                              {suggestion.priority} priority
                            </Badge>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {suggestion.timeline}
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground">{suggestion.suggestion}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Expected Impact:</span>
                          <p className="text-muted-foreground mt-1">{suggestion.expected_impact}</p>
                        </div>
                        <div>
                          <span className="font-medium">Implementation:</span>
                          <p className="text-muted-foreground mt-1 capitalize">{suggestion.implementation_difficulty} difficulty</p>
                        </div>
                      </div>

                      {suggestion.success_metrics && suggestion.success_metrics.length > 0 && (
                        <div>
                          <span className="font-medium text-sm">Success Metrics:</span>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {suggestion.success_metrics.map((metric, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {metric}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Retention Strategies */}
            {suggestions.retention_strategies && suggestions.retention_strategies.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Retention Strategies</h3>
                <div className="space-y-4">
                  {suggestions.retention_strategies.map((strategy, index) => (
                    <Card key={index} className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Target className="size-5 text-chart-1" />
                          <h4 className="font-semibold text-lg">{strategy.strategy}</h4>
                        </div>
                        
                        <p className="text-muted-foreground">{strategy.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Target Roles:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {strategy.target_roles.map((role, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">Expected Outcome:</span>
                            <p className="text-muted-foreground mt-1">{strategy.expected_outcome}</p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Key Insights Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h4 className="font-semibold mb-3">Common Departure Reasons</h4>
                <div className="space-y-2">
                  {suggestions.summary.common_departure_reasons.map((reason, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-destructive rounded-full" />
                      <span className="text-sm">{reason}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h4 className="font-semibold mb-3">Key Themes</h4>
                <div className="flex flex-wrap gap-2">
                  {suggestions.summary.key_themes.map((theme, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {theme}
                    </Badge>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Empty State when no suggestions generated yet */}
        {!suggestions && !isGenerating && recentInterviews.length > 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Lightbulb className="size-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Ready to Generate AI Suggestions</h3>
              <p className="text-muted-foreground mb-6">
                Analyze your recent exit interviews to get actionable organizational insights and improvement recommendations.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
