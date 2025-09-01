/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0e12",
        card: "#12161c",
        text: "#e6edf3",
        muted: "#9aa4b2",
        brand: "#4da3ff"
      },
      borderRadius: { '2xl': '1rem' }
    },
  },
  plugins: [],
};
