/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#0b0f19',
        cardBg: 'rgba(15, 23, 42, 0.45)',
        accentColor: '#6366f1',
        secondaryAccent: '#06b6d4',
      }
    },
  },
  plugins: [],
}
