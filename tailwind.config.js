/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#FF3B30", dark: "#D92A21" },
        accent: { DEFAULT: "#16A34A", dark: "#15803D" }
      }
    }
  },
  plugins: [require('@tailwindcss/aspect-ratio')],
};
