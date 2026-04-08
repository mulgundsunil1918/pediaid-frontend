/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // MedShelf Academics design palette
        primary: {
          DEFAULT: '#1e3a5f',
          light: '#2c5282',
        },
        accent: '#3182ce',
        success: '#38a169',
        warning: '#d69e2e',
        danger: '#e53e3e',
        bg: '#f7fafc',
        card: '#ffffff',
        border: '#e2e8f0',
        ink: {
          DEFAULT: '#2d3748',
          muted: '#718096',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'serif'],
      },
      maxWidth: {
        reading: '800px',
        browse: '1400px',
      },
      borderRadius: {
        card: '12px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)',
        'card-hover':
          '0 10px 25px -3px rgba(0,0,0,0.10), 0 4px 6px -4px rgba(0,0,0,0.07)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeSlideIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 150ms ease-out',
        fadeSlideIn: 'fadeSlideIn 150ms ease-out both',
        slideInRight: 'slideInRight 250ms ease-out',
      },
    },
  },
  plugins: [],
};
