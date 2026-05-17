/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Prompt"',
          '"IBM Plex Sans Thai"',
          '"Sarabun"',
          '"Inter"',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
      },
      colors: {
        // KlangTECH-style orange palette — replaces indigo throughout
        brand: {
          50: '#fff5eb',
          100: '#ffe6cc',
          200: '#ffcc99',
          300: '#ffb366',
          400: '#ff9933',
          500: '#ff7a00',
          600: '#f06800',
          700: '#cc5500',
          800: '#a34000',
          900: '#7a2f00',
        },
        coral: {
          50: '#fff1ec',
          100: '#ffddd0',
          200: '#ffb39a',
          300: '#ff8967',
          400: '#ff6b3d',
          500: '#ff5722',
          600: '#e64a1a',
          700: '#b83b14',
          800: '#8a2c0e',
          900: '#5c1d09',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)',
        card: '0 4px 14px rgba(15, 23, 42, 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
