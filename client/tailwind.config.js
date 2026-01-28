// client/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Red for logo + main CTA buttons
        brand:  { DEFAULT: "#FF3B30", dark: "#D92A21" },
        // Green for the hero "Search" button
        accent: { DEFAULT: "#16A34A", dark: "#15803D" },
        // Professional deep blue for AI Expert section
        professional: { DEFAULT: "#1e3a8a", dark: "#1e40af", light: "#3b82f6" }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/aspect-ratio"),
  ],
};
