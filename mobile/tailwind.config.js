/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{tsx,ts}', './src/**/*.{tsx,ts}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cream:   { 50: '#FDFBF7', 100: '#FAF6F0', 200: '#F3ECE1', 300: '#E9DECF' },
        wine:    { 50: '#FBF1F2', 100: '#F6DFE2', 300: '#D98A95', 500: '#A82234', 600: '#8A1A29', 700: '#7A1420', 800: '#5E0F19' },
        brass:   { 300: '#E2C98F', 400: '#D4B16A', 500: '#C8A35B', 600: '#A9863F' },
        charcoal: '#1F1A17',
        warmgray: { 400: '#A89C8E', 500: '#8A7E70', 600: '#6B6157' },
      },
      fontFamily: {
        display: ['Fraunces_600SemiBold'],
        sans: ['PlusJakartaSans_400Regular'],
        medium: ['PlusJakartaSans_500Medium'],
        semibold: ['PlusJakartaSans_600SemiBold'],
        bold: ['PlusJakartaSans_700Bold'],
      },
    },
  },
  plugins: [],
}
