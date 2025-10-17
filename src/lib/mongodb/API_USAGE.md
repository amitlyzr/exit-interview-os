# MongoDB Schemas and API Usage

This document describes the MongoDB schemas and API endpoints for the Mock Interview Agent.

## Schemas

### Message Schema

- `_id`: ObjectId (auto-generated)
- `role`: String - 'user', 'assistant', or 'system'
- `content`: String - The message content
- `created_at`: Date - Timestamp when message was created
- `session_id`: String - Reference to the session

### Session Schema

- `session_id`: String - Unique session identifier
- `role`: String - Technology role ('java', 'python', 'devops', 'ai-genai')
- `interview_level`: String - Difficulty level ('beginner', 'intermediate', 'advanced')
- `status`: String - Session status ('active', 'completed', 'paused', 'cancelled')
- `created_at`: Date - When session was created
- `updated_at`: Date - Last update timestamp
- `started_at`: Date - When interview started
- `completed_at`: Date - When interview completed
- `duration_minutes`: Number - Interview duration

## API Endpoints

### Sessions

#### Create Session

```http
POST /api/sessions
Content-Type: application/json

{
  "session_id": "session_123",
  "role": "java",
  "interview_level": "intermediate"
}
```

#### Get Sessions

```http
GET /api/sessions?session_id=session_123
GET /api/sessions?status=active
```

#### Get Single Session

```http
GET /api/sessions/session_123
```

#### Update Session

```http
PATCH /api/sessions/session_123
Content-Type: application/json

{
  "status": "completed",
  "duration_minutes": 45
}
```

#### Delete Session

```http
DELETE /api/sessions/session_123
```

### Messages

#### Store Message

```http
POST /api/messages
Content-Type: application/json

{
  "role": "assistant",
  "content": "Hello! I'm ready to start your interview.",
  "session_id": "session_123"
}
```

#### Get Messages for Session

```http
GET /api/messages?session_id=session_123
GET /api/messages?session_id=session_123&limit=20&skip=0
```

### Feedback

#### Generate Interview Feedback

```http
POST /api/feedback
Content-Type: application/json

{
  "session_id": "session_123",
  "user_id": "user_456"
}
```

**Response:**

```json
{
  "success": true,
  "feedback": "Based on the interview conversation, here is your feedback...",
  "session_info": {
    "session_id": "session_123",
    "technology": "java",
    "level": "intermediate",
    "duration_minutes": 45,
    "total_messages": 12,
    "user_responses": 6,
    "ai_questions": 6
  }
}
```

## Usage Examples

### JavaScript/TypeScript Client

```typescript
// Create a session
const createSession = async (
  sessionId: string,
  role: string,
  level: string
) => {
  const response = await fetch("/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      role: role,
      interview_level: level,
    }),
  });
  return response.json();
};

// Store a message
const storeMessage = async (
  role: string,
  content: string,
  sessionId: string
) => {
  const response = await fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role: role,
      content: content,
      session_id: sessionId,
    }),
  });
  return response.json();
};

// Get messages for a session
const getMessages = async (sessionId: string) => {
  const response = await fetch(`/api/messages?session_id=${sessionId}`);
  return response.json();
};

// Update session status
const updateSession = async (sessionId: string, updates: any) => {
  const response = await fetch(`/api/sessions/${sessionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  return response.json();
};

// Generate interview feedback
const generateFeedback = async (sessionId: string, userId: string) => {
  const response = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      user_id: userId,
    }),
  });
  return response.json();
};
```

## Environment Variables

Make sure to set up your MongoDB connection string in `.env.local`:

```
MONGODB_URI=mongodb://localhost:27017/mock-interview-agent
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mock-interview-agent
```
