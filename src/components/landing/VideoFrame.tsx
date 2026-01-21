import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState, useCallback } from 'react';

interface VideoFrameProps {
  src: string;
  className?: string;
  opacity?: number;
  filter?: string;
  label?: string;
}

export const VideoFrame = ({ src, className = '', opacity = 0.6, filter = 'saturate(0.6) contrast(1.1)', label = 'ATHLETE · LIVE' }: VideoFrameProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isInView = useInView(containerRef, { once: false, margin: '-20%' });
  const [hasInteracted, setHasInteracted] = useState(false);

  const attemptPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay was prevented, will retry on user interaction
      });
    }
  }, []);

  // Handle user interaction to enable autoplay on iOS
  useEffect(() => {
    const handleInteraction = () => {
      setHasInteracted(true);
      if (isInView) {
        attemptPlay();
      }
    };

    if (!hasInteracted) {
      document.addEventListener('touchstart', handleInteraction, { once: true });
      document.addEventListener('click', handleInteraction, { once: true });
    }

    return () => {
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('click', handleInteraction);
    };
  }, [hasInteracted, isInView, attemptPlay]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isInView) {
      attemptPlay();
    } else {
      video.pause();
    }
  }, [isInView, attemptPlay]);

  return (
    <motion.div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
    >
      {/* Telemetry frame border */}
      <div className="absolute inset-0 border border-slate-800/50 pointer-events-none z-10">
        {/* Corner markers */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-slate-700/50" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-slate-700/50" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-slate-700/50" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-slate-700/50" />
      </div>

      {/* Reference label */}
      <div className="absolute top-2 left-3 z-10 text-[9px] font-mono tracking-wider text-slate-600">
        {label}
      </div>

      {/* Video content - iOS WebKit compatible attributes */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="w-full h-full object-cover"
        style={{ filter, opacity }}
      >
        <source src={src} type="video/mp4" />
      </video>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40" />
    </motion.div>
  );
};
