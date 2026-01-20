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

  if (prefersReducedMotion) {
    return (
      <img
        src="/AthleteSpace_logo_dark.jpg"
        alt="Athlete Space"
        className="w-56 md:w-64 h-auto opacity-60 pointer-events-none"
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
      className="w-56 md:w-64 h-auto opacity-60 pointer-events-none"
    />
  );
};

export const BrandSignatureSection = () => {
  return (
    <section className="relative py-24 md:py-32 bg-slate-950 overflow-hidden">
      {/* Subtle top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-800/30 to-transparent" />

      <div className="relative container mx-auto px-6">
        <motion.div
          className="flex flex-col items-center text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          {/* Animated logo - larger, slower, dimmed */}
          <div className="mb-8">
            <SignatureLogo />
          </div>

          {/* Brand tagline - F1 tone */}
          <motion.div
            className="flex flex-col items-center gap-2"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <h3 className="text-sm md:text-base font-mono tracking-[0.15em] text-slate-400 uppercase">
              AthleteSpace
            </h3>
            <p className="text-xs md:text-sm font-mono tracking-wider text-slate-600 italic">
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
