import { ReactNode, useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/Logo';

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
  { path: '/plan', label: 'Training Plan', icon: ClipboardList },
  { path: '/activities', label: 'Activities', icon: Activity },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
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

  // F1 Design: Force dark mode for app pages
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('[AppLayout] Logout error:', error);
      // Still navigate to login even if logout API call fails
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--surface-void))]">
      {/* Mobile header - F1 glass surface */}
      <header 
        className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[var(--surface-glass-strong)] backdrop-blur-xl border-b border-[var(--border-subtle)] z-50 flex items-center px-4 safe-area-top"
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
          <Logo className="h-6 w-auto" />
        </div>
      </header>

      {/* Sidebar - F1 glass surface */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-64 bg-[var(--surface-glass-strong)] backdrop-blur-xl border-r border-[var(--border-subtle)] z-40 transition-transform duration-200 ease-in-out',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-14 lg:h-16 flex items-center px-6 border-b border-[var(--border-subtle)]">
            <Logo className="h-6 w-auto" />
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
                    'flex items-center gap-3 px-3 py-2.5 rounded-f1 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[hsl(var(--accent-telemetry)/0.12)] text-[hsl(var(--accent-telemetry))] border-l-2 border-[hsl(var(--accent-telemetry))] -ml-[2px] pl-[14px]'
                      : 'text-[hsl(var(--f1-text-secondary))] hover:bg-[var(--border-subtle)] hover:text-[hsl(var(--f1-text-primary))]'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-[var(--border-subtle)] space-y-1">
            <Link
              to="/faq"
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-f1 text-sm font-medium transition-colors w-full',
                location.pathname === '/faq'
                  ? 'bg-[hsl(var(--accent-telemetry)/0.12)] text-[hsl(var(--accent-telemetry))]'
                  : 'text-[hsl(var(--f1-text-tertiary))] hover:bg-[var(--border-subtle)] hover:text-[hsl(var(--f1-text-primary))]'
              )}
            >
              <HelpCircle className="h-4 w-4" />
              FAQ
            </Link>
            <Link
              to="/privacy"
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-f1 text-sm font-medium transition-colors w-full',
                location.pathname === '/privacy'
                  ? 'bg-[hsl(var(--accent-telemetry)/0.12)] text-[hsl(var(--accent-telemetry))]'
                  : 'text-[hsl(var(--f1-text-tertiary))] hover:bg-[var(--border-subtle)] hover:text-[hsl(var(--f1-text-primary))]'
              )}
            >
              <Shield className="h-4 w-4" />
              Privacy
            </Link>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-[hsl(var(--f1-text-tertiary))] hover:text-[hsl(var(--f1-text-primary))] hover:bg-[var(--border-subtle)]"
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
          className="fixed inset-0 bg-[hsl(var(--surface-void))]/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content - F1 void background */}
      <main className={cn(
        'min-h-screen pt-safe-area lg:pt-0 lg:pl-64 transition-all duration-200'
      )}>
        <div className="mx-auto max-w-[1400px] px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
