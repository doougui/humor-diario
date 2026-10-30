import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9eaff',
          200: '#bcdaff',
          300: '#8ec3ff',
          400: '#59a1ff',
          500: '#337dfc',
          600: '#1d5ef1',
          700: '#1549de',
          800: '#183db4',
          900: '#1a378d',
        },
      },
    },
  },
  plugins: [],
};

export default config;
