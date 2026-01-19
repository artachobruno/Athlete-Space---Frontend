import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import anime from 'animejs';

interface TelemetrySignalProps {
  className?: string;
  animate?: boolean;
}

export const TelemetrySignal = ({ className = '', animate = true }: TelemetrySignalProps) => {
  const pathRef = useRef<SVGPathElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Generate a realistic performance curve
  const generatePath = () => {
    const points: [number, number][] = [];
    const width = 1200;
    const height = 200;
    const segments = 120;
    
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * width;
      const progress = i / segments;
      
      // Create a realistic training load curve with variations
      const baseY = height * 0.5;
      const trend = Math.sin(progress * Math.PI * 0.8) * 40; // Overall trend
      const micro = Math.sin(progress * Math.PI * 8) * 15; // Micro fluctuations
      const noise = (Math.random() - 0.5) * 10; // Slight noise
      const spike = progress > 0.6 && progress < 0.7 ? -30 : 0; // Performance spike
      
      const y = baseY - trend - micro - noise - spike;
      points.push([x, Math.max(20, Math.min(height - 20, y))]);
    }
    
    // Convert to SVG path
    let d = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 1; i < points.length; i++) {
      const [x, y] = points[i];
      const [px, py] = points[i - 1];
      const cpx = (px + x) / 2;
      d += ` C ${cpx} ${py}, ${cpx} ${y}, ${x} ${y}`;
    }
    
    return d;
  };

  const pathData = useRef(generatePath());

  useEffect(() => {
    if (!animate || hasAnimated || !pathRef.current) return;

    const path = pathRef.current;
    const length = path.getTotalLength();
    
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;

    anime({
      targets: path,
      strokeDashoffset: [length, 0],
      duration: 3000,
      easing: 'easeInOutQuart',
      complete: () => setHasAnimated(true),
    });
  }, [animate, hasAnimated]);

  return (
    <motion.div 
      className={`relative ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 0.5 }}
    >
      <svg
        viewBox="0 0 1200 200"
        className="w-full h-auto"
        preserveAspectRatio="none"
      >
        {/* Gradient definition */}
        <defs>
          <linearGradient id="signalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(210, 100%, 50%)" stopOpacity="0.3" />
            <stop offset="30%" stopColor="hsl(210, 100%, 60%)" stopOpacity="0.8" />
            <stop offset="60%" stopColor="hsl(160, 80%, 45%)" stopOpacity="1" />
            <stop offset="80%" stopColor="hsl(210, 100%, 60%)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="hsl(210, 100%, 50%)" stopOpacity="0.4" />
          </linearGradient>
          
          {/* Glow filter */}
          <filter id="signalGlow" x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background reference lines */}
        <line x1="0" y1="100" x2="1200" y2="100" stroke="hsl(215, 20%, 20%)" strokeWidth="0.5" strokeDasharray="4 8" />
        <line x1="0" y1="50" x2="1200" y2="50" stroke="hsl(215, 20%, 15%)" strokeWidth="0.5" strokeDasharray="2 12" />
        <line x1="0" y1="150" x2="1200" y2="150" stroke="hsl(215, 20%, 15%)" strokeWidth="0.5" strokeDasharray="2 12" />

        {/* Main signal line */}
        <path
          ref={pathRef}
          d={pathData.current}
          fill="none"
          stroke="url(#signalGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#signalGlow)"
        />
      </svg>
    </motion.div>
  );
};
