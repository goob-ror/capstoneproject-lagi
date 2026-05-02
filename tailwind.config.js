/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
        istok: ['Istok Web', 'sans-serif'],
      },
      colors: {
        brand: {
          green: '#22C55E',
          'green-dark': '#16A34A',
        }
      },
      borderRadius: {
        '25': '25px',
      }
    },
  },
  plugins: [],
}

