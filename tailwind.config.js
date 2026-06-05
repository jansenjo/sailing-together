/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ocean: {
          50:  '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7dc8fb',
          400: '#38aaf6',
          500: '#0e8de7',
          600: '#026fc5',
          700: '#0258a0',
          800: '#064b84',
          900: '#0b3f6e',
          950: '#082849',
        },
        sand: {
          50:  '#fdf8f0',
          100: '#faeede',
          200: '#f4dab8',
          300: '#ecbf87',
          400: '#e39d54',
          500: '#db8232',
          600: '#cc6a27',
          700: '#aa5222',
          800: '#884222',
          900: '#6e371f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
