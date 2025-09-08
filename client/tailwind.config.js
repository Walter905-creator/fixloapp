/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: { colors: { brand: { DEFAULT: "#667EEA", dark: "#764BA2" } } } },
  plugins: [],
};