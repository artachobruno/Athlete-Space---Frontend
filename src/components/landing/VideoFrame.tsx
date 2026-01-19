import { motion, useInView } from 'framer-motion';
import { useRef, useEffect } from 'react';

interface VideoFrameProps {
  src: string;
  className?: string;
}

export const VideoFrame = ({ src, className = '' }: VideoFrameProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isInView = useInView(containerRef, { once: false, margin: '-20%' });

  useEffect(() => {
    if (videoRef.current) {
      if (isInView) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [isInView]);

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
        ATHLETE · LIVE
      </div>

      {/* Video content */}
      <video
        ref={videoRef}
        loop
        muted
        playsInline
        className="w-full h-full object-cover opacity-60"
        style={{ filter: 'saturate(0.6) contrast(1.1)' }}
      >
        <source src={src} type="video/mp4" />
      </video>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40" />
    </motion.div>
  );
};
