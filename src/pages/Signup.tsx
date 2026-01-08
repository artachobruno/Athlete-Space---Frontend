import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, HelpCircle, Shield, AlertCircle } from 'lucide-react';
import { signupWithEmail } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/Logo';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Signup() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      await signupWithEmail(email, password);
      await refreshUser();
      navigate('/onboarding');
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex flex-col">
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
            <h1 className="text-3xl font-bold text-primary">Create Account</h1>
            <p className="text-muted-foreground">
              Start your personalized training journey
            </p>
          </div>

          <Card className="border-border/50 shadow-lg">
            <CardContent className="space-y-4 pt-6">
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
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                      }}
                      className="pl-10"
                      disabled={isLoading}
                      required
                      minLength={8}
                    />
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
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError(null);
                      }}
                      className="pl-10"
                      disabled={isLoading}
                      required
                      minLength={8}
                    />
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
          </Card>

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
