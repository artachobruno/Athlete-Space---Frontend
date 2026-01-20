import { motion } from 'framer-motion';
import { VideoFrame } from './VideoFrame';

interface ExplanationBlockProps {
  title: string;
  description: string;
  metrics?: { label: string; value: string }[];
  align?: 'left' | 'right';
}

const ExplanationBlock = ({ title, description, metrics, align = 'left' }: ExplanationBlockProps) => {
  return (
    <motion.div
      className={`max-w-lg ${align === 'right' ? 'ml-auto text-right' : ''}`}
      initial={{ opacity: 0, x: align === 'left' ? -20 : 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.8 }}
    >
      <h3 className="text-sm font-mono tracking-[0.15em] text-slate-300 mb-3 uppercase">
        {title}
      </h3>
      <p className="text-slate-500 text-sm leading-relaxed mb-6">
        {description}
      </p>
      
      {metrics && (
        <div className={`flex gap-6 ${align === 'right' ? 'justify-end' : ''}`}>
          {metrics.map((m, i) => (
            <div key={i} className="text-right">
              <div className="text-lg font-mono text-slate-300 tracking-tight">{m.value}</div>
              <div className="text-[10px] font-mono text-slate-600 tracking-wider uppercase">{m.label}</div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export const SystemExplanation = () => {
  return (
    <section className="relative py-24 bg-slate-950">
      <div className="container mx-auto px-6">
        {/* System Logic explanation block */}
        <div className="py-16">
          <ExplanationBlock
            title="System Logic"
            description="Performance is not training more. It is managing stress faster than it accumulates. AthleteSpace models load, recovery, and adaptation continuously — not just after workouts."
            metrics={[
              { label: 'ATL', value: '↓' },
              { label: 'CTL', value: '+2.1' },
              { label: 'TSB', value: '+8' },
            ]}
            align="left"
          />
        </div>

        {/* System Decision Example with video */}
        <div className="grid md:grid-cols-2 gap-16 items-center mt-16">
          {/* Video frame */}
          <VideoFrame 
            src="/running_female.mp4"
            className="aspect-video rounded-sm"
            label="SIGNAL · LIVE"
          />

          {/* System Decision callout */}
          <motion.div
            className="border border-slate-800/50 bg-slate-900/20 p-8"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h3 className="text-sm font-mono tracking-[0.15em] text-slate-300 mb-6 uppercase">
              System Decision Example
            </h3>
            <div className="space-y-3 text-sm font-mono text-slate-400 leading-relaxed">
              <p>Load trending upward.</p>
              <p>Recovery within range.</p>
              <p>Adaptation stable.</p>
              <div className="mt-6 pt-6 border-t border-slate-800/50">
                <p className="text-slate-300">
                  System recommendation:
                </p>
                <p className="text-slate-200 mt-1">
                  Proceed with planned intensity.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
