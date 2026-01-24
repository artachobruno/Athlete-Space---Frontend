import { AppLayout } from '@/components/layout/AppLayout';
import { AthleteProfileSection } from '@/components/settings/AthleteProfileSection';
import { TrainingPreferencesSection } from '@/components/settings/TrainingPreferencesSection';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { useAuth } from '@/context/AuthContext';
import { useAthleteProfile } from '@/hooks/useAthleteProfile';

export default function Profile() {
  const { user } = useAuth();
  const { profile } = useAthleteProfile();
  
  // Build display name from profile identity
  const firstName = profile?.identity?.first_name;
  const lastName = profile?.identity?.last_name;
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  const displayName = fullName || user?.email?.split('@')[0] || 'Athlete';

  return (
    <AppLayout>
      <div className="space-y-8 max-w-4xl">
        {/* Profile Header with Avatar */}
        <div className="flex items-center gap-5">
          <ProfileAvatar 
            name={fullName} 
            email={user?.email} 
            size="xl" 
          />
          <div>
            <h1 className="text-[clamp(1.25rem,3vw,1.5rem)] font-semibold text-primary">
              {displayName}
            </h1>
            <p className="text-muted-foreground mt-1">
              {user?.email || 'Your athlete profile and training preferences'}
            </p>
          </div>
        </div>

        {/* Athlete Profile */}
        <AthleteProfileSection />

        {/* Training Preferences */}
        <TrainingPreferencesSection />
      </div>
    </AppLayout>
  );
}
