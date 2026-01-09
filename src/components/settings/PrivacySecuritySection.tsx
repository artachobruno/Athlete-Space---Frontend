import { useState, useEffect } from 'react';
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
import { Shield, Lock, Eye, EyeOff, Loader2, Trash2, Mail } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { auth } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';
import { fetchPrivacySettings, updatePrivacySettings, changePassword, changeEmail } from '@/lib/api';

export function PrivacySecuritySection() {
  const { user } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
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
    profileVisibility: 'private' as 'public' | 'private' | 'coaches',
    shareActivityData: false,
    shareTrainingMetrics: false,
  });
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteAccountData, setDeleteAccountData] = useState({
    password: '',
    confirmation: '',
  });
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Load privacy settings on mount
  useEffect(() => {
    const loadPrivacySettings = async () => {
      try {
        const settings = await fetchPrivacySettings();
        setPrivacySettings({
          profileVisibility: settings.profile_visibility,
          shareActivityData: settings.share_activity_data,
          shareTrainingMetrics: settings.share_training_metrics,
        });
      } catch (error) {
        console.error('Failed to load privacy settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPrivacySettings();
  }, []);

  const handleEmailChange = async () => {
    if (!newEmail || !emailPassword) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in both email and password fields',
        variant: 'destructive',
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    if (newEmail === user?.email) {
      toast({
        title: 'Email unchanged',
        description: 'New email is the same as current email',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingEmail(true);
    try {
      await changeEmail({
        new_email: newEmail,
        password: emailPassword,
      });
      toast({
        title: 'Email changed',
        description: 'Your email has been updated successfully. Please log in with your new email.',
      });
      setNewEmail('');
      setEmailPassword('');
      // Refresh user to get updated email
      window.location.reload();
    } catch (error) {
      console.error('Failed to change email:', error);
      const apiError = error as { status?: number; message?: string };
      let errorMessage = 'Could not update email';
      if (apiError.status === 401) {
        errorMessage = 'Incorrect password';
      } else if (apiError.status === 409) {
        errorMessage = 'This email is already in use';
      } else if (apiError.message) {
        errorMessage = apiError.message;
      }
      toast({
        title: 'Failed to change email',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsChangingEmail(false);
    }
  };

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
      await changePassword({
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
        confirm_password: passwordData.confirmPassword,
      });
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
      await updatePrivacySettings({
        profile_visibility: privacySettings.profileVisibility,
        share_activity_data: privacySettings.shareActivityData,
        share_training_metrics: privacySettings.shareTrainingMetrics,
      });
      toast({
        title: 'Privacy settings updated',
        description: 'Your privacy preferences have been saved',
      });
    } catch (error) {
      console.error('Failed to save privacy settings:', error);
      toast({
        title: 'Failed to save settings',
        description: error instanceof Error ? error.message : 'Could not save your privacy preferences',
        variant: 'destructive',
      });
    } finally {
      setIsSavingPrivacy(false);
    }
  };

  const handleDeleteAccount = async () => {
    // FE-PS4: Require password and typed confirmation
    if (!deleteAccountData.password) {
      toast({
        title: 'Password required',
        description: 'Please enter your password to confirm account deletion',
        variant: 'destructive',
      });
      return;
    }

    if (deleteAccountData.confirmation !== 'DELETE') {
      toast({
        title: 'Confirmation required',
        description: 'Please type "DELETE" to confirm account deletion',
        variant: 'destructive',
      });
      return;
    }

    setIsDeletingAccount(true);
    try {
      // In a real app, this would call an API endpoint with password
      // For now, simulate API call
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
      setIsDeletingAccount(false);
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
        {/* Change Email */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-foreground mb-1">Change Email</h3>
            <p className="text-xs text-muted-foreground">
              Update your email address. You'll need to log in with your new email after the change.
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-email">Current Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="current-email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="pl-10 bg-muted"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email">New Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-email"
                  type="email"
                  placeholder="new@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="pl-10"
                  disabled={isChangingEmail}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email-password"
                  type={showEmailPassword ? 'text' : 'password'}
                  placeholder="Enter your password to confirm"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  className="pl-10"
                  disabled={isChangingEmail}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowEmailPassword(!showEmailPassword)}
                >
                  {showEmailPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter your password to confirm the email change
              </p>
            </div>
            <Button
              onClick={handleEmailChange}
              disabled={isChangingEmail || !newEmail || !emailPassword}
            >
              {isChangingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Changing...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Change Email
                </>
              )}
            </Button>
          </div>
        </div>

        <Separator />

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
                  profileVisibility: value as 'public' | 'private' | 'coaches',
                })}
              >
                <SelectTrigger id="profile-visibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private - Only you</SelectItem>
                  <SelectItem value="coaches">Coaches - Only your coaches</SelectItem>
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
        {/* FE-PS4: Explicit confirmation UX with password and typed confirmation */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-destructive mb-1">Danger Zone</h3>
            <p className="text-xs text-muted-foreground">
              Permanently delete your account and all associated data
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeletingAccount}>
                {isDeletingAccount ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-4">
                  <p>
                    This action cannot be undone. This will permanently delete your account
                    and remove all your data from our servers. All your activities, training plans,
                    and progress will be lost forever.
                  </p>
                  <div className="space-y-3 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="delete-password">Enter your password</Label>
                      <div className="relative">
                        <Input
                          id="delete-password"
                          type="password"
                          placeholder="Enter your password"
                          value={deleteAccountData.password}
                          onChange={(e) => setDeleteAccountData({ ...deleteAccountData, password: e.target.value })}
                          disabled={isDeletingAccount}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="delete-confirmation">Type "DELETE" to confirm</Label>
                      <Input
                        id="delete-confirmation"
                        type="text"
                        placeholder="Type DELETE"
                        value={deleteAccountData.confirmation}
                        onChange={(e) => setDeleteAccountData({ ...deleteAccountData, confirmation: e.target.value })}
                        disabled={isDeletingAccount}
                      />
                    </div>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteAccountData({ password: '', confirmation: '' })}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={!deleteAccountData.password || deleteAccountData.confirmation !== 'DELETE' || isDeletingAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
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

