import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        bg2: 'var(--bg2)',
        bg3: 'var(--bg3)',
        card: 'var(--card)',
        card2: 'var(--card2)',
        border: 'var(--border)',
        border2: 'var(--border2)',
        yellow: 'var(--yellow)',
        yellow2: 'var(--yellow2)',
        yellowDim: 'var(--yellow-dim)',
        red: 'var(--red)',
        redDim: 'var(--red-dim)',
        green: 'var(--green)',
        greenDim: 'var(--green-dim)',
        orange: 'var(--orange)',
        blue: 'var(--blue)',
        text: 'var(--text)',
        text2: 'var(--text2)',
        text3: 'var(--text3)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'var(--font-barlow)', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'var(--font-space-mono)', 'monospace'],
        cond: ['var(--font-barlow-condensed)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
