import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  /** 
   * Size variant for different placements:
   * - nav: h-5 or h-6 for navigation bars
   * - footer: h-4 for footer placement  
   * - default: h-6 standard size
   */
  size?: 'nav' | 'footer' | 'default';
}

/**
 * AthleteSpace Logo Component
 * 
 * Uses the dark logo image asset. Placement rules:
 * - Top-left: primary brand anchor (nav)
 * - Footer/bottom: secondary reference only
 * - Never center the logo on dashboard pages
 */
export function Logo({ className = '', size = 'default' }: LogoProps) {
  const sizeClasses = {
    nav: 'h-5 md:h-6',
    footer: 'h-4',
    default: 'h-6',
  };

  return (
    <img
      src="/AthleteSpace_logo_dark.jpg"
      alt="AthleteSpace"
      className={cn(
        sizeClasses[size],
        'w-auto opacity-90 pointer-events-none select-none',
        className
      )}
    />
  );
}

