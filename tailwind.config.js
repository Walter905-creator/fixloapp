/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",     // ✅ Your main React components
    "./public/index.html"             // ✅ Your main HTML file
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
