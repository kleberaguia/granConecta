// Formata o nome da fonte para a URL do Google Fonts
const fonteFormatadaUrl = fonteSorteada.replace(/ /g, '+');

const tailwindConfigScript = `
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: { 
            primary: "${estilo.primary_color}" 
          },
          fontFamily: { 
            // Definimos que a fonte sorteada será a padrão do sistema 'sans'
            sans: ["'${fonteSorteada}'", "sans-serif"],
            serif: ["'Playfair Display'", "serif"] // Caso queira usar em variantes Boutique
          },
          borderRadius: { 
            custom: "${estilo.border_style}" 
          },
          // 🔥 AS ANIMAÇÕES DEVEM FICAR AQUI DENTRO DO EXTEND!
          animation: {
            'blob': 'blob 7s infinite',
            'bounce-slow': 'bounce 3s infinite',
          },
          keyframes: {
            blob: {
              '0%': { transform: 'translate(0px, 0px) scale(1)' },
              '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
              '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
              '100%': { transform: 'translate(0px, 0px) scale(1)' },
            }
          }
        }
      }
    }
  </script>

  <style>
    /* Import dinâmico da fonte escolhida */
    @import url('https://fonts.googleapis.com/css2?family=${fonteFormatadaUrl}:wght@400;500;600;700&display=swap');
    
    /* Configurações globais de CSS */
    body { 
        background-color: ${estilo.body_bg.includes('#') ? estilo.body_bg : '#ffffff'} !important; 
        color: ${estilo.body_text_color} !important; 
        font-family: "${fonteSorteada}", sans-serif !important; 
        margin: 0;
        padding: 0;
        overflow-x: hidden;
    }

    /* Efeito de Scroll Suave */
    html { scroll-behavior: smooth; }

    /* Utilitário para esconder scrollbar se necessário */
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  </style>
`;