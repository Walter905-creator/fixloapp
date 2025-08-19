/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  safelist: [
    'opacity-100', 'opacity-0',
    'visible', 'invisible',
    // any dynamic classes you toggle in JS
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
