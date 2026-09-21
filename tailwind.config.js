/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        academic: {
          navy: '#000000',      // Pure black background for dark mode
          darkCard: '#18181b',  // Dark grey card (Zinc 900)
          darkBorder: '#27272a',// Subtle dark grey border (Zinc 800)
          darkText: '#f4f4f5',  // Clean light text
          darkMuted: '#a1a1aa', // Muted secondary text
          lightBg: '#f8fafc',
          lightCard: '#ffffff',
          lightBorder: '#e2e8f0',
          lightText: '#0f172a',
          lightMuted: '#64748b',
          primary: '#4f46e5',
          primaryHover: '#4338ca',
          primaryDark: '#6366f1',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}
