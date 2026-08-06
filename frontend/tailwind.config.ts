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
        background: "#0A0A0A",
        surface: "#111111",
        border: "#333333",
        accent: {
          up: "#10B981", // Muted emerald
          down: "#EF4444", // Muted red
          line: "#6366F1", // Indigo for prediction
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "Geist Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
