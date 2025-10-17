"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Calendar, Eye, Play, Trash2 } from "lucide-react"
import { ChatHistoryModal } from "@/components/shared/chat-history-modal"

interface ExitSession {
  employeeName: string
  email: string
  role: string
  level: string
  status: string
  duration: string
  created: string
  actions: string
  sessionId?: string
}

interface ExitSessionsTableProps {
  data: ExitSession[]
}

export function ExitSessionsTable({ data }: ExitSessionsTableProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>("")
  const [isChatModalOpen, setIsChatModalOpen] = useState(false)

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      Active: { label: "Active", color: "bg-blue-100 text-blue-800" },
      Completed: { label: "Completed", color: "bg-green-100 text-green-800" },
      Paused: { label: "Paused", color: "bg-yellow-100 text-yellow-800" },
      Cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      color: "bg-gray-100 text-gray-800",
    }

    return (
      <Badge variant="outline" className={`${config.color} font-medium`}>
        {config.label}
      </Badge>
    )
  }

  const handleViewChat = (sessionId: string, employeeName: string) => {
    setSelectedSessionId(sessionId)
    setSelectedEmployeeName(employeeName)
    setIsChatModalOpen(true)
  }

  // const handleContinueSession = (sessionId: string) => {
  //   // Navigate to interview page to continue the session
  //   window.location.href = `/interview?session_id=${sessionId}`
  // }

  return (
    <Card className="w-full p-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Recent Exit Interview Sessions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {data.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500">No exit interview sessions found</p>
              <p className="text-xs text-gray-400 mt-1">
                Start your first exit interview to see data here
              </p>
            </div>
          </div>
        ) : (
          <Table className="min-w-full p-4">
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((session, index) => (
                <TableRow key={session.sessionId || index}>
                  <TableCell className="font-medium">
                    {session.employeeName}
                  </TableCell>
                  <TableCell className="font-medium">
                    {session.email}
                  </TableCell>
                  <TableCell>{session.role}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                      {session.level}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(session.status)}</TableCell>
                  <TableCell>{session.duration}</TableCell>
                  <TableCell>{session.created}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {session.status === "Completed" && session.sessionId && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewChat(session.sessionId!, session.employeeName)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Chat
                        </Button>
                      )}
                      {/* <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button> */}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      
      {/* Chat History Modal */}
      <ChatHistoryModal
        open={isChatModalOpen}
        onOpenChange={setIsChatModalOpen}
        sessionId={selectedSessionId || ""}
        employeeName={selectedEmployeeName}
      />
    </Card>
  )
}
