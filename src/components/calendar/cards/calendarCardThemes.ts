/**
 * Calendar Card Themes
 * 
 * Color system for calendar workout cards.
 * DO NOT invent colors - use these exact values.
 */

export interface CardTheme {
  base: string;
  text: string;
  secondary: string;
  sparkline: string;
  showSparkline: boolean;
  showPace: boolean;
}

export const CALENDAR_CARD_THEMES: Record<string, CardTheme> = {
  // Completed Activity (Running default)
  'completed-running': {
    base: 'hsl(220 45% 20%)',      // slate blue
    text: '#FFFFFF',
    secondary: '#D6E2FF',
    sparkline: 'rgba(230,238,255,0.9)',
    showSparkline: true,
    showPace: true,
  },
  'completed-cycling': {
    base: 'hsl(220 45% 20%)',
    text: '#FFFFFF',
    secondary: '#D6E2FF',
    sparkline: 'rgba(230,238,255,0.9)',
    showSparkline: true,
    showPace: false,
  },
  'completed-swimming': {
    base: 'hsl(220 45% 20%)',
    text: '#FFFFFF',
    secondary: '#D6E2FF',
    sparkline: 'rgba(230,238,255,0.9)',
    showSparkline: true,
    showPace: false,
  },
  
  // Planned Session
  'planned-running': {
    base: 'hsl(145 45% 22%)',      // green
    text: '#FFFFFF',
    secondary: '#E9FFF1',
    sparkline: 'rgba(230,238,255,0.9)',
    showSparkline: false,
    showPace: false,
  },
  'planned-cycling': {
    base: 'hsl(145 45% 22%)',
    text: '#FFFFFF',
    secondary: '#E9FFF1',
    sparkline: 'rgba(230,238,255,0.9)',
    showSparkline: false,
    showPace: false,
  },
  'planned-swimming': {
    base: 'hsl(145 45% 22%)',
    text: '#FFFFFF',
    secondary: '#E9FFF1',
    sparkline: 'rgba(230,238,255,0.9)',
    showSparkline: false,
    showPace: false,
  },
  
  // Workout / Strength / Cross
  'strength': {
    base: 'hsl(270 45% 24%)',      // purple
    text: '#FFFFFF',
    secondary: '#F1E9FF',
    sparkline: 'rgba(230,238,255,0.9)',
    showSparkline: false,
    showPace: false,
  },
};
