/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#070a13",
          card: "#0f172a",
          border: "#1e293b",
          primary: "#6366f1",
          secondary: "#06b6d4",
          success: "#10b981",
          warning: "#f59e0b",
          danger: "#f43f5e",
        }
      }
    },
  },
  plugins: [],
}
