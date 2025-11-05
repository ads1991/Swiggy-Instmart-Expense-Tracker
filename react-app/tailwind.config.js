/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        swiggy: {
          orange: '#fc8019',
          dark: '#282c3f',
        }
      }
    },
  },
  plugins: [],
}
