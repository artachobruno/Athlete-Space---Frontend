import { motion } from 'framer-motion';
import { GlassCard } from './GlassCard';
import { Cpu, LineChart, Shield, Sparkles } from 'lucide-react';

const features = [
  {
    icon: Cpu,
    title: 'AI That Understands You',
    description: 'Not generic plans. Training that learns your physiology, adapts to your life, and evolves with your fitness.',
    highlight: 'Personalized to your DNA',
  },
  {
    icon: LineChart,
    title: 'Data-Driven Decisions',
    description: 'Every recommendation is backed by your training history, recovery metrics, and performance trends.',
    highlight: '10M+ data points analyzed',
  },
  {
    icon: Shield,
    title: 'Injury Prevention',
    description: 'Proactive load management that keeps you healthy. Train hard, but train smart.',
    highlight: '40% fewer overuse injuries',
  },
  {
    icon: Sparkles,
    title: 'Peak When It Matters',
    description: 'Periodization that builds toward your goal. Arrive at the start line ready to perform.',
    highlight: 'Race-day optimization',
  },
];

export const WhySection = () => {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-slate-950" />
      
      {/* Gradient orbs */}
      <motion.div
        className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%)',
        }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      
      <div className="relative z-10 container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            className="mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-12 bg-gradient-to-r from-blue-500 to-transparent" />
              <span className="text-sm uppercase tracking-widest text-blue-400 font-medium">Why Athlete Space</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight max-w-3xl">
              <span className="text-white">Training intelligence </span>
              <span className="bg-gradient-to-r from-slate-400 to-slate-600 bg-clip-text text-transparent">
                that actually works
              </span>
            </h2>
          </motion.div>

          {/* Features grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.1,
                  ease: [0.21, 0.47, 0.32, 0.98]
                }}
              >
                <GlassCard className="p-8 h-full group" hover delay={index * 0.1}>
                  <div className="flex items-start gap-5">
                    {/* Icon */}
                    <div className="shrink-0">
                      <motion.div
                        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-emerald-500/10 flex items-center justify-center border border-white/[0.05]"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        <feature.icon className="w-7 h-7 text-blue-400" />
                      </motion.div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-slate-400 leading-relaxed mb-4">
                        {feature.description}
                      </p>
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="text-xs text-emerald-400 font-medium">{feature.highlight}</span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
