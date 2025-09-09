import forms from '@tailwindcss/forms'

/** @type {import('tailwindcss').Config} */
export default {
  // Disable dark mode entirely—you'll have only the light theme
  darkMode: false, // or 'false' as a string if that works better
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Red for logo + main CTA buttons
        brand:  { DEFAULT: "#FF3B30", dark: "#D92A21" },
        // Green for the hero "Search" button
        accent: { DEFAULT: "#16A34A", dark: "#15803D" }
      },
    },
  },
  plugins: [forms],
};
