import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';

interface SupportingPageLayoutProps {
  children: ReactNode;
}

export function SupportingPageLayout({ children }: SupportingPageLayoutProps) {
  const { status } = useAuth();
  const isAuthenticated = status === 'authenticated';

  if (isAuthenticated) {
    return <AppLayout>{children}</AppLayout>;
  }

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Return to home
          </Link>
        </Button>
      </div>
      {children}
    </PublicLayout>
  );
}
