import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { GlassCard } from './GlassCard';
import { Upload, Brain, TrendingUp, Target } from 'lucide-react';

const steps = [
  {
    icon: Upload,
    title: 'Connect',
    description: 'Sync your training data from Strava, Garmin, or any major platform. Your history becomes your foundation.',
    color: 'blue',
  },
  {
    icon: Brain,
    title: 'Analyze',
    description: 'Our AI engine processes your patterns, strengths, and limiters to build your unique athlete profile.',
    color: 'emerald',
  },
  {
    icon: TrendingUp,
    title: 'Adapt',
    description: 'Receive daily-adjusted training that responds to your recovery, stress, and performance signals.',
    color: 'amber',
  },
  {
    icon: Target,
    title: 'Perform',
    description: 'Peak when it matters. Every session builds toward your goal with surgical precision.',
    color: 'white',
  },
];

const colorMap = {
  blue: {
    iconBg: 'bg-blue-500/10',
    iconText: 'text-blue-400',
    line: 'from-blue-500/50',
  },
  emerald: {
    iconBg: 'bg-emerald-500/10',
    iconText: 'text-emerald-400',
    line: 'from-emerald-500/50',
  },
  amber: {
    iconBg: 'bg-amber-500/10',
    iconText: 'text-amber-400',
    line: 'from-amber-500/50',
  },
  white: {
    iconBg: 'bg-white/10',
    iconText: 'text-white',
    line: 'from-white/50',
  },
};

export const HowItWorksSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });

  return (
    <section className="relative py-32 overflow-hidden" ref={containerRef}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950" />
      
      <div className="relative z-10 container mx-auto px-6">
        {/* Section header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            <span className="text-white">How It </span>
            <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">Works</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            From raw data to race-day performance. Four seamless steps to unlock your potential.
          </p>
        </motion.div>

        {/* Steps grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {steps.map((step, index) => {
            const colors = colorMap[step.color as keyof typeof colorMap];
            
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.15,
                  ease: [0.21, 0.47, 0.32, 0.98]
                }}
              >
                <GlassCard className="p-6 h-full" hover delay={index * 0.15}>
                  {/* Step number */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-mono text-slate-600">0{index + 1}</span>
                    <div className={`h-px flex-1 bg-gradient-to-r ${colors.line} to-transparent`} />
                  </div>

                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl ${colors.iconBg} flex items-center justify-center mb-4`}>
                    <step.icon className={`w-6 h-6 ${colors.iconText}`} />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>

        {/* Connection lines (desktop) */}
        <div className="hidden lg:block absolute top-1/2 left-1/2 -translate-x-1/2 w-[800px] h-px">
          <motion.div
            className="h-full bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, delay: 0.5 }}
          />
        </div>
      </div>
    </section>
  );
};
