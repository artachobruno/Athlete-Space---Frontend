import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GlassCard } from '@/components/ui/GlassCard';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, HelpCircle, Shield, AlertCircle, Eye, EyeOff, Activity } from 'lucide-react';
import { signupWithEmail } from '@/lib/auth';
import { initiateStravaConnect, initiateGoogleConnect } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { isPreviewMode } from '@/lib/preview';
import { toast } from '@/hooks/use-toast';
import { Logo } from '@/components/Logo';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Signup() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStravaSignup = async () => {
    // Disable OAuth in preview mode (doesn't work in Lovable preview)
    if (isPreviewMode()) {
      toast({
        title: 'OAuth disabled in preview',
        description: 'OAuth authentication is not available in preview mode.',
        variant: 'default',
      });
      return;
    }
    
    try {
      await initiateStravaConnect();
    } catch (err) {
      setError('Failed to connect with Strava. Please try again.');
      console.error('[Signup] Strava connection error:', err);
    }
  };

  const handleGoogleSignup = async () => {
    // Disable OAuth in preview mode (doesn't work in Lovable preview)
    if (isPreviewMode()) {
      toast({
        title: 'OAuth disabled in preview',
        description: 'OAuth authentication is not available in preview mode.',
        variant: 'default',
      });
      return;
    }
    
    try {
      await initiateGoogleConnect();
    } catch (err) {
      setError('Failed to connect with Google. Please try again.');
      console.error('[Signup] Google connection error:', err);
    }
  };
  
  const isPreview = isPreviewMode();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      // STEP 4: Force auth state refresh after token is stored
      await signupWithEmail(email, password);
      console.log("[SIGNUP] Token stored, refreshing user state...");
      await refreshUser();
      console.log("[SIGNUP] User state refreshed, navigating to onboarding");
      // Use replace: true to prevent back button from going back to signup
      navigate('/onboarding', { replace: true });
    } catch (err: unknown) {
      const apiError = err as { status?: number; message?: string };
      if (apiError.status === 409) {
        setError('An account with this email already exists.');
      } else if (apiError.status === 400) {
        // Use backend validation message if available
        setError(apiError.message || 'Invalid email or password. Please check your input.');
      } else {
        // Use backend message if available, otherwise generic error
        setError(apiError.message || 'Could not create account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100svh] flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <div className="flex items-center">
          <Logo className="h-8 w-auto" />
        </div>
        <div className="flex items-center gap-2">
          <Link to="/faq">
            <Button variant="ghost" size="sm">
              <HelpCircle className="h-4 w-4 mr-1" />
              FAQ
            </Button>
          </Link>
          <Link to="/privacy">
            <Button variant="ghost" size="sm">
              <Shield className="h-4 w-4 mr-1" />
              Privacy
            </Button>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-[clamp(1.5rem,4vw,1.875rem)] font-bold text-primary">Create Account</h1>
            <p className="text-muted-foreground">
              Start your personalized training journey
            </p>
          </div>

          <GlassCard className="border-border/50 shadow-lg">
            <CardContent className="space-y-4 pt-6">
              {/* Strava - Primary CTA */}
              {/* STRAVA DISABLED: Garmin-first strategy - Strava coming soon */}
              {/* <Button
                className="w-full"
                size="lg"
                onClick={handleStravaSignup}
                disabled={isLoading || isPreview}
                title={isPreview ? "OAuth disabled in preview mode" : undefined}
              >
                <Activity className="h-4 w-4 mr-2 text-[#FC4C02]" />
                Continue with Strava (recommended)
              </Button> */}

              {/* Google OAuth */}
              <Button
                className="w-full"
                variant="outline"
                size="lg"
                onClick={handleGoogleSignup}
                disabled={isLoading || isPreview}
                title={isPreview ? "OAuth disabled in preview mode" : undefined}
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
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
                  <span className="bg-card px-2 text-muted-foreground">Or sign up with email</span>
                </div>
              </div>

              {/* Email Signup Form */}
              <form onSubmit={handleSignup} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                      }}
                      className="pl-10"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                      }}
                      className="pl-10 pr-10"
                      disabled={isLoading}
                      required
                      minLength={8}
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
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirm Password <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError(null);
                      }}
                      className="pl-10 pr-10"
                      disabled={isLoading}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creating account...' : 'Sign Up'}
                </Button>
              </form>

              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-accent hover:underline font-medium">
                  Sign in
                </Link>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                By continuing, you agree to our{' '}
                <Link to="/privacy" className="text-accent hover:underline">
                  Privacy Policy
                </Link>
              </p>
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
    </div>
  );
}
