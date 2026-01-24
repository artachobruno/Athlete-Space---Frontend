import { AppLayout } from '@/components/layout/AppLayout';
import { AppearanceSection } from '@/components/settings/AppearanceSection';
import { IntegrationsSection } from '@/components/settings/IntegrationsSection';
import { NotificationsSection } from '@/components/settings/NotificationsSection';
import { PrivacySecuritySection } from '@/components/settings/PrivacySecuritySection';
import { DataManagementSection } from '@/components/settings/DataManagementSection';

export default function Settings() {
  return (
    <AppLayout>
      <div className="space-y-8 max-w-4xl">
        <div>
          <h1 className="text-[clamp(1.25rem,3vw,1.5rem)] font-semibold text-primary">Settings</h1>
          <p className="text-muted-foreground mt-1">App preferences, integrations, and account management</p>
        </div>

        {/* Appearance */}
        <AppearanceSection />

        {/* Notifications */}
        <NotificationsSection />

        {/* Integrations */}
        <IntegrationsSection />

        {/* Privacy & Security */}
        <PrivacySecuritySection />

        {/* Data Management */}
        <DataManagementSection />
      </div>
    </AppLayout>
  );
}
