import { useEffect } from 'react';
import { LandingNav } from '@/components/landing/LandingNav';
import { HeroSection } from '@/components/landing/HeroSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { WhySection } from '@/components/landing/WhySection';
import { AthletesSection } from '@/components/landing/AthletesSection';
import { FooterSection } from '@/components/landing/FooterSection';

const Landing = () => {
  useEffect(() => {
    // Force dark mode for landing page
    document.documentElement.classList.add('dark');
    
    return () => {
      // Optionally restore previous theme state on unmount
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <LandingNav />
      <HeroSection />
      <HowItWorksSection />
      <WhySection />
      <AthletesSection />
      <FooterSection />
    </div>
  );
};

export default Landing;
