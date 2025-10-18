# System Architecture

This document provides a comprehensive overview of the Exit Interview Application's architecture, design patterns, and system components.

## 📐 Overview

The Exit Interview Application is built as a modern, serverless web application using Next.js 15's App Router architecture. It follows a multi-tenant SaaS model where organizations can conduct AI-powered exit interviews with their departing employees.

### Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes, Node.js runtime
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Cookie-based session management with Lyzr integration
- **Email Services**: Gmail API (OAuth 2.0), Nodemailer SMTP
- **AI/ML**: Lyzr Agent SDK for conversation, sentiment analysis, and feedback

### Key Architectural Principles

- **Multi-tenant isolation**: Data strictly segregated by `user_id` and `org_id`
- **Serverless-first**: Optimized for edge deployment and serverless functions
- **API-driven**: Clear separation between client and server logic
- **Progressive enhancement**: Graceful fallbacks for email delivery and AI features
- **Type safety**: Full TypeScript coverage with strict mode enabled

## 🏗️ System Components

### 1. Frontend Architecture

#### Route Structure

The application uses Next.js App Router with folder-based routing:

```
app/
├── (main)/                  # Public landing pages
│   └── page.tsx            # Home page
├── (hr-dashboard)/         # HR-protected routes
│   ├── dashboard/          # Analytics dashboard
│   ├── settings/           # Configuration
│   ├── add-email/          # Email template management
│   └── suggestions/        # AI-powered suggestions
└── (interview)/            # Employee interview routes
    ├── employee/           # Employee info capture
    └── interview/          # AI conversation interface
```

**Route Groups**: Parenthesized folders `(name)` don't create URL segments but allow layout grouping.

#### State Management

- **React Context**: Authentication state (`AuthProvider`)
- **Redux Toolkit**: API state caching and management
- **React Query**: Server state synchronization
- **Local State**: Component-specific useState/useReducer

#### Component Hierarchy

```
App Root
├── ThemeProvider (dark/light mode)
├── StoreProvider (Redux store)
└── AuthProvider (authentication state)
    ├── HRAccessGuard (HR route protection)
    └── Page Components
```

### 2. Backend Architecture

#### API Route Organization

```
api/
├── users/              # User CRUD and HR role management
├── sessions/           # Interview session management
│   └── [session_id]/  # Individual session operations
├── messages/           # Conversation message storage
├── analytics/          # Interview metrics and insights
├── sentiment/          # AI sentiment analysis
├── feedback/           # AI feedback generation
├── suggestions/        # AI HR suggestions
├── email-template/     # Template CRUD
├── smtp-config/        # SMTP configuration
├── send-invitation/    # Multi-channel email delivery
└── auth/gmail/         # Gmail OAuth flow
    ├── connect/        # Initiate OAuth
    ├── callback/       # OAuth callback handler
    └── status/         # Connection status check
```

#### Request Flow

```
Client Request
    ↓
Next.js Middleware (future: rate limiting, auth checks)
    ↓
API Route Handler
    ↓
Database Connection Pool (MongoDB)
    ↓
Mongoose Model Query
    ↓
Business Logic Processing
    ↓
External API Call (Lyzr AI, Gmail API) [if needed]
    ↓
Response Formatting
    ↓
Client Response
```

### 3. Database Architecture

#### Schema Design

The database uses MongoDB with the following collections:

**Users Collection**
- Stores HR and system users
- Manages OAuth and SMTP credentials
- Tracks organization membership

**Sessions Collection**
- Represents individual exit interviews
- Tracks interview lifecycle (pending → active → completed)
- Stores AI-generated feedback

**Messages Collection**
- Stores conversation history
- Links to sessions for complete transcripts
- Supports user, assistant, and system roles

**EmailTemplates Collection**
- Customizable email templates per user
- Supports variable substitution
- HTML and plain text versions

**Sentiments Collection**
- AI-analyzed sentiment per question/response
- Confidence scores and theme extraction
- Aggregated for analytics

#### Data Isolation

All queries include `user_id` filter for multi-tenant data isolation:

```typescript
// Example: Fetching sessions for a user
const sessions = await Session.find({ 
  user_id: currentUserId 
}).sort({ created_at: -1 });
```

#### Indexes

Optimized compound indexes for common query patterns:

```typescript
// User queries
{ user_id: 1 } (unique)
{ org_id: 1, is_hr: 1 }

// Session queries
{ user_id: 1, status: 1, created_at: -1 }
{ user_id: 1, role: 1, interview_level: 1 }

// Message queries
{ session_id: 1, created_at: 1 }
{ user_id: 1, session_id: 1 }

// Sentiment queries
{ user_id: 1, session_id: 1, question_number: 1 } (unique)
{ user_id: 1, sentiment: 1, confidence: -1 }
```

### 4. Authentication & Authorization

#### Authentication Flow

```
1. User logs in via Lyzr authentication system
   ↓
2. Lyzr provides: user_id, email, token, org_id
   ↓
3. Application stores credentials in cookies
   ↓
4. POST /api/users creates/retrieves user record
   ↓
5. First user in org automatically becomes HR
   ↓
6. Subsequent requests include cookies for authentication
```

#### Authorization Model

- **HR Users**: Can create sessions, view analytics, manage settings
- **Employees**: Can only access their specific interview session
- **Session Access**: Validated via `session_id` in URL parameter

#### Security Measures

- Cookie-based session management (httpOnly, secure, sameSite)
- Database-level permission checks (never trust cookies alone)
- Input validation using Zod schemas
- SQL injection prevention via Mongoose ODM
- XSS protection via React's built-in escaping

### 5. Email Delivery System

#### Multi-Channel Architecture

The application implements a cascading email delivery system:

```
Primary: Gmail API OAuth
    ↓ (if fails or not configured)
Fallback: SMTP via Nodemailer
    ↓ (if fails or not configured)
Manual: Return interview URL for manual distribution
```

#### Gmail OAuth Flow

```
1. User clicks "Connect Gmail" in settings
   ↓
2. POST /api/auth/gmail/connect generates OAuth URL
   ↓
3. User authorizes app in Google consent screen
   ↓
4. Google redirects to /api/auth/gmail/callback
   ↓
5. Exchange authorization code for tokens
   ↓
6. Store tokens in User.gmail_oauth
   ↓
7. Use Gmail API to send emails
```

#### Token Management

- Access tokens expire after 1 hour
- Refresh tokens used to obtain new access tokens
- Automatic token refresh before sending emails
- Secure storage in MongoDB (encrypted in production)

#### Email Template System

Templates support variable substitution:

- `{{name}}` - Employee name
- `{{role}}` - Job role
- `{{level}}` - Seniority level
- `{{tenure}}` - Employment duration
- `{{interviewUrl}}` - Unique interview link

### 6. AI Integration

#### Lyzr Agent Architecture

The application uses Lyzr's Agent SDK for multiple AI capabilities:

**Interview Agent**
- Conducts natural language conversation
- Adapts questions based on role and level
- Maintains conversation context
- Stored in `LYZR_QUESTIONINAIRE_AGENT_ID`

**Sentiment Agent**
- Analyzes emotional tone of responses
- Classifies as positive, negative, or neutral
- Provides confidence scores (0-1)
- Extracts themes and topics

**Feedback Agent**
- Generates structured feedback from conversation
- Summarizes key insights
- Identifies patterns and recommendations
- Stored in `LYZR_FEEDBACK_AGENT_ID`

**Suggestions Agent**
- Provides actionable HR recommendations
- Identifies organizational improvements
- Analyzes trends across interviews
- Stored in `LYZR_SUGGESTIONS_AGENT_ID`

#### AI Request Flow

```
Client (Voice/Text Input)
    ↓
POST /api/messages
    ↓
Store user message in database
    ↓
Fetch conversation history
    ↓
Call Lyzr Agent API with context
    ↓
Stream AI response back to client
    ↓
Store assistant response in database
    ↓
Trigger sentiment analysis (async)
```

### 7. Analytics & Reporting

#### Metrics Collected

- **Interview Completion Rate**: completed / total sessions
- **Average Interview Duration**: Mean duration in minutes
- **Sentiment Distribution**: Positive, negative, neutral breakdown
- **Role-based Insights**: Patterns by job role
- **Level-based Insights**: Patterns by seniority level
- **Theme Extraction**: Common topics and concerns
- **Rejoin Willingness**: Would rejoin/recommend percentages

#### Analytics Query Optimization

Aggregation pipelines for efficient analytics:

```typescript
// Example: Sentiment distribution by role
await Sentiment.aggregate([
  { $match: { user_id: userId } },
  { $group: {
    _id: { role: '$role', sentiment: '$sentiment' },
    count: { $sum: 1 },
    avgConfidence: { $avg: '$confidence' }
  }},
  { $sort: { '_id.role': 1, count: -1 } }
]);
```

## 🔄 Data Flow Diagrams

### Interview Creation Flow

```
HR Dashboard
    ↓
Create Session Form (name, email, role, level, tenure)
    ↓
POST /api/sessions
    ↓
Create Session record (status: pending)
    ↓
POST /api/send-invitation
    ↓
Fetch email template
    ↓
Substitute variables
    ↓
Try Gmail API → SMTP → Manual fallback
    ↓
Send invitation email with unique session URL
    ↓
Return success/failure to HR
```

### Interview Participation Flow

```
Employee clicks email link
    ↓
GET /interview?session_id=xxx
    ↓
Fetch session data
    ↓
Validate session exists and is pending/active
    ↓
Update session status to "active"
    ↓
Load existing messages (if resuming)
    ↓
Initialize AI chat interface
    ↓
Employee responds to questions
    ↓
POST /api/messages for each interaction
    ↓
Lyzr AI generates contextual responses
    ↓
Continue until employee ends interview
    ↓
PUT /api/sessions/[id] (status: completed)
    ↓
POST /api/feedback (generate AI summary)
    ↓
Redirect to thank you page
```

### Analytics Generation Flow

```
HR visits dashboard
    ↓
GET /api/analytics?user_id=xxx
    ↓
Query completed sessions
    ↓
Aggregate sentiment data
    ↓
Calculate metrics:
  - Completion rate
  - Average duration
  - Sentiment distribution
  - Theme frequency
    ↓
Return JSON analytics
    ↓
Render charts and insights
```

## 🔐 Security Architecture

### Threat Model

**Data Isolation**: Prevent cross-tenant data access
- Mitigation: All DB queries filtered by `user_id`
- Validation: Never trust client-provided user IDs

**Credential Exposure**: OAuth tokens and SMTP passwords
- Mitigation: Stored encrypted in MongoDB
- Mitigation: Never sent to client
- Mitigation: Automatic token rotation for Gmail

**Session Hijacking**: Unauthorized interview access
- Mitigation: Unique `session_id` UUIDs (hard to guess)
- Mitigation: Session ownership validation
- Mitigation: httpOnly secure cookies

**XSS Attacks**: Malicious script injection
- Mitigation: React's automatic escaping
- Mitigation: Content Security Policy headers
- Mitigation: Input sanitization

### Production Security Checklist

- [ ] Enable HTTPS/TLS for all traffic
- [ ] Set secure cookie flags (httpOnly, secure, sameSite)
- [ ] Implement rate limiting on API routes
- [ ] Enable MongoDB authentication
- [ ] Rotate OAuth secrets regularly
- [ ] Set up Content Security Policy headers
- [ ] Enable CORS restrictions
- [ ] Implement request signing for sensitive operations
- [ ] Add audit logging for HR actions
- [ ] Regular security dependency updates

## 📊 Performance Optimization

### Database Optimization

- Connection pooling (maxPoolSize: 10)
- Compound indexes on frequently queried fields
- Projection to fetch only needed fields
- Pagination for large result sets
- Query result caching in Redis (future enhancement)

### Frontend Optimization

- Code splitting via Next.js dynamic imports
- Image optimization with next/image
- Route prefetching for improved navigation
- React.memo for expensive components
- Lazy loading for off-screen components

### API Optimization

- Parallel data fetching where possible
- Response compression (gzip/brotli)
- CDN caching for static assets
- Edge deployment for low latency
- Background jobs for async processing (sentiment, feedback)

## 🚀 Deployment Architecture

### Recommended Deployment

**Platform**: Vercel (optimized for Next.js)

**Configuration**:
- Node.js runtime: 18.x
- Build command: `npm run build`
- Output directory: `.next`
- Install command: `npm install`

**Environment Variables**: Set in Vercel dashboard
- All variables from `.env.example`
- Production MongoDB URI
- Production app URL
- Gmail OAuth credentials (production)

### Alternative Deployment Options

- **Docker**: Containerized deployment (Dockerfile included)
- **AWS**: EC2 or ECS with Application Load Balancer
- **Google Cloud**: Cloud Run or App Engine
- **Azure**: App Service with Linux runtime

### Scaling Considerations

- **Horizontal Scaling**: Stateless API routes allow multiple instances
- **Database Scaling**: MongoDB Atlas auto-scaling
- **Caching Layer**: Redis for session and query caching
- **CDN**: Cloudflare or AWS CloudFront for static assets
- **Background Jobs**: Bull queue for async AI processing

## 📈 Monitoring & Observability

### Recommended Tools

- **Application Monitoring**: Sentry for error tracking
- **Performance Monitoring**: Vercel Analytics
- **Database Monitoring**: MongoDB Atlas monitoring
- **Uptime Monitoring**: UptimeRobot or Pingdom
- **Log Aggregation**: Logtail or DataDog

### Key Metrics to Monitor

- API response times (p50, p95, p99)
- Database query performance
- Email delivery success rate
- AI API response times
- Error rates by route
- User session duration
- Interview completion rate

## 🔮 Future Enhancements

### Planned Features

- SMS notifications for interview invitations
- Real-time collaboration on feedback
- Multi-language support for interviews
- Video interview capabilities
- Advanced analytics with predictive insights
- Integration with HRIS systems (BambooHR, Workday)
- Custom branding and white-labeling
- Mobile native apps (React Native)

### Technical Improvements

- Implement server-side caching (Redis)
- Add comprehensive E2E tests (Playwright)
- Set up CI/CD pipelines (GitHub Actions)
- Implement feature flags for gradual rollouts
- Add real-time notifications (WebSockets)
- Migrate to tRPC for type-safe API calls
- Implement background job queue (Bull/BullMQ)

---

For questions or clarifications about the architecture, please open a GitHub Discussion or contact the maintainers.
