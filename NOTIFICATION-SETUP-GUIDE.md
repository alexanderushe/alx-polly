# 🚀 ALX-Polly Notification System Setup Guide

This guide will walk you through setting up the complete notification system for ALX-Polly, from initial configuration to production deployment.

## Prerequisites

Before you begin, ensure you have:

- [x] Node.js 18+ installed
- [x] Supabase account and project
- [x] Resend.com account (for email delivery)
- [x] ALX-Polly project cloned locally
- [x] Basic familiarity with Next.js and Supabase

## 📋 Quick Setup Checklist

- [ ] Configure environment variables
- [ ] Install dependencies
- [ ] Apply database migrations
- [ ] Set up email service
- [ ] Deploy Edge Functions
- [ ] Configure cron jobs
- [ ] Test the system

## Step 1: Environment Configuration

### 1.1 Create Environment File

Copy the example environment file:

```bash
cp .env.example .env.local
```

### 1.2 Configure Required Variables

Edit `.env.local` with your actual values:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Email Service (Resend)
RESEND_API_KEY=re_your_api_key_here
FROM_EMAIL=notifications@yourdomain.com
FROM_NAME="ALX-Polly Notifications"

# Application
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NODE_ENV=development
```

### 1.3 Get Your API Keys

**Supabase Keys:**
1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings > API
4. Copy the Project URL and anon/service_role keys

**Resend API Key:**
1. Sign up at [Resend.com](https://resend.com)
2. Go to API Keys in your dashboard
3. Create a new API key
4. Copy the key (starts with `re_`)

## Step 2: Install Dependencies

### 2.1 Install Required Packages

```bash
npm install resend react-email @react-email/components @radix-ui/react-switch @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-tabs class-variance-authority
```

### 2.2 Install Supabase CLI (if not already installed)

```bash
npm install -g supabase
```

### 2.3 Verify Installation

```bash
node scripts/setup-notifications.js
```

This script will validate your configuration and guide you through any missing setup.

## Step 3: Database Setup

### 3.1 Initialize Supabase (if not done already)

```bash
supabase init
supabase login
supabase link --project-ref your-project-ref
```

### 3.2 Apply Notification Migrations

```bash
supabase db push
```

Or apply specific migrations:

```bash
supabase migration up
```

### 3.3 Verify Database Schema

The following tables should now exist in your database:
- `notification_preferences`
- `email_notifications`
- `notification_queue`

### 3.4 Enable Required Extensions

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable pg_cron for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable http extension for webhook calls
CREATE EXTENSION IF NOT EXISTS http;
```

## Step 4: Email Service Setup

### 4.1 Verify Domain (Production Only)

If using a custom domain for emails:

1. Go to your Resend dashboard
2. Add your domain
3. Configure DNS records as instructed
4. Verify domain ownership

### 4.2 Test Email Service

```bash
curl -X POST http://localhost:3000/api/notifications/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -d '{"notificationType": "new_poll"}'
```

## Step 5: Deploy Edge Functions

### 5.1 Deploy the Processing Function

```bash
supabase functions deploy process-notifications
```

### 5.2 Set Function Environment Variables

In your Supabase dashboard:
1. Go to Edge Functions > process-notifications
2. Add these environment variables:
   - `SUPABASE_URL`: Your Supabase URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key
   - `RESEND_API_KEY`: Your Resend API key
   - `FROM_EMAIL`: Your notification email address
   - `FROM_NAME`: Your notification sender name

### 5.3 Test Edge Function

```bash
supabase functions invoke process-notifications --data '{}'
```

## Step 6: Configure Cron Jobs

### 6.1 Set Up Notification Processing

Run this SQL in your Supabase SQL Editor:

```sql
SELECT cron.schedule(
  'process-notifications',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/process-notifications',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}',
    body := '{}',
    timeout_milliseconds := 30000
  );
  $$
);
```

Replace:
- `your-project` with your actual Supabase project reference
- `YOUR_SERVICE_ROLE_KEY` with your actual service role key

### 6.2 Verify Cron Job

```sql
-- Check if the cron job was created
SELECT * FROM cron.job WHERE jobname = 'process-notifications';

-- View cron job runs
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-notifications')
ORDER BY start_time DESC 
LIMIT 10;
```

## Step 7: Testing & Verification

### 7.1 Run the Test Suite

```bash
npm test -- __tests__/notifications.test.ts
```

### 7.2 Manual UI Testing

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/notifications`

3. Test the following features:
   - [ ] View notification preferences
   - [ ] Update notification settings
   - [ ] Send test emails
   - [ ] View notification history

### 7.3 End-to-End Testing

1. Create a test poll with an end time
2. Verify notifications are queued automatically
3. Wait for cron job to process notifications
4. Check email delivery in your inbox

## Step 8: Production Deployment

### 8.1 Update Environment Variables

Set production values:

```bash
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
FROM_EMAIL=notifications@yourdomain.com
NODE_ENV=production
```

### 8.2 Deploy to Vercel (or your preferred platform)

```bash
# If using Vercel
vercel --prod

# Set environment variables in your deployment platform
```

### 8.3 Update Cron Job URLs

Update the cron job with your production URL:

```sql
SELECT cron.unschedule('process-notifications');

SELECT cron.schedule(
  'process-notifications',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://yourdomain.com/api/functions/process-notifications',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}',
    body := '{}',
    timeout_milliseconds := 30000
  );
  $$
);
```

## 🔧 Configuration Options

### Notification Frequency

Users can choose from:
- **Immediate**: Send emails right away
- **Daily**: Once per day digest
- **Weekly**: Weekly summary

### Notification Types

The system supports:
- Poll closing warnings (24h and 1h)
- Poll closed with results
- New poll notifications
- Voting reminders
- Results announcements

### Quiet Hours

Users can set quiet hours to avoid notifications during:
- Sleep hours (e.g., 10 PM - 8 AM)
- Work focus time
- Any custom time range

## 🚨 Troubleshooting

### Common Issues

**1. Emails not sending**
- Verify Resend API key is correct
- Check FROM_EMAIL is verified in Resend
- Ensure user has notifications enabled

**2. Cron jobs not running**
- Verify pg_cron extension is enabled
- Check cron job was created correctly
- Ensure service role key has proper permissions

**3. Edge function errors**
- Check function logs: `supabase functions logs process-notifications`
- Verify environment variables are set
- Ensure database connection is working

**4. Database errors**
- Confirm migrations were applied
- Check RLS policies are correct
- Verify user permissions

### Debug Commands

```bash
# Check Supabase connection
supabase status

# View function logs
supabase functions logs process-notifications

# Test database connection
supabase db diff

# Validate configuration
node scripts/setup-notifications.js
```

### Getting Help

1. Check the [troubleshooting section](NOTIFICATION-SYSTEM.md#troubleshooting) in the main documentation
2. Review the [API documentation](NOTIFICATION-SYSTEM.md#api-endpoints) for endpoint details
3. Look at the browser console for client-side errors
4. Check Supabase dashboard for database errors

## 📊 Monitoring & Maintenance

### Key Metrics to Monitor

- Email delivery success rate (target: >99%)
- Notification processing time (target: <5 minutes)
- User opt-out rate (target: <2%)
- Database query performance

### Regular Maintenance

**Weekly:**
- Review email delivery reports
- Check for failed notifications
- Monitor user feedback

**Monthly:**
- Clean up old notification records
- Update dependencies
- Review performance metrics

**Quarterly:**
- Security audit of API keys
- Performance optimization review
- Feature usage analysis

## 🎯 Next Steps

After successful setup, consider:

1. **Custom Templates**: Modify email templates for your brand
2. **Advanced Analytics**: Implement detailed tracking
3. **Push Notifications**: Add browser/mobile push support
4. **SMS Integration**: Add text message notifications
5. **A/B Testing**: Optimize email timing and content

## 🏁 Setup Complete!

Congratulations! Your notification system is now ready. Users can:

- ✅ Manage their notification preferences
- ✅ Receive timely email notifications
- ✅ Get reminders about poll activities
- ✅ View their notification history

The system will automatically:
- ✅ Process scheduled notifications every 5 minutes
- ✅ Respect user quiet hours and preferences
- ✅ Handle email delivery and retry failures
- ✅ Track delivery metrics and user engagement

For ongoing support and feature requests, refer to the main [NOTIFICATION-SYSTEM.md](NOTIFICATION-SYSTEM.md) documentation.

---

**Setup completed**: Ready for production use  
**Support**: Check documentation or create an issue  
**Updates**: Follow the project repository for updates