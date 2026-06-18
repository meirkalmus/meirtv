import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-heebo)", "Arial", "sans-serif"],
      },
      colors: {
        brand: {
          50:  "#eef1ff",
          100: "#dce3f0",
          500: "#0f3460",
          600: "#16213e",
          700: "#1a1a2e",
          900: "#0a0a1a",
        },
        gold: {
          300: "#f0d060",
          400: "#d4af37",
          500: "#b8960c",
        },
      },
      direction: {
        rtl: "rtl",
      },
    },
  },
  plugins: [],
};

export default config;
