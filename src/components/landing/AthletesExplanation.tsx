import { motion } from 'framer-motion';
import { VideoFrame } from './VideoFrame';

export const AthletesExplanation = () => {
  return (
    <section className="relative py-24 bg-slate-950" id="athletes">
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
            Built For
          </span>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-2xl font-mono tracking-tight text-slate-200 mb-6">
              Athletes who measure, not guess.
            </h2>
            
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              Marathon. Triathlon. Ultra. Cycling. The sport changes, 
              the system logic remains. Load in. Adaptation out. 
              Performance follows signal.
            </p>

            {/* Delta metrics */}
            <div className="flex gap-8 text-sm font-mono">
              <div>
                <div className="text-slate-300 text-lg">Δ −0.04</div>
                <div className="text-[10px] text-slate-600 tracking-wider uppercase">Pace Trend</div>
              </div>
              <div>
                <div className="text-slate-300 text-lg">+6</div>
                <div className="text-[10px] text-slate-600 tracking-wider uppercase">7d Load</div>
              </div>
              <div>
                <div className="text-slate-300 text-lg">94%</div>
                <div className="text-[10px] text-slate-600 tracking-wider uppercase">Adaptation</div>
              </div>
            </div>
          </motion.div>

          {/* Video frame */}
          <VideoFrame 
            src="/Hyrox_male.mp4"
            className="aspect-video rounded-sm"
          />
        </div>
      </div>
    </section>
  );
};
