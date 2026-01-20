import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const SignatureLogo = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const logoClasses = "w-48 md:w-60 h-auto opacity-70 pointer-events-none";

  if (prefersReducedMotion) {
    return (
      <img
        src="/AthleteSpace_logo_dark.jpg"
        alt="Athlete Space"
        className={logoClasses}
      />
    );
  }

  return (
    <video
      src="/branding/athletespace-logo-motion.mp4"
      autoPlay
      loop
      muted
      playsInline
      className={logoClasses}
    />
  );
};

export const BrandSignatureSection = () => {
  return (
    <section className="relative py-20 md:py-28 bg-slate-950 overflow-hidden">
      {/* Subtle top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-800/30 to-transparent" />

      <div className="relative container mx-auto px-6">
        <motion.div
          className="max-w-5xl mx-auto flex flex-col md:flex-row items-center md:items-center gap-8 md:gap-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          {/* Logo - left side */}
          <div className="flex-shrink-0">
            <SignatureLogo />
          </div>

          {/* Text block - right side */}
          <motion.div
            className="flex flex-col gap-3 text-center md:text-left"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <h3 className="text-xl md:text-2xl font-mono font-medium tracking-[0.2em] text-slate-300 uppercase">
              ATHLETESPACE
            </h3>
            <p className="text-sm md:text-base font-mono tracking-wide text-slate-500 italic">
              Precision intelligence for elite training.
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Subtle bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-800/30 to-transparent" />
    </section>
  );
};
