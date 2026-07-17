import type { Config } from "tailwindcss";

/**
 * TracePilot QA design system.
 *
 * All colors are driven by CSS custom properties defined in `globals.css`
 * (space-separated RGB channels), so every token supports Tailwind's
 * `/<alpha-value>` opacity modifiers and both themes from one source.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      colors: {
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        card: {
          DEFAULT: "rgb(var(--card) / <alpha-value>)",
          foreground: "rgb(var(--card-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--muted) / <alpha-value>)",
          foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          foreground: "rgb(var(--accent-foreground) / <alpha-value>)",
        },
        rust: {
          DEFAULT: "rgb(var(--rust) / <alpha-value>)",
          foreground: "rgb(var(--rust-foreground) / <alpha-value>)",
        },
        wine: "rgb(var(--wine) / <alpha-value>)",
        "soft-red": "rgb(var(--soft-red) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        input: "rgb(var(--input) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 3px)",
        sm: "calc(var(--radius) - 5px)",
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgb(var(--shadow-color) / 0.06)",
        card: "0 1px 3px 0 rgb(var(--shadow-color) / 0.08), 0 8px 24px -12px rgb(var(--shadow-color) / 0.12)",
        pop: "0 24px 60px -20px rgb(var(--shadow-color) / 0.28)",
      },
      letterSpacing: {
        eyebrow: "0.22em",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        scan: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        "pulse-ring": "pulse-ring 1.6s ease-in-out infinite",
        scan: "scan 2.2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
