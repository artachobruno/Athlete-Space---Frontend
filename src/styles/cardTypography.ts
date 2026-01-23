/**
 * Card Typography Design Tokens
 * 
 * Shared typography system for workout cards across all views.
 * Ensures consistent text hierarchy, spacing, and alignment.
 */

export const CardTypography = {
  title: {
    fontSize: '16px',
    fontWeight: 600,
    letterSpacing: '-0.01em',
    lineHeight: '1.25',
    color: 'rgba(255,255,255,0.95)',
  },

  titleCompact: {
    fontSize: '14px',
    fontWeight: 600,
    letterSpacing: '-0.005em',
    lineHeight: '1.25',
    color: 'rgba(255,255,255,0.9)',
  },

  metaChip: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
  },

  stat: {
    fontSize: '13px',
    fontWeight: 400,
    color: 'rgba(255,255,255,0.75)',
  },

  description: {
    fontSize: '13px',
    lineHeight: '1.4',
    color: 'rgba(255,255,255,0.65)',
  },
};
