import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui"],
      },
      colors: {
        canvas: "#09090b",
        panel: "#111114",
        accent: "#a78bfa",
      },
      boxShadow: {
        glow: "0 0 48px rgba(139, 92, 246, 0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
