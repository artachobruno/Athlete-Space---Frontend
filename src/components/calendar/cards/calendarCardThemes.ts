/**
 * Calendar Card Themes
 * 
 * Color system for calendar workout cards.
 * Neutral backgrounds matching Dashboard card styling.
 * Uses CSS custom properties for theme compatibility.
 */

export interface CardTheme {
  base: string;
  text: string;
  secondary: string;
  sparkline: string;
  accent: string;
  showSparkline: boolean;
  showPace: boolean;
}

// Neutral card background - matches shadcn Card bg-card
const CARD_BG = 'hsl(240 5% 17%)';           // Dark neutral (matches --card in dark mode)
const CARD_BG_LIGHT = 'hsl(0 0% 100%)';      // Light mode
const TEXT_PRIMARY = 'hsl(0 0% 98%)';        // --foreground dark
const TEXT_SECONDARY = 'hsl(240 5% 65%)';    // --muted-foreground dark

// Accent colors for differentiation (subtle, used for traces/badges)
const ACCENT_COMPLETED = 'hsl(142 71% 45%)'; // Green - completed
const ACCENT_PLANNED = 'hsl(217 91% 60%)';   // Blue - planned  
const ACCENT_STRENGTH = 'hsl(270 60% 60%)';  // Purple - strength

export const CALENDAR_CARD_THEMES: Record<string, CardTheme> = {
  // Completed Activity (Running default)
  'completed-running': {
    base: CARD_BG,
    text: TEXT_PRIMARY,
    secondary: TEXT_SECONDARY,
    sparkline: ACCENT_COMPLETED,
    accent: ACCENT_COMPLETED,
    showSparkline: true,
    showPace: true,
  },
  'completed-cycling': {
    base: CARD_BG,
    text: TEXT_PRIMARY,
    secondary: TEXT_SECONDARY,
    sparkline: ACCENT_COMPLETED,
    accent: ACCENT_COMPLETED,
    showSparkline: true,
    showPace: false,
  },
  'completed-swimming': {
    base: CARD_BG,
    text: TEXT_PRIMARY,
    secondary: TEXT_SECONDARY,
    sparkline: ACCENT_COMPLETED,
    accent: ACCENT_COMPLETED,
    showSparkline: true,
    showPace: false,
  },
  
  // Planned Session
  'planned-running': {
    base: CARD_BG,
    text: TEXT_PRIMARY,
    secondary: TEXT_SECONDARY,
    sparkline: ACCENT_PLANNED,
    accent: ACCENT_PLANNED,
    showSparkline: false,
    showPace: false,
  },
  'planned-cycling': {
    base: CARD_BG,
    text: TEXT_PRIMARY,
    secondary: TEXT_SECONDARY,
    sparkline: ACCENT_PLANNED,
    accent: ACCENT_PLANNED,
    showSparkline: false,
    showPace: false,
  },
  'planned-swimming': {
    base: CARD_BG,
    text: TEXT_PRIMARY,
    secondary: TEXT_SECONDARY,
    sparkline: ACCENT_PLANNED,
    accent: ACCENT_PLANNED,
    showSparkline: false,
    showPace: false,
  },
  
  // Workout / Strength / Cross
  'strength': {
    base: CARD_BG,
    text: TEXT_PRIMARY,
    secondary: TEXT_SECONDARY,
    sparkline: ACCENT_STRENGTH,
    accent: ACCENT_STRENGTH,
    showSparkline: false,
    showPace: false,
  },
};
