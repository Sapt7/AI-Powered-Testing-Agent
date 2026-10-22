import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const hsl = (token: string) => `hsl(var(--${token}))`;
const hslA = (token: string) => `hsl(var(--${token}) / <alpha-value>)`;

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        sans: ["Archivo", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SF Mono", "Menlo", "monospace"],
      },
      colors: {
        border: hsl("border"),
        input: hsl("input"),
        ring: hsl("ring"),
        background: hsl("background"),
        foreground: hsl("foreground"),
        primary: { DEFAULT: hsl("primary"), foreground: hsl("primary-foreground") },
        secondary: { DEFAULT: hsl("secondary"), foreground: hsl("secondary-foreground") },
        destructive: { DEFAULT: hsl("destructive"), foreground: hsl("destructive-foreground") },
        muted: { DEFAULT: hsl("muted"), foreground: hsl("muted-foreground") },
        accent: { DEFAULT: hsl("accent"), foreground: hsl("accent-foreground") },
        popover: { DEFAULT: hsl("popover"), foreground: hsl("popover-foreground") },
        card: { DEFAULT: hsl("card"), foreground: hsl("card-foreground") },

        /* The test-section world, addressable by name. */
        facility: { DEFAULT: hslA("facility"), deep: hslA("facility-deep") },
        panel: hslA("panel"),
        line: { DEFAULT: hslA("line"), strong: hslA("line-strong") },
        graphite: {
          DEFAULT: hslA("graphite"),
          2: hslA("graphite-2"),
          3: hslA("graphite-3"),
          line: hslA("graphite-line"),
        },
        ink: { DEFAULT: hslA("ink"), 2: hslA("ink-2"), 3: hslA("ink-3") },
        flow: { DEFAULT: hslA("flow"), 2: hslA("flow-2"), 3: hslA("flow-3") },
        safety: { DEFAULT: hslA("safety"), deep: hslA("safety-deep") },
        fluid: {
          high: hslA("fluid-high"),
          med: hslA("fluid-med"),
          low: hslA("fluid-low"),
          "high-text": hslA("fluid-high-text"),
          "med-text": hslA("fluid-med-text"),
          "low-text": hslA("fluid-low-text"),
        },

        sidebar: {
          DEFAULT: hsl("sidebar-background"),
          foreground: hsl("sidebar-foreground"),
          primary: hsl("sidebar-primary"),
          "primary-foreground": hsl("sidebar-primary-foreground"),
          accent: hsl("sidebar-accent"),
          "accent-foreground": hsl("sidebar-accent-foreground"),
          border: hsl("sidebar-border"),
          ring: hsl("sidebar-ring"),
        },
      },
      /* Declared end to end so the scale can never invert. */
      borderRadius: {
        none: "0px",
        sm: "3px",
        DEFAULT: "4px",
        md: "4px",
        lg: "var(--radius)",
        xl: "8px",
        "2xl": "12px",
        "3xl": "16px",
        full: "9999px",
      },
      boxShadow: {
        panel: "var(--shadow-panel)",
        window: "var(--shadow-window)",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
