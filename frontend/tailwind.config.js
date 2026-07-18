/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0F172A',       // slate-900
          slate: '#64748B',      // slate-500
          teal: '#0EA5E9',       // sky-500
          tealHover: '#0284C7',  // sky-600
          tealLight: '#F0F9FF',  // sky-50
          bg: '#090D19',         // ultra deep blue base
          success: '#10B981',    // emerald-500
          warning: '#F59E0B',    // amber-500
          danger: '#EF4444',     // red-500
        },
        luxury: {
          indigo: '#6366F1',     // Indigo 500
          purple: '#A855F7',     // Purple 500
          deepNavy: '#0F172A',
          border: 'rgba(255, 255, 255, 0.08)',
          borderLight: 'rgba(255, 255, 255, 0.04)',
          glow: 'rgba(99, 102, 241, 0.15)',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
