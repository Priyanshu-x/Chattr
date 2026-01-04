import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'xs': '480px',
      },
      colors: {
        gray: colors.neutral,
        primary: {
          50: '#fafafa',
          500: '#171717',
          600: '#0a0a0a',
          700: '#000000',
        }
      }
    },
  },
  plugins: [],
}

