/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f4f6fb',
          100: '#e8ecf6',
          200: '#cbd5ec',
          300: '#a0b3db',
          400: '#6f8bc5',
          500: '#4c6cb0',
          600: '#395292',
          700: '#2f4377',
          800: '#2a3964',
          900: '#273254',
          950: '#1a1f35',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
