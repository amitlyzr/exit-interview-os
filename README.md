# Exit Interview Application

An AI-powered exit interview platform that enables organizations to conduct structured, confidential exit interviews with departing employees. The application features Gmail OAuth integration for seamless email delivery, customizable templates, and comprehensive analytics.

## 🚀 Features

- **AI-Powered Interviews**: Intelligent conversation flow with natural language processing
- **Gmail OAuth Integration**: Send invitations directly from user's Gmail account
- **Customizable Email Templates**: HTML and text email templates with variable substitution
- **Multi-Channel Email Delivery**: Gmail API, SMTP fallback, and manual sending options
- **Real-time Analytics**: Sentiment analysis and interview insights
- **User-Based Data Isolation**: Secure multi-tenant architecture
- **Responsive Design**: Modern UI built with Next.js and Tailwind CSS

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Cookie-based session management
- **Email Services**: Gmail API, Nodemailer (SMTP)
- **UI Components**: Radix UI, Tailwind CSS, Lucide Icons
- **AI Integration**: Lyzr Agent SDK

## 📋 Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- MongoDB database (local or cloud)
- Google Cloud Console account (for Gmail OAuth)
- Lyzr API credentials

## ⚡ Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd exit-interview-app
npm install
```

### 2. Environment Configuration

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

### 3. Gmail OAuth Setup

#### Google Cloud Console Configuration

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the Gmail API

2. **Create OAuth 2.0 Credentials**
   - Navigate to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - Choose **Web application**

3. **Configure OAuth Consent Screen**
   - Add application name and authorized domains
   - Add scopes: 
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/userinfo.email`

4. **Set Authorized Redirect URIs**
   - Development: `http://localhost:3000/api/auth/gmail/callback`
   - Production: `https://yourdomain.com/api/auth/gmail/callback`

5. **Get Credentials**
   - Copy Client ID and Client Secret to your `.env.local`

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

## 📧 Email Configuration

The application supports multiple email delivery methods with automatic fallback:

### Priority Order
1. **Gmail API** (Preferred) - Uses connected Gmail account
2. **SMTP Fallback** - Uses configured SMTP settings
3. **Manual Sending** - Returns interview URL for manual distribution

### Gmail Connection Flow
1. Navigate to Settings → Gmail Connection
2. Click "Connect Gmail" button
3. Complete Google OAuth consent
4. Gmail account is now connected for sending

### SMTP Configuration (Optional)
Configure SMTP settings in the application settings as a fallback option:

```
Host: smtp.gmail.com
Port: 587
Security: STARTTLS
Username: your-email@gmail.com
Password: your-app-password
```

## 🏗️ Project Structure

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

## 🔧 API Endpoints

### Gmail OAuth
- `POST /api/auth/gmail/connect` - Initiate Gmail connection
- `GET /api/auth/gmail/callback` - OAuth callback handler
- `GET /api/auth/gmail/status` - Check connection status
- `DELETE /api/auth/gmail/status` - Disconnect Gmail
- `POST /api/auth/gmail/test` - Send test email

### Email Management
- `GET /api/email-template` - Get email template
- `POST /api/email-template` - Save email template
- `DELETE /api/email-template` - Reset to default template

### Interview Management
- `GET /api/sessions` - List interview sessions
- `POST /api/sessions` - Create new session
- `POST /api/send-invitation` - Send interview invitation

### Analytics
- `GET /api/analytics` - Get interview analytics
- `GET /api/sentiment` - Get sentiment analysis

## 🎨 Email Templates

### Template Variables
Use these variables in your email templates:

- `{{name}}` - Employee name
- `{{role}}` - Employee role
- `{{level}}` - Interview level (junior, mid-level, senior)
- `{{tenure}}` - Employment tenure in months
- `{{interviewUrl}}` - Interview participation link

### HTML Template Example
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

## 🔒 Security Features

- **OAuth 2.0 Authentication**: Secure Gmail integration without password storage
- **User-Based Data Isolation**: Multi-tenant architecture with user-specific data
- **Token Management**: Automatic refresh and secure storage of OAuth tokens
- **Input Validation**: Comprehensive validation using Zod schemas
- **CORS Protection**: Configured for secure cross-origin requests

## 📊 Analytics & Insights

The application provides comprehensive analytics including:

- **Interview Completion Rates**: Track participation metrics
- **Sentiment Analysis**: AI-powered sentiment scoring of responses
- **Response Patterns**: Identify common themes and feedback
- **Department Insights**: Analytics segmented by role and level
- **Trend Analysis**: Historical data and patterns

## 🚀 Deployment

### Environment Variables for Production

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

### Build and Deploy

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Vercel Deployment

The application is optimized for Vercel deployment:

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## 🔧 Troubleshooting

### Common Issues

**Gmail OAuth Not Working**
- Verify environment variables are set correctly
- Check Google Cloud Console OAuth configuration
- Ensure redirect URIs match exactly

**Email Sending Failures**
- Check Gmail API quotas in Google Cloud Console
- Verify user has granted necessary permissions
- Test with SMTP fallback configuration

**Database Connection Issues**
- Verify MongoDB URI format and credentials
- Check network connectivity to MongoDB instance
- Ensure database user has proper permissions

**Build Errors**
- Clear `.next` folder and `node_modules`
- Run `npm install` to reinstall dependencies
- Check TypeScript errors with `npm run lint`

### Gmail API Quotas

- **Free Tier**: 1 billion quota units per day
- **Email Sending**: ~25 quota units per email
- **Monitor Usage**: Google Cloud Console → APIs & Services → Quotas

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

1. Check the troubleshooting section above
2. Review the [Gmail OAuth Setup Guide](./GMAIL_OAUTH_SETUP.md)
3. Open an issue on GitHub
4. Contact the development team

## 🔄 Version History

- **v0.1.0** - Initial release with core functionality
- Gmail OAuth integration
- Email template management
- Basic analytics dashboard
- User-based data isolation
