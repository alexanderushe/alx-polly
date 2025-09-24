/**
 * Notification API Client Functions
 *
 * This module provides client-side functions for managing notifications,
 * user preferences, email sending, and notification analytics.
 */

import { supabase } from "./supabase";
import {
  NotificationPreferences,
  UpdateNotificationPreferences,
  EmailNotification,
  NotificationQueue,
  NotificationApiResponse,
  GetPreferencesResponse,
  UpdatePreferencesResponse,
  SendNotificationResponse,
  GetNotificationHistoryResponse,
  GetQueueResponse,
  QueueNotificationResponse,
  NotificationAnalytics,
  NotificationType,
  EmailTemplateData,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from "./types/notifications";

/**
 * Base API configuration
 */
const API_BASE_URL = "/api/notifications";

/**
 * Generic API call handler with error handling
 */
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<NotificationApiResponse<T>> {
  try {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error:
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API call failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error occurred",
    };
  }
}

/**
 * Get current user's notification preferences
 */
export async function getNotificationPreferences(): Promise<GetPreferencesResponse> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  // First try to get existing preferences
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned
    return {
      success: false,
      error: error.message,
    };
  }

  // If no preferences exist, create default ones
  if (!data) {
    const defaultPrefs = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      user_id: user.id,
    };

    const { data: newPrefs, error: insertError } = await supabase
      .from("notification_preferences")
      .insert(defaultPrefs)
      .select()
      .single();

    if (insertError) {
      return {
        success: false,
        error: insertError.message,
      };
    }

    return {
      success: true,
      data: newPrefs,
    };
  }

  return {
    success: true,
    data,
  };
}

/**
 * Update user's notification preferences
 */
export async function updateNotificationPreferences(
  preferences: UpdateNotificationPreferences,
): Promise<UpdatePreferencesResponse> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  const { data, error } = await supabase
    .from("notification_preferences")
    .update(preferences)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    data,
  };
}

/**
 * Get user's notification history
 */
export async function getNotificationHistory(
  limit: number = 50,
  offset: number = 0,
): Promise<GetNotificationHistoryResponse> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  const { data, error } = await supabase
    .from("email_notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    data: data || [],
  };
}

/**
 * Get user's scheduled notifications queue
 */
export async function getNotificationQueue(): Promise<GetQueueResponse> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  const { data, error } = await supabase
    .from("notification_queue")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "scheduled")
    .order("scheduled_for", { ascending: true });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    data: data || [],
  };
}

/**
 * Cancel a scheduled notification
 */
export async function cancelScheduledNotification(
  queueId: number,
): Promise<NotificationApiResponse<boolean>> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  const { error } = await supabase
    .from("notification_queue")
    .update({ status: "cancelled" })
    .eq("id", queueId)
    .eq("user_id", user.id);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    data: true,
  };
}

/**
 * Queue a new notification
 */
export async function queueNotification(
  pollId: number,
  notificationType: NotificationType,
  scheduledFor: Date,
  templateData: EmailTemplateData = {},
): Promise<QueueNotificationResponse> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  const queueData = {
    user_id: user.id,
    poll_id: pollId,
    notification_type: notificationType,
    scheduled_for: scheduledFor.toISOString(),
    template_data: templateData,
  };

  const { data, error } = await supabase
    .from("notification_queue")
    .insert(queueData)
    .select()
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    data,
  };
}

/**
 * Send immediate notification (calls API endpoint)
 */
export async function sendNotification(
  userId: string,
  notificationType: NotificationType,
  templateData: EmailTemplateData,
  pollId?: number,
): Promise<SendNotificationResponse> {
  return apiCall<EmailNotification>("/send", {
    method: "POST",
    body: JSON.stringify({
      userId,
      notificationType,
      templateData,
      pollId,
    }),
  });
}

/**
 * Test notification delivery (sends test email)
 */
export async function testNotification(
  notificationType: NotificationType,
  templateData: EmailTemplateData = {},
): Promise<SendNotificationResponse> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  return apiCall<EmailNotification>("/test", {
    method: "POST",
    body: JSON.stringify({
      notificationType,
      templateData: {
        ...templateData,
        user_email: user.email,
        user_name: user.user_metadata?.full_name || user.email,
      },
    }),
  });
}

/**
 * Get notification analytics for poll creators
 */
export async function getNotificationAnalytics(
  pollId?: number,
  startDate?: Date,
  endDate?: Date,
): Promise<NotificationApiResponse<NotificationAnalytics>> {
  const params = new URLSearchParams();

  if (pollId) params.append("pollId", pollId.toString());
  if (startDate) params.append("startDate", startDate.toISOString());
  if (endDate) params.append("endDate", endDate.toISOString());

  return apiCall<NotificationAnalytics>(`/analytics?${params.toString()}`);
}

/**
 * Utility function to check if user is in quiet hours
 */
export function isInQuietHours(
  preferences: NotificationPreferences,
  targetTime: Date = new Date(),
): boolean {
  const userTime = new Date(
    targetTime.toLocaleString("en-US", {
      timeZone: preferences.timezone,
    }),
  );

  const currentHour = userTime.getHours();
  const currentMinute = userTime.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinute;

  const [startHour, startMinute] = preferences.quiet_hours_start
    .split(":")
    .map(Number);
  const [endHour, endMinute] = preferences.quiet_hours_end
    .split(":")
    .map(Number);

  const quietStartMinutes = startHour * 60 + startMinute;
  const quietEndMinutes = endHour * 60 + endMinute;

  // Handle overnight quiet hours (e.g., 22:00 - 08:00)
  if (quietStartMinutes > quietEndMinutes) {
    return (
      currentTimeMinutes >= quietStartMinutes ||
      currentTimeMinutes < quietEndMinutes
    );
  }

  // Handle same-day quiet hours (e.g., 12:00 - 14:00)
  return (
    currentTimeMinutes >= quietStartMinutes &&
    currentTimeMinutes < quietEndMinutes
  );
}

/**
 * Utility function to calculate next delivery time respecting quiet hours
 */
export function getNextDeliveryTime(
  preferences: NotificationPreferences,
  targetTime: Date = new Date(),
): Date {
  if (!isInQuietHours(preferences, targetTime)) {
    return targetTime;
  }

  const userTime = new Date(
    targetTime.toLocaleString("en-US", {
      timeZone: preferences.timezone,
    }),
  );

  const [endHour, endMinute] = preferences.quiet_hours_end
    .split(":")
    .map(Number);

  // Set delivery time to end of quiet hours
  const deliveryTime = new Date(userTime);
  deliveryTime.setHours(endHour, endMinute, 0, 0);

  // If quiet hours end is tomorrow (overnight quiet hours)
  const [startHour] = preferences.quiet_hours_start.split(":").map(Number);
  if (endHour < startHour && userTime.getHours() >= startHour) {
    deliveryTime.setDate(deliveryTime.getDate() + 1);
  }

  return deliveryTime;
}

/**
 * Utility function to format notification type for display
 */
export function formatNotificationType(type: NotificationType): string {
  const typeMap: Record<NotificationType, string> = {
    poll_closing_24h: "24h Closing Warning",
    poll_closing_1h: "1h Closing Warning",
    poll_closed: "Poll Closed",
    new_poll: "New Poll Available",
    voting_reminder: "Voting Reminder",
    results_announcement: "Results Available",
  };

  return (
    typeMap[type] ||
    type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  );
}

/**
 * Utility function to validate email template data
 */
export function validateTemplateData(
  notificationType: NotificationType,
  data: EmailTemplateData,
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Common required fields
  if (!data.user_email) {
    errors.push("User email is required");
  }

  // Type-specific validation
  switch (notificationType) {
    case "poll_closing_24h":
    case "poll_closing_1h":
    case "poll_closed":
    case "results_announcement":
      if (!data.poll_id) {
        errors.push("Poll ID is required for poll-related notifications");
      }
      if (!data.poll_question) {
        errors.push("Poll question is required for poll-related notifications");
      }
      break;

    case "new_poll":
      if (!data.poll_id || !data.poll_question) {
        errors.push(
          "Poll ID and question are required for new poll notifications",
        );
      }
      if (!data.creator_name) {
        errors.push("Creator name is required for new poll notifications");
      }
      break;

    case "voting_reminder":
      if (!data.poll_id || !data.poll_question) {
        errors.push("Poll ID and question are required for voting reminders");
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Bulk notification operations
 */
export async function sendBulkNotifications(
  notifications: Array<{
    userId: string;
    notificationType: NotificationType;
    templateData: EmailTemplateData;
    pollId?: number;
  }>,
): Promise<NotificationApiResponse<EmailNotification[]>> {
  return apiCall<EmailNotification[]>("/bulk", {
    method: "POST",
    body: JSON.stringify({ notifications }),
  });
}

/**
 * Subscribe/unsubscribe from notifications
 */
export async function toggleNotificationSubscription(
  subscribe: boolean,
): Promise<NotificationApiResponse<boolean>> {
  return updateNotificationPreferences({
    email_enabled: subscribe,
  }).then((result) => ({
    success: result.success,
    data: subscribe,
    error: result.error,
  }));
}

/**
 * Get notification settings info (no auth required)
 */
export async function getNotificationInfo(): Promise<
  NotificationApiResponse<{
    supportedTypes: NotificationType[];
    defaultPreferences: typeof DEFAULT_NOTIFICATION_PREFERENCES;
  }>
> {
  return {
    success: true,
    data: {
      supportedTypes: [
        "poll_closing_24h",
        "poll_closing_1h",
        "poll_closed",
        "new_poll",
        "voting_reminder",
        "results_announcement",
      ],
      defaultPreferences: DEFAULT_NOTIFICATION_PREFERENCES,
    },
  };
}
