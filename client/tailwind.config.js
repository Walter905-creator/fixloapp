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
        accent: { DEFAULT: "#16A34A", dark: "#15803D" }
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/aspect-ratio"),
  ],
};
