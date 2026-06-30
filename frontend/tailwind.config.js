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
          dark: '#0F172A',       // Slate 900 (Main headings)
          card: '#FFFFFF',       // Clean White Cards
          border: '#E2E8F0',     // Light border slate
          slate: '#475569',      // Slate 600 (Secondary text)
          teal: '#0EA5E9',       // Clean Sky Blue Accent
          tealHover: '#0284C7',  // Sky Blue hover
          tealLight: '#F0F9FF',  // Sky Blue light tint
          bg: '#F8FAFC',         // Off-White Background
          success: '#10B981',    // Emerald Green
          warning: '#F59E0B',    // Amber
          danger: '#EF4444',     // Red
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
