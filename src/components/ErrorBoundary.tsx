import { Component, ReactNode } from 'react';
import { isNative } from '@/lib/platform';
import { GlassCard } from '@/components/ui/GlassCard';
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

interface ErrorDisplayProps {
  error: Error | null;
  onReset: () => void;
}

function ErrorDisplay({ error, onReset }: ErrorDisplayProps) {
  const handleGoToDashboard = () => {
    onReset();
    // Use hash navigation for HashRouter (native) - this won't cause a full reload
    // For BrowserRouter (web), this will still work but may cause a reload (acceptable for error recovery)
    if (isNative()) {
      // HashRouter uses hash-based routing
      window.location.hash = '#/dashboard';
    } else {
      // BrowserRouter - use Navigate component via window.location
      // Note: This will cause a reload, but it's acceptable for error recovery
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="min-h-[100svh] flex items-center justify-center p-4 bg-background">
      <GlassCard className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle>Something went wrong</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          {error && (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer mb-2">Error details</summary>
              <pre className="mt-2 p-2 bg-muted rounded overflow-auto">
                {error.message}
              </pre>
            </details>
          )}
          <div className="flex gap-2">
            <Button
              onClick={() => {
                onReset();
                window.location.reload();
              }}
              className="flex-1"
            >
              Refresh Page
            </Button>
            <Button
              variant="outline"
              onClick={handleGoToDashboard}
              className="flex-1"
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </GlassCard>
    </div>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error('[ErrorBoundary] Caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorDisplay
          error={this.state.error}
          onReset={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}

