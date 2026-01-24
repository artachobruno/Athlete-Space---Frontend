import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface ProfileAvatarProps {
  name?: string;
  email?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
};

export function ProfileAvatar({ name, email, size = 'lg', className }: ProfileAvatarProps) {
  const initials = useMemo(() => {
    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return '?';
  }, [name, email]);

  // Generate a consistent color based on the name/email
  const bgColor = useMemo(() => {
    const str = name || email || '';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Use HSL for consistent saturation/lightness with varying hue
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 45%, 55%)`;
  }, [name, email]);

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold text-white shrink-0',
        'ring-2 ring-white/20 shadow-lg',
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: bgColor }}
    >
      {initials}
    </div>
  );
}
