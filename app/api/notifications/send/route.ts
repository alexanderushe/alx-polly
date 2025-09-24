import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  NotificationType,
  EmailTemplateData,
  validateTemplateData
} from '../../../../lib/types/notifications';
import { sendNotificationEmail } from '../../../../lib/emailService';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/notifications/send
 * Send immediate notification email
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

    // Verify the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      userId,
      notificationType,
      templateData,
      pollId,
      subject,
      replyTo,
      tags
    }: {
      userId: string;
      notificationType: NotificationType;
      templateData: EmailTemplateData;
      pollId?: number;
      subject?: string;
      replyTo?: string;
      tags?: string[];
    } = body;

    // Validate required fields
    if (!userId || !notificationType || !templateData) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, notificationType, templateData' },
        { status: 400 }
      );
    }

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

    // Validate template data
    const validation = validateTemplateData(notificationType, templateData);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: `Invalid template data: ${validation.errors.join(', ')}` },
        { status: 400 }
      );
    }

    // Get target user's email and preferences
    const { data: targetUser, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !targetUser?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Target user not found or has no email' },
        { status: 404 }
      );
    }

    // Check user's notification preferences
    const { data: preferences, error: prefsError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If preferences don't exist, assume defaults (email enabled)
    const emailEnabled = preferences?.email_enabled ?? true;

    if (!emailEnabled) {
      return NextResponse.json(
        { success: false, error: 'User has disabled email notifications' },
        { status: 400 }
      );
    }

    // Check specific notification type preferences
    const typePreferences: Record<NotificationType, keyof typeof preferences> = {
      'poll_closing_24h': 'poll_closing_24h',
      'poll_closing_1h': 'poll_closing_1h',
      'poll_closed': 'poll_closed_immediately',
      'new_poll': 'new_poll_notifications',
      'voting_reminder': 'voting_reminders',
      'results_announcement': 'results_announcements'
    };

    const prefKey = typePreferences[notificationType];
    if (preferences && prefKey && !preferences[prefKey]) {
      return NextResponse.json(
        { success: false, error: `User has disabled ${notificationType} notifications` },
        { status: 400 }
      );
    }

    // Enhance template data with user information
    const enhancedTemplateData: EmailTemplateData = {
      ...templateData,
      user_email: targetUser.user.email,
      user_name: targetUser.user.user_metadata?.full_name || targetUser.user.email
    };

    // Send the email
    const emailResult = await sendNotificationEmail(
      targetUser.user.email,
      notificationType,
      enhancedTemplateData,
      {
        subject,
        replyTo,
        tags
      }
    );

    if (!emailResult.success) {
      // Log the notification attempt in the database
      await supabase
        .from('email_notifications')
        .insert({
          user_id: userId,
          poll_id: pollId,
          notification_type: notificationType,
          email_address: targetUser.user.email,
          subject: subject || `ALX-Polly: ${notificationType.replace(/_/g, ' ')}`,
          template_name: notificationType,
          template_data: enhancedTemplateData,
          status: 'failed',
          failed_at: new Date().toISOString(),
          failure_reason: emailResult.error,
          retry_count: 0
        });

      return NextResponse.json(
        { success: false, error: emailResult.error },
        { status: 500 }
      );
    }

    // Log successful notification in the database
    const { data: loggedNotification, error: logError } = await supabase
      .from('email_notifications')
      .insert({
        user_id: userId,
        poll_id: pollId,
        notification_type: notificationType,
        email_address: targetUser.user.email,
        subject: subject || `ALX-Polly: ${notificationType.replace(/_/g, ' ')}`,
        template_name: notificationType,
        template_data: enhancedTemplateData,
        status: 'sent',
        sent_at: new Date().toISOString(),
        email_provider_id: emailResult.messageId,
        retry_count: 0
      })
      .select()
      .single();

    if (logError) {
      console.error('Failed to log notification:', logError);
    }

    return NextResponse.json({
      success: true,
      data: loggedNotification,
      message: 'Notification sent successfully'
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
