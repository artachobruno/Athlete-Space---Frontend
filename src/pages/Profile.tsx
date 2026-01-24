import { AppLayout } from '@/components/layout/AppLayout';
import { AthleteProfileSection } from '@/components/settings/AthleteProfileSection';
import { TrainingPreferencesSection } from '@/components/settings/TrainingPreferencesSection';

export default function Profile() {
  return (
    <AppLayout>
      <div className="space-y-8 max-w-4xl">
        <div>
          <h1 className="text-[clamp(1.25rem,3vw,1.5rem)] font-semibold text-primary">Profile</h1>
          <p className="text-muted-foreground mt-1">Your athlete profile and training preferences</p>
        </div>

        {/* Athlete Profile */}
        <AthleteProfileSection />

        {/* Training Preferences */}
        <TrainingPreferencesSection />
      </div>
    </AppLayout>
  );
}
