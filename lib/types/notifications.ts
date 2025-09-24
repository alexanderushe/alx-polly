/**
 * TypeScript type definitions for the notification system
 */

export type NotificationFrequency = "immediate" | "daily" | "weekly";

export type NotificationType =
  | "poll_closing_24h"
  | "poll_closing_1h"
  | "poll_closed"
  | "new_poll"
  | "voting_reminder"
  | "results_announcement";

export type NotificationStatus = "pending" | "sent" | "failed" | "retry";

export type QueueStatus =
  | "scheduled"
  | "processing"
  | "sent"
  | "failed"
  | "cancelled";

/**
 * User notification preferences stored in the database
 */
export interface NotificationPreferences {
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
  notification_frequency: NotificationFrequency;
  quiet_hours_start: string; // HH:MM:SS format
  quiet_hours_end: string; // HH:MM:SS format
  timezone: string;
  created_at: string;
  updated_at: string;
}

/**
 * Partial preferences for updates
 */
export interface UpdateNotificationPreferences {
  email_enabled?: boolean;
  poll_closing_24h?: boolean;
  poll_closing_1h?: boolean;
  poll_closed_immediately?: boolean;
  new_poll_notifications?: boolean;
  voting_reminders?: boolean;
  results_announcements?: boolean;
  admin_notifications?: boolean;
  notification_frequency?: NotificationFrequency;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  timezone?: string;
}

/**
 * Email notification record for tracking sent emails
 */
export interface EmailNotification {
  id: number;
  user_id: string;
  poll_id?: number;
  notification_type: NotificationType;
  email_address: string;
  subject: string;
  template_name: string;
  template_data: Record<string, any>;
  status: NotificationStatus;
  sent_at?: string;
  failed_at?: string;
  retry_count: number;
  failure_reason?: string;
  email_provider_id?: string;
  opened_at?: string;
  clicked_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Notification queue for scheduled notifications
 */
export interface NotificationQueue {
  id: number;
  user_id: string;
  poll_id?: number;
  notification_type: NotificationType;
  scheduled_for: string;
  status: QueueStatus;
  template_data: Record<string, any>;
  created_at: string;
  updated_at: string;
  processed_at?: string;
}

/**
 * Data structure for email templates
 */
export interface EmailTemplateData {
  // Common fields
  user_name?: string;
  user_email?: string;
  poll_id?: number;
  poll_question?: string;
  poll_url?: string;
  unsubscribe_url?: string;

  // Poll closing notifications
  time_until_close?: string;
  closing_time?: string;

  // Poll results
  poll_results?: {
    option: string;
    votes: number;
    percentage: number;
  }[];
  total_votes?: number;
  winning_options?: string[];

  // New poll notifications
  creator_name?: string;
  poll_description?: string;
  poll_options?: string[];

  // Voting reminders
  days_since_created?: number;
  has_voted?: boolean;
}

/**
 * Email template configuration
 */
export interface EmailTemplate {
  name: string;
  subject: string;
  component: string; // Component name for React Email
  description: string;
}

/**
 * API response types
 */
export interface NotificationApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Notification preferences API responses
 */
export type GetPreferencesResponse =
  NotificationApiResponse<NotificationPreferences>;
export type UpdatePreferencesResponse =
  NotificationApiResponse<NotificationPreferences>;

/**
 * Email notification API responses
 */
export type SendNotificationResponse =
  NotificationApiResponse<EmailNotification>;
export type GetNotificationHistoryResponse = NotificationApiResponse<
  EmailNotification[]
>;

/**
 * Queue management API responses
 */
export type GetQueueResponse = NotificationApiResponse<NotificationQueue[]>;
export type QueueNotificationResponse =
  NotificationApiResponse<NotificationQueue>;

/**
 * Email service provider configuration
 */
export interface EmailServiceConfig {
  provider: "resend" | "sendgrid" | "ses";
  apiKey: string;
  fromEmail: string;
  fromName: string;
  baseUrl?: string;
}

/**
 * Email sending options
 */
export interface SendEmailOptions {
  to: string;
  subject: string;
  template: string;
  data: EmailTemplateData;
  replyTo?: string;
  tags?: string[];
}

/**
 * Notification settings for different user roles
 */
export interface NotificationSettings {
  poll_creator: {
    enabled_by_default: NotificationType[];
    required: NotificationType[];
  };
  poll_participant: {
    enabled_by_default: NotificationType[];
    optional: NotificationType[];
  };
  admin: {
    enabled_by_default: NotificationType[];
    special_permissions: string[];
  };
}

/**
 * Notification analytics data
 */
export interface NotificationAnalytics {
  total_sent: number;
  total_failed: number;
  open_rate: number;
  click_rate: number;
  unsubscribe_rate: number;
  by_type: Record<
    NotificationType,
    {
      sent: number;
      opened: number;
      clicked: number;
      failed: number;
    }
  >;
  by_day: Record<
    string,
    {
      sent: number;
      opened: number;
      clicked: number;
    }
  >;
}

/**
 * Default notification preferences
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: Omit<
  NotificationPreferences,
  "id" | "user_id" | "created_at" | "updated_at"
> = {
  email_enabled: true,
  poll_closing_24h: true,
  poll_closing_1h: true,
  poll_closed_immediately: true,
  new_poll_notifications: false,
  voting_reminders: true,
  results_announcements: true,
  admin_notifications: false,
  notification_frequency: "immediate",
  quiet_hours_start: "22:00:00",
  quiet_hours_end: "08:00:00",
  timezone: "UTC",
};

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
 * Utility function to check if user is in quiet hours
 */
export function isInQuietHours(
  preferences: NotificationPreferences,
  targetTime: Date = new Date(),
): boolean {
  try {
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
  } catch (error) {
    console.error("Error checking quiet hours:", error);
    return false;
  }
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
 * Available email templates
 */
export const EMAIL_TEMPLATES: Record<NotificationType, EmailTemplate> = {
  poll_closing_24h: {
    name: "poll_closing_24h",
    subject: "Poll closing in 24 hours: {{poll_question}}",
    component: "PollClosing24hEmail",
    description: "24-hour warning before poll closes",
  },
  poll_closing_1h: {
    name: "poll_closing_1h",
    subject: "Poll closing in 1 hour: {{poll_question}}",
    component: "PollClosing1hEmail",
    description: "1-hour warning before poll closes",
  },
  poll_closed: {
    name: "poll_closed",
    subject: "Poll results: {{poll_question}}",
    component: "PollClosedEmail",
    description: "Poll has closed with results",
  },
  new_poll: {
    name: "new_poll",
    subject: "New poll available: {{poll_question}}",
    component: "NewPollEmail",
    description: "Notification about a new poll",
  },
  voting_reminder: {
    name: "voting_reminder",
    subject: "Reminder: Vote on {{poll_question}}",
    component: "VotingReminderEmail",
    description: "Reminder to vote on an active poll",
  },
  results_announcement: {
    name: "results_announcement",
    subject: "Poll results available: {{poll_question}}",
    component: "ResultsAnnouncementEmail",
    description: "Announcement of poll results",
  },
};
