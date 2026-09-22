/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        industrial: {
          dark: '#0a0d14',
          card: '#121824',
          border: '#1e293b',
          green: '#10b981',
          blue: '#0284c7',
          yellow: '#eab308',
          red: '#ef4444',
          purple: '#a855f7',
          orange: '#f97316'
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
