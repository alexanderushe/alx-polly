"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  BellOff,
  Clock,
  Mail,
  Settings,
  Globe,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  type NotificationPreferences,
  UpdateNotificationPreferences,
  NotificationFrequency,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from "@/lib/types/notifications";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  testNotification,
} from "@/lib/notificationApi";

interface NotificationPreferencesProps {
  userId?: string;
  className?: string;
  onPreferencesChange?: (preferences: NotificationPreferences) => void;
}

export default function NotificationPreferences({
  userId,
  className = "",
  onPreferencesChange,
}: NotificationPreferencesProps) {
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getNotificationPreferences();

      if (result.success && result.data) {
        setPreferences(result.data);
        onPreferencesChange?.(result.data);
      } else {
        setError(result.error || "Failed to load preferences");
      }
    } catch (err) {
      setError("Failed to load notification preferences");
      console.error("Error loading preferences:", err);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!preferences || !hasChanges) return;

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const updates: UpdateNotificationPreferences = {
        email_enabled: preferences.email_enabled,
        poll_closing_24h: preferences.poll_closing_24h,
        poll_closing_1h: preferences.poll_closing_1h,
        poll_closed_immediately: preferences.poll_closed_immediately,
        new_poll_notifications: preferences.new_poll_notifications,
        voting_reminders: preferences.voting_reminders,
        results_announcements: preferences.results_announcements,
        admin_notifications: preferences.admin_notifications,
        notification_frequency: preferences.notification_frequency,
        quiet_hours_start: preferences.quiet_hours_start,
        quiet_hours_end: preferences.quiet_hours_end,
        timezone: preferences.timezone,
      };

      const result = await updateNotificationPreferences(updates);

      if (result.success && result.data) {
        setPreferences(result.data);
        setHasChanges(false);
        setSuccessMessage("Preferences saved successfully!");
        onPreferencesChange?.(result.data);

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(result.error || "Failed to save preferences");
      }
    } catch (err) {
      setError("Failed to save preferences");
      console.error("Error saving preferences:", err);
    } finally {
      setSaving(false);
    }
  };

  const testNotificationDelivery = async () => {
    try {
      setTesting(true);
      setError(null);
      setSuccessMessage(null);

      const result = await testNotification("new_poll", {
        user_name: "Test User",
        poll_question: "This is a test notification",
        creator_name: "ALX-Polly System",
        poll_options: ["Option 1", "Option 2", "Option 3"],
      });

      if (result.success) {
        setSuccessMessage("Test email sent successfully! Check your inbox.");
      } else {
        setError(result.error || "Failed to send test email");
      }
    } catch (err) {
      setError("Failed to send test notification");
      console.error("Error testing notification:", err);
    } finally {
      setTesting(false);
    }
  };

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K],
  ) => {
    if (!preferences) return;

    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    setHasChanges(true);
  };

  const resetToDefaults = () => {
    if (!preferences) return;

    const defaultPrefs = {
      ...preferences,
      ...DEFAULT_NOTIFICATION_PREFERENCES,
    };
    setPreferences(defaultPrefs);
    setHasChanges(true);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading notification preferences...
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card className={className}>
        <CardContent className="py-12">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error || "Failed to load notification preferences"}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const timezones = [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Australia/Sydney",
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>Notification Preferences</CardTitle>
          </div>
          <CardDescription>
            Customize when and how you receive email notifications about polls
            and voting activities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="types">Notification Types</TabsTrigger>
              <TabsTrigger value="schedule">Schedule & Timing</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {preferences.email_enabled ? (
                      <Bell className="h-5 w-5 text-green-600" />
                    ) : (
                      <BellOff className="h-5 w-5 text-gray-400" />
                    )}
                    <div>
                      <Label
                        htmlFor="email-enabled"
                        className="text-base font-medium"
                      >
                        Email Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Enable or disable all email notifications
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="email-enabled"
                    checked={preferences.email_enabled}
                    onCheckedChange={(checked) =>
                      updatePreference("email_enabled", checked)
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Notification Frequency
                  </Label>
                  <Select
                    value={preferences.notification_frequency}
                    onValueChange={(value: NotificationFrequency) =>
                      updatePreference("notification_frequency", value)
                    }
                    disabled={!preferences.email_enabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <div>
                            <div>Immediate</div>
                            <div className="text-xs text-muted-foreground">
                              Send emails right away
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="daily">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <div>
                            <div>Daily Digest</div>
                            <div className="text-xs text-muted-foreground">
                              One email per day with all updates
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="weekly">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <div>
                            <div>Weekly Summary</div>
                            <div className="text-xs text-muted-foreground">
                              Weekly email with summary
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={testNotificationDelivery}
                    variant="outline"
                    disabled={!preferences.email_enabled || testing}
                  >
                    {testing ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Mail className="h-4 w-4 mr-2" />
                    )}
                    Send Test Email
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="types" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-3">
                    Poll Notifications
                  </h3>
                  <div className="space-y-4">
                    {[
                      {
                        key: "poll_closing_24h" as const,
                        title: "24-Hour Warning",
                        description:
                          "Get notified 24 hours before a poll closes",
                      },
                      {
                        key: "poll_closing_1h" as const,
                        title: "1-Hour Warning",
                        description: "Final reminder 1 hour before poll closes",
                      },
                      {
                        key: "poll_closed_immediately" as const,
                        title: "Poll Closed",
                        description:
                          "Immediate notification when poll closes with results",
                      },
                      {
                        key: "results_announcements" as const,
                        title: "Results Available",
                        description:
                          "Get notified when poll results are published",
                      },
                    ].map(({ key, title, description }) => (
                      <div
                        key={key}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <Label
                            htmlFor={key}
                            className="text-base font-medium"
                          >
                            {title}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {description}
                          </p>
                        </div>
                        <Switch
                          id={key}
                          checked={preferences[key]}
                          onCheckedChange={(checked) =>
                            updatePreference(key, checked)
                          }
                          disabled={!preferences.email_enabled}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-3">
                    Engagement Notifications
                  </h3>
                  <div className="space-y-4">
                    {[
                      {
                        key: "new_poll_notifications" as const,
                        title: "New Polls",
                        description:
                          "Get notified about new polls that might interest you",
                      },
                      {
                        key: "voting_reminders" as const,
                        title: "Voting Reminders",
                        description:
                          "Gentle reminders to vote on active polls you haven't voted on",
                      },
                    ].map(({ key, title, description }) => (
                      <div
                        key={key}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <Label
                            htmlFor={key}
                            className="text-base font-medium"
                          >
                            {title}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {description}
                          </p>
                        </div>
                        <Switch
                          id={key}
                          checked={preferences[key]}
                          onCheckedChange={(checked) =>
                            updatePreference(key, checked)
                          }
                          disabled={!preferences.email_enabled}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-3">Administrative</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label
                          htmlFor="admin-notifications"
                          className="text-base font-medium"
                        >
                          Admin Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications about poll management and system
                          updates
                        </p>
                      </div>
                      <Switch
                        id="admin-notifications"
                        checked={preferences.admin_notifications}
                        onCheckedChange={(checked) =>
                          updatePreference("admin_notifications", checked)
                        }
                        disabled={!preferences.email_enabled}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Timezone
                  </Label>
                  <Select
                    value={preferences.timezone}
                    onValueChange={(value) =>
                      updatePreference("timezone", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    All notification times will be adjusted to your timezone
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Quiet Hours
                  </Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Set quiet hours when you don't want to receive
                    notifications. Notifications during these hours will be
                    delayed until quiet hours end.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quiet-start" className="text-sm">
                        Start Time
                      </Label>
                      <Input
                        id="quiet-start"
                        type="time"
                        value={preferences.quiet_hours_start.substring(0, 5)}
                        onChange={(e) =>
                          updatePreference(
                            "quiet_hours_start",
                            e.target.value + ":00",
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="quiet-end" className="text-sm">
                        End Time
                      </Label>
                      <Input
                        id="quiet-end"
                        type="time"
                        value={preferences.quiet_hours_end.substring(0, 5)}
                        onChange={(e) =>
                          updatePreference(
                            "quiet_hours_end",
                            e.target.value + ":00",
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={resetToDefaults}>
          Reset to Defaults
        </Button>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={loadPreferences}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Refresh
          </Button>

          <Button onClick={savePreferences} disabled={!hasChanges || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Changes
            {hasChanges && (
              <Badge variant="secondary" className="ml-2">
                •
              </Badge>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
