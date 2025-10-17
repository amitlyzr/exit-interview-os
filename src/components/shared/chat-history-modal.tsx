"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, User, Bot, Calendar, Loader2 } from "lucide-react"
import { format } from "date-fns"

const LYZR_API_KEY = "sk-default-AP2dc2OE8ElziiXisioG75rOg6EZZ8B8"

interface ChatMessage {
    role: "user" | "assistant"
    content: string
    created_at: string
}

interface ChatHistoryModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    sessionId: string
    employeeName?: string
}

export function ChatHistoryModal({
    open,
    onOpenChange,
    sessionId,
    employeeName
}: ChatHistoryModalProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchChatHistory = useCallback(async () => {
        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch(
                `https://agent-prod.studio.lyzr.ai/v1/sessions/${sessionId}/history`,
                {
                    headers: {
                        'accept': 'application/json',
                        'x-api-key': LYZR_API_KEY
                    }
                }
            )

            if (!response.ok) {
                throw new Error(`Failed to fetch chat history: ${response.statusText}`)
            }

            const data = await response.json()
            setMessages(data)
        } catch (err) {
            console.error('Error fetching chat history:', err)
            setError(err instanceof Error ? err.message : 'Failed to load chat history')
        } finally {
            setIsLoading(false)
        }
    }, [sessionId])

    useEffect(() => {
        if (open && sessionId) {
            fetchChatHistory()
        }
    }, [open, sessionId, fetchChatHistory])

    const formatMessageTime = (timestamp: string) => {
        try {
            // Handle malformed timestamps like "2025-09-09T11:55:28.401000"
            let cleanTimestamp = timestamp;
            
            // If timestamp has more than 3 digits after decimal, truncate to 3
            if (timestamp.includes('.')) {
                const parts = timestamp.split('.');
                if (parts[1] && parts[1].length > 3) {
                    cleanTimestamp = parts[0] + '.' + parts[1].substring(0, 3) + 'Z';
                }
            }
            
            const date = new Date(cleanTimestamp);
            if (isNaN(date.getTime())) {
                throw new Error('Invalid date');
            }
            
            return format(date, 'MMM dd, yyyy at h:mm a');
        } catch {
            // Fallback formatting for malformed timestamps
            try {
                const match = timestamp.match(/(\d{4}-\d{2}-\d{2}).*?(\d{2}):(\d{2}):(\d{2})/);
                if (match) {
                    const [, date, hours, minutes] = match;
                    const hour24 = parseInt(hours);
                    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
                    const ampm = hour24 >= 12 ? 'PM' : 'AM';
                    const formattedDate = new Date(date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                    });
                    return `${formattedDate} at ${hour12}:${minutes} ${ampm}`;
                }
            } catch {
                // Final fallback
            }
            return timestamp;
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-[95vw] w-[95vw] h-[90vh] flex flex-col p-0">
                <DialogHeader className="flex-shrink-0 p-6 pb-4 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        Chat History - {employeeName || `Session ${sessionId.slice(-8)}`}
                    </DialogTitle>
                    <div className="text-sm text-muted-foreground">
                        Session ID: {sessionId}
                    </div>
                </DialogHeader>

                <div className="flex-1 min-h-0 overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Loading chat history...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <MessageCircle className="h-12 w-12 mx-auto mb-3 text-red-300" />
                                <p className="text-sm text-red-600 mb-2">Failed to load chat history</p>
                                <p className="text-xs text-red-500">{error}</p>
                            </div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                <p className="text-sm text-gray-500">No messages found</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    This session doesn&apos;t have any chat history yet
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full overflow-y-auto">
                            <div className="space-y-6 p-6">
                                {messages.map((message, index) => (
                                    <div
                                        key={index}
                                        className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                                            }`}
                                    >
                                        <div className="flex-shrink-0">
                                            <div
                                                className={`w-10 h-10 rounded-full flex items-center justify-center ${message.role === 'user'
                                                        ? 'bg-blue-100 text-blue-600'
                                                        : 'bg-purple-100 text-purple-600'
                                                    }`}
                                            >
                                                {message.role === 'user' ? (
                                                    <User className="h-5 w-5" />
                                                ) : (
                                                    <Bot className="h-5 w-5" />
                                                )}
                                            </div>
                                        </div>

                                        <div className={`flex-1 min-w-0 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                                            <div className={`flex items-center gap-2 mb-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                <Badge
                                                    variant="outline"
                                                    className={`text-xs ${message.role === 'user'
                                                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                            : 'bg-purple-50 text-purple-700 border-purple-200'
                                                        }`}
                                                >
                                                    {message.role === 'user' ? 'Employee' : 'AI Interviewer'}
                                                </Badge>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatMessageTime(message.created_at)}
                                                </div>
                                            </div>

                                            <div
                                                className={`inline-block max-w-[80%] rounded-lg px-4 py-3 ${message.role === 'user'
                                                        ? 'bg-blue-600 text-white ml-auto'
                                                        : 'bg-gray-100 text-gray-900 border mr-auto'
                                                    }`}
                                            >
                                                <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">
                                                    {message.content}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
