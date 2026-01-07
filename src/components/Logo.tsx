import { useTheme } from '@/hooks/useTheme';
import { useEffect, useState } from 'react';
import logoLight from '@/assets/AthleteSpace_logo_light.jpg';
import logoDark from '@/assets/AthleteSpace_logo_dark.jpg';

interface LogoProps {
  className?: string;
  alt?: string;
}

export function Logo({ className = '', alt = 'AthleteSpace' }: LogoProps) {
  const { theme } = useTheme();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const updateTheme = () => {
      if (theme === 'dark') {
        setIsDark(true);
      } else if (theme === 'light') {
        setIsDark(false);
      } else {
        // system theme - check actual system preference
        setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
      }
    };

    updateTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => setIsDark(mediaQuery.matches);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);
  
  // Use light logo for dark theme, dark logo for light theme
  const logoPath = isDark ? logoLight : logoDark;
  
  return (
    <img 
      src={logoPath} 
      alt={alt} 
      className={className}
    />
  );
}

