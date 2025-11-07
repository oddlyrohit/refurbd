import type { Config } from 'tailwindcss'
const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './styles/**/*.{css}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f4f7ff', 100: '#e6eeff', 200: '#cfe0ff', 300: '#a9c8ff',
          400: '#78a6ff', 500: '#3b82ff', 600: '#2f6ae6', 700: '#2554b8',
          800: '#1e4594', 900: '#1a3a7a'
        }
      },
      boxShadow: { card: '0 10px 30px rgba(2,6,23,0.08)' },
      borderRadius: { xl: '1rem', '2xl': '1.25rem' }
    }
  },
  plugins: []
}
export default config
