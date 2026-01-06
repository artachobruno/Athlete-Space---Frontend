import { AppLayout } from '@/components/layout/AppLayout';
import { AthleteProfileSection } from '@/components/settings/AthleteProfileSection';
import { TrainingPreferencesSection } from '@/components/settings/TrainingPreferencesSection';
import { IntegrationsSection } from '@/components/settings/IntegrationsSection';

export default function Settings() {
  return (
    <AppLayout>
      <div className="space-y-8 max-w-4xl">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your profile, preferences, and connected services</p>
        </div>

        {/* Athlete Profile */}
        <AthleteProfileSection />

        {/* Training Preferences */}
        <TrainingPreferencesSection />

        {/* Integrations */}
        <IntegrationsSection />
      </div>
    </AppLayout>
  );
}
