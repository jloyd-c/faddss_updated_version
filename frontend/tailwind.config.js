/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        ink: {
          50: '#f8fafc',
          100: '#eef2f7',
          200: '#e2e8f0',
          400: '#94a3b8',
          500: '#667085',
          600: '#4b5563',
          700: '#344054',
          800: '#1e2938',
          900: '#101828',
        },
        civic: {
          50: '#fffbeb',
          100: '#fff3d0',
          200: '#ffe99a',
          300: '#fde68a',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
        },
        emeraldGov: {
          50: '#ecfdf5',
          100: '#d1fae5',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
        },
      },
      boxShadow: {
        soft: '0 12px 32px rgba(15, 23, 42, 0.08)',
        panel: '0 1px 2px rgba(16, 24, 40, 0.06), 0 8px 20px rgba(16, 24, 40, 0.05)',
        card: '0 1px 3px rgba(16, 24, 40, 0.08), 0 1px 2px rgba(16, 24, 40, 0.04)',
        lift: '0 4px 16px rgba(16, 24, 40, 0.10), 0 1px 4px rgba(16, 24, 40, 0.06)',
      },
      keyframes: {
        'skeleton-shimmer': {
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-right': {
          '0%': { opacity: '0', transform: 'translateX(-14px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-7px)' },
        },
      },
      animation: {
        'skeleton': 'skeleton-shimmer 1.5s ease infinite',
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up':    'slide-up 0.5s ease-out both',
        'slide-up-d1': 'slide-up 0.5s ease-out 0.12s both',
        'slide-up-d2': 'slide-up 0.5s ease-out 0.24s both',
        'slide-up-d3': 'slide-up 0.5s ease-out 0.36s both',
        'slide-up-d4': 'slide-up 0.5s ease-out 0.50s both',
        'float': 'float 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
