<div align="center">
  <h1>🎯 Exit Interview OS</h1>
  <p><strong>AI-Powered Exit Interview Platform for Modern Organizations</strong></p>
  
  <p>
    <a href="#-features">Features</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-documentation">Documentation</a> •
    <a href="#-contributing">Contributing</a> •
    <a href="#-license">License</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/MongoDB-6-47A248?style=flat-square&logo=mongodb" alt="MongoDB" />
    <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
  </p>
</div>

---

## 📖 Overview

**Exit Interview OS** is an open-source, AI-powered platform that transforms the traditional exit interview process. Organizations can conduct structured, confidential exit interviews with departing employees, gaining actionable insights to improve retention and workplace culture.

### Why Exit Interview OS?

- 🤖 **AI-Driven Conversations** - Natural, adaptive interview flow powered by Lyzr AI
- 📧 **Multi-Channel Email Delivery** - Gmail OAuth, SMTP fallback, and manual options
- 🎨 **Customizable Templates** - Brand your interview invitations
- 📊 **Real-Time Analytics** - Sentiment analysis and comprehensive insights
- 🔒 **Enterprise-Grade Security** - Multi-tenant architecture with complete data isolation
- ⚡ **Modern Stack** - Built on Next.js 15, React 19, and TypeScript

---

## ✨ Features

<table>
  <tr>
    <td width="50%">
      <h3>🤖 AI-Powered Interviews</h3>
      <p>Intelligent conversation flow that adapts to employee responses using natural language processing and contextual awareness.</p>
    </td>
    <td width="50%">
      <h3>📧 Smart Email Delivery</h3>
      <p>Multiple delivery channels with automatic fallback: Gmail OAuth → SMTP → Manual distribution.</p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>📊 Comprehensive Analytics</h3>
      <p>Real-time sentiment analysis, theme extraction, and actionable insights to drive organizational improvements.</p>
    </td>
    <td width="50%">
      <h3>🎨 Customizable Templates</h3>
      <p>HTML and text email templates with variable substitution for personalized communications.</p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>🔒 Secure & Isolated</h3>
      <p>Enterprise-grade multi-tenant architecture ensuring complete data privacy and isolation.</p>
    </td>
    <td width="50%">
      <h3>⚡ Modern Tech Stack</h3>
      <p>Built with Next.js 15, React 19, TypeScript, MongoDB, and Tailwind CSS for maximum performance.</p>
    </td>
  </tr>
</table>

---

## 🛠️ Tech Stack

<div align="center">

| Category | Technologies |
|----------|-------------|
| **Frontend** | Next.js 15, React 19, TypeScript |
| **Backend** | Next.js API Routes, Node.js |
| **Database** | MongoDB + Mongoose ODM |
| **AI/ML** | Lyzr Agent SDK |
| **Email** | Gmail API, Nodemailer (SMTP) |
| **UI** | Radix UI, Tailwind CSS, Lucide Icons |
| **State** | Redux Toolkit, React Context |

</div>

---

## � Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ and npm/yarn/pnpm
- **MongoDB** (local or cloud instance)
- **Google Cloud Console** account (for Gmail OAuth)
- **Lyzr API** credentials

### Installation

#### 1️⃣ Clone the Repository

```bash
git clone https://github.com/amitlyzr/exit-interview-os.git
cd exit-interview-os
```

#### 2️⃣ Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

#### 3️⃣ Environment Configuration

Create a `.env.local` file in the root directory:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/exit-interview

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Gmail OAuth (Required for email sending)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Lyzr AI Integration
LYZR_API_KEY=your_lyzr_api_key_here
LYZR_SENTIMENT_AGENT_ID=""
LYZR_FEEDBACK_AGENT_ID=""
LYZR_SUGGESTIONS_AGENT_ID=""
```

#### 4️⃣ Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. 🎉

---

## 📧 Email Configuration

The application supports **multiple email delivery methods** with automatic fallback:

```
Gmail OAuth (Primary) → SMTP (Fallback) → Manual Link (Last Resort)
```

### Gmail OAuth Setup

<details>
<summary><b>🔧 Google Cloud Console Setup (Click to expand)</b></summary>

<br/>

**Step 1: Create Google Cloud Project**
- Visit [Google Cloud Console](https://console.cloud.google.com/)
- Create a new project or select an existing one
- Enable the Gmail API

**Step 2: Create OAuth 2.0 Credentials**
- Navigate to **APIs & Services** → **Credentials**
- Click **Create Credentials** → **OAuth client ID**
- Choose **Web application**

**Step 3: Configure OAuth Consent Screen**
- Add application name and authorized domains
- Add scopes:
  - `https://www.googleapis.com/auth/gmail.send`
  - `https://www.googleapis.com/auth/userinfo.email`

**Step 4: Set Authorized Redirect URIs**
- Development: `http://localhost:3000/api/auth/gmail/callback`
- Production: `https://yourdomain.com/api/auth/gmail/callback`

**Step 5: Get Credentials**
- Copy Client ID and Client Secret to your `.env.local`

</details>

### In-App Gmail Connection

1. Navigate to **Settings → Gmail Connection**
2. Click **"Connect Gmail"** button
3. Complete Google OAuth consent flow
4. Start sending invitations! ✉️

### SMTP Configuration (Optional Fallback)

Configure SMTP in application settings:

| Setting | Value |
|---------|-------|
| **Host** | smtp.gmail.com |
| **Port** | 587 |
| **Security** | STARTTLS |
| **Username** | your-email@gmail.com |
| **Password** | your-app-password |

---

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (hr-dashboard)/          # HR Dashboard routes
│   ├── (interview)/             # Interview participant routes
│   ├── api/                     # API endpoints
│   │   ├── auth/gmail/          # Gmail OAuth endpoints
│   │   ├── email-template/      # Email template management
│   │   ├── send-invitation/     # Email sending logic
│   │   ├── sessions/            # Interview session management
│   │   └── analytics/           # Analytics endpoints
│   └── globals.css              # Global styles
├── components/                   # Reusable UI components
│   ├── shared/                  # Common components
│   ├── providers/               # Context providers
│   └── logo/                    # Branding components
├── lib/                         # Utility libraries
│   ├── mongodb/                 # Database schemas and connection
│   ├── features/                # Feature-specific logic
│   ├── lyzr-api/               # AI integration
│   ├── gmail-auth.ts           # Gmail OAuth service
│   ├── gmail-email-service.ts  # Email sending service
│   └── server-auth-utils.ts    # Server-side auth utilities
└── hooks/                       # Custom React hooks
```

---

## � API Reference

<details>
<summary><b>View All API Endpoints</b></summary>

<br/>

### 🔐 Gmail OAuth
```
POST   /api/auth/gmail/connect    - Initiate Gmail connection
GET    /api/auth/gmail/callback   - OAuth callback handler
GET    /api/auth/gmail/status     - Check connection status
DELETE /api/auth/gmail/status     - Disconnect Gmail
POST   /api/auth/gmail/test       - Send test email
```

### 📧 Email Management
```
GET    /api/email-template        - Get email template
POST   /api/email-template        - Save email template
DELETE /api/email-template        - Reset to default template
```

### 📝 Interview Management
```
GET    /api/sessions              - List interview sessions
POST   /api/sessions              - Create new session
POST   /api/send-invitation       - Send interview invitation
GET    /api/sessions/:id          - Get session details
PATCH  /api/sessions/:id          - Update session
DELETE /api/sessions/:id          - Delete session
```

### 💬 Messages & Feedback
```
GET    /api/messages              - Get conversation messages
POST   /api/messages              - Store new message
POST   /api/feedback              - Generate AI feedback
```

### 📊 Analytics & Insights
```
GET    /api/analytics             - Get interview analytics
GET    /api/sentiment             - Get sentiment analysis
POST   /api/suggestions           - Get improvement suggestions
```

</details>

---

## 🎨 Email Templates

Customize your interview invitation emails with **dynamic variables**:

| Variable | Description |
|----------|-------------|
| `{{name}}` | Employee's full name |
| `{{role}}` | Job role/title |
| `{{level}}` | Seniority level (junior/mid/senior) |
| `{{tenure}}` | Employment duration in months |
| `{{interviewUrl}}` | Unique interview link |

<details>
<summary><b>📄 HTML Template Example</b></summary>

<br/>
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        .button { 
            background: #007bff; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 4px; 
        }
    </style>
</head>
<body>
    <h1>Exit Interview Invitation</h1>
    <p>Dear {{name}},</p>
    <p>We invite you to participate in an AI-powered exit interview.</p>
    <a href="{{interviewUrl}}" class="button">Start Exit Interview</a>
</body>
</html>
```

</details>

---

## 🔒 Security & Privacy

<table>
  <tr>
    <td>🔐 <b>OAuth 2.0</b></td>
    <td>Secure Gmail integration without password storage</td>
  </tr>
  <tr>
    <td>🏢 <b>Multi-Tenant</b></td>
    <td>Complete data isolation per organization</td>
  </tr>
  <tr>
    <td>🔄 <b>Token Management</b></td>
    <td>Automatic refresh and secure token storage</td>
  </tr>
  <tr>
    <td>✅ <b>Input Validation</b></td>
    <td>Comprehensive validation with Zod schemas</td>
  </tr>
  <tr>
    <td>🛡️ <b>CORS Protection</b></td>
    <td>Secure cross-origin request handling</td>
  </tr>
</table>

---

## 📊 Analytics & Insights

Transform exit interview data into **actionable insights**:

- 📈 **Completion Rates** - Track interview participation metrics
- 😊 **Sentiment Analysis** - AI-powered emotional tone analysis
- 🎯 **Pattern Recognition** - Identify common themes and concerns
- 👥 **Role-Based Insights** - Analytics segmented by department and level
- 📉 **Trend Analysis** - Historical data and retention patterns
- 💡 **AI Recommendations** - Actionable suggestions for improvement

---

## 🚀 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/amitlyzr/exit-interview-os)

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables

Set these in your deployment platform:

```env
MONGODB_URI=your_mongodb_connection_string
NEXT_PUBLIC_APP_URL=https://yourdomain.com
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
LYZR_API_KEY=your_lyzr_api_key
```

### Deployment Platforms

| Platform | Status | Documentation |
|----------|--------|---------------|
| **Vercel** | ✅ Recommended | Optimized for Next.js |
| **Docker** | ✅ Supported | Dockerfile included |
| **AWS** | ✅ Supported | EC2, ECS, or Lambda |
| **Google Cloud** | ✅ Supported | Cloud Run or App Engine |
| **Azure** | ✅ Supported | App Service |

---

## � Troubleshooting

<details>
<summary><b>🔍 Common Issues & Solutions</b></summary>

<br/>

### Gmail OAuth Not Working
- ✅ Verify environment variables are set correctly
- ✅ Check Google Cloud Console OAuth configuration
- ✅ Ensure redirect URIs match exactly (dev vs production)

### Email Sending Failures
- ✅ Check Gmail API quotas in Google Cloud Console
- ✅ Verify user has granted necessary permissions
- ✅ Test with SMTP fallback configuration

### Database Connection Issues
- ✅ Verify MongoDB URI format and credentials
- ✅ Check network connectivity to MongoDB instance
- ✅ Ensure database user has proper permissions

### Build Errors
- ✅ Clear `.next` folder: `rm -rf .next`
- ✅ Clear `node_modules`: `rm -rf node_modules`
- ✅ Reinstall dependencies: `npm install`
- ✅ Check TypeScript errors: `npm run lint`

### Gmail API Quotas
- **Free Tier**: 1 billion quota units/day
- **Email Sending**: ~25 quota units per email
- **Monitor**: Google Cloud Console → APIs & Services → Quotas

</details>

---

## 🤝 Contributing

We love contributions! Exit Interview OS is **open-source** and welcomes improvements from the community.

### How to Contribute

1. **Fork** the repository
2. **Create** a feature branch
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit** your changes
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push** to the branch
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open** a Pull Request

### Development Guidelines

- � Follow TypeScript best practices
- ✅ Write tests for new features
- 📖 Update documentation
- 🎨 Follow existing code style
- 💬 Write clear commit messages

---

## �📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## � Support & Community

<div align="center">

### Show Your Support

If you find this project useful, please consider:

⭐ **Star this repository**  
🐛 **Report bugs**  
💡 **Suggest new features**  
🤝 **Contribute code**

### Get Help

- 📚 [Documentation](./ARCHITECTURE.md)
- 💬 [GitHub Discussions](https://github.com/amitlyzr/exit-interview-os/discussions)
- 🐛 [Issue Tracker](https://github.com/amitlyzr/exit-interview-os/issues)
- 📧 [Email Support](mailto:support@lyzr.ai)

---

<p>Built with ❤️ by <a href="https://lyzr.ai">Lyzr</a></p>

<p>
  <a href="https://twitter.com/lyzrai">Twitter</a> •
  <a href="https://github.com/amitlyzr">GitHub</a> •
  <a href="https://lyzr.ai">Website</a>
</p>

</div>
