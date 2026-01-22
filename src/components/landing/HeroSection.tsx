import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import anime from 'animejs';
import { Button } from '@/components/ui/button';
import { GlassCard } from './GlassCard';
import { AnimatedMetric } from './AnimatedMetric';
import { AnimatedBackground } from './AnimatedBackground';
import { ChevronDown, Activity, Zap, Brain } from 'lucide-react';

export const HeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useEffect(() => {
    // Animate headline words
    if (headlineRef.current) {
      const words = headlineRef.current.querySelectorAll('.word');
      anime({
        targets: words,
        opacity: [0, 1],
        translateY: [40, 0],
        duration: 1200,
        delay: anime.stagger(100, { start: 300 }),
        easing: 'easeOutExpo',
      });
    }

    // Animate the data lines in SVG
    anime({
      targets: '.data-line',
      strokeDashoffset: [anime.setDashoffset, 0],
      duration: 2000,
      delay: anime.stagger(200, { start: 800 }),
      easing: 'easeInOutQuart',
    });
  }, []);

  return (
    <motion.section
      ref={containerRef}
      className="relative min-h-[100svh] flex items-center justify-center overflow-hidden"
      style={{ opacity }}
    >
      <AnimatedBackground />

      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <motion.video
          className="absolute inset-0 w-full h-full object-cover"
          style={{ y, opacity: videoLoaded ? 0.15 : 0 }}
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
        >
          <source src="/Cycling_male.mp4" type="video/mp4" />
        </motion.video>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/80 to-slate-950" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">
          {/* Main Hero Content */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] border border-white/[0.08] backdrop-blur-sm mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm text-slate-300 font-medium">AI-Powered Training Intelligence</span>
            </motion.div>

            {/* Headline */}
            <h1
              ref={headlineRef}
              className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8"
            >
              <span className="word inline-block opacity-0 bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent">
                Intelligence
              </span>{' '}
              <span className="word inline-block opacity-0 text-slate-400">for</span>
              <br />
              <span className="word inline-block opacity-0 bg-gradient-to-r from-blue-400 via-emerald-400 to-blue-400 bg-clip-text text-transparent">
                Endurance
              </span>{' '}
              <span className="word inline-block opacity-0 bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent">
                Athletes
              </span>
            </h1>

            {/* Subheadline */}
            <motion.p
              className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              Train with precision. Plan with confidence. Perform at your peak.
            </motion.p>

            {/* CTAs */}
            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
            >
              <Button
                size="lg"
                className="relative group px-8 py-6 text-lg bg-white text-slate-900 hover:bg-white/90 rounded-xl font-semibold overflow-hidden transition-all duration-300"
              >
                <span className="relative z-10">Join the Space</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-400 to-emerald-400"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
                <motion.span
                  className="absolute inset-0 flex items-center justify-center text-white font-semibold"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  Join the Space
                </motion.span>
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="px-8 py-6 text-lg text-slate-300 hover:text-white hover:bg-white/[0.05] rounded-xl font-medium border border-white/[0.08]"
              >
                See How It Works
              </Button>
            </motion.div>
          </motion.div>

          {/* Floating Metrics Card */}
          <motion.div
            className="max-w-4xl mx-auto"
            style={{ y: useTransform(scrollYProgress, [0, 1], ['0%', '15%']) }}
          >
            <GlassCard className="p-8" glow="blue" delay={0.4}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <AnimatedMetric
                  label="Training Load"
                  value={847}
                  unit="TSS"
                  delay={600}
                  color="blue"
                />
                <AnimatedMetric
                  label="Fitness"
                  value={72.4}
                  unit="CTL"
                  decimals={1}
                  delay={800}
                  color="emerald"
                />
                <AnimatedMetric
                  label="Form"
                  value={8.2}
                  unit="TSB"
                  decimals={1}
                  delay={1000}
                  color="amber"
                />
                <AnimatedMetric
                  label="Readiness"
                  value={94}
                  unit="%"
                  delay={1200}
                  color="white"
                />
              </div>

              {/* Mini chart visualization */}
              <div className="mt-8 pt-6 border-t border-white/[0.06]">
                <svg className="w-full h-24" viewBox="0 0 400 80" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="50%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Area fill */}
                  <path
                    d="M0 70 Q50 50 100 55 T200 35 T300 45 T400 25 L400 80 L0 80 Z"
                    fill="url(#areaGradient)"
                  />
                  
                  {/* Main line */}
                  <path
                    className="data-line"
                    d="M0 70 Q50 50 100 55 T200 35 T300 45 T400 25"
                    stroke="url(#lineGradient)"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                  
                  {/* Data points */}
                  {[
                    { x: 0, y: 70 },
                    { x: 100, y: 55 },
                    { x: 200, y: 35 },
                    { x: 300, y: 45 },
                    { x: 400, y: 25 },
                  ].map((point, i) => (
                    <motion.circle
                      key={i}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill="#3b82f6"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 1.5 + i * 0.1, duration: 0.3 }}
                    />
                  ))}
                </svg>
              </div>
            </GlassCard>
          </motion.div>

          {/* Feature Pills */}
          <motion.div
            className="flex flex-wrap justify-center gap-4 mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.8 }}
          >
            {[
              { icon: Activity, label: 'Performance Analytics' },
              { icon: Brain, label: 'AI Coach' },
              { icon: Zap, label: 'Real-time Adaptation' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06] text-slate-400 text-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 + i * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.06)' }}
              >
                <item.icon className="w-4 h-4 text-blue-400" />
                {item.label}
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.5 }}
        >
          <motion.div
            className="flex flex-col items-center gap-2 text-slate-500"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="text-xs uppercase tracking-widest">Explore</span>
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
};
