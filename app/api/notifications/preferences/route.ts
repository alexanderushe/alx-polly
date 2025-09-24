import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  NotificationPreferences,
  UpdateNotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES
} from '../../../../lib/types/notifications';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/notifications/preferences
 * Get user's notification preferences
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

    // Verify the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get existing preferences
    const { data: preferences, error: fetchError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    // If no preferences exist, create default ones
    if (!preferences) {
      const defaultPrefs = {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        user_id: user.id,
      };

      const { data: newPrefs, error: insertError } = await supabase
        .from('notification_preferences')
        .insert(defaultPrefs)
        .select()
        .single();

      if (insertError) {
        return NextResponse.json(
          { success: false, error: insertError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: newPrefs,
      });
    }

    return NextResponse.json({
      success: true,
      data: preferences,
    });

  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications/preferences
 * Update user's notification preferences
 */
export async function PATCH(request: NextRequest) {
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
    const updates: UpdateNotificationPreferences = body;

    // Validate the updates
    const validFields = [
      'email_enabled',
      'poll_closing_24h',
      'poll_closing_1h',
      'poll_closed_immediately',
      'new_poll_notifications',
      'voting_reminders',
      'results_announcements',
      'admin_notifications',
      'notification_frequency',
      'quiet_hours_start',
      'quiet_hours_end',
      'timezone'
    ];

    const invalidFields = Object.keys(updates).filter(field => !validFields.includes(field));
    if (invalidFields.length > 0) {
      return NextResponse.json(
        { success: false, error: `Invalid fields: ${invalidFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate notification frequency
    if (updates.notification_frequency && !['immediate', 'daily', 'weekly'].includes(updates.notification_frequency)) {
      return NextResponse.json(
        { success: false, error: 'Invalid notification frequency' },
        { status: 400 }
      );
    }

    // Validate time format for quiet hours
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    if (updates.quiet_hours_start && !timeRegex.test(updates.quiet_hours_start)) {
      return NextResponse.json(
        { success: false, error: 'Invalid quiet_hours_start format (use HH:MM:SS)' },
        { status: 400 }
      );
    }

    if (updates.quiet_hours_end && !timeRegex.test(updates.quiet_hours_end)) {
      return NextResponse.json(
        { success: false, error: 'Invalid quiet_hours_end format (use HH:MM:SS)' },
        { status: 400 }
      );
    }

    // Update preferences
    const { data: updatedPreferences, error: updateError } = await supabase
      .from('notification_preferences')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      // If no existing preferences, create new ones with the updates
      if (updateError.code === 'PGRST116') {
        const defaultPrefs = {
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          ...updates,
          user_id: user.id,
        };

        const { data: newPrefs, error: insertError } = await supabase
          .from('notification_preferences')
          .insert(defaultPrefs)
          .select()
          .single();

        if (insertError) {
          return NextResponse.json(
            { success: false, error: insertError.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          data: newPrefs,
        });
      }

      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedPreferences,
    });

  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notifications/preferences
 * Replace user's notification preferences entirely
 */
export async function PUT(request: NextRequest) {
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
    const preferences = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...body,
      user_id: user.id,
    };

    // Validate required fields
    if (typeof preferences.email_enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'email_enabled must be a boolean' },
        { status: 400 }
      );
    }

    // Upsert preferences (insert or update)
    const { data: savedPreferences, error: saveError } = await supabase
      .from('notification_preferences')
      .upsert(preferences, { onConflict: 'user_id' })
      .select()
      .single();

    if (saveError) {
      return NextResponse.json(
        { success: false, error: saveError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: savedPreferences,
    });

  } catch (error) {
    console.error('Error replacing notification preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
