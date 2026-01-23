import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, HelpCircle, Brain, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/Logo';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-[100svh]">
      {/* Simple header */}
      <header 
        className="border-b border-border"
        style={{
          background: 'rgba(2, 6, 23, 0.85)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center">
              <Logo className="text-xl" />
            </Link>
            
            {/* Navigation */}
            <nav className="flex items-center gap-1 sm:gap-2">
              <Link
                to="/about"
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  location.pathname === '/about'
                    ? 'text-primary bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Info className={cn("h-4 w-4", location.pathname === '/about' && "text-primary")} />
                <span className="hidden sm:inline">About</span>
              </Link>
              <Link
                to="/science"
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  location.pathname === '/science'
                    ? 'text-primary bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Brain className={cn("h-4 w-4", location.pathname === '/science' && "text-primary")} />
                <span className="hidden sm:inline">Science & AI</span>
              </Link>
              <Link
                to="/privacy"
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  location.pathname === '/privacy'
                    ? 'text-primary bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Shield className={cn("h-4 w-4", location.pathname === '/privacy' && "text-primary")} />
                <span className="hidden sm:inline">Privacy</span>
              </Link>
              <Link
                to="/faq"
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  location.pathname === '/faq'
                    ? 'text-primary bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <HelpCircle className={cn("h-4 w-4", location.pathname === '/faq' && "text-primary")} />
                <span className="hidden sm:inline">FAQ</span>
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

