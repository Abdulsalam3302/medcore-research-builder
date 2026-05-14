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
          bg: "#f6f8fb",
          panel: "#ffffff",
          ink: "#0f172a",
          sub: "#475569",
          line: "#e2e8f0",
          brand: "#0e6ba8",
          brandDark: "#08507c",
          accent: "#0ea5e9",
          good: "#16a34a",
          warn: "#d97706",
          bad: "#dc2626",
          info: "#2563eb",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
