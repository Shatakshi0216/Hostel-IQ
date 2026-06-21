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
          dark: '#0F172A',      // Deep Slate (Primary)
          slate: '#1E293B',     // Secondary Slate
          teal: '#14B8A6',      // Teal Accent
          tealHover: '#0D9488', // Teal Darker
          tealLight: '#E6F8F6', // Very Light Teal for badges
          bg: '#F8FAFC',        // Slate Gray Tint Background
          success: '#22C55E',   // Success Green
          warning: '#F59E0B',   // Warning Orange
          card: '#FFFFFF',      // White Cards
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
