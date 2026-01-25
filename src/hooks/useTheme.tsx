import { useEffect, createContext, useContext } from 'react';

export type Theme = 'dark';

function applyTheme() {
  if (typeof window === 'undefined') return;
  
  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add('dark');
}

interface ThemeContextType {
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Component to provide theme context and initialize theme at app startup
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always use dark theme
  const theme: Theme = 'dark';

  // Apply dark theme on mount
  useEffect(() => {
    applyTheme();
    localStorage.setItem('theme', 'dark');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

