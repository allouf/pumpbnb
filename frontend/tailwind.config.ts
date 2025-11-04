import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#F0B90B", // BNB yellow (keep for compatibility)
          dark: "#C79A09",
          green: "#00D4AA", // Pump.fun style green
          red: "#FF6B6B",
          yellow: "#FFD93D",
        },
        secondary: {
          DEFAULT: "#1E2329", // Dark background
          light: "#2B3139",
        },
        "background-dark": "#0A0A0A",
        "background-card": "#1A1A1A",
        "background-sidebar": "#111111",
        "background-light": "#2A2A2A",
        "text-primary": "#FFFFFF",
        "text-secondary": "#A0A0A0",
        "text-muted": "#666666",
        border: {
          DEFAULT: "#2A2A2A",
          light: "#3A3A3A",
        },
        accent: {
          blue: "#6366F1",
          purple: "#A855F7",
        },
      },
      animation: {
        shimmer: "shimmer 2s linear infinite",
        "pulse-green": "pulse-green 2s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-green": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
