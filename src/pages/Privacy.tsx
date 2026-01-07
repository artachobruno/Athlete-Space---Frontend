import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 lg:py-12">
        {/* Header with back button */}
        <div className="mb-8">
          <Button
            variant="ghost"
            asChild
            className="mb-4"
          >
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
          <p className="text-muted-foreground mt-2">Athlete Space (Pre-Launch)</p>
        </div>

        {/* Privacy Policy Content */}
        <Card>
          <CardHeader>
            <CardTitle>Privacy Policy – Athlete Space (Pre-Launch)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">8. Updates</h2>
                <p className="text-muted-foreground leading-relaxed">
                  This policy may be updated as the product evolves. Changes will be reflected on this page.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>

        {/* Footer note */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>
    </div>
  );
}

