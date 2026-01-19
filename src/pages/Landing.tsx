import { useEffect } from 'react';
import { TelemetryNav } from '@/components/landing/TelemetryNav';
import { TelemetryHero } from '@/components/landing/TelemetryHero';
import { TelemetryStrip } from '@/components/landing/TelemetryStatusBand';
import { MentalModelSection } from '@/components/landing/MentalModelSection';
import { SystemExplanation } from '@/components/landing/SystemExplanation';
import { AthletesExplanation } from '@/components/landing/AthletesExplanation';
import { CoachesSection } from '@/components/landing/CoachesSection';
import { TelemetryFooter } from '@/components/landing/TelemetryFooter';

const Landing = () => {
  useEffect(() => {
    // Force dark mode for landing page
    document.documentElement.classList.add('dark');
    
    return () => {
      // Optionally restore previous theme state on unmount
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 overflow-x-hidden">
      <TelemetryNav />
      <TelemetryHero />
      
      {/* Telemetry strip breaks scroll flow */}
      <TelemetryStrip variant="default" />
      
      {/* Mental model - how the system thinks */}
      <MentalModelSection />
      
      {/* Second telemetry strip */}
      <TelemetryStrip variant="alt" />
      
      {/* System explanation with load management */}
      <SystemExplanation />
      
      {/* Athletes section with video */}
      <AthletesExplanation />
      
      {/* Coaches section with video */}
      <CoachesSection />
      
      {/* Minimal footer */}
      <TelemetryFooter />
    </div>
  );
};

export default Landing;
