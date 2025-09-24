import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface Database {
  public: {
    Tables: {
      notification_queue: {
        Row: {
          id: number;
          user_id: string;
          poll_id?: number;
          notification_type: string;
          scheduled_for: string;
          status: string;
          template_data: Record<string, any>;
          created_at: string;
          updated_at: string;
          processed_at?: string;
        };
        Insert: {
          user_id: string;
          poll_id?: number;
          notification_type: string;
          scheduled_for: string;
          status?: string;
          template_data?: Record<string, any>;
        };
        Update: {
          status?: string;
          processed_at?: string;
        };
      };
      notification_preferences: {
        Row: {
          id: number;
          user_id: string;
          email_enabled: boolean;
          poll_closing_24h: boolean;
          poll_closing_1h: boolean;
          poll_closed_immediately: boolean;
          new_poll_notifications: boolean;
          voting_reminders: boolean;
          results_announcements: boolean;
          admin_notifications: boolean;
          notification_frequency: string;
          quiet_hours_start: string;
          quiet_hours_end: string;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
      };
      email_notifications: {
        Row: {
          id: number;
          user_id: string;
          poll_id?: number;
          notification_type: string;
          email_address: string;
          subject: string;
          template_name: string;
          template_data: Record<string, any>;
          status: string;
          sent_at?: string;
          failed_at?: string;
          retry_count: number;
          failure_reason?: string;
          email_provider_id?: string;
          opened_at?: string;
          clicked_at?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          poll_id?: number;
          notification_type: string;
          email_address: string;
          subject: string;
          template_name: string;
          template_data?: Record<string, any>;
          status?: string;
          sent_at?: string;
          failed_at?: string;
          retry_count?: number;
          failure_reason?: string;
          email_provider_id?: string;
        };
      };
    };
  };
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
const fromEmail = Deno.env.get('FROM_EMAIL') || 'notifications@alx-polly.com';
const fromName = Deno.env.get('FROM_NAME') || 'ALX-Polly Notifications';

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

/**
 * Check if current time is within user's quiet hours
 */
function isInQuietHours(
  preferences: Database['public']['Tables']['notification_preferences']['Row'],
  targetTime: Date = new Date()
): boolean {
  try {
    const userTime = new Date(targetTime.toLocaleString('en-US', {
      timeZone: preferences.timezone
    }));

    const currentHour = userTime.getHours();
    const currentMinute = userTime.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = preferences.quiet_hours_start.split(':').map(Number);
    const [endHour, endMinute] = preferences.quiet_hours_end.split(':').map(Number);

    const quietStartMinutes = startHour * 60 + startMinute;
    const quietEndMinutes = endHour * 60 + endMinute;

    // Handle overnight quiet hours (e.g., 22:00 - 08:00)
    if (quietStartMinutes > quietEndMinutes) {
      return currentTimeMinutes >= quietStartMinutes || currentTimeMinutes < quietEndMinutes;
    }

    // Handle same-day quiet hours (e.g., 12:00 - 14:00)
    return currentTimeMinutes >= quietStartMinutes && currentTimeMinutes < quietEndMinutes;
  } catch (error) {
    console.error('Error checking quiet hours:', error);
    return false;
  }
}

/**
 * Generate email HTML template
 */
function generateEmailHTML(
  notificationType: string,
  templateData: Record<string, any>
): { html: string; subject: string } {
  const baseUrl = Deno.env.get('NEXT_PUBLIC_BASE_URL') || 'http://localhost:3000';

  const enhancedData = {
    ...templateData,
    base_url: baseUrl,
    poll_url: templateData.poll_id ? `${baseUrl}/polls/${templateData.poll_id}` : undefined,
    unsubscribe_url: `${baseUrl}/notifications/unsubscribe`,
    company_name: 'ALX-Polly',
    support_email: 'support@alx-polly.com'
  };

  const subjects: Record<string, string> = {
    poll_closing_24h: `Poll closing in 24 hours: ${enhancedData.poll_question}`,
    poll_closing_1h: `Poll closing in 1 hour: ${enhancedData.poll_question}`,
    poll_closed: `Poll results: ${enhancedData.poll_question}`,
    new_poll: `New poll available: ${enhancedData.poll_question}`,
    voting_reminder: `Reminder: Vote on ${enhancedData.poll_question}`,
    results_announcement: `Poll results available: ${enhancedData.poll_question}`
  };

  const baseStyles = `
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 30px;
        text-align: center;
        border-radius: 8px 8px 0 0;
      }
      .content {
        background: white;
        padding: 30px;
        border: 1px solid #e1e5e9;
        border-top: none;
      }
      .footer {
        background: #f8f9fa;
        padding: 20px;
        text-align: center;
        font-size: 14px;
        color: #6c757d;
        border-radius: 0 0 8px 8px;
      }
      .button {
        display: inline-block;
        background: #667eea;
        color: white;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 6px;
        margin: 20px 0;
      }
      .poll-option {
        background: #f8f9fa;
        padding: 15px;
        margin: 10px 0;
        border-left: 4px solid #667eea;
        border-radius: 4px;
      }
    </style>
  `;

  let html = '';
  const subject = subjects[notificationType] || 'ALX-Polly Notification';

  switch (notificationType) {
    case 'poll_closing_24h':
      html = `
        ${baseStyles}
        <div class="header">
          <h1>🕐 Poll Closing Soon</h1>
          <p>Don't miss your chance to vote!</p>
        </div>
        <div class="content">
          <h2>Poll closing in 24 hours</h2>
          <p>Hi ${enhancedData.user_name || 'there'},</p>
          <p>This is a reminder that the following poll will be closing in 24 hours:</p>
          <div class="poll-option">
            <h3>${enhancedData.poll_question}</h3>
          </div>
          <p>
            <a href="${enhancedData.poll_url}" class="button">Vote Now</a>
          </p>
        </div>
        <div class="footer">
          <p><a href="${enhancedData.unsubscribe_url}">Unsubscribe</a> from notifications</p>
        </div>
      `;
      break;

    case 'poll_closing_1h':
      html = `
        ${baseStyles}
        <div class="header">
          <h1>⚡ Final Hour!</h1>
          <p>Poll closing very soon</p>
        </div>
        <div class="content">
          <h2>Poll closing in 1 hour</h2>
          <p>Hi ${enhancedData.user_name || 'there'},</p>
          <p><strong>Final reminder:</strong> This poll will close in just 1 hour!</p>
          <div class="poll-option">
            <h3>${enhancedData.poll_question}</h3>
          </div>
          <p>
            <a href="${enhancedData.poll_url}" class="button">Vote Now!</a>
          </p>
        </div>
        <div class="footer">
          <p><a href="${enhancedData.unsubscribe_url}">Unsubscribe</a> from notifications</p>
        </div>
      `;
      break;

    case 'new_poll':
      html = `
        ${baseStyles}
        <div class="header">
          <h1>🗳️ New Poll Available</h1>
          <p>Your input is needed</p>
        </div>
        <div class="content">
          <h2>New Poll Created</h2>
          <p>Hi ${enhancedData.user_name || 'there'},</p>
          <p>${enhancedData.creator_name} has created a new poll:</p>
          <div class="poll-option">
            <h3>${enhancedData.poll_question}</h3>
          </div>
          <p>
            <a href="${enhancedData.poll_url}" class="button">Vote Now</a>
          </p>
        </div>
        <div class="footer">
          <p><a href="${enhancedData.unsubscribe_url}">Unsubscribe</a> from notifications</p>
        </div>
      `;
      break;

    default:
      html = `
        ${baseStyles}
        <div class="header">
          <h1>ALX-Polly Notification</h1>
        </div>
        <div class="content">
          <h2>Notification</h2>
          <p>Hi ${enhancedData.user_name || 'there'},</p>
          <p>You have a new notification from ALX-Polly.</p>
          <p>
            <a href="${enhancedData.poll_url || enhancedData.base_url}" class="button">Visit ALX-Polly</a>
          </p>
        </div>
        <div class="footer">
          <p><a href="${enhancedData.unsubscribe_url}">Unsubscribe</a> from notifications</p>
        </div>
      `;
  }

  return { html, subject };
}

/**
 * Send email via Resend API
 */
async function sendEmail(
  to: string,
  subject: string,
  html: string,
  tags: string[] = []
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [to],
        subject,
        html,
        tags
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.message || `HTTP ${response.status}`
      };
    }

    return {
      success: true,
      messageId: result.id
    };
  } catch (error) {
    console.error('Send email error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Process scheduled notifications
 */
async function processScheduledNotifications() {
  const now = new Date().toISOString();
  const processedCount = { success: 0, failed: 0, skipped: 0 };

  try {
    // Get notifications that are ready to be sent
    const { data: queuedNotifications, error: queueError } = await supabase
      .from('notification_queue')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_for', now)
      .limit(50); // Process in batches

    if (queueError) {
      throw new Error(`Failed to fetch queued notifications: ${queueError.message}`);
    }

    if (!queuedNotifications || queuedNotifications.length === 0) {
      return { processedCount, message: 'No notifications to process' };
    }

    console.log(`Processing ${queuedNotifications.length} scheduled notifications`);

    for (const notification of queuedNotifications) {
      try {
        // Mark as processing
        await supabase
          .from('notification_queue')
          .update({ status: 'processing' })
          .eq('id', notification.id);

        // Get user's email and preferences
        const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(notification.user_id);
        if (userError || !user?.email) {
          throw new Error(`User not found or has no email: ${userError?.message}`);
        }

        // Get user preferences
        const { data: preferences } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', notification.user_id)
          .single();

        // Check if notifications are enabled
        if (preferences && !preferences.email_enabled) {
          await supabase
            .from('notification_queue')
            .update({ status: 'cancelled', processed_at: new Date().toISOString() })
            .eq('id', notification.id);

          processedCount.skipped++;
          continue;
        }

        // Check quiet hours
        if (preferences && isInQuietHours(preferences)) {
          // Reschedule for end of quiet hours
          const [endHour, endMinute] = preferences.quiet_hours_end.split(':').map(Number);
          const nextDelivery = new Date();
          nextDelivery.setHours(endHour, endMinute, 0, 0);

          // If end time is past, schedule for tomorrow
          if (nextDelivery <= new Date()) {
            nextDelivery.setDate(nextDelivery.getDate() + 1);
          }

          await supabase
            .from('notification_queue')
            .update({
              status: 'scheduled',
              scheduled_for: nextDelivery.toISOString()
            })
            .eq('id', notification.id);

          processedCount.skipped++;
          continue;
        }

        // Generate email content
        const templateData = {
          ...notification.template_data,
          user_name: user.user_metadata?.full_name || user.email,
          user_email: user.email
        };

        const { html, subject } = generateEmailHTML(notification.notification_type, templateData);

        // Send email
        const emailResult = await sendEmail(
          user.email,
          subject,
          html,
          [notification.notification_type]
        );

        if (emailResult.success) {
          // Log successful notification
          await supabase
            .from('email_notifications')
            .insert({
              user_id: notification.user_id,
              poll_id: notification.poll_id,
              notification_type: notification.notification_type,
              email_address: user.email,
              subject,
              template_name: notification.notification_type,
              template_data: templateData,
              status: 'sent',
              sent_at: new Date().toISOString(),
              email_provider_id: emailResult.messageId,
              retry_count: 0
            });

          // Mark queue item as sent
          await supabase
            .from('notification_queue')
            .update({ status: 'sent', processed_at: new Date().toISOString() })
            .eq('id', notification.id);

          processedCount.success++;
        } else {
          // Log failed notification
          await supabase
            .from('email_notifications')
            .insert({
              user_id: notification.user_id,
              poll_id: notification.poll_id,
              notification_type: notification.notification_type,
              email_address: user.email,
              subject,
              template_name: notification.notification_type,
              template_data: templateData,
              status: 'failed',
              failed_at: new Date().toISOString(),
              failure_reason: emailResult.error,
              retry_count: 0
            });

          // Mark queue item as failed
          await supabase
            .from('notification_queue')
            .update({ status: 'failed', processed_at: new Date().toISOString() })
            .eq('id', notification.id);

          processedCount.failed++;
        }

      } catch (error) {
        console.error(`Error processing notification ${notification.id}:`, error);

        // Mark as failed
        await supabase
          .from('notification_queue')
          .update({ status: 'failed', processed_at: new Date().toISOString() })
          .eq('id', notification.id);

        processedCount.failed++;
      }
    }

    return {
      processedCount,
      message: `Processed ${processedCount.success + processedCount.failed + processedCount.skipped} notifications`
    };

  } catch (error) {
    console.error('Error in processScheduledNotifications:', error);
    throw error;
  }
}

/**
 * Main Edge Function handler
 */
Deno.serve(async (req: Request) => {
  try {
    // Only allow POST requests for manual triggers, or cron jobs
    const url = new URL(req.url);
    const method = req.method;

    // Verify authorization for manual triggers
    if (method === 'POST') {
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ success: false, error: 'Authorization required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Verify service role key or user auth
      const token = authHeader.replace('Bearer ', '');
      if (token !== supabaseKey) {
        // Try to verify as user token
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid authorization' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Process notifications
    const result = await processScheduledNotifications();

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Edge Function error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
