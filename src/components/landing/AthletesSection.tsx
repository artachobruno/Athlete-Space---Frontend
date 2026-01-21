import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { GlassCard } from './GlassCard';

const sports = [
  { name: 'Marathon', stat: '2:58:42', label: 'PR Potential' },
  { name: 'Triathlon', stat: '9:14:33', label: 'Ironman Ready' },
  { name: 'Ultra', stat: '100mi', label: 'Distance Unlocked' },
  { name: 'Cycling', stat: '4.2 w/kg', label: 'FTP Goal' },
];

export const AthletesSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const x = useTransform(scrollYProgress, [0, 1], ['-10%', '10%']);

  return (
    <section ref={containerRef} className="relative py-32 overflow-hidden">
      {/* Background video layer - iOS WebKit compatible */}
      <div className="absolute inset-0">
        <video
          className="absolute inset-0 w-full h-full object-cover opacity-10"
          autoPlay
          loop
          muted
          playsInline
          webkit-playsinline="true"
          preload="auto"
        >
          <source src="/Hyrox_male.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/95 to-slate-950" />
      </div>

      <div className="relative z-10 container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              <span className="text-white">Built for </span>
              <span className="bg-gradient-to-r from-blue-400 via-emerald-400 to-blue-400 bg-clip-text text-transparent">
                Serious Athletes
              </span>
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Whether you're chasing a Boston qualifier or your first finish line, 
              Athlete Space scales to your ambition.
            </p>
          </motion.div>

          {/* Sports cards - horizontal scroll effect */}
          <motion.div 
            className="flex gap-6 justify-center flex-wrap"
            style={{ x }}
          >
            {sports.map((sport, index) => (
              <motion.div
                key={sport.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="w-full sm:w-auto"
              >
                <GlassCard 
                  className="p-8 min-w-[200px] text-center" 
                  glow={index === 0 ? 'blue' : index === 1 ? 'emerald' : 'none'}
                  delay={index * 0.1}
                >
                  <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">
                    {sport.name}
                  </div>
                  <div className="text-3xl md:text-4xl font-mono font-bold text-white mb-1">
                    {sport.stat}
                  </div>
                  <div className="text-sm text-emerald-400">
                    {sport.label}
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            className="text-center mt-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <p className="text-slate-500 text-sm mb-6">
              Join 12,000+ athletes training smarter
            </p>
            <motion.div
              className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/[0.03] border border-white/[0.08]"
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
            >
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 border-2 border-slate-900"
                  />
                ))}
              </div>
              <span className="text-sm text-slate-400">
                <span className="text-white font-medium">+2,847</span> joined this month
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
