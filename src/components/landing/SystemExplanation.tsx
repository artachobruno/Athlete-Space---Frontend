import { motion } from 'framer-motion';

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
        {/* First explanation block */}
        <div className="py-16">
          <ExplanationBlock
            title="Load Management"
            description="Training stress accumulates. Recovery replenishes. The balance determines adaptation. We track this signal continuously, not just after workouts."
            metrics={[
              { label: 'ATL', value: '↓' },
              { label: 'CTL', value: '+2.1' },
              { label: 'TSB', value: '+8' },
            ]}
            align="left"
          />
        </div>
      </div>
    </section>
  );
};
