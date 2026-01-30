import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pitch: {
          dark: "#0d3b2e",
          DEFAULT: "#1a6b4f",
          light: "#228b5e",
          stripe: "#2da86a",
        },
        sport: {
          orange: "#ff6b35",
          gold: "#f4a261",
          white: "#f8f9fa",
        },
      },
      fontFamily: {
        display: ["var(--font-outfit)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      animation: {
        "spin-slow": "spin 1.5s linear infinite",
        "bounce-ball": "bounce-ball 0.6s ease-in-out infinite",
      },
      keyframes: {
        "bounce-ball": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-12px) rotate(180deg)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
