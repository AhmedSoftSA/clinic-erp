/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./client/index.html", "./client/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        mist: "rgb(var(--color-mist) / <alpha-value>)",
        paper: "rgb(var(--color-paper) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        "ink-soft": "rgb(var(--color-ink-soft) / <alpha-value>)",
        pine: {
          DEFAULT: "rgb(var(--color-pine) / <alpha-value>)",
          dark: "rgb(var(--color-pine-dark) / <alpha-value>)",
          light: "rgb(var(--color-pine-light) / <alpha-value>)",
        },
        clay: {
          DEFAULT: "rgb(var(--color-clay) / <alpha-value>)",
          light: "rgb(var(--color-clay-light) / <alpha-value>)",
        },
        line: "rgb(var(--color-line) / <alpha-value>)",
        success: {
          DEFAULT: "rgb(var(--color-success) / <alpha-value>)",
          light: "rgb(var(--color-success-light) / <alpha-value>)",
        },
        warning: {
          DEFAULT: "rgb(var(--color-warning) / <alpha-value>)",
          light: "rgb(var(--color-warning-light) / <alpha-value>)",
        },
        danger: {
          DEFAULT: "rgb(var(--color-danger) / <alpha-value>)",
          light: "rgb(var(--color-danger-light) / <alpha-value>)",
        },
        info: {
          DEFAULT: "rgb(var(--color-info) / <alpha-value>)",
          light: "rgb(var(--color-info-light) / <alpha-value>)",
        },
      },
      fontFamily: {
        display: ["Tajawal", "sans-serif"],
        body: ["'IBM Plex Sans Arabic'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      borderRadius: {
        card: "14px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(22,35,31,0.04), 0 4px 14px rgba(22,35,31,0.06)",
      },
      keyframes: {
        pulseLine: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
      },
      animation: {
        "pulse-line": "pulseLine 2.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
