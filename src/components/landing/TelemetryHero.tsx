import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TelemetrySignal } from './TelemetrySignal';
import { TelemetryStatusBand } from './TelemetryStatusBand';

export const TelemetryHero = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.8;
    }
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col bg-slate-950">
      {/* Subtle grid background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(215, 20%, 30%) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(215, 20%, 30%) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
          }}
        />
        
        {/* Video background - more visible */}
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-[0.25]"
          style={{ filter: 'saturate(0.7) contrast(1.1)' }}
        >
          <source src="/Cycling_male.mp4" type="video/mp4" />
        </video>
        
        {/* Gradient overlay to maintain readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/60 to-slate-950" />
      </div>

      {/* Status band at top */}
      <div className="relative z-10 pt-20">
        <TelemetryStatusBand />
      </div>

      {/* Main hero content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center container mx-auto px-6 py-16">
        {/* Minimal branding */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <img 
              src="/AthleteSpace_logo_dark.jpg" 
              alt="Athlete Space" 
              className="h-8 w-auto opacity-90"
            />
          </div>
          
          <h1 className="text-slate-400 text-sm tracking-[0.2em] uppercase font-mono mb-4">
            Performance System
          </h1>
          
          <p className="text-slate-500 text-sm max-w-md tracking-wide leading-relaxed">
            Signal-driven training intelligence for endurance athletes.
          </p>
        </motion.div>

        {/* Dominant telemetry signal */}
        <div className="relative">
          <TelemetrySignal className="w-full max-w-5xl" animate />
          
          {/* Minimal labels */}
          <motion.div 
            className="absolute -bottom-8 left-0 flex gap-8 text-[10px] font-mono tracking-wider text-slate-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.5, duration: 0.8 }}
          >
            <span>30d</span>
            <span className="text-slate-500">|</span>
            <span>TRAINING LOAD SIGNAL</span>
          </motion.div>
        </div>

        {/* CTA - subtle, invitation style */}
        <motion.div 
          className="mt-24 flex items-center gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4, duration: 0.8 }}
        >
          <a 
            href="/login"
            className="text-sm font-mono tracking-[0.1em] text-slate-400 hover:text-slate-200 transition-colors border-b border-slate-700 hover:border-slate-500 pb-1"
          >
            Enter Athlete Space
          </a>
          <span className="text-slate-700">|</span>
          <a 
            href="#system"
            className="text-sm font-mono tracking-[0.1em] text-slate-600 hover:text-slate-400 transition-colors"
          >
            View Performance System
          </a>
        </motion.div>
      </div>

      {/* Bottom reference line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-800/50 to-transparent" />
    </section>
  );
};
