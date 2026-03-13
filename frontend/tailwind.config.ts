import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        surface: '#0D0F12',
        'surface-2': '#161A20',
        'surface-3': '#1E2329',
        border: '#2A3040',
        text: '#F0EBE1',
        'text-muted': '#8A8F9A',
        accent: '#E8A835',
        teal: '#2DD4BF',
      },
      fontFamily: {
        mono: ['DM Mono', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
