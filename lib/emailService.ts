/**
 * Email Service Module
 *
 * This module provides email sending functionality using Resend API
 * with support for different email templates and delivery tracking.
 */

import { Resend } from "resend";
import {
  EmailTemplateData,
  NotificationType,
  SendEmailOptions,
  EmailServiceConfig,
  EMAIL_TEMPLATES,
} from "./types/notifications";

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Email service configuration
 */
export const EMAIL_CONFIG: EmailServiceConfig = {
  provider: "resend",
  apiKey: process.env.RESEND_API_KEY!,
  fromEmail: process.env.FROM_EMAIL || "notifications@alx-polly.com",
  fromName: process.env.FROM_NAME || "ALX-Polly Notifications",
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
};

/**
 * Email template renderer
 */
export class EmailTemplateRenderer {
  private baseUrl: string;
  private fromEmail: string;
  private fromName: string;

  constructor(config: EmailServiceConfig) {
    this.baseUrl = config.baseUrl || "http://localhost:3000";
    this.fromEmail = config.fromEmail;
    this.fromName = config.fromName;
  }

  /**
   * Render email template to HTML
   */
  async renderTemplate(
    notificationType: NotificationType,
    data: EmailTemplateData,
  ): Promise<{ html: string; subject: string }> {
    const template = EMAIL_TEMPLATES[notificationType];

    // Enhanced template data with common fields
    const enhancedData = {
      ...data,
      base_url: this.baseUrl,
      poll_url: data.poll_id
        ? `${this.baseUrl}/polls/${data.poll_id}`
        : undefined,
      unsubscribe_url: `${this.baseUrl}/notifications/unsubscribe`,
      company_name: "ALX-Polly",
      support_email: "support@alx-polly.com",
    };

    // Replace template variables in subject
    let subject = template.subject;
    Object.entries(enhancedData).forEach(([key, value]) => {
      if (typeof value === "string") {
        subject = subject.replace(new RegExp(`{{${key}}}`, "g"), value);
      }
    });

    // Generate HTML based on notification type
    const html = await this.generateHTML(notificationType, enhancedData);

    return { html, subject };
  }

  /**
   * Generate HTML content for different notification types
   */
  private async generateHTML(
    notificationType: NotificationType,
    data: EmailTemplateData,
  ): Promise<string> {
    const baseStyles = `
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
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
          padding: 10px 15px;
          margin: 5px 0;
          border-left: 4px solid #667eea;
          border-radius: 4px;
        }
        .result-bar {
          background: #e9ecef;
          height: 20px;
          border-radius: 10px;
          overflow: hidden;
          margin: 5px 0;
        }
        .result-fill {
          background: #667eea;
          height: 100%;
          transition: width 0.3s ease;
        }
        .winner {
          background: #d4edda;
          border-left-color: #28a745;
        }
      </style>
    `;

    switch (notificationType) {
      case "poll_closing_24h":
        return `
          ${baseStyles}
          <div class="header">
            <h1>🕐 Poll Closing Soon</h1>
            <p>Don't miss your chance to vote!</p>
          </div>
          <div class="content">
            <h2>Poll closing in 24 hours</h2>
            <p>Hi ${data.user_name || "there"},</p>
            <p>This is a reminder that the following poll will be closing in 24 hours:</p>

            <div class="poll-option">
              <h3>${data.poll_question}</h3>
              ${data.closing_time ? `<p><strong>Closes:</strong> ${new Date(data.closing_time).toLocaleString()}</p>` : ""}
            </div>

            ${
              data.has_voted
                ? "<p>✅ Thank you for voting! You can still view the poll and see how others are voting.</p>"
                : "<p>⏰ You haven't voted yet. Make sure to cast your vote before the poll closes!</p>"
            }

            <p>
              <a href="${data.poll_url}" class="button">
                ${data.has_voted ? "View Poll" : "Vote Now"}
              </a>
            </p>
          </div>
          <div class="footer">
            <p>This notification was sent because you ${data.has_voted ? "voted on" : "are subscribed to notifications for"} this poll.</p>
            <p><a href="${data.unsubscribe_url}">Unsubscribe</a> from notifications</p>
          </div>
        `;

      case "poll_closing_1h":
        return `
          ${baseStyles}
          <div class="header">
            <h1>⚡ Final Hour!</h1>
            <p>Poll closing very soon</p>
          </div>
          <div class="content">
            <h2>Poll closing in 1 hour</h2>
            <p>Hi ${data.user_name || "there"},</p>
            <p><strong>Final reminder:</strong> This poll will close in just 1 hour!</p>

            <div class="poll-option">
              <h3>${data.poll_question}</h3>
              ${data.closing_time ? `<p><strong>Closes:</strong> ${new Date(data.closing_time).toLocaleString()}</p>` : ""}
            </div>

            ${
              data.has_voted
                ? "<p>✅ You've already voted. Thank you for participating!</p>"
                : "<p>🚨 <strong>Last chance to vote!</strong> Don't miss out on having your say.</p>"
            }

            <p>
              <a href="${data.poll_url}" class="button">
                ${data.has_voted ? "View Results" : "Vote Now!"}
              </a>
            </p>
          </div>
          <div class="footer">
            <p>This is your final notification for this poll.</p>
            <p><a href="${data.unsubscribe_url}">Unsubscribe</a> from notifications</p>
          </div>
        `;

      case "poll_closed":
        return `
          ${baseStyles}
          <div class="header">
            <h1>📊 Poll Results</h1>
            <p>Voting has ended</p>
          </div>
          <div class="content">
            <h2>Poll Results Available</h2>
            <p>Hi ${data.user_name || "there"},</p>
            <p>The poll you ${data.has_voted ? "voted on" : "were following"} has now closed. Here are the results:</p>

            <div class="poll-option">
              <h3>${data.poll_question}</h3>
              <p><strong>Total votes:</strong> ${data.total_votes || 0}</p>
            </div>

            ${
              data.poll_results
                ? data.poll_results
                    .map(
                      (result) => `
              <div class="poll-option ${data.winning_options?.includes(result.option) ? "winner" : ""}">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <strong>${result.option}</strong>
                  <span>${result.votes} votes (${result.percentage}%)</span>
                </div>
                <div class="result-bar">
                  <div class="result-fill" style="width: ${result.percentage}%"></div>
                </div>
              </div>
            `,
                    )
                    .join("")
                : ""
            }

            ${
              data.winning_options && data.winning_options.length > 0
                ? `<p>🏆 <strong>Winner${data.winning_options.length > 1 ? "s" : ""}:</strong> ${data.winning_options.join(", ")}</p>`
                : "<p>It's a tie! Multiple options received the same number of votes.</p>"
            }

            <p>
              <a href="${data.poll_url}" class="button">View Full Results</a>
            </p>
          </div>
          <div class="footer">
            <p>Thank you for participating in this poll!</p>
            <p><a href="${data.unsubscribe_url}">Unsubscribe</a> from notifications</p>
          </div>
        `;

      case "new_poll":
        return `
          ${baseStyles}
          <div class="header">
            <h1>🗳️ New Poll Available</h1>
            <p>Your input is needed</p>
          </div>
          <div class="content">
            <h2>New Poll Created</h2>
            <p>Hi ${data.user_name || "there"},</p>
            <p>${data.creator_name} has created a new poll that might interest you:</p>

            <div class="poll-option">
              <h3>${data.poll_question}</h3>
              ${data.poll_description ? `<p>${data.poll_description}</p>` : ""}
              ${
                data.poll_options
                  ? `
                <p><strong>Options:</strong></p>
                <ul>
                  ${data.poll_options.map((option) => `<li>${option}</li>`).join("")}
                </ul>
              `
                  : ""
              }
            </div>

            <p>Be among the first to vote and help shape the outcome!</p>

            <p>
              <a href="${data.poll_url}" class="button">Vote Now</a>
            </p>
          </div>
          <div class="footer">
            <p>You received this notification because you subscribed to new poll alerts.</p>
            <p><a href="${data.unsubscribe_url}">Unsubscribe</a> from notifications</p>
          </div>
        `;

      case "voting_reminder":
        return `
          ${baseStyles}
          <div class="header">
            <h1>🔔 Voting Reminder</h1>
            <p>Don't forget to vote</p>
          </div>
          <div class="content">
            <h2>Reminder: Vote on Active Poll</h2>
            <p>Hi ${data.user_name || "there"},</p>
            <p>You haven't voted yet on this poll. Your opinion matters!</p>

            <div class="poll-option">
              <h3>${data.poll_question}</h3>
              ${data.days_since_created ? `<p>Created ${data.days_since_created} day${data.days_since_created !== 1 ? "s" : ""} ago</p>` : ""}
            </div>

            <p>Join the ${data.total_votes || 0} people who have already voted and make your voice heard.</p>

            <p>
              <a href="${data.poll_url}" class="button">Cast Your Vote</a>
            </p>
          </div>
          <div class="footer">
            <p>This is a gentle reminder. You can disable voting reminders in your notification settings.</p>
            <p><a href="${data.unsubscribe_url}">Unsubscribe</a> from notifications</p>
          </div>
        `;

      case "results_announcement":
        return `
          ${baseStyles}
          <div class="header">
            <h1>📈 Poll Results</h1>
            <p>See what everyone voted for</p>
          </div>
          <div class="content">
            <h2>Poll Results Announcement</h2>
            <p>Hi ${data.user_name || "there"},</p>
            <p>The results are in for the poll you were interested in:</p>

            <div class="poll-option">
              <h3>${data.poll_question}</h3>
              <p><strong>Total votes:</strong> ${data.total_votes || 0}</p>
            </div>

            ${
              data.poll_results
                ? data.poll_results
                    .map(
                      (result) => `
              <div class="poll-option ${data.winning_options?.includes(result.option) ? "winner" : ""}">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <strong>${result.option}</strong>
                  <span>${result.votes} votes (${result.percentage}%)</span>
                </div>
                <div class="result-bar">
                  <div class="result-fill" style="width: ${result.percentage}%"></div>
                </div>
              </div>
            `,
                    )
                    .join("")
                : ""
            }

            <p>
              <a href="${data.poll_url}" class="button">View Detailed Results</a>
            </p>
          </div>
          <div class="footer">
            <p>Stay tuned for more polls and results!</p>
            <p><a href="${data.unsubscribe_url}">Unsubscribe</a> from notifications</p>
          </div>
        `;

      default:
        return `
          ${baseStyles}
          <div class="header">
            <h1>ALX-Polly Notification</h1>
          </div>
          <div class="content">
            <h2>Notification</h2>
            <p>Hi ${data.user_name || "there"},</p>
            <p>You have a new notification from ALX-Polly.</p>
            <p>
              <a href="${data.poll_url || this.baseUrl}" class="button">Visit ALX-Polly</a>
            </p>
          </div>
          <div class="footer">
            <p><a href="${data.unsubscribe_url}">Unsubscribe</a> from notifications</p>
          </div>
        `;
    }
  }
}

/**
 * Email delivery service
 */
export class EmailService {
  private renderer: EmailTemplateRenderer;
  private config: EmailServiceConfig;

  constructor(config: EmailServiceConfig = EMAIL_CONFIG) {
    this.config = config;
    this.renderer = new EmailTemplateRenderer(config);
  }

  /**
   * Send notification email
   */
  async sendNotification(options: SendEmailOptions): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      // Validate email address
      if (!this.isValidEmail(options.to)) {
        return {
          success: false,
          error: "Invalid email address",
        };
      }

      // Render template
      const { html, subject } = await this.renderer.renderTemplate(
        options.template as NotificationType,
        options.data,
      );

      // Send email via Resend
      const result = await resend.emails.send({
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: options.to,
        subject: options.subject || subject,
        html: html,
        replyTo: options.replyTo,
        tags: (options.tags || [options.template]).map((tag) => ({
          name: tag,
          value: tag,
        })),
      });

      if (result.error) {
        console.error("Resend API error:", result.error);
        return {
          success: false,
          error: result.error.message || "Failed to send email",
        };
      }

      return {
        success: true,
        messageId: result.data?.id,
      };
    } catch (error) {
      console.error("Email sending failed:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(notifications: SendEmailOptions[]): Promise<{
    success: boolean;
    results: Array<{
      email: string;
      success: boolean;
      messageId?: string;
      error?: string;
    }>;
  }> {
    const results: Array<{
      email: string;
      success: boolean;
      messageId?: string;
      error?: string;
    }> = [];

    // Process notifications in batches to avoid rate limits
    const batchSize = 10;
    const batches = this.chunkArray(notifications, batchSize);

    for (const batch of batches) {
      const batchPromises = batch.map(async (notification) => {
        const result = await this.sendNotification(notification);
        return {
          email: notification.to,
          success: result.success,
          messageId: result.messageId,
          error: result.error,
        };
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Small delay between batches
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    const successCount = results.filter((r) => r.success).length;

    return {
      success: successCount > 0,
      results,
    };
  }

  /**
   * Validate email address format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// Export singleton instance
export const emailService = new EmailService(EMAIL_CONFIG);

/**
 * Convenience function to send a single notification
 */
export async function sendNotificationEmail(
  to: string,
  notificationType: NotificationType,
  templateData: EmailTemplateData,
  options?: {
    subject?: string;
    replyTo?: string;
    tags?: string[];
  },
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  return emailService.sendNotification({
    to,
    subject: options?.subject || EMAIL_TEMPLATES[notificationType].subject,
    template: notificationType,
    data: templateData,
    replyTo: options?.replyTo,
    tags: options?.tags,
  });
}

/**
 * Test email delivery
 */
export async function testEmailDelivery(
  to: string = "test@example.com",
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  return sendNotificationEmail(to, "new_poll", {
    user_name: "Test User",
    user_email: to,
    poll_id: 1,
    poll_question: "Test Poll: What is your favorite color?",
    creator_name: "Poll Creator",
    poll_options: ["Red", "Blue", "Green", "Yellow"],
  });
}
