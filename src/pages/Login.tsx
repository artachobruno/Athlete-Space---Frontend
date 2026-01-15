import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Activity, Mail, Lock, HelpCircle, Shield, ArrowLeft, AlertCircle, Info, FileText, Eye, EyeOff } from 'lucide-react';
import { loginWithEmail, loginWithGoogle } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';
import { initiateStravaConnect } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { isPreviewMode } from '@/lib/preview';
import { Logo } from '@/components/Logo';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Login() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    
    try {
      // CRITICAL: Enforce token → /me ordering
      // Step 1: Store token
      await loginWithEmail(email, password);
      
      // Step 2: Call /me to validate token and get user
      // This ensures we have user data (including onboarding_complete) before routing
      await refreshUser();
      
      // Step 3: Get updated user from context after refresh
      // Wait a tick for React to update context
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Step 4: Route based on onboarding status
      // CRITICAL: Only navigate to dashboard if onboarding is complete
      // Otherwise, AuthLanding will redirect to onboarding
      navigate('/dashboard');
    } catch (err: unknown) {
      const apiError = err as { status?: number; message?: string; details?: { error?: string; reason?: string } | string | unknown };
      
      // Extract error details from backend response
      // Backend returns: {"error": "error_code", "message": "..."} or {"detail": {"error": "...", "message": "..."}}
      let errorReason: string | undefined;
      let errorMessage: string | undefined;
      
      if (apiError.details) {
        if (typeof apiError.details === 'object' && apiError.details !== null) {
          const details = apiError.details as { error?: string; reason?: string; message?: string };
          errorReason = details.reason || details.error;
          errorMessage = details.message;
        }
      }
      
      // Map specific error reasons to user-friendly messages
      if (apiError.status === 404 || errorReason === "user_not_found") {
        setError('No account found. Please sign up.');
      } else if (errorReason === "invalid_auth_method") {
        setError('This account uses Google sign-in. Please sign in with Google instead.');
      } else if (errorReason === "invalid_credentials" || apiError.status === 401) {
        // Show backend message if available, otherwise generic message
        setError(errorMessage || 'Incorrect email or password.');
      } else {
        // Use backend message if available, otherwise generic error
        setError(errorMessage || apiError.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStravaLogin = async () => {
    // Disable OAuth in preview mode (doesn't work in Lovable preview)
    if (isPreviewMode()) {
      toast({
        title: 'OAuth disabled in preview',
        description: 'OAuth authentication is not available in preview mode. Use email login or preview the app directly.',
        variant: 'default',
      });
      return;
    }
    
    try {
      await initiateStravaConnect();
      // User will be redirected to Strava, then back to /onboarding with token
    } catch (err) {
      setError('Failed to connect with Strava. Please try again.');
      console.error('[Login] Strava connection error:', err);
    }
  };

  const handleGoogleLogin = async () => {
    // Disable OAuth in preview mode (doesn't work in Lovable preview)
    if (isPreviewMode()) {
      toast({
        title: 'OAuth disabled in preview',
        description: 'OAuth authentication is not available in preview mode. Use email login or preview the app directly.',
        variant: 'default',
      });
      return;
    }
    
    try {
      await loginWithGoogle();
      // User will be redirected to Google, then back with token
    } catch (err) {
      setError('Failed to connect with Google. Please try again.');
      console.error('[Login] Google connection error:', err);
    }
  };
  
  const isPreview = isPreviewMode();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    // Placeholder - password reset not implemented yet
    toast({
      title: 'Coming soon',
      description: 'Password reset via email will be available soon.',
    });
    setIsLoading(false);
    setShowForgotPassword(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/3 flex flex-col">
      {/* Header */}
      <header 
        className="px-4 pb-4 pt-4 flex items-center justify-between"
        style={{
          paddingTop: 'calc(1rem + env(safe-area-inset-top, 20px))',
          minHeight: 'calc(3.5rem + env(safe-area-inset-top, 20px))',
        }}
      >
        <div className="flex items-center">
          <Logo className="h-8 w-auto" />
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Link to="/about">
            <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
              <Info className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">About</span>
            </Button>
          </Link>
          <Link to="/faq">
            <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
              <HelpCircle className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">FAQ</span>
            </Button>
          </Link>
          <Link to="/privacy">
            <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
              <Shield className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Privacy</span>
            </Button>
          </Link>
          <Link to="/terms">
            <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
              <FileText className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Terms</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-primary">Welcome</h1>
            <p className="text-muted-foreground">
              Sign in to continue your training journey
            </p>
          </div>

          <Card className="border-border/50 shadow-lg">
            <CardContent className="space-y-4 pt-6">
              {/* Strava - Primary CTA */}
              <Button
                className="w-full"
                size="lg"
                onClick={handleStravaLogin}
                disabled={isLoading || isPreview}
                title={isPreview ? "OAuth disabled in preview mode" : undefined}
              >
                <Activity className="h-4 w-4 mr-2 text-[#FC4C02]" />
                Continue with Strava (recommended)
              </Button>

              {/* Google OAuth */}
              <Button
                className="w-full"
                variant="outline"
                size="lg"
                onClick={handleGoogleLogin}
                disabled={isLoading || isPreview}
                title={isPreview ? "OAuth disabled in preview mode" : undefined}
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or sign in with email</span>
                </div>
              </div>

              {/* Email Login Form */}
              <form onSubmit={handleEmailLogin} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                      }}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="signin-password">Password</Label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs text-accent hover:underline disabled:opacity-50"
                      disabled={isLoading}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                      }}
                      className="pl-10 pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              <div className="text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/signup" className="text-accent hover:underline font-medium">
                  Sign up
                </Link>
              </div>
            </CardContent>
          </GlassCard>

          <p className="text-center text-sm text-muted-foreground">
            Need help?{' '}
            <Link to="/faq" className="text-accent hover:underline">
              Check our FAQ
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} AthleteSpace. All rights reserved.
      </footer>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="you@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowForgotPassword(false)}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send reset link'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
