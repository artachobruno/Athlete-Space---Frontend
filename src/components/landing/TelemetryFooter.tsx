import { motion } from 'framer-motion';

export const TelemetryFooter = () => {
  return (
    <footer className="relative py-16 bg-slate-950 border-t border-slate-900/50">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          {/* Brand - static logo only, no animation */}
          <div className="flex items-center gap-3">
            <img 
              src="/AthleteSpace_logo_dark.jpg" 
              alt="Athlete Space" 
              className="h-5 w-auto opacity-50 pointer-events-none"
            />
            <span className="text-[10px] font-mono tracking-[0.2em] text-slate-600 uppercase">
              Performance System
            </span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center gap-8 text-[10px] font-mono tracking-[0.15em] text-slate-600 uppercase">
            <a href="/about" className="hover:text-slate-400 transition-colors">About</a>
            <a href="/science" className="hover:text-slate-400 transition-colors">Science & AI</a>
            <a href="/privacy" className="hover:text-slate-400 transition-colors">Privacy</a>
            <a href="/faq" className="hover:text-slate-400 transition-colors">FAQ</a>
            <a href="/login" className="hover:text-slate-400 transition-colors">Sign In</a>
          </div>
        </div>

        {/* Final CTA */}
        <motion.div 
          className="mt-16 pt-12 border-t border-slate-900/30 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <a 
            href="/login"
            className="inline-block text-sm font-mono tracking-[0.1em] text-slate-300 hover:text-slate-200 transition-colors border-b border-slate-700 hover:border-slate-500 pb-1 mb-4"
          >
            Enter the Performance System
          </a>
          <p className="text-xs font-mono tracking-wider text-slate-600 mt-3">
            Built for endurance athletes who train by signal, not guesswork.
          </p>
        </motion.div>

        {/* Bottom line */}
        <motion.div 
          className="mt-12 pt-8 border-t border-slate-900/30"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] font-mono tracking-wider text-slate-700">
            <span>© 2025 Athlete Space</span>
            <span>Signal-driven training intelligence</span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};
