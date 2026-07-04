/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html','./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: '#f9f4ef',
          100: '#f0e5d8',
          200: '#e1cab2',
          300: '#cfad88',
          400: '#ba8a5d',
          500: '#a66f43',
          600: '#965a37',
          700: '#7d462f',
          800: '#653929',
          900: '#522f24',
          950: '#2d1812'
        },
        cream: '#faf6f1',
        bun: '#5b3522'
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      },
      borderRadius: { xl: '1.15rem', '2xl': '1.5rem' }
    }
  },
  plugins: []
}
