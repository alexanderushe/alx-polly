# 📧 ALX-Polly Notification System

## Overview

The ALX-Polly Notification System is a comprehensive email notification infrastructure that provides real-time and scheduled notifications for poll-related events. It includes user preference management, template customization, delivery tracking, and analytics.

## 🏗️ Architecture

### Components

1. **Database Layer**
   - `notification_preferences`: User email preferences and settings
   - `email_notifications`: Delivery tracking and history
   - `notification_queue`: Scheduled notification management

2. **API Layer**
   - `/api/notifications/preferences`: User preference management
   - `/api/notifications/send`: Immediate notification sending
   - `/api/notifications/test`: Test email functionality

3. **Service Layer**
   - `EmailService`: Email template rendering and delivery
   - `NotificationApi`: Client-side API functions

4. **Processing Layer**
   - Supabase Edge Function: Scheduled notification processing
   - Database triggers: Automatic notification queueing

5. **UI Layer**
   - `NotificationPreferences`: User preference management UI
   - `/notifications`: Notification management dashboard

## 🗄️ Database Schema

### notification_preferences

Stores user email notification preferences and settings.

```sql
CREATE TABLE notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  poll_closing_24h BOOLEAN DEFAULT true,
  poll_closing_1h BOOLEAN DEFAULT true,
  poll_closed_immediately BOOLEAN DEFAULT true,
  new_poll_notifications BOOLEAN DEFAULT false,
  voting_reminders BOOLEAN DEFAULT true,
  results_announcements BOOLEAN DEFAULT true,
  admin_notifications BOOLEAN DEFAULT false,
  notification_frequency TEXT DEFAULT 'immediate' CHECK (notification_frequency IN ('immediate', 'daily', 'weekly')),
  quiet_hours_start TIME DEFAULT '22:00:00',
  quiet_hours_end TIME DEFAULT '08:00:00',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### email_notifications

Tracks all email notifications sent, including delivery status and analytics.

```sql
CREATE TABLE email_notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  poll_id INTEGER REFERENCES polls(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'poll_closing_24h',
    'poll_closing_1h',
    'poll_closed',
    'new_poll',
    'voting_reminder',
    'results_announcement'
  )),
  email_address TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_name TEXT NOT NULL,
  template_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'retry')),
  sent_at TIMESTAMPTZ NULL,
  failed_at TIMESTAMPTZ NULL,
  retry_count INTEGER DEFAULT 0,
  failure_reason TEXT NULL,
  email_provider_id TEXT NULL,
  opened_at TIMESTAMPTZ NULL,
  clicked_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### notification_queue

Manages scheduled notifications for future delivery.

```sql
CREATE TABLE notification_queue (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  poll_id INTEGER REFERENCES polls(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'poll_closing_24h',
    'poll_closing_1h',
    'poll_closed',
    'new_poll',
    'voting_reminder',
    'results_announcement'
  )),
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'processing', 'sent', 'failed', 'cancelled')),
  template_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ NULL
);
```

## 🔧 API Endpoints

### Notification Preferences

#### GET `/api/notifications/preferences`
Get user's current notification preferences.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": "uuid",
    "email_enabled": true,
    "poll_closing_24h": true,
    "poll_closing_1h": true,
    "poll_closed_immediately": true,
    "new_poll_notifications": false,
    "voting_reminders": true,
    "results_announcements": true,
    "admin_notifications": false,
    "notification_frequency": "immediate",
    "quiet_hours_start": "22:00:00",
    "quiet_hours_end": "08:00:00",
    "timezone": "UTC",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### PATCH `/api/notifications/preferences`
Update user's notification preferences.

**Request Body:**
```json
{
  "email_enabled": true,
  "poll_closing_24h": false,
  "notification_frequency": "daily",
  "timezone": "America/New_York"
}
```

### Send Notifications

#### POST `/api/notifications/send`
Send immediate notification to a user.

**Request Body:**
```json
{
  "userId": "uuid",
  "notificationType": "poll_closing_1h",
  "templateData": {
    "user_name": "John Doe",
    "poll_question": "What's your favorite color?",
    "poll_id": 123,
    "closing_time": "2024-01-01T15:00:00Z"
  },
  "pollId": 123
}
```

#### POST `/api/notifications/test`
Send test notification to authenticated user.

**Request Body:**
```json
{
  "notificationType": "new_poll",
  "templateData": {
    "poll_question": "Test Poll Question"
  }
}
```

## 📧 Notification Types

### Poll Closing Notifications

#### `poll_closing_24h`
Sent 24 hours before a poll closes.

**Template Data:**
- `user_name`: Recipient's name
- `poll_question`: Poll title
- `poll_url`: Link to poll
- `closing_time`: When poll closes
- `has_voted`: Whether user has already voted

#### `poll_closing_1h`
Final warning sent 1 hour before poll closes.

**Template Data:** Same as 24h warning

#### `poll_closed`
Immediate notification when poll closes with results.

**Template Data:**
- `poll_results`: Array of results with votes and percentages
- `total_votes`: Total number of votes
- `winning_options`: Array of winning options

### Engagement Notifications

#### `new_poll`
Notification about new polls created.

**Template Data:**
- `creator_name`: Poll creator's name
- `poll_description`: Optional poll description
- `poll_options`: Array of voting options

#### `voting_reminder`
Reminder to vote on active polls.

**Template Data:**
- `days_since_created`: How long poll has been active
- `has_voted`: Whether user has voted

#### `results_announcement`
Announcement of poll results.

**Template Data:**
- Similar to `poll_closed` but for broader announcements

## 🎨 Email Templates

### Template Structure

All email templates include:
- Responsive HTML design
- Consistent branding
- Call-to-action buttons
- Unsubscribe links
- Mobile-friendly layout

### Template Variables

Common variables available in all templates:
- `{{user_name}}`: Recipient's name
- `{{poll_question}}`: Poll title
- `{{poll_url}}`: Direct link to poll
- `{{unsubscribe_url}}`: Unsubscribe link
- `{{base_url}}`: Application base URL

## 🔄 Notification Processing

### Automatic Queueing

When polls are created with end times, the system automatically queues:
1. 24-hour closing warning
2. 1-hour closing warning  
3. Poll closed notification

### Scheduled Processing

The Supabase Edge Function `process-notifications` runs:
- Every 5 minutes via cron job
- On-demand via API call
- Processes up to 50 notifications per run

### Quiet Hours Handling

Notifications scheduled during user's quiet hours are:
- Automatically rescheduled to end of quiet hours
- Respects user's timezone settings
- Handles overnight quiet hours (e.g., 22:00 - 08:00)

## 🛠️ Setup Instructions

### 1. Environment Variables

Create `.env.local` with required variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=notifications@yourdomain.com
FROM_NAME="Your App Notifications"

# Application
NEXT_PUBLIC_BASE_URL=https://yourapp.com
```

### 2. Database Migration

Apply the migration files:

```bash
supabase db reset
```

Or apply individually:
```bash
supabase db push
```

### 3. Email Service Setup

#### Using Resend (Recommended)
1. Sign up at [Resend.com](https://resend.com)
2. Get API key from dashboard
3. Add domain verification if using custom domain
4. Update environment variables

#### Alternative: Custom SMTP
Modify `lib/emailService.ts` to use your preferred email service.

### 4. Deploy Edge Function

```bash
supabase functions deploy process-notifications
```

### 5. Configure Cron Jobs

In Supabase dashboard, add cron job:

```sql
SELECT cron.schedule('process-notifications', '*/5 * * * *', 'https://your-project.supabase.co/functions/v1/process-notifications');
```

## 🧪 Testing

### Manual Testing

1. Visit `/notifications` page
2. Configure your preferences
3. Use "Test" tab to send test emails
4. Check email delivery and formatting

### API Testing

```bash
# Test notification sending
curl -X POST http://localhost:3000/api/notifications/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"notificationType": "new_poll"}'
```

### Edge Function Testing

```bash
# Test processing function
curl -X POST https://your-project.supabase.co/functions/v1/process-notifications \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

## 📊 Analytics & Monitoring

### Available Metrics

Track via `email_notifications` table:
- Delivery success rate
- Open rates (when implemented)
- Click-through rates
- Failure reasons
- User engagement by notification type

### Query Examples

```sql
-- Delivery success rate by type
SELECT 
  notification_type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'sent') as sent,
  ROUND(COUNT(*) FILTER (WHERE status = 'sent') * 100.0 / COUNT(*), 2) as success_rate
FROM email_notifications 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY notification_type;

-- User engagement by preference
SELECT 
  np.notification_frequency,
  COUNT(en.*) as emails_sent,
  COUNT(en.*) FILTER (WHERE en.status = 'sent') as delivered
FROM notification_preferences np
LEFT JOIN email_notifications en ON np.user_id = en.user_id
WHERE en.created_at >= NOW() - INTERVAL '30 days'
GROUP BY np.notification_frequency;
```

## 🔧 Troubleshooting

### Common Issues

#### Notifications Not Sending

1. **Check Environment Variables**
   - Verify `RESEND_API_KEY` is correct
   - Ensure `FROM_EMAIL` is verified in Resend

2. **Check User Preferences**
   - Verify user has `email_enabled = true`
   - Check specific notification type preferences

3. **Check Quiet Hours**
   - Notifications may be delayed due to quiet hours
   - Check `notification_queue` table for rescheduled items

#### Edge Function Issues

1. **Check Function Logs**
   ```bash
   supabase functions logs process-notifications
   ```

2. **Verify Database Permissions**
   - Ensure service role key has proper permissions
   - Check RLS policies

#### Template Issues

1. **Missing Template Data**
   - Verify all required fields are provided
   - Check template variable substitution

2. **Email Formatting**
   - Test with different email clients
   - Verify HTML validity

### Debug Queries

```sql
-- Check notification queue status
SELECT status, COUNT(*) 
FROM notification_queue 
GROUP BY status;

-- Recent notification failures
SELECT * FROM email_notifications 
WHERE status = 'failed' 
ORDER BY created_at DESC 
LIMIT 10;

-- User preference distribution
SELECT 
  email_enabled,
  notification_frequency,
  COUNT(*) as users
FROM notification_preferences 
GROUP BY email_enabled, notification_frequency;
```

## 🚀 Production Deployment

### Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Email domain verified
- [ ] Edge function deployed
- [ ] Cron jobs configured
- [ ] SSL certificates valid
- [ ] Rate limiting configured
- [ ] Monitoring alerts set up

### Performance Considerations

1. **Email Rate Limits**
   - Resend: 100 emails/second by default
   - Implement batching for large user bases

2. **Database Performance**
   - Index on frequently queried columns
   - Archive old notification records

3. **Edge Function Scaling**
   - Monitor function execution time
   - Consider splitting processing into smaller batches

## 📝 Customization

### Adding New Notification Types

1. **Update Database Enum**
   ```sql
   ALTER TABLE email_notifications 
   DROP CONSTRAINT email_notifications_notification_type_check;
   
   ALTER TABLE email_notifications 
   ADD CONSTRAINT email_notifications_notification_type_check 
   CHECK (notification_type IN ('existing_types', 'new_type'));
   ```

2. **Update TypeScript Types**
   ```typescript
   // lib/types/notifications.ts
   export type NotificationType = 
     | 'existing_types' 
     | 'new_type';
   ```

3. **Add Email Template**
   ```typescript
   // lib/emailService.ts
   case 'new_type':
     html = `<!-- Your template HTML -->`;
     break;
   ```

4. **Update UI Components**
   Add new type to preference management interface.

### Custom Email Templates

Override default templates by modifying `generateHTML` function in:
- `lib/emailService.ts` (Next.js)
- `supabase/functions/process-notifications/index.ts` (Edge Function)

### Integration with Other Services

Extend `EmailService` class to support:
- SendGrid
- AWS SES
- Mailgun
- Custom SMTP servers

## 🤝 Contributing

### Development Setup

1. Fork and clone the repository
2. Copy `.env.example` to `.env.local`
3. Run `npm install`
4. Apply database migrations
5. Start development server: `npm run dev`

### Adding Features

1. Create feature branch
2. Add tests for new functionality
3. Update documentation
4. Submit pull request

### Code Standards

- TypeScript strict mode enabled
- ESLint and Prettier configured
- Comprehensive error handling
- JSDoc comments for public APIs
- Test coverage >80%

## 📄 License

This notification system is part of the ALX-Polly project and is licensed under the same terms.

## 🆘 Support

For technical support:
1. Check this documentation
2. Review troubleshooting section
3. Check GitHub issues
4. Contact development team

---

*Last updated: December 2024*