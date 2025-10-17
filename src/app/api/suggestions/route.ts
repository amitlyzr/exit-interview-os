import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb/mongdb";
import { Session, Sentiment, User } from "@/lib/mongodb/schemas";

const API_KEY = process.env.LYZR_API_KEY!;
const SUGGESTIONS_AGENT_ID = process.env.LYZR_SUGGESTIONS_AGENT_ID!;

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const body = await request.json();
        const { user_id, count = 5 } = body;

        // Validate required fields
        if (!user_id) {
            return NextResponse.json(
                { error: "Missing required field: user_id" },
                { status: 400 }
            );
        }

        // Get user and their agent information
        const user = await User.findOne({ user_id });
        console.log(user);
        // if (!user) {
        //     return NextResponse.json(
        //         { error: "User or user agent not found" },
        //         { status: 404 }
        //     );
        // }

        // Get latest completed sessions with feedback
        const sessions = await Session.find({
            user_id,
            status: "completed",
            feedback: { $exists: true, $ne: null }
        })
            .sort({ completed_at: -1 })
            .limit(count)
            .lean();

        if (sessions.length === 0) {
            return NextResponse.json(
                { error: "No completed sessions with feedback found" },
                { status: 404 }
            );
        }

        // Get sentiment data for these sessions
        const sessionIds = sessions.map(s => s.session_id);
        const sentiments = await Sentiment.find({
            session_id: { $in: sessionIds },
            user_id
        }).lean();

        // Prepare data for agent
        const interviewData = sessions.map(session => {
            const sessionSentiments = sentiments.filter(s => s.session_id === session.session_id);

            return {
                session_id: session.session_id,
                employee_info: {
                    role: session.role,
                    level: session.interview_level,
                    tenure: session.tenure
                },
                completion_date: session.completed_at,
                feedback: session.feedback,
                sentiments: sessionSentiments.map(s => ({
                    question: s.question,
                    response: s.response,
                    sentiment: s.sentiment,
                    confidence: s.confidence,
                    themes: s.themes
                }))
            };
        });

        // Create comprehensive prompt for the agent
        const promptMessage = `Analyze the following ${sessions.length} exit interview data and provide actionable improvement suggestions for the organization to reduce employee turnover.
                                INTERVIEW DATA:
                                ${JSON.stringify(interviewData, null, 2)}
                                Focus on practical, actionable recommendations that address the root causes identified in the interviews. Prioritize suggestions based on frequency of issues and potential impact on retention.`;

        // Call the improvement suggestions agent
        const response = await fetch("https://agent-prod.studio.lyzr.ai/v3/inference/chat/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": API_KEY,
            },
            body: JSON.stringify({
                user_id: user_id,
                agent_id: SUGGESTIONS_AGENT_ID,
                session_id: `suggestions_${Date.now()}`,
                message: promptMessage,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Agent API Error:", errorText);
            return NextResponse.json(
                { error: "Failed to generate suggestions from AI service" },
                { status: 500 }
            );
        }

        const agentResponse = await response.json();

        // Parse the structured response
        let suggestions;
        try {
            suggestions = JSON.parse(agentResponse.response);
        } catch (error) {
            console.error("Error parsing agent response:", error);
            // Fallback to raw response if parsing fails
            suggestions = {
                summary: {
                    total_interviews_analyzed: sessions.length,
                    message: "Could not parse structured response",
                    raw_response: agentResponse.response
                }
            };
        }

        return NextResponse.json({
            success: true,
            data: {
                interviews_analyzed: sessions.length,
                analysis_date: new Date().toISOString(),
                suggestions,
                raw_interview_data: interviewData
            }
        });

    } catch (error) {
        console.error("Error generating improvement suggestions:", error);
        return NextResponse.json(
            { error: "Internal server error while generating suggestions" },
            { status: 500 }
        );
    }
}

// GET - Get recent feedback summaries for display
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const user_id = searchParams.get("user_id");
        const count = parseInt(searchParams.get("count") || "5");

        if (!user_id) {
            return NextResponse.json(
                { error: "user_id is required" },
                { status: 400 }
            );
        }

        // Get latest completed sessions with feedback
        const sessions = await Session.find({
            user_id,
            status: "completed",
            feedback: { $exists: true, $ne: null }
        })
            .sort({ completed_at: -1 })
            .limit(count)
            .select('session_id name email role interview_level tenure completed_at feedback')
            .lean();

        return NextResponse.json({
            success: true,
            data: {
                recent_interviews: sessions,
                total_count: sessions.length
            }
        });

    } catch (error) {
        console.error("Error fetching recent feedback:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
