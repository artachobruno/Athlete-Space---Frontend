import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Privacy() {
  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
          <p className="text-muted-foreground mt-2">AthleteSpace (Pre-Launch)</p>
        </div>

        {/* Privacy Policy Content */}
        <Card>
          <CardHeader>
            <CardTitle>Privacy Policy – AthleteSpace (Pre-Launch)</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">Last updated: January 2026</p>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {/* Introduction */}
              <section className="mb-6">
                <p className="text-muted-foreground leading-relaxed">
                  AthleteSpace ("we", "our", "us") is a pre-launch fitness and performance application designed to provide training insights to endurance athletes. We respect your privacy and are committed to protecting your personal data.
                </p>
              </section>

              {/* Section 1 */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">1. Data We Collect</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  With your explicit consent, Athlete Space may collect fitness and wellness data from connected third-party services, including but not limited to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Activity data (e.g., workouts, duration, distance)</li>
                  <li>Heart rate and related metrics</li>
                  <li>Sleep and recovery data</li>
                  <li>Training load and wellness indicators</li>
                </ul>
              </section>

              {/* Section 2 */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">2. How We Use Your Data</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  We use collected data solely to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Provide personalized training insights and performance analysis</li>
                  <li>Generate recovery and fatigue trends</li>
                  <li>Improve the functionality and accuracy of the application</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Athlete Space does not provide medical diagnosis or treatment.
                </p>
              </section>

              {/* Section 3 */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">3. Data Sharing</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  We do not sell, rent, or share individual user data with advertisers or third parties.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Aggregated and anonymized data may be used internally for product improvement and analytics.
                </p>
              </section>

              {/* Section 4 */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">4. Data Security</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We implement reasonable technical and organizational safeguards to protect your data, including encrypted storage and secure communication protocols.
                </p>
              </section>

              {/* Section 5 */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">5. User Control & Consent</h2>
                <p className="text-muted-foreground leading-relaxed">
                  You control which services you connect and may revoke access at any time. Upon request, we will delete your personal data in accordance with applicable laws.
                </p>
              </section>

              {/* Section 6 */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">6. Third-Party Services</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Athlete Space integrates with third-party fitness platforms only with user authorization and in accordance with their respective privacy policies.
                </p>
              </section>

              {/* Section 7 */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">7. Contact</h2>
                <p className="text-muted-foreground leading-relaxed">
                  This policy may be updated as the product evolves. Changes will be reflected on this page.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}

