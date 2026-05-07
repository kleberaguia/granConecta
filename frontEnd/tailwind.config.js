/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 1. DEFINIÇÃO DAS CORES
      // Estas classes agora lêem as variáveis CSS do seu src/index.css
      colors: {
        'background': 'rgb(var(--color-background) / <alpha-value>)',
        'dark-grey': 'rgb(var(--color-text-dark) / <alpha-value>)',
        'primary': 'rgb(var(--color-primary) / <alpha-value>)',
        'primary-5': 'rgb(var(--color-primary-5) / <alpha-value>)',
        
        // AQUI ESTÃO AS CORREÇÕES:
        'header': 'rgb(var(--color-header-bg) / <alpha-value>)',
        'footer-bg': 'rgb(var(--color-footer-bg) / <alpha-value>)', // <-- ESTA LINHA FOI 
        
      },

      // 2. DEFINIÇÃO DAS FONTES
      fontFamily: {
        'heading': ['Merriweather', 'serif'],
        'paragraph': ['Lato', 'sans-serif'],
      }
    },
  },
  plugins: [],
}