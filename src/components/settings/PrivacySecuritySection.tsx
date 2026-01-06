import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Shield, Lock, Eye, EyeOff, Loader2, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { auth } from '@/lib/auth';

export function PrivacySecuritySection() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'private' as 'public' | 'private' | 'friends',
    shareActivityData: false,
    shareTrainingMetrics: false,
    allowDataAnalytics: true,
  });
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all password fields',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters long',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'New password and confirmation must match',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      // In a real app, this would call an API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: 'Password changed',
        description: 'Your password has been updated successfully',
      });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Failed to change password:', error);
      toast({
        title: 'Failed to change password',
        description: error instanceof Error ? error.message : 'Could not update password',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handlePrivacySave = async () => {
    setIsSavingPrivacy(true);
    try {
      localStorage.setItem('privacy_settings', JSON.stringify(privacySettings));
      toast({
        title: 'Privacy settings updated',
        description: 'Your privacy preferences have been saved',
      });
    } catch (error) {
      console.error('Failed to save privacy settings:', error);
      toast({
        title: 'Failed to save settings',
        description: 'Could not save your privacy preferences',
        variant: 'destructive',
      });
    } finally {
      setIsSavingPrivacy(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // In a real app, this would call an API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      auth.clear();
      toast({
        title: 'Account deleted',
        description: 'Your account has been permanently deleted',
      });
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast({
        title: 'Failed to delete account',
        description: error instanceof Error ? error.message : 'Could not delete your account',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg">
            <Shield className="h-5 w-5 text-accent" />
          </div>
          <div>
            <CardTitle className="text-lg">Privacy & Security</CardTitle>
            <CardDescription>Manage your account security and privacy settings</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Change Password */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-foreground mb-1">Change Password</h3>
            <p className="text-xs text-muted-foreground">
              Update your password to keep your account secure
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Enter new password (min. 8 characters)"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <Button
              onClick={handlePasswordChange}
              disabled={isChangingPassword || !passwordData.currentPassword || !passwordData.newPassword}
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Changing...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </>
              )}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Privacy Settings */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-foreground mb-1">Privacy Settings</h3>
            <p className="text-xs text-muted-foreground">
              Control who can see your profile and activity data
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-visibility">Profile Visibility</Label>
              <Select
                value={privacySettings.profileVisibility}
                onValueChange={(value) => setPrivacySettings({
                  ...privacySettings,
                  profileVisibility: value as 'public' | 'private' | 'friends',
                })}
              >
                <SelectTrigger id="profile-visibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private - Only you</SelectItem>
                  <SelectItem value="friends">Friends - Only connected users</SelectItem>
                  <SelectItem value="public">Public - Everyone</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="share-activity" className="cursor-pointer">
                  Share Activity Data
                </Label>
                <p className="text-xs text-muted-foreground">
                  Allow sharing of anonymized activity data for research
                </p>
              </div>
              <Switch
                id="share-activity"
                checked={privacySettings.shareActivityData}
                onCheckedChange={(checked) => setPrivacySettings({
                  ...privacySettings,
                  shareActivityData: checked,
                })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="share-metrics" className="cursor-pointer">
                  Share Training Metrics
                </Label>
                <p className="text-xs text-muted-foreground">
                  Allow sharing of training metrics with coaches
                </p>
              </div>
              <Switch
                id="share-metrics"
                checked={privacySettings.shareTrainingMetrics}
                onCheckedChange={(checked) => setPrivacySettings({
                  ...privacySettings,
                  shareTrainingMetrics: checked,
                })}
              />
            </div>
            <Button onClick={handlePrivacySave} disabled={isSavingPrivacy}>
              {isSavingPrivacy ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Privacy Settings'
              )}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Delete Account */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-destructive mb-1">Danger Zone</h3>
            <p className="text-xs text-muted-foreground">
              Permanently delete your account and all associated data
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account
                  and remove all your data from our servers. All your activities, training plans,
                  and progress will be lost forever.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

