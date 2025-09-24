"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  BellOff,
  Settings,
  Send,
  History,
  TestTube,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Mail,
  Clock,
  Calendar,
} from "lucide-react";
import NotificationPreferences from "@/components/NotificationPreferences";
import {
  type NotificationPreferences as NotificationPrefsType,
  EmailNotification,
  NotificationQueue,
  NotificationType,
  formatNotificationType,
} from "@/lib/types/notifications";
import {
  getNotificationPreferences,
  getNotificationHistory,
  getNotificationQueue,
  testNotification,
} from "@/lib/notificationApi";
import { supabase } from "@/lib/supabase";

export default function NotificationsPage() {
  const [user, setUser] = useState<any>(null);
  const [preferences, setPreferences] = useState<NotificationPrefsType | null>(
    null,
  );
  const [history, setHistory] = useState<EmailNotification[]>([]);
  const [queue, setQueue] = useState<NotificationQueue[]>([]);
  const [loading, setLoading] = useState(true);
  const [testLoading, setTestLoading] = useState(false);
  const [selectedTestType, setSelectedTestType] =
    useState<NotificationType>("new_poll");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await loadData();
      } else {
        setError("Please sign in to manage your notification preferences");
      }
    } catch (err) {
      setError("Failed to authenticate user");
      console.error("Auth error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [prefsResult, historyResult, queueResult] = await Promise.all([
        getNotificationPreferences(),
        getNotificationHistory(20),
        getNotificationQueue(),
      ]);

      if (prefsResult.success) {
        setPreferences(prefsResult.data || null);
      }

      if (historyResult.success) {
        setHistory(historyResult.data || []);
      }

      if (queueResult.success) {
        setQueue(queueResult.data || []);
      }
    } catch (err) {
      console.error("Error loading data:", err);
    }
  };

  const handleTestNotification = async () => {
    if (!user?.email) return;

    try {
      setTestLoading(true);
      setError(null);
      setSuccessMessage(null);

      const result = await testNotification(selectedTestType, {
        user_name: user.user_metadata?.full_name || user.email,
        poll_question: "Test Poll: How effective is our notification system?",
        creator_name: "ALX-Polly Team",
        poll_options: ["Excellent", "Good", "Needs Improvement"],
        total_votes: 15,
      });

      if (result.success) {
        setSuccessMessage(
          `Test ${formatNotificationType(selectedTestType)} email sent successfully!`,
        );
        await loadData(); // Refresh history
      } else {
        setError(result.error || "Failed to send test email");
      }
    } catch (err) {
      setError("Failed to send test notification");
      console.error("Test error:", err);
    } finally {
      setTestLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      sent: "default",
      failed: "destructive",
      pending: "secondary",
      scheduled: "secondary",
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mr-3" />
          <span>Loading notification settings...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please sign in to manage your notification preferences.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Bell className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Notification Center</h1>
          <p className="text-muted-foreground">
            Manage your email notifications and preferences
          </p>
        </div>
      </div>

      {/* Alerts */}
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

      {/* Main Content */}
      <Tabs defaultValue="preferences" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Scheduled
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Test
          </TabsTrigger>
        </TabsList>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <NotificationPreferences
            userId={user.id}
            onPreferencesChange={(newPrefs) => setPreferences(newPrefs)}
          />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Email History
              </CardTitle>
              <CardDescription>
                View your recent email notifications and delivery status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No email notifications sent yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(notification.status)}
                        <div>
                          <h4 className="font-medium">
                            {notification.subject}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {formatNotificationType(
                              notification.notification_type,
                            )}{" "}
                            • {formatDate(notification.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(notification.status)}
                        {notification.retry_count > 0 && (
                          <Badge variant="outline">
                            {notification.retry_count} retries
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Queue Tab */}
        <TabsContent value="queue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Scheduled Notifications
              </CardTitle>
              <CardDescription>
                View and manage your upcoming scheduled notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {queue.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No scheduled notifications</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {queue.map((queueItem) => (
                    <div
                      key={queueItem.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <div>
                          <h4 className="font-medium">
                            {formatNotificationType(
                              queueItem.notification_type,
                            )}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Scheduled for: {formatDate(queueItem.scheduled_for)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(queueItem.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Tab */}
        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Test Notifications
              </CardTitle>
              <CardDescription>
                Send test emails to verify your notification settings and
                templates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">
                    Notification Type
                  </label>
                  <Select
                    value={selectedTestType}
                    onValueChange={(value: NotificationType) =>
                      setSelectedTestType(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new_poll">New Poll</SelectItem>
                      <SelectItem value="poll_closing_24h">
                        24h Closing Warning
                      </SelectItem>
                      <SelectItem value="poll_closing_1h">
                        1h Closing Warning
                      </SelectItem>
                      <SelectItem value="poll_closed">Poll Closed</SelectItem>
                      <SelectItem value="voting_reminder">
                        Voting Reminder
                      </SelectItem>
                      <SelectItem value="results_announcement">
                        Results Announcement
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Test Email Details</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>To:</strong> {user.email}
                    </p>
                    <p>
                      <strong>Type:</strong>{" "}
                      {formatNotificationType(selectedTestType)}
                    </p>
                    <p>
                      <strong>Subject:</strong> [TEST] ALX-Polly:{" "}
                      {formatNotificationType(selectedTestType)}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleTestNotification}
                  disabled={testLoading || !preferences?.email_enabled}
                  className="w-full"
                >
                  {testLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Test Email
                </Button>

                {!preferences?.email_enabled && (
                  <Alert>
                    <BellOff className="h-4 w-4" />
                    <AlertTitle>Email Notifications Disabled</AlertTitle>
                    <AlertDescription>
                      Enable email notifications in your preferences to send
                      test emails.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
