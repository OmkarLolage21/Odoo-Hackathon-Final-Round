/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#F5F2F4",
          100: "#E7E0E6",
          200: "#D1C3CD",
          300: "#B59FB0",
          400: "#9B7A92",
          500: "#825575",
          600: "#714B67", // Primary brand color (Odoo-like purple)
          700: "#5A3F50",
          800: "#402C38",
          900: "#261A22",
        },
      },
    },
  },
  plugins: [],
};
