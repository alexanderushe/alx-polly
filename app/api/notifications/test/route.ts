import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  NotificationType,
  EmailTemplateData
} from '../../../../lib/types/notifications';
import { sendNotificationEmail } from '../../../../lib/emailService';

// Initialize Supabase clients
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// For verifying user tokens (anon/public key)
const supabaseAuth = createClient(
  supabaseUrl,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// For privileged DB operations (service role key)
const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/notifications/test
 * Send test notification email to authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    // Verify the user using anon client
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    if (!user.email) {
      return NextResponse.json(
        { success: false, error: 'User has no email address' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      notificationType = 'new_poll',
      templateData = {},
      subject
    }: {
      notificationType?: NotificationType;
      templateData?: EmailTemplateData;
      subject?: string;
    } = body;

    // Validate notification type
    const validTypes: NotificationType[] = [
      'poll_closing_24h',
      'poll_closing_1h',
      'poll_closed',
      'new_poll',
      'voting_reminder',
      'results_announcement'
    ];

    if (!validTypes.includes(notificationType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid notification type' },
        { status: 400 }
      );
    }

    // Create test template data
    const testTemplateData: EmailTemplateData = {
      user_email: user.email,
      user_name: user.user_metadata?.full_name || user.email,
      poll_id: 999,
      poll_question: 'Test Poll: What is your favorite testing framework?',
      poll_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/polls/999`,
      creator_name: 'Test Creator',
      poll_options: ['Jest', 'Vitest', 'Mocha', 'Cypress'],
      total_votes: 42,
      has_voted: false,
      ...templateData
    };

    // Add type-specific test data
    switch (notificationType) {
      case 'poll_closing_24h':
        testTemplateData.time_until_close = '24 hours';
        testTemplateData.closing_time = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        break;

      case 'poll_closing_1h':
        testTemplateData.time_until_close = '1 hour';
        testTemplateData.closing_time = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        break;

      case 'poll_closed':
      case 'results_announcement':
        testTemplateData.poll_results = [
          { option: 'Jest', votes: 18, percentage: 42.9 },
          { option: 'Vitest', votes: 12, percentage: 28.6 },
          { option: 'Cypress', votes: 8, percentage: 19.0 },
          { option: 'Mocha', votes: 4, percentage: 9.5 }
        ];
        testTemplateData.winning_options = ['Jest'];
        break;

      case 'voting_reminder':
        testTemplateData.days_since_created = 3;
        testTemplateData.has_voted = false;
        break;

      case 'new_poll':
        testTemplateData.poll_description = 'This is a test poll to demonstrate our notification system. Please vote on your preferred testing framework!';
        break;
    }

    // Send the test email
    const emailResult = await sendNotificationEmail(
      user.email,
      notificationType,
      testTemplateData,
      {
        subject: subject || `[TEST] ALX-Polly: ${notificationType.replace(/_/g, ' ')}`
      }
    );

    if (!emailResult.success) {
      return NextResponse.json(
        { success: false, error: emailResult.error },
        { status: 500 }
      );
    }

    // Log test notification using admin client
    const { data: loggedNotification, error: logError } = await supabaseAdmin
      .from('email_notifications')
      .insert({
        user_id: user.id,
        poll_id: 999,
        notification_type: notificationType,
        email_address: user.email,
        subject: subject || `[TEST] ALX-Polly: ${notificationType.replace(/_/g, ' ')}`,
        template_name: notificationType,
        template_data: testTemplateData,
        status: 'sent',
        sent_at: new Date().toISOString(),
        email_provider_id: emailResult.messageId,
        retry_count: 0
      })
      .select()
      .single();

    if (logError) {
      console.warn('Failed to log test notification:', logError);
    }

    return NextResponse.json({
      success: true,
      data: loggedNotification,
      message: `Test ${notificationType} notification sent to ${user.email}`,
      templateData: testTemplateData
    });

  } catch (error) {
    console.error('Error sending test notification:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notifications/test
 * Get available notification types for testing
 */
export async function GET(request: NextRequest) {
  try {
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    // Verify user with anon client
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const notificationTypes: Array<{
      type: NotificationType;
      name: string;
      description: string;
    }> = [
      { type: 'new_poll', name: 'New Poll', description: 'Notification about a new poll being created' },
      { type: 'poll_closing_24h', name: '24h Closing Warning', description: 'Warning sent 24 hours before poll closes' },
      { type: 'poll_closing_1h', name: '1h Closing Warning', description: 'Final warning sent 1 hour before poll closes' },
      { type: 'poll_closed', name: 'Poll Closed', description: 'Notification when poll closes with results' },
      { type: 'voting_reminder', name: 'Voting Reminder', description: 'Reminder to vote on active polls' },
      { type: 'results_announcement', name: 'Results Announcement', description: 'Announcement of poll results' }
    ];

    return NextResponse.json({
      success: true,
      data: {
        availableTypes: notificationTypes,
        userEmail: user.email,
        testEndpoint: '/api/notifications/test'
      }
    });

  } catch (error) {
    console.error('Error getting test notification info:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
