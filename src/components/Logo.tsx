import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  variant?: 'default' | 'inverse';
}

export function Logo({ className = '', variant = 'default' }: LogoProps) {
  return (
    <span 
      className={cn(
        "font-semibold tracking-wide select-none",
        variant === 'default' 
          ? "text-primary" 
          : "text-primary-foreground",
        className
      )}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      AthleteSpace
    </span>
  );
}

