import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Orion Stream Color Palette
        background: '#0A0A0F',
        surface: '#14141F',
        primary: {
          DEFAULT: '#FF6B4A',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#4A6FFF',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#1E1E2E',
          foreground: '#9CA3AF',
        },
        accent: {
          DEFAULT: '#FF6B4A',
          foreground: '#FFFFFF',
        },
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },
        border: '#2A2A3E',
        input: '#1E1E2E',
        ring: '#FF6B4A',
        card: {
          DEFAULT: '#14141F',
          foreground: '#FFFFFF',
        },
        popover: {
          DEFAULT: '#14141F',
          foreground: '#FFFFFF',
        },
        foreground: '#FFFFFF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: '12px',
        md: '8px',
        sm: '4px',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
