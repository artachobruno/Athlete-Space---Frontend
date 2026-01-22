import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Activity,
  BarChart3,
  Settings,
  Menu,
  X,
  Brain,
  LogOut,
  Shield,
  HelpCircle,
  Bot,
  Database,
  LifeBuoy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/Logo';

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/today', label: 'Today', icon: LayoutDashboard },
  { path: '/schedule', label: 'Schedule', icon: Calendar },
  { path: '/plan', label: 'Plan', icon: ClipboardList },
  { path: '/history', label: 'History', icon: Activity },
  { path: '/insights', label: 'Insights', icon: BarChart3 },
  { path: '/coach', label: 'Coach', icon: Brain },
  { path: '/admin', label: 'Admin Ops', icon: Shield },
  { path: '/admin/ai', label: 'Admin AI', icon: Bot },
  { path: '/admin/analytics', label: 'Admin Analytics', icon: Database },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('[AppLayout] Logout error:', error);
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="min-h-[100svh] bg-background">
      {/* Mobile header */}
      <header 
        className="lg:hidden fixed top-0 left-0 right-0 bg-card border-b z-50 flex items-center px-4 pt-[env(safe-area-inset-top,0px)] h-[calc(3.5rem+env(safe-area-inset-top,0px))]"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="mr-3"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <div className="flex items-center">
          <Logo size="nav" />
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 w-64 bg-card border-r z-40 transition-transform duration-200 ease-in-out',
          // On mobile: start below the header (which includes safe area)
          'top-[calc(3.5rem+env(safe-area-inset-top,0px))] h-[calc(100%-3.5rem-env(safe-area-inset-top,0px))]',
          // On desktop: full height from top
          'lg:top-0 lg:h-full',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo - only visible on desktop since mobile has header */}
          <div className="hidden lg:flex h-16 items-center px-6 border-b">
            <Logo size="nav" />
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t space-y-1">
            <Link
              to="/faq"
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full',
                location.pathname === '/faq'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <HelpCircle className="h-4 w-4" />
              FAQ
            </Link>
            <Link
              to="/support"
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full',
                location.pathname === '/support'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <LifeBuoy className="h-4 w-4" />
              Support
            </Link>
            <Link
              to="/privacy"
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full',
                location.pathname === '/privacy'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <Shield className="h-4 w-4" />
              Privacy
            </Link>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className={cn(
        'min-h-[100svh] pt-safe-area lg:pt-0 lg:pl-64 transition-all duration-200'
      )}>
        <div className="mx-auto max-w-[1400px] px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
