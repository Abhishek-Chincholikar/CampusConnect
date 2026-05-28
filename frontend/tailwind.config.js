/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cardinal: {
          50: '#fff1f2',
          600: '#b91c1c',
          700: '#991b1b',
        },
        institute: {
          navy: '#061a33',
          blue: '#0b2d53',
          ink: '#111827',
          slate: '#475569',
          mist: '#f8fafc',
        },
      },
      boxShadow: {
        lift: '0 18px 45px rgba(15, 23, 42, 0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
