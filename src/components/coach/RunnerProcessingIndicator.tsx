import { cn } from '@/lib/utils';

interface RunnerProcessingIndicatorProps {
  className?: string;
  caption?: string;
  /** Animation speed multiplier for later phases */
  speedMultiplier?: number;
}

/**
 * Animated runner indicator shown while coach is processing a request.
 * Uses pure CSS animations with reduced-motion support.
 * Height: 40px to stay subtle and non-distracting.
 */
export function RunnerProcessingIndicator({ 
  className,
  caption = "Coach is building your plan…",
  speedMultiplier = 1
}: RunnerProcessingIndicatorProps) {
  // Calculate animation duration based on speed multiplier (faster = shorter duration)
  const runDuration = Math.max(0.3, 0.6 / speedMultiplier);
  const moveDuration = Math.max(2, 4 / speedMultiplier);

  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center py-2 animate-fade-in",
        className
      )}
      role="status"
      aria-label="Processing"
    >
      {/* Runner container with horizontal movement */}
      <div 
        className="relative w-full max-w-[200px] h-10 overflow-hidden"
        style={{
          // Horizontal movement animation
          animation: `runner-move ${moveDuration}s ease-in-out infinite`,
        }}
      >
        {/* Runner SVG figure */}
        <div 
          className="absolute left-0 w-8 h-8 motion-reduce:animate-none"
          style={{
            animation: `runner-jog ${runDuration}s steps(2) infinite`,
          }}
        >
          <svg 
            viewBox="0 0 32 32" 
            fill="none" 
            className="w-full h-full text-coach"
            aria-hidden="true"
          >
            {/* Head */}
            <circle cx="16" cy="6" r="4" fill="currentColor" />
            
            {/* Body */}
            <path 
              d="M16 10 L16 18" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round"
            />
            
            {/* Arms - animated pose 1 */}
            <g className="runner-arms">
              <path 
                d="M16 12 L10 16" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round"
              />
              <path 
                d="M16 12 L22 14" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round"
              />
            </g>
            
            {/* Legs - animated pose 1 */}
            <g className="runner-legs">
              <path 
                d="M16 18 L11 28" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round"
              />
              <path 
                d="M16 18 L21 26" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round"
              />
            </g>
          </svg>
        </div>

        {/* Motion trail dots */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 flex gap-1 -ml-6 opacity-40">
          <span 
            className="w-1 h-1 bg-coach rounded-full motion-reduce:hidden"
            style={{ animation: `trail-fade 0.6s ease-out infinite` }}
          />
          <span 
            className="w-1.5 h-1.5 bg-coach rounded-full motion-reduce:hidden"
            style={{ animation: `trail-fade 0.6s ease-out infinite 0.1s` }}
          />
          <span 
            className="w-1 h-1 bg-coach rounded-full motion-reduce:hidden"
            style={{ animation: `trail-fade 0.6s ease-out infinite 0.2s` }}
          />
        </div>
      </div>

      {/* Optional caption */}
      {caption && (
        <p className="text-xs text-muted-foreground mt-1 text-center">
          {caption}
        </p>
      )}

      {/* CSS Keyframes */}
      <style>{`
        @keyframes runner-move {
          0%, 100% {
            transform: translateX(0%);
          }
          50% {
            transform: translateX(calc(100% - 32px));
          }
        }

        @keyframes runner-jog {
          0%, 100% {
            transform: translateY(0px) scaleX(1);
          }
          50% {
            transform: translateY(-2px) scaleX(-1);
          }
        }

        @keyframes trail-fade {
          0%, 100% {
            opacity: 0.1;
          }
          50% {
            opacity: 0.5;
          }
        }

        /* Reduced motion - static runner with pulse */
        @media (prefers-reduced-motion: reduce) {
          .runner-arms, .runner-legs {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
