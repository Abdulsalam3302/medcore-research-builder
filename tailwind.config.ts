import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        med: {
          bg: "#f4f7fb",
          bgAlt: "#eef2f8",
          panel: "#ffffff",
          panelMuted: "#fafbfd",
          ink: "#0b1220",
          inkSoft: "#1f2a44",
          sub: "#5b6577",
          subtle: "#8b94a6",
          line: "#e4e8ef",
          lineStrong: "#cdd4df",
          brand: "#0E6BA8",
          brandDark: "#08507c",
          brandLight: "#3FA0D6",
          teal: "#0E7490",
          accent: "#0EA5E9",
          accentSoft: "#7DD3FC",
          deep: "#1E3A8A",
          gold: "#B08D57",
          good: "#16a34a",
          warn: "#d97706",
          bad: "#dc2626",
          info: "#2563eb",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        display: [
          "var(--font-display)",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
        soft: "0 1px 2px rgba(15,23,42,0.04), 0 6px 16px -8px rgba(15,23,42,0.08)",
        elevated:
          "0 1px 2px rgba(15,23,42,0.05), 0 12px 30px -10px rgba(15,23,42,0.18)",
        ring: "0 0 0 1px rgba(14,107,168,0.18), 0 6px 24px -10px rgba(14,107,168,0.35)",
        glow: "0 10px 40px -10px rgba(14,107,168,0.45)",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #0E7490 0%, #0E6BA8 55%, #1E3A8A 100%)",
        "brand-gradient-soft":
          "linear-gradient(135deg, rgba(14,116,144,0.10) 0%, rgba(14,107,168,0.10) 55%, rgba(30,58,138,0.10) 100%)",
        "hero-mesh":
          "radial-gradient(1200px 480px at 110% -10%, rgba(14,165,233,0.18), transparent 60%), radial-gradient(900px 420px at -10% 110%, rgba(30,58,138,0.18), transparent 60%), linear-gradient(180deg, #ffffff 0%, #f4f7fb 100%)",
        "panel-grid":
          "linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
        "fade-in-up": "fade-in-up 0.55s ease-out",
        "pulse-soft": "pulse-soft 2.2s ease-in-out infinite",
        shimmer: "shimmer 2.4s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
