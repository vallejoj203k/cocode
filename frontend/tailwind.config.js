/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta inspirada en el logo de Python, con contraste suficiente para
        // texto pequeno.
        marca: {
          50: '#eef6ff',
          100: '#d9eaff',
          200: '#bcdaff',
          300: '#8ec2ff',
          400: '#589fff',
          500: '#3178c6',
          600: '#2563a8',
          700: '#1f4f87',
          800: '#1d426e',
          900: '#1c395c',
        },
        acento: {
          400: '#ffd43b',
          500: '#f2b705',
          600: '#c99400',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
