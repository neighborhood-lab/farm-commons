/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Farm-themed color palette
        earth: {
          50: '#f9f7f4',
          100: '#f0ebe3',
          200: '#e1d7c7',
          300: '#ccbaa1',
          400: '#b39b7a',
          500: '#9f835f',
          600: '#8a6f4f',
          700: '#725a43',
          800: '#5f4c39',
          900: '#503f30',
        },
        sage: {
          50: '#f6f7f6',
          100: '#e3e7e3',
          200: '#c7cfc7',
          300: '#a3afa3',
          400: '#7e8e7e',
          500: '#5f6f5f',
          600: '#4a574a',
          700: '#3d483d',
          800: '#323a32',
          900: '#2b312b',
        },
      },
    },
  },
  plugins: [],
};
