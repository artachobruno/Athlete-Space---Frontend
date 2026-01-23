import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import anime from 'animejs';
import { VideoFrame } from './VideoFrame';

const stages = [
  { id: 'data', label: 'DATA', sublabel: 'Sensors & sessions' },
  { id: 'signal', label: 'SIGNAL', sublabel: 'Pattern recognition' },
  { id: 'decision', label: 'DECISION', sublabel: 'AI analysis' },
  { id: 'adaptation', label: 'ADAPTATION', sublabel: 'Training response' },
];

export const MentalModelSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (isInView && !hasAnimated) {
      // Animate connection lines
      anime({
        targets: '.flow-line',
        strokeDashoffset: [anime.setDashoffset, 0],
        duration: 800,
        delay: anime.stagger(300, { start: 200 }),
        easing: 'easeInOutQuart',
      });

      // Animate dots
      anime({
        targets: '.flow-dot',
        scale: [0, 1],
        opacity: [0, 1],
        duration: 400,
        delay: anime.stagger(300, { start: 100 }),
        easing: 'easeOutBack',
      });

      setHasAnimated(true);
    }
  }, [isInView, hasAnimated]);

  return (
    <section ref={containerRef} className="relative py-32" id="system">
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
            System Logic
          </span>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Text content and flow diagram */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            {/* Flow diagram */}
            <div className="relative mb-8">
              {/* Connection lines SVG */}
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 800 100"
                preserveAspectRatio="none"
                style={{ height: '100px' }}
              >
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(210, 80%, 50%)" stopOpacity="0.2" />
                    <stop offset="50%" stopColor="hsl(160, 70%, 45%)" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="hsl(210, 80%, 50%)" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
                
                {/* Connecting lines */}
                <line 
                  className="flow-line" 
                  x1="100" y1="50" x2="300" y2="50" 
                  stroke="url(#lineGradient)" 
                  strokeWidth="1"
                  strokeDasharray="200"
                />
                <line 
                  className="flow-line" 
                  x1="300" y1="50" x2="500" y2="50" 
                  stroke="url(#lineGradient)" 
                  strokeWidth="1"
                  strokeDasharray="200"
                />
                <line 
                  className="flow-line" 
                  x1="500" y1="50" x2="700" y2="50" 
                  stroke="url(#lineGradient)" 
                  strokeWidth="1"
                  strokeDasharray="200"
                />
              </svg>

              {/* Stage nodes */}
              <div className="relative flex justify-between items-center py-12">
                {stages.map((stage, index) => (
                  <motion.div
                    key={stage.id}
                    className="flex flex-col items-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15, duration: 0.6 }}
                  >
                    {/* Dot indicator */}
                    <div 
                      className="flow-dot w-2 h-2 rounded-full bg-slate-600 mb-4 opacity-0"
                      style={{ transform: 'scale(0)' }}
                    />
                    
                    {/* Label */}
                    <span className="text-sm font-mono tracking-[0.15em] text-slate-300 mb-1">
                      {stage.label}
                    </span>
                    
                    {/* Sublabel */}
                    <span className="text-[10px] font-mono tracking-wider text-slate-600">
                      {stage.sublabel}
                    </span>

                    {/* Arrow indicator (except last) */}
                    {index < stages.length - 1 && (
                      <span className="absolute text-slate-700 text-xs" style={{ left: `${(index + 0.5) * 25}%`, top: '50%', transform: 'translateY(-50%)' }}>
                        →
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* System Logic explanation */}
            <div>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Performance is not training more.
                <br />
                It is managing stress faster than it accumulates.
              </p>
              <p className="text-slate-500 text-sm leading-relaxed font-mono">
                AthleteSpace models load, recovery, and adaptation continuously —
                not just after workouts.
              </p>
            </div>
          </motion.div>

          {/* Video frame */}
          <VideoFrame 
            src="/crossFit_female.mp4"
            className="aspect-video rounded-sm"
          />
        </div>
      </div>

    </section>
  );
};
