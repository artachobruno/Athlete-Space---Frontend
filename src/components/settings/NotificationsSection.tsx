import { useState, useEffect } from 'react';
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GlassCard } from '@/components/ui/GlassCard';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Bell, Save, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { fetchNotificationPreferences, updateNotificationPreferences } from '@/lib/api';

interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  workoutReminders: boolean;
  weeklySummary: boolean;
  goalAchievements: boolean;
  coachMessages: boolean;
  trainingLoadAlerts: boolean;
  raceReminders: boolean;
}

export function NotificationsSection() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    pushNotifications: true,
    workoutReminders: true,
    weeklySummary: true,
    goalAchievements: true,
    coachMessages: true,
    trainingLoadAlerts: true,
    raceReminders: true,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialPreferences, setInitialPreferences] = useState<NotificationPreferences | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  useEffect(() => {
    if (initialPreferences) {
      const changed = JSON.stringify(preferences) !== JSON.stringify(initialPreferences);
      setHasChanges(changed);
    } else {
      // If initialPreferences is not set yet, no changes can exist
      setHasChanges(false);
    }
  }, [preferences, initialPreferences]);

  const loadPreferences = async () => {
    setIsLoading(true);
    try {
      const prefs = await fetchNotificationPreferences();
      // Map backend snake_case to frontend camelCase
      const frontendPrefs: NotificationPreferences = {
        emailNotifications: prefs.email_notifications,
        pushNotifications: prefs.push_notifications,
        workoutReminders: prefs.workout_reminders,
        trainingLoadAlerts: prefs.training_load_alerts,
        raceReminders: prefs.race_reminders,
        weeklySummary: prefs.weekly_summary,
        goalAchievements: prefs.goal_achievements,
        coachMessages: prefs.coach_messages,
      };
      setPreferences(frontendPrefs);
      setInitialPreferences(frontendPrefs);
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
      toast({
        title: 'Failed to load preferences',
        description: error instanceof Error ? error.message : 'Could not load your notification preferences',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Map frontend camelCase to backend snake_case
      await updateNotificationPreferences({
        email_notifications: preferences.emailNotifications,
        push_notifications: preferences.pushNotifications,
        workout_reminders: preferences.workoutReminders,
        training_load_alerts: preferences.trainingLoadAlerts,
        race_reminders: preferences.raceReminders,
        weekly_summary: preferences.weeklySummary,
        goal_achievements: preferences.goalAchievements,
        coach_messages: preferences.coachMessages,
      });
      setInitialPreferences({ ...preferences });
      setHasChanges(false);
      toast({
        title: 'Notification preferences updated',
        description: 'Your notification settings have been saved',
      });
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast({
        title: 'Failed to save preferences',
        description: error instanceof Error ? error.message : 'Could not save your notification settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <GlassCard>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Bell className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-lg">Notifications</CardTitle>
              <CardDescription>Manage how and when you receive notifications</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg">
            <Bell className="h-5 w-5 text-accent" />
          </div>
          <div>
            <CardTitle className="text-lg">Notifications</CardTitle>
            <CardDescription>Manage how and when you receive notifications</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* General Notifications */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">General</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications" className="cursor-pointer">
                    Email Notifications
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={preferences.emailNotifications}
                  onCheckedChange={(checked) => updatePreference('emailNotifications', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notifications" className="cursor-pointer">
                    Push Notifications
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Receive browser push notifications
                  </p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={preferences.pushNotifications}
                  onCheckedChange={(checked) => updatePreference('pushNotifications', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Training Notifications */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">Training</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="workout-reminders" className="cursor-pointer">
                    Workout Reminders
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Get reminded about upcoming workouts
                  </p>
                </div>
                <Switch
                  id="workout-reminders"
                  checked={preferences.workoutReminders}
                  onCheckedChange={(checked) => updatePreference('workoutReminders', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="training-load-alerts" className="cursor-pointer">
                    Training Load Alerts
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Alerts when training load is high or low
                  </p>
                </div>
                <Switch
                  id="training-load-alerts"
                  checked={preferences.trainingLoadAlerts}
                  onCheckedChange={(checked) => updatePreference('trainingLoadAlerts', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="race-reminders" className="cursor-pointer">
                    Race Reminders
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Reminders about upcoming races and events
                  </p>
                </div>
                <Switch
                  id="race-reminders"
                  checked={preferences.raceReminders}
                  onCheckedChange={(checked) => updatePreference('raceReminders', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Updates & Reports */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">Updates & Reports</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="weekly-summary" className="cursor-pointer">
                    Weekly Summary
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Receive a weekly training summary
                  </p>
                </div>
                <Switch
                  id="weekly-summary"
                  checked={preferences.weeklySummary}
                  onCheckedChange={(checked) => updatePreference('weeklySummary', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="goal-achievements" className="cursor-pointer">
                    Goal Achievements
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Notifications when you achieve training goals
                  </p>
                </div>
                <Switch
                  id="goal-achievements"
                  checked={preferences.goalAchievements}
                  onCheckedChange={(checked) => updatePreference('goalAchievements', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="coach-messages" className="cursor-pointer">
                    Coach Messages
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Notifications when the coach sends messages
                  </p>
                </div>
                <Switch
                  id="coach-messages"
                  checked={preferences.coachMessages}
                  onCheckedChange={(checked) => updatePreference('coachMessages', checked)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </GlassCard>
  );
}

