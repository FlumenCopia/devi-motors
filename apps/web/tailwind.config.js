/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#F52B2B',
          redHover: '#DC2626',
          navy: '#06245C',
          dark: '#0B0F17',
          darkSurface: '#121824',
          darkCard: '#161E2E',
          darkBorder: '#233048',
        }
      }
    },
  },
  plugins: [],
}
