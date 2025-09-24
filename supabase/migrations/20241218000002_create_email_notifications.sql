-- Create email notifications tracking table
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

-- Enable RLS
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own email notifications"
  ON email_notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all notifications (poll creators can see notifications for their polls)
CREATE POLICY "Poll creators can view notifications for their polls"
  ON email_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM polls
      WHERE polls.id = email_notifications.poll_id
      AND polls.creator_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_email_notifications_user_id ON email_notifications(user_id);
CREATE INDEX idx_email_notifications_poll_id ON email_notifications(poll_id);
CREATE INDEX idx_email_notifications_status ON email_notifications(status);
CREATE INDEX idx_email_notifications_type ON email_notifications(notification_type);
CREATE INDEX idx_email_notifications_created_at ON email_notifications(created_at);
CREATE INDEX idx_email_notifications_sent_at ON email_notifications(sent_at);

-- Composite indexes for common queries
CREATE INDEX idx_email_notifications_status_retry ON email_notifications(status, retry_count)
  WHERE status IN ('failed', 'retry');
CREATE INDEX idx_email_notifications_poll_type ON email_notifications(poll_id, notification_type);

-- Create updated_at trigger
CREATE TRIGGER update_email_notifications_updated_at
  BEFORE UPDATE ON email_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create notification queue table for scheduled notifications
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

-- Enable RLS
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification queue
CREATE POLICY "Users can view their own queued notifications"
  ON notification_queue FOR SELECT
  USING (auth.uid() = user_id);

-- Create indexes for notification queue
CREATE INDEX idx_notification_queue_user_id ON notification_queue(user_id);
CREATE INDEX idx_notification_queue_poll_id ON notification_queue(poll_id);
CREATE INDEX idx_notification_queue_scheduled_for ON notification_queue(scheduled_for);
CREATE INDEX idx_notification_queue_status ON notification_queue(status);
CREATE INDEX idx_notification_queue_type ON notification_queue(notification_type);

-- Composite index for processing scheduled notifications
CREATE INDEX idx_notification_queue_processing ON notification_queue(scheduled_for, status)
  WHERE status = 'scheduled' AND scheduled_for <= NOW();

-- Create updated_at trigger for notification queue
CREATE TRIGGER update_notification_queue_updated_at
  BEFORE UPDATE ON notification_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically queue poll closing notifications
CREATE OR REPLACE FUNCTION queue_poll_closing_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Queue 24h notification if poll has end_time and is more than 24h away
  IF NEW.end_time IS NOT NULL AND NEW.end_time > NOW() + INTERVAL '24 hours' THEN
    INSERT INTO notification_queue (user_id, poll_id, notification_type, scheduled_for, template_data)
    SELECT
      np.user_id,
      NEW.id,
      'poll_closing_24h',
      NEW.end_time - INTERVAL '24 hours',
      jsonb_build_object('poll_id', NEW.id, 'poll_question', NEW.question)
    FROM notification_preferences np
    WHERE np.email_enabled = true
      AND np.poll_closing_24h = true
      AND (
        -- Creator always gets notified
        np.user_id = NEW.creator_id
        OR
        -- Users who voted get notified
        EXISTS (SELECT 1 FROM votes WHERE votes.poll_id = NEW.id AND votes.voter_id = np.user_id)
        OR
        -- Users who opted in for new poll notifications
        np.new_poll_notifications = true
      );
  END IF;

  -- Queue 1h notification if poll has end_time and is more than 1h away
  IF NEW.end_time IS NOT NULL AND NEW.end_time > NOW() + INTERVAL '1 hour' THEN
    INSERT INTO notification_queue (user_id, poll_id, notification_type, scheduled_for, template_data)
    SELECT
      np.user_id,
      NEW.id,
      'poll_closing_1h',
      NEW.end_time - INTERVAL '1 hour',
      jsonb_build_object('poll_id', NEW.id, 'poll_question', NEW.question)
    FROM notification_preferences np
    WHERE np.email_enabled = true
      AND np.poll_closing_1h = true
      AND (
        np.user_id = NEW.creator_id
        OR
        EXISTS (SELECT 1 FROM votes WHERE votes.poll_id = NEW.id AND votes.voter_id = np.user_id)
        OR
        np.new_poll_notifications = true
      );
  END IF;

  -- Queue immediate notification when poll closes
  IF NEW.end_time IS NOT NULL THEN
    INSERT INTO notification_queue (user_id, poll_id, notification_type, scheduled_for, template_data)
    SELECT
      np.user_id,
      NEW.id,
      'poll_closed',
      NEW.end_time,
      jsonb_build_object('poll_id', NEW.id, 'poll_question', NEW.question)
    FROM notification_preferences np
    WHERE np.email_enabled = true
      AND np.poll_closed_immediately = true
      AND (
        np.user_id = NEW.creator_id
        OR
        EXISTS (SELECT 1 FROM votes WHERE votes.poll_id = NEW.id AND votes.voter_id = np.user_id)
      );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic notification queueing
CREATE TRIGGER trigger_queue_poll_closing_notifications
  AFTER INSERT ON polls
  FOR EACH ROW
  EXECUTE FUNCTION queue_poll_closing_notifications();
