/**
 * Notification System Tests
 *
 * Comprehensive test suite for the ALX-Polly notification system
 * including API endpoints, email services, and utility functions.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  NotificationPreferences,
  NotificationType,
  EmailTemplateData,
  validateTemplateData,
  formatNotificationType,
  isInQuietHours,
  getNextDeliveryTime,
  DEFAULT_NOTIFICATION_PREFERENCES
} from '../lib/types/notifications';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  testNotification,
  sendNotification
} from '../lib/notificationApi';
import { EmailService, EmailTemplateRenderer } from '../lib/emailService';

// Mock Supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      admin: {
        getUserById: jest.fn()
      }
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      range: jest.fn()
    }))
  }
}));

// Mock Resend
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({
        data: { id: 'mock-email-id' },
        error: null
      })
    }
  }))
}));

describe('Notification Types and Validation', () => {
  describe('validateTemplateData', () => {
    it('should validate poll closing notification data', () => {
      const data: EmailTemplateData = {
        user_email: 'test@example.com',
        poll_id: 1,
        poll_question: 'Test Poll?',
        poll_url: 'https://example.com/polls/1'
      };

      const result = validateTemplateData('poll_closing_24h', data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for missing required fields', () => {
      const data: EmailTemplateData = {
        user_email: 'test@example.com'
        // Missing poll_id and poll_question
      };

      const result = validateTemplateData('poll_closed', data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Poll ID is required for poll-related notifications');
      expect(result.errors).toContain('Poll question is required for poll-related notifications');
    });

    it('should validate new poll notification data', () => {
      const data: EmailTemplateData = {
        user_email: 'test@example.com',
        poll_id: 1,
        poll_question: 'New Test Poll?',
        creator_name: 'John Doe'
      };

      const result = validateTemplateData('new_poll', data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for new poll without creator name', () => {
      const data: EmailTemplateData = {
        user_email: 'test@example.com',
        poll_id: 1,
        poll_question: 'New Test Poll?'
        // Missing creator_name
      };

      const result = validateTemplateData('new_poll', data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Creator name is required for new poll notifications');
    });
  });

  describe('formatNotificationType', () => {
    it('should format notification types correctly', () => {
      expect(formatNotificationType('poll_closing_24h')).toBe('24h Closing Warning');
      expect(formatNotificationType('poll_closing_1h')).toBe('1h Closing Warning');
      expect(formatNotificationType('poll_closed')).toBe('Poll Closed');
      expect(formatNotificationType('new_poll')).toBe('New Poll Available');
      expect(formatNotificationType('voting_reminder')).toBe('Voting Reminder');
      expect(formatNotificationType('results_announcement')).toBe('Results Available');
    });

    it('should handle unknown notification types', () => {
      const result = formatNotificationType('unknown_type' as NotificationType);
      expect(result).toBe('Unknown Type');
    });
  });
});

describe('Quiet Hours Functionality', () => {
  const mockPreferences: NotificationPreferences = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    id: 1,
    user_id: 'test-user',
    quiet_hours_start: '22:00:00',
    quiet_hours_end: '08:00:00',
    timezone: 'America/New_York',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  describe('isInQuietHours', () => {
    it('should detect quiet hours correctly for overnight period', () => {
      // 11 PM - within quiet hours
      const nightTime = new Date('2024-01-01T23:00:00Z');
      expect(isInQuietHours(mockPreferences, nightTime)).toBe(true);

      // 3 AM - within quiet hours
      const earlyMorning = new Date('2024-01-01T03:00:00Z');
      expect(isInQuietHours(mockPreferences, earlyMorning)).toBe(true);

      // 10 AM - outside quiet hours
      const morning = new Date('2024-01-01T10:00:00Z');
      expect(isInQuietHours(mockPreferences, morning)).toBe(false);
    });

    it('should handle same-day quiet hours', () => {
      const sameDayPrefs = {
        ...mockPreferences,
        quiet_hours_start: '12:00:00',
        quiet_hours_end: '14:00:00'
      };

      // 1 PM - within quiet hours
      const lunchTime = new Date('2024-01-01T13:00:00Z');
      expect(isInQuietHours(sameDayPrefs, lunchTime)).toBe(true);

      // 3 PM - outside quiet hours
      const afternoon = new Date('2024-01-01T15:00:00Z');
      expect(isInQuietHours(sameDayPrefs, afternoon)).toBe(false);
    });
  });

  describe('getNextDeliveryTime', () => {
    it('should return original time if not in quiet hours', () => {
      const targetTime = new Date('2024-01-01T10:00:00Z');
      const result = getNextDeliveryTime(mockPreferences, targetTime);
      expect(result).toEqual(targetTime);
    });

    it('should reschedule to end of quiet hours', () => {
      const targetTime = new Date('2024-01-01T02:00:00Z'); // 2 AM (in quiet hours)
      const result = getNextDeliveryTime(mockPreferences, targetTime);

      // Should be rescheduled to 8 AM
      expect(result.getHours()).toBe(8);
      expect(result.getMinutes()).toBe(0);
    });
  });
});

describe('Email Service', () => {
  let emailService: EmailService;
  let templateRenderer: EmailTemplateRenderer;

  beforeEach(() => {
    const mockConfig = {
      provider: 'resend' as const,
      apiKey: 'test-api-key',
      fromEmail: 'test@example.com',
      fromName: 'Test App',
      baseUrl: 'https://test.com'
    };

    emailService = new EmailService(mockConfig);
    templateRenderer = new EmailTemplateRenderer(mockConfig);
  });

  describe('EmailTemplateRenderer', () => {
    it('should render poll closing 24h template', async () => {
      const data: EmailTemplateData = {
        user_name: 'John Doe',
        user_email: 'john@example.com',
        poll_id: 1,
        poll_question: 'What is your favorite color?',
        closing_time: '2024-01-02T12:00:00Z',
        has_voted: false
      };

      const result = await templateRenderer.renderTemplate('poll_closing_24h', data);

      expect(result.subject).toContain('Poll closing in 24 hours');
      expect(result.subject).toContain('What is your favorite color?');
      expect(result.html).toContain('Hi John Doe');
      expect(result.html).toContain('What is your favorite color?');
      expect(result.html).toContain('24 hours');
      expect(result.html).toContain('Vote Now');
    });

    it('should render new poll template', async () => {
      const data: EmailTemplateData = {
        user_name: 'Jane Doe',
        user_email: 'jane@example.com',
        poll_id: 2,
        poll_question: 'Best programming language?',
        creator_name: 'Poll Creator',
        poll_options: ['JavaScript', 'TypeScript', 'Python']
      };

      const result = await templateRenderer.renderTemplate('new_poll', data);

      expect(result.subject).toContain('New poll available');
      expect(result.subject).toContain('Best programming language?');
      expect(result.html).toContain('Hi Jane Doe');
      expect(result.html).toContain('Poll Creator has created');
      expect(result.html).toContain('JavaScript');
      expect(result.html).toContain('TypeScript');
      expect(result.html).toContain('Python');
    });

    it('should render poll closed template with results', async () => {
      const data: EmailTemplateData = {
        user_name: 'Bob Smith',
        user_email: 'bob@example.com',
        poll_id: 3,
        poll_question: 'Favorite framework?',
        total_votes: 100,
        poll_results: [
          { option: 'React', votes: 50, percentage: 50 },
          { option: 'Vue', votes: 30, percentage: 30 },
          { option: 'Angular', votes: 20, percentage: 20 }
        ],
        winning_options: ['React']
      };

      const result = await templateRenderer.renderTemplate('poll_closed', data);

      expect(result.subject).toContain('Poll results');
      expect(result.html).toContain('Hi Bob Smith');
      expect(result.html).toContain('Total votes: 100');
      expect(result.html).toContain('React');
      expect(result.html).toContain('50 votes (50%)');
      expect(result.html).toContain('Winner: React');
    });

    it('should include unsubscribe link in all templates', async () => {
      const data: EmailTemplateData = {
        user_email: 'test@example.com',
        poll_id: 1,
        poll_question: 'Test Poll?'
      };

      const result = await templateRenderer.renderTemplate('poll_closed', data);
      expect(result.html).toContain('Unsubscribe');
      expect(result.html).toContain('/notifications/unsubscribe');
    });
  });

  describe('EmailService', () => {
    it('should validate email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ];

      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        ''
      ];

      validEmails.forEach(email => {
        expect(emailService['isValidEmail'](email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect(emailService['isValidEmail'](email)).toBe(false);
      });
    });

    it('should chunk arrays correctly', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const chunks = emailService['chunkArray'](array, 3);

      expect(chunks).toEqual([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
        [10]
      ]);
    });

    it('should handle empty arrays when chunking', () => {
      const chunks = emailService['chunkArray']([], 5);
      expect(chunks).toEqual([]);
    });
  });
});

describe('Notification API Functions', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: { full_name: 'Test User' }
  };

  beforeEach(() => {
    // Mock successful auth
    const { supabase } = require('../lib/supabase');
    supabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotificationPreferences', () => {
    it('should return existing preferences', async () => {
      const mockPreferences = {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        id: 1,
        user_id: mockUser.id,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const { supabase } = require('../lib/supabase');
      supabase.from().select().eq().single.mockResolvedValue({
        data: mockPreferences,
        error: null
      });

      const result = await getNotificationPreferences();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPreferences);
    });

    it('should create default preferences if none exist', async () => {
      const { supabase } = require('../lib/supabase');

      // Mock no existing preferences
      supabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' } // No rows returned
      });

      // Mock successful insert
      const newPreferences = {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        id: 1,
        user_id: mockUser.id,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      supabase.from().insert().select().single.mockResolvedValue({
        data: newPreferences,
        error: null
      });

      const result = await getNotificationPreferences();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(newPreferences);
    });

    it('should handle auth errors', async () => {
      const { supabase } = require('../lib/supabase');
      supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      });

      const result = await getNotificationPreferences();

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not authenticated');
    });
  });

  describe('updateNotificationPreferences', () => {
    it('should update preferences successfully', async () => {
      const updates = {
        email_enabled: false,
        poll_closing_24h: false,
        notification_frequency: 'daily' as const
      };

      const updatedPreferences = {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...updates,
        id: 1,
        user_id: mockUser.id,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T12:00:00Z'
      };

      const { supabase } = require('../lib/supabase');
      supabase.from().update().eq().select().single.mockResolvedValue({
        data: updatedPreferences,
        error: null
      });

      const result = await updateNotificationPreferences(updates);

      expect(result.success).toBe(true);
      expect(result.data?.email_enabled).toBe(false);
      expect(result.data?.notification_frequency).toBe('daily');
    });

    it('should handle database errors', async () => {
      const { supabase } = require('../lib/supabase');
      supabase.from().update().eq().select().single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      const result = await updateNotificationPreferences({ email_enabled: false });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });
});

describe('Default Notification Preferences', () => {
  it('should have sensible defaults', () => {
    expect(DEFAULT_NOTIFICATION_PREFERENCES.email_enabled).toBe(true);
    expect(DEFAULT_NOTIFICATION_PREFERENCES.poll_closing_24h).toBe(true);
    expect(DEFAULT_NOTIFICATION_PREFERENCES.poll_closing_1h).toBe(true);
    expect(DEFAULT_NOTIFICATION_PREFERENCES.poll_closed_immediately).toBe(true);
    expect(DEFAULT_NOTIFICATION_PREFERENCES.new_poll_notifications).toBe(false);
    expect(DEFAULT_NOTIFICATION_PREFERENCES.voting_reminders).toBe(true);
    expect(DEFAULT_NOTIFICATION_PREFERENCES.results_announcements).toBe(true);
    expect(DEFAULT_NOTIFICATION_PREFERENCES.admin_notifications).toBe(false);
    expect(DEFAULT_NOTIFICATION_PREFERENCES.notification_frequency).toBe('immediate');
    expect(DEFAULT_NOTIFICATION_PREFERENCES.quiet_hours_start).toBe('22:00:00');
    expect(DEFAULT_NOTIFICATION_PREFERENCES.quiet_hours_end).toBe('08:00:00');
    expect(DEFAULT_NOTIFICATION_PREFERENCES.timezone).toBe('UTC');
  });
});

describe('Integration Tests', () => {
  // Mock fetch for API tests
  global.fetch = jest.fn();

  beforeEach(() => {
    (fetch as jest.MockedFunction<typeof fetch>).mockClear();
  });

  it('should handle complete notification flow', async () => {
    // Mock successful API response
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          id: 1,
          user_id: 'test-user',
          status: 'sent',
          sent_at: '2024-01-01T12:00:00Z'
        }
      })
    } as Response);

    const templateData: EmailTemplateData = {
      user_name: 'Test User',
      user_email: 'test@example.com',
      poll_id: 1,
      poll_question: 'Integration Test Poll?'
    };

    const result = await sendNotification(
      'test-user',
      'new_poll',
      templateData,
      1
    );

    expect(result.success).toBe(true);
    expect(fetch).toHaveBeenCalledWith('/api/notifications/send', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify({
        userId: 'test-user',
        notificationType: 'new_poll',
        templateData,
        pollId: 1
      })
    }));
  });

  it('should handle API errors gracefully', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({
        success: false,
        error: 'Server error'
      })
    } as Response);

    const result = await sendNotification(
      'test-user',
      'new_poll',
      { user_email: 'test@example.com' }
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('Server error');
  });

  it('should handle network errors', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(new Error('Network error'));

    const result = await sendNotification(
      'test-user',
      'new_poll',
      { user_email: 'test@example.com' }
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });
});

describe('Performance Tests', () => {
  it('should handle large template data efficiently', async () => {
    const templateRenderer = new EmailTemplateRenderer({
      provider: 'resend',
      apiKey: 'test',
      fromEmail: 'test@example.com',
      fromName: 'Test',
      baseUrl: 'https://test.com'
    });

    // Create large poll results array
    const largeResults = Array.from({ length: 100 }, (_, i) => ({
      option: `Option ${i + 1}`,
      votes: Math.floor(Math.random() * 1000),
      percentage: Math.floor(Math.random() * 100)
    }));

    const data: EmailTemplateData = {
      user_email: 'test@example.com',
      poll_id: 1,
      poll_question: 'Large Poll Test?',
      total_votes: 50000,
      poll_results: largeResults,
      winning_options: ['Option 1']
    };

    const startTime = performance.now();
    const result = await templateRenderer.renderTemplate('poll_closed', data);
    const endTime = performance.now();

    expect(result.html).toContain('Option 1');
    expect(result.html).toContain('Option 100');
    expect(endTime - startTime).toBeLessThan(1000); // Should render in under 1 second
  });
});
