/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        /**
         * Paleta de la portada publica (Logic Plus). Vive aparte de `marca`
         * porque la pagina de venta y la plataforma son dos superficies con
         * trabajos distintos: una convence, la otra se usa cada semana.
         */
        logic: {
          50: '#F4F6FF',
          100: '#EEF0FF',
          200: '#E4E7FF',
          300: '#9AA2FF',
          500: '#2E38C9',
          600: '#232AA0',
          700: '#1B2493',
        },
        // Grises de texto del diseno, del titular al pie de foto.
        tinta: {
          300: '#9BA1B0',
          400: '#8E95A5',
          500: '#737A8C',
          600: '#525A6E',
          700: '#3D4457',
          800: '#232838',
          900: '#141824',
        },
        wapp: { 50: '#F0FBF5', 500: '#1E9E5A', 600: '#17804A' },
        mascota: '#FF6B2C',
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
        // Solo en la portada publica.
        marca: ['Manrope', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
