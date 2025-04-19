module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#3fbaeb',
          DEFAULT: '#0fa9e6',
          dark: '#0c87b8',
        },
        secondary: {
          light: '#ff7ce5',
          DEFAULT: '#ff49db',
          dark: '#ff16d1',
        },
        neutral: {
          light: '#f5f5f5',
          DEFAULT: '#e5e5e5',
          dark: '#d4d4d4',
        },
      },
    },
  },
  plugins: [],
};