import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import anime from 'animejs';

interface AnimatedMetricProps {
  label: string;
  value: number;
  unit: string;
  decimals?: number;
  duration?: number;
  delay?: number;
  color?: 'blue' | 'emerald' | 'amber' | 'white';
}

export const AnimatedMetric = ({
  label,
  value,
  unit,
  decimals = 0,
  duration = 2000,
  delay = 0,
  color = 'white',
}: AnimatedMetricProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const elementRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  const colorStyles = {
    blue: 'text-blue-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    white: 'text-white',
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            
            const obj = { val: 0 };
            anime({
              targets: obj,
              val: value,
              duration,
              delay,
              easing: 'easeOutExpo',
              update: () => {
                setDisplayValue(obj.val);
              },
            });
          }
        });
      },
      { threshold: 0.5 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [value, duration, delay]);

  return (
    <motion.div
      ref={elementRef}
      className="text-center"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: delay / 1000 }}
    >
      <div className="text-xs uppercase tracking-widest text-slate-500 mb-1 font-medium">
        {label}
      </div>
      <div className={`text-2xl md:text-3xl font-mono font-semibold ${colorStyles[color]} tabular-nums`}>
        {displayValue.toFixed(decimals)}
        <span className="text-sm ml-1 text-slate-400 font-sans">{unit}</span>
      </div>
    </motion.div>
  );
};
