import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

const NavLogo = () => {
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

  const logoClasses = "h-8 md:h-10 lg:h-11 w-auto opacity-95 pointer-events-none drop-shadow-[0_0_12px_rgba(120,180,255,0.25)]";

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
      preload="auto"
      className={logoClasses}
    />
  );
};

export const TelemetryNav = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top,0px)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.1 }}
    >
      <div
        className="absolute inset-0 border-b border-white/10"
        style={{
          background: 'rgba(2, 6, 23, 0.85)',
          backdropFilter: 'blur(12px)',
        }}
      />
      
      <div className="relative container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <NavLogo />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8 text-[11px] font-mono tracking-[0.12em] uppercase">
            <a href="#system" className="text-slate-500 hover:text-slate-300 transition-colors">
              System
            </a>
            <a href="#athletes" className="text-slate-500 hover:text-slate-300 transition-colors">
              Athletes
            </a>
            <a href="#coaches" className="text-slate-500 hover:text-slate-300 transition-colors">
              Coaches
            </a>
            <Link to="/about" className="text-slate-500 hover:text-slate-300 transition-colors">
              About
            </Link>
            <Link to="/science" className="text-slate-500 hover:text-slate-300 transition-colors">
              Science & AI
            </Link>
            <Link to="/faq" className="text-slate-500 hover:text-slate-300 transition-colors">
              FAQ
            </Link>
            <Link to="/support" className="text-slate-500 hover:text-slate-300 transition-colors">
              Support
            </Link>
            <Link to="/login" className="text-slate-400 hover:text-slate-200 transition-colors">
              Sign In
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-slate-400"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu - position below nav accounting for safe area */}
      {isMenuOpen && (
        <motion.div
          className="md:hidden absolute left-0 right-0 border-b border-white/10"
          style={{
            top: 'calc(4rem + env(safe-area-inset-top, 0px))',
            background: 'rgba(2, 6, 23, 0.85)',
            backdropFilter: 'blur(12px)',
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="container mx-auto px-6 py-4 flex flex-col gap-4 text-[11px] font-mono tracking-[0.12em] uppercase">
            <a href="#system" className="text-slate-500 hover:text-slate-300 transition-colors py-2">
              System
            </a>
            <a href="#athletes" className="text-slate-500 hover:text-slate-300 transition-colors py-2">
              Athletes
            </a>
            <a href="#coaches" className="text-slate-500 hover:text-slate-300 transition-colors py-2">
              Coaches
            </a>
            <Link to="/about" className="text-slate-500 hover:text-slate-300 transition-colors py-2">
              About
            </Link>
            <Link to="/science" className="text-slate-500 hover:text-slate-300 transition-colors py-2">
              Science & AI
            </Link>
            <Link to="/faq" className="text-slate-500 hover:text-slate-300 transition-colors py-2">
              FAQ
            </Link>
            <Link to="/support" className="text-slate-500 hover:text-slate-300 transition-colors py-2">
              Support
            </Link>
            <Link to="/login" className="text-slate-400 hover:text-slate-200 transition-colors py-2">
              Sign In
            </Link>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};
