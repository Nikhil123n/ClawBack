import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#080b11",
        surface: "rgba(255,255,255,0.04)",
        border: "rgba(255,255,255,0.08)",
        "border-strong": "rgba(255,255,255,0.15)",
        blue: {
          accent: "#3080ff",
          dim: "#155dfc",
          glow: "rgba(48,128,255,0.25)",
        },
        emerald: {
          accent: "#00d294",
          dim: "#005f46",
          glow: "rgba(0,210,148,0.2)",
        },
        amber: { accent: "#edb200" },
        slate: {
          text: "#90a1b9",
          dim: "#45556c",
          dark: "#1d293d",
        },
      },
      fontFamily: {
        sans: ["Geist", "Inter", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "JetBrains Mono", "monospace"],
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
        "fade-up": "fade-up 0.5s cubic-bezier(0.4,0,0.2,1) forwards",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%,100%": { boxShadow: "0 0 5px rgba(48,128,255,0.4)" },
          "50%": { boxShadow: "0 0 20px rgba(48,128,255,0.8),0 0 40px rgba(48,128,255,0.3)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
