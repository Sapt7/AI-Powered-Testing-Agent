import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const hsl = (token: string) => `hsl(var(--${token}))`;
const hslA = (token: string) => `hsl(var(--${token}) / <alpha-value>)`;

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "Segoe UI Variable Text",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: ["IBM Plex Mono", "ui-monospace", "SF Mono", "Menlo", "Consolas", "monospace"],
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

        ground: { DEFAULT: hslA("ground"), deep: hslA("ground-deep") },
        window: { DEFAULT: hslA("window"), sunk: hslA("window-sunk") },
        ink: { DEFAULT: hslA("ink"), 2: hslA("ink-2"), 3: hslA("ink-3") },
        indigo: {
          DEFAULT: hslA("indigo"),
          deep: hslA("indigo-deep"),
          soft: hslA("indigo-soft"),
          line: hslA("indigo-line"),
        },
        ok: hslA("ok"),
        sev: {
          high: hslA("sev-high"),
          "high-bg": hslA("sev-high-bg"),
          med: hslA("sev-med"),
          "med-bg": hslA("sev-med-bg"),
          low: hslA("sev-low"),
          "low-bg": hslA("sev-low-bg"),
        },
      },
      borderRadius: {
        none: "0px",
        sm: "4px",
        DEFAULT: "6px",
        md: "6px",
        lg: "var(--radius)",
        xl: "12px",
        "2xl": "16px",
        "3xl": "22px",
        full: "9999px",
      },
      boxShadow: {
        window: "var(--shadow-window)",
        raised: "var(--shadow-raised)",
        select: "var(--shadow-select)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
