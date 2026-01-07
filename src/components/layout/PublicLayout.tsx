import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Simple header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center">
              <span className="font-semibold text-lg text-foreground">AthleteSpace</span>
            </Link>
            
            {/* Navigation */}
            <nav className="flex items-center gap-4">
              <Link
                to="/privacy"
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  location.pathname === '/privacy'
                    ? 'text-foreground bg-muted'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Shield className="h-4 w-4" />
                Privacy
              </Link>
              <Link
                to="/faq"
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  location.pathname === '/faq'
                    ? 'text-foreground bg-muted'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <HelpCircle className="h-4 w-4" />
                FAQ
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="min-h-[calc(100vh-4rem)]">
        {children}
      </main>
    </div>
  );
}

