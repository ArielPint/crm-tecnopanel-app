/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#ed3224',
          dark: '#c0241a',
          gray: '#374151',
          bg: '#1a1a1b',
        },
        semantic: {
          success: '#059669',
          info:    '#2563eb',
          warning: '#f59e0b',
          danger:  '#ed3224',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}
