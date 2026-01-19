import { motion } from 'framer-motion';

export const TelemetryFooter = () => {
  return (
    <footer className="relative py-16 bg-slate-950 border-t border-slate-900/50">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <img 
              src="/AthleteSpace_logo_dark.jpg" 
              alt="Athlete Space" 
              className="h-6 w-auto opacity-60"
            />
            <span className="text-[10px] font-mono tracking-[0.2em] text-slate-600 uppercase">
              Performance System
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-8 text-[10px] font-mono tracking-[0.15em] text-slate-600 uppercase">
            <a href="/privacy" className="hover:text-slate-400 transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-slate-400 transition-colors">Terms</a>
            <a href="/login" className="hover:text-slate-400 transition-colors">Enter</a>
          </div>
        </div>

        {/* Bottom line */}
        <motion.div 
          className="mt-12 pt-8 border-t border-slate-900/30"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
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
