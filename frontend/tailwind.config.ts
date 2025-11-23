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
        "border-pulse": "border-pulse 1.5s ease-in-out infinite",
        "gradient-shift": "gradient-shift 2s ease infinite",
        "ath-shimmer": "ath-shimmer 2s linear infinite",
        "sparkle": "sparkle 1s ease-in-out infinite",
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
        "border-pulse": {
          "0%, 100%": { boxShadow: "0 0 4px rgba(250, 204, 21, 0.4)" },
          "50%": { boxShadow: "0 0 12px rgba(250, 204, 21, 0.8)" },
        },
        "gradient-shift": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "ath-shimmer": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "sparkle": {
          "0%, 100%": { opacity: "0", transform: "scale(0)" },
          "50%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
