import { motion } from 'framer-motion';
import { VideoFrame } from './VideoFrame';

export const CoachesSection = () => {
  return (
    <section className="relative py-24 bg-slate-950" id="coaches">
      <div className="container mx-auto px-6">
        {/* Section label */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="text-[10px] tracking-[0.3em] text-slate-600 font-mono uppercase">
            Built For Coaches
          </span>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Video frame - slightly higher visibility for coach authority */}
          <VideoFrame 
            src="/crossFit_female.mp4"
            className="aspect-video rounded-sm"
            opacity={0.65}
            filter="saturate(0.65) contrast(1.15)"
            label="COACH · LIVE"
          />

          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-2xl font-mono tracking-tight text-slate-200 mb-6">
              One system.
              <br />
              Many athletes.
              <br />
              Zero guesswork.
            </h2>
            
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              Athlete Space gives coaches a real-time performance system —
              tracking load, recovery, and risk across athletes from one control layer.
            </p>

            {/* Coach metrics - F1-style telemetry readouts */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <div className="text-slate-300 text-lg font-mono tracking-tight mb-1">12</div>
                <div className="text-[10px] font-mono text-slate-600 tracking-[0.12em] uppercase mb-1">
                  ATHLETES
                </div>
                <div className="text-[9px] font-mono text-slate-700 opacity-50">
                  Active roster
                </div>
              </div>
              <div>
                <div className="text-slate-300 text-lg font-mono tracking-tight mb-1">STABLE</div>
                <div className="text-[10px] font-mono text-slate-600 tracking-[0.12em] uppercase mb-1">
                  LOAD DISTRIBUTION
                </div>
                <div className="text-[9px] font-mono text-slate-700 opacity-50">
                  30-day window
                </div>
              </div>
              <div>
                <div className="text-slate-300 text-lg font-mono tracking-tight mb-1">1</div>
                <div className="text-[10px] font-mono text-slate-600 tracking-[0.12em] uppercase mb-1">
                  RISK FLAGS
                </div>
                <div className="text-[9px] font-mono text-slate-700 opacity-50">
                  Action required
                </div>
              </div>
              <div>
                <div className="text-slate-300 text-lg font-mono tracking-tight mb-1">91%</div>
                <div className="text-[10px] font-mono text-slate-600 tracking-[0.12em] uppercase mb-1">
                  ADHERENCE
                </div>
                <div className="text-[9px] font-mono text-slate-700 opacity-50">
                  Last 14 days
                </div>
              </div>
            </div>

            {/* System Insight callout */}
            <motion.div
              className="border border-slate-800/50 bg-slate-900/20 p-6 mb-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <h3 className="text-sm font-mono tracking-[0.15em] text-slate-300 mb-4 uppercase">
                System Insight
              </h3>
              <div className="space-y-2 text-sm font-mono text-slate-400 leading-relaxed">
                <p>Two athletes approaching overload.</p>
                <p>One under-stimulated.</p>
                <div className="mt-4 pt-4 border-t border-slate-800/50">
                  <p className="text-slate-300">
                    Recommended action:
                  </p>
                  <p className="text-slate-200 mt-1">
                    Reduce intensity for Group A.
                    <br />
                    Progress load for Athlete 7.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* CTAs */}
            <div className="flex items-center gap-6">
              <a 
                href="/login"
                className="text-sm font-mono tracking-[0.1em] text-slate-400 hover:text-slate-200 transition-colors border-b border-slate-700 hover:border-slate-500 pb-1"
              >
                Enter Coach View
              </a>
              <span className="text-slate-700">|</span>
              <a 
                href="#system"
                className="text-sm font-mono tracking-[0.1em] text-slate-600 hover:text-slate-400 transition-colors"
              >
                View System Logic
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
