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
        background: "#F8FAFC", // Soft Slate 50
        surface: "#FFFFFF",
        border: "#E2E8F0", // Slate 200
        primary: {
          DEFAULT: "#3B82F6", // Blue 500
          hover: "#2563EB", // Blue 600
          light: "#DBEAFE", // Blue 100
        },
        accent: {
          up: "#10B981",
          down: "#EF4444",
          line: "#3B82F6",
        }
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
        mono: ["JetBrains Mono", "Geist Mono", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"],
      },
      boxShadow: {
        'soft': '0 10px 40px -10px rgba(59, 130, 246, 0.1)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      }
    },
  },
  plugins: [],
};
export default config;
