/**
 * Schedule Theme Design Tokens
 * 
 * Extracted design system tokens for schedule/calendar page.
 * Matches production-grade visual language with glassmorphic cards,
 * layered gradients, and premium glow effects.
 */

// ============================================================================
// Page Background
// ============================================================================

/**
 * Base background color (deep slate / near-black)
 */
export const PAGE_BG_BASE = '#020617';

/**
 * Page background gradient structure:
 * - Primary vertical gradient (top → bottom)
 * - Soft radial vignette centered slightly above viewport center
 * - Edge darkening radial gradient for cinematic frame
 * - Linear gradient for depth
 */
export const PAGE_BG = `
  radial-gradient(
    1200px 600px at 50% 20%,
    rgba(56, 189, 248, 0.10) 0%,
    rgba(2, 6, 23, 0.0) 55%
  ),
  radial-gradient(
    100% 80% at 50% 100%,
    rgba(2, 6, 23, 0.0) 0%,
    rgba(2, 6, 23, 0.85) 80%
  ),
  linear-gradient(
    to bottom,
    #020617 0%,
    #020617 40%,
    #01040f 100%
  )
`;

/**
 * Tailwind-ready page background class
 */
export const PAGE_BG_CLASS = 'bg-[var(--page-bg)]';

// ============================================================================
// Card Surface Styling
// ============================================================================

/**
 * Card background - directional glass gradient (not flat)
 * 145deg angle creates depth and dimension
 */
export const CARD_BG = `
  linear-gradient(
    145deg,
    rgba(15, 23, 42, 0.95) 0%,
    rgba(2, 6, 23, 0.92) 55%,
    rgba(2, 6, 23, 0.98) 100%
  )
`;

/**
 * Card border - very thin, cool-toned, semi-transparent
 */
export const CARD_BORDER = 'rgba(148, 163, 184, 0.14)';

/**
 * Card border width
 */
export const CARD_BORDER_WIDTH = '1px';

/**
 * Backdrop blur - subtle but critical for glass effect
 */
export const CARD_BLUR = 'blur(14px)';

/**
 * Inner highlight (top-left sheen)
 * Creates subtle depth and premium feel
 */
export const CARD_INNER_HIGHLIGHT = `
  linear-gradient(
    135deg,
    rgba(255,255,255,0.08) 0%,
    rgba(255,255,255,0.02) 25%,
    transparent 60%
  )
`;

/**
 * Inner shadow for edge lift and depth
 * Creates "floating glass slab" appearance
 */
export const CARD_INNER_SHADOW = `
  inset 0 1px 0 rgba(255,255,255,0.06),
  inset 0 -1px 0 rgba(0,0,0,0.35)
`;

/**
 * Nebula mist – atmospheric layer (not stars)
 * Soft radial gradient for depth and atmosphere
 * Desaturated blue, emanating from center-right, very subtle
 */
export const CARD_NEBULA = `
  radial-gradient(
    320px 240px at 70% 50%,
    rgba(140, 180, 240, 0.08) 0%,
    rgba(140, 180, 240, 0.04) 30%,
    rgba(2, 6, 23, 0.0) 60%
  )
`;

/**
 * Stellar density control (background-size variation)
 * Smaller size = more stars per area
 * Adjusted for very dense Milky Way with many clusters
 */
export const STELLAR_DENSITY = {
  easy: '180px 180px',
  steady: '170px 170px',
  tempo: '160px 160px',
  intervals: '150px 150px',
  long: '140px 140px',
  rest: '180px 180px',
} as const;

/**
 * Tailwind-ready card background class
 */
export const CARD_BG_CLASS = 'bg-[var(--card-bg)]';

/**
 * Tailwind-ready card border class
 */
export const CARD_BORDER_CLASS = 'border-white/10';

/**
 * Tailwind-ready backdrop blur class
 */
export const CARD_BLUR_CLASS = 'backdrop-blur-[14px]';

// ============================================================================
// Glow & Emphasis Effects
// ============================================================================

/**
 * Card glow for highlighted sessions (long / threshold / vo2)
 * Characteristics:
 * - Directional bias (stronger bottom-right)
 * - Still ambient and soft
 * - Radial with soft falloff
 * - Cyan/blue accent
 * - No hard edge
 */
export const CARD_GLOW = `
  20px 30px 80px -40px rgba(56, 189, 248, 0.45),
  0 0 120px -60px rgba(56, 189, 248, 0.25)
`;

/**
 * Tailwind-ready glow class
 */
export const CARD_GLOW_CLASS = 'shadow-[var(--card-glow)]';

// ============================================================================
// Noise / Texture Overlay
// ============================================================================

/**
 * Noise opacity - ultra-fine grain to break gradient banding
 * Barely perceptible unless zoomed (matches reference)
 */
export const NOISE_OPACITY = 0.035;

/**
 * Noise blend mode - soft-light for subtle texture
 * overlay as fallback if Safari behaves oddly
 */
export const NOISE_BLEND_MODE: 'overlay' | 'soft-light' = 'soft-light';

/**
 * CSS-only noise fallback (if noise.png not available)
 * Creates subtle grain pattern
 */
export const NOISE_FALLBACK = `
  repeating-radial-gradient(
    circle at 50% 50%,
    rgba(255,255,255,0.03),
    rgba(255,255,255,0.03) 1px,
    transparent 1px,
    transparent 2px
  )
`;

// ============================================================================
// CSS Variables (for inline styles)
// ============================================================================

/**
 * CSS variables object for inline style usage
 */
export const scheduleThemeVars = {
  '--page-bg-base': PAGE_BG_BASE,
  '--page-bg': PAGE_BG,
  '--card-bg': CARD_BG,
  '--card-border': CARD_BORDER,
  '--card-border-width': CARD_BORDER_WIDTH,
  '--card-blur': CARD_BLUR,
  '--card-inner-highlight': CARD_INNER_HIGHLIGHT,
  '--card-inner-shadow': CARD_INNER_SHADOW,
  '--card-nebula': CARD_NEBULA,
  '--card-glow': CARD_GLOW,
  '--noise-opacity': NOISE_OPACITY.toString(),
} as const;
