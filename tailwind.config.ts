import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "SF Mono", "monospace"],
        display: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        coach: {
          DEFAULT: "hsl(var(--coach))",
          foreground: "hsl(var(--coach-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Training-specific colors
        training: {
          aerobic: "hsl(var(--training-aerobic))",
          threshold: "hsl(var(--training-threshold))",
          vo2: "hsl(var(--training-vo2))",
          recovery: "hsl(var(--training-recovery))",
          endurance: "hsl(var(--training-endurance))",
        },
        load: {
          fresh: "hsl(var(--load-fresh))",
          optimal: "hsl(var(--load-optimal))",
          overreaching: "hsl(var(--load-overreaching))",
          overtraining: "hsl(var(--load-overtraining))",
        },
        decision: {
          proceed: "hsl(var(--decision-proceed))",
          modify: "hsl(var(--decision-modify))",
          replace: "hsl(var(--decision-replace))",
          rest: "hsl(var(--decision-rest))",
        },
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
        // F1 Design System colors
        f1: {
          void: "hsl(var(--surface-void))",
          telemetry: "hsl(var(--accent-telemetry))",
          "telemetry-dim": "hsl(var(--accent-telemetry-dim))",
          success: "hsl(var(--accent-success))",
          warning: "hsl(var(--accent-warning))",
          danger: "hsl(var(--accent-danger))",
          "text-primary": "hsl(var(--f1-text-primary))",
          "text-secondary": "hsl(var(--f1-text-secondary))",
          "text-tertiary": "hsl(var(--f1-text-tertiary))",
          "text-muted": "hsl(var(--f1-text-muted))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // F1 Design System
        "f1": "0.375rem",
        "f1-lg": "0.5rem",
        "f1-sm": "0.25rem",
      },
      // F1 Design System spacing
      spacing: {
        "f1-section": "1.5rem",
        "f1-card": "1rem",
        "f1-element": "0.75rem",
      },
      // F1 Design System font sizes
      fontSize: {
        "f1-metric-lg": ["2rem", { lineHeight: "1", fontWeight: "500" }],
        "f1-metric-md": ["1.25rem", { lineHeight: "1.2", fontWeight: "500" }],
        "f1-metric-sm": ["0.875rem", { lineHeight: "1.4", fontWeight: "500" }],
        "f1-metric-xs": ["0.75rem", { lineHeight: "1.4", fontWeight: "500" }],
        "f1-label": ["0.625rem", { lineHeight: "1.4", letterSpacing: "0.1em", fontWeight: "500" }],
        "f1-label-md": ["0.6875rem", { lineHeight: "1.4", letterSpacing: "0.08em", fontWeight: "500" }],
        "f1-headline-lg": ["1.5rem", { lineHeight: "1.2", fontWeight: "500", letterSpacing: "-0.01em" }],
        "f1-headline-md": ["1.125rem", { lineHeight: "1.3", fontWeight: "500", letterSpacing: "-0.01em" }],
        "f1-headline-sm": ["1rem", { lineHeight: "1.4", fontWeight: "500" }],
        "f1-body": ["0.875rem", { lineHeight: "1.6" }],
        "f1-body-sm": ["0.8125rem", { lineHeight: "1.5" }],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-up": "fade-up 0.4s ease-out",
        "pulse-subtle": "pulse-subtle 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
