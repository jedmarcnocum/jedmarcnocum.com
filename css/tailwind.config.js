/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./**/*.{html,js}",
    "!./dist/**/*",
    "!./node_modules/**/*"
  ],
  theme: {
    extend: {}
  },
  plugins: []
};
