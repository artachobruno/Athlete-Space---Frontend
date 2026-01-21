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
        {/* Grid pattern - reduced opacity by 10% */}
        <div 
          className="absolute inset-0 opacity-[0.027]"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(215, 20%, 30%) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(215, 20%, 30%) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
          }}
        />
        
        {/* Video background - increased contrast 8-12%, reduced opacity mask */}
        {/* iOS WebKit compatible attributes for autoplay in WebViews */}
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          // @ts-expect-error webkit-playsinline is required for iOS WebView compatibility
          webkit-playsinline="true"
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover opacity-[0.30]"
          style={{ filter: 'saturate(0.75) contrast(1.20)' }}
        >
          <source src="/Cycling_male.mp4" type="video/mp4" />
        </video>
        
        {/* Gradient overlay to maintain readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/35 via-slate-950/55 to-slate-950" />
      </div>

      {/* Status band at top - account for fixed nav + safe area on iOS */}
      <div 
        className="relative z-10"
        style={{ paddingTop: 'calc(4rem + env(safe-area-inset-top, 0px) + 0.5rem)' }}
      >
        <TelemetryStatusBand />
      </div>

      {/* Main hero content - centered more vertically */}
      <div className="relative z-10 flex-1 flex flex-col justify-center container mx-auto px-6 py-16">
        {/* Hero headline section - increased font size 25% */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.3 }}
        >
          {/* Headline (H1) - slightly reduced to prevent line breaks */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-mono font-light text-slate-200 mb-6 leading-[1.15] tracking-tight">
            Training, driven by Data and Intelligence.
          </h1>
          
          {/* Subheadline (H2) */}
          <h2 className="text-lg md:text-xl lg:text-2xl text-slate-400 font-light mb-4 leading-relaxed max-w-3xl">
            Your training data becomes a signal.
            <br />
            The signal informs a decision.
            <br />
            The decision drives adaptation.
          </h2>
          
          {/* Optional inline system label */}
          <p className="text-xs font-mono tracking-[0.15em] text-slate-500 uppercase mt-4">
            Closed-loop performance system
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

        {/* CTA - updated copy */}
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
            Enter the Performance System
          </a>
          <span className="text-slate-700">|</span>
          <a 
            href="#system"
            className="text-sm font-mono tracking-[0.1em] text-slate-600 hover:text-slate-400 transition-colors"
          >
            View a Live System Example
          </a>
        </motion.div>
      </div>

      {/* Bottom reference line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-800/50 to-transparent" />
    </section>
  );
};
