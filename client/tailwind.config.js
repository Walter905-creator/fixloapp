/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Red (logo + main CTA buttons like "Find a Pro")
        brand: { DEFAULT: "#FF3B30", dark: "#D92A21" },

        // Green (hero "Search" button)
        accent: { DEFAULT: "#16A34A", dark: "#15803D" },
      },
    },
  },
  plugins: [],
};
