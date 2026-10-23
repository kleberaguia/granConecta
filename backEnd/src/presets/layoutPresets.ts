// src/presets/layoutPresets.ts
export const heroPresets = [
  // Minimalista com imagem lateral
  `<section class="flex bg-white">
     <div class="w-1/2 p-10"><h1 class="text-5xl font-bold">Minimalismo Moderno</h1><p>Design limpo e direto.</p></div>
     <div class="w-1/2 bg-cover" style="background-image:url('/img/hero1.jpg')"></div>
   </section>`,

  // Gradiente vibrante
  `<section class="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center py-24">
     <h1 class="text-6xl font-bold">Vibrante e Colorido</h1><p>Impacto visual para sua marca.</p>
   </section>`,

  // Hero escuro elegante
  `<section class="relative bg-black text-white py-32">
     <div class="absolute inset-0 bg-black/60"></div>
     <div class="relative z-10 text-center"><h1 class="text-5xl font-serif">Elegância no Escuro</h1></div>
   </section>`,

  // Hero com vídeo
  `<section class="relative h-[500px]">
     <video autoplay muted loop class="absolute inset-0 w-full h-full object-cover"><source src="/video/bg.mp4" type="video/mp4"/></video>
     <div class="relative z-10 text-center text-white p-20"><h1 class="text-5xl font-bold">Hero com Vídeo</h1></div>
   </section>`,

  // Hero dividido em colunas
  `<section class="grid grid-cols-2 bg-gray-100 p-20">
     <div><h1 class="text-5xl font-bold">Hero Coluna Esquerda</h1></div>
     <div><img src="/img/hero2.jpg" /></div>
   </section>`,

  // Hero com CTA destacado
  `<section class="bg-blue-600 text-white text-center py-24">
     <h1 class="text-6xl font-bold">Hero com CTA</h1>
     <a href="#contato" class="bg-white text-blue-600 px-6 py-3 rounded-lg">Fale Conosco</a>
   </section>`,

  // Hero com carrossel
  `<section class="bg-gray-900 text-white py-24">
     <div class="carousel">[Carrossel de imagens aqui]</div>
     <h1 class="text-5xl font-bold text-center">Hero com Carrossel</h1>
   </section>`,

  // Hero minimalista centralizado
  `<section class="bg-white text-black text-center py-32">
     <h1 class="text-6xl font-bold">Hero Minimalista</h1><p>Texto centralizado e limpo.</p>
   </section>`,

  // Hero com gradiente animado
  `<section class="bg-gradient-to-r from-indigo-500 via-pink-500 to-yellow-500 animate-pulse text-white text-center py-24">
     <h1 class="text-6xl font-bold">Hero Animado</h1>
   </section>`,

  // Hero com imagem full background
  `<section class="h-[600px] bg-cover bg-center text-white flex items-center justify-center" style="background-image:url('/img/hero3.jpg')">
     <h1 class="text-6xl font-bold">Hero Full Background</h1>
   </section>`
];

// Cards Presets
export const cardPresets = [
  `<div class="grid grid-cols-3 gap-6 mt-10">
     <div class="bg-white shadow-lg rounded-xl p-6">💡 Ideias criativas</div>
     <div class="bg-white shadow-lg rounded-xl p-6">🚀 Crescimento rápido</div>
     <div class="bg-white shadow-lg rounded-xl p-6">🔒 Segurança</div>
   </div>`,

  `<div class="grid grid-cols-4 gap-4 mt-10">
     <div class="bg-blue-100 p-6 rounded-lg">📊 Análises</div>
     <div class="bg-green-100 p-6 rounded-lg">🌱 Sustentabilidade</div>
     <div class="bg-yellow-100 p-6 rounded-lg">⚙️ Automação</div>
     <div class="bg-pink-100 p-6 rounded-lg">🎨 Design</div>
   </div>`,

  `<div class="flex overflow-x-scroll gap-6 mt-10">
     <div class="min-w-[200px] bg-white shadow-md p-6 rounded-lg">💻 Tecnologia</div>
     <div class="min-w-[200px] bg-white shadow-md p-6 rounded-lg">📱 Mobile</div>
     <div class="min-w-[200px] bg-white shadow-md p-6 rounded-lg">🌍 Global</div>
   </div>`,

  `<div class="grid grid-cols-2 gap-8 mt-10">
     <div class="bg-gradient-to-r from-pink-500 to-yellow-500 text-white rounded-xl p-8">✨ Colorido</div>
     <div class="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl p-8">🔥 Impactante</div>
   </div>`,

  `<div class="grid grid-cols-3 gap-6 mt-10">
     <div class="p-6 border rounded-lg hover:shadow-lg">📦 Produto 1</div>
     <div class="p-6 border rounded-lg hover:shadow-lg">📦 Produto 2</div>
     <div class="p-6 border rounded-lg hover:shadow-lg">📦 Produto 3</div>
   </div>`,

  `<div class="grid grid-cols-3 gap-6 mt-10">
     <div class="bg-cover p-6 text-white rounded-lg" style="background-image:url('/img/card1.jpg')">🌄 Natureza</div>
     <div class="bg-cover p-6 text-white rounded-lg" style="background-image:url('/img/card2.jpg')">🏙️ Cidade</div>
     <div class="bg-cover p-6 text-white rounded-lg" style="background-image:url('/img/card3.jpg')">🌊 Mar</div>
   </div>`,

  `<div class="grid grid-cols-2 gap-6 mt-10">
     <div class="bg-white p-6 rounded-lg shadow hover:scale-105 transition">📈 Crescimento</div>
     <div class="bg-white p-6 rounded-lg shadow hover:scale-105 transition">🤝 Parcerias</div>
   </div>`,

  `<div class="grid grid-cols-3 gap-6 mt-10">
     <div class="bg-gray-100 p-6 rounded-lg hover:bg-gray-200">🔍 Pesquisa</div>
     <div class="bg-gray-100 p-6 rounded-lg hover:bg-gray-200">🛠️ Ferramentas</div>
     <div class="bg-gray-100 p-6 rounded-lg hover:bg-gray-200">📚 Conhecimento</div>
   </div>`,

  `<div class="grid grid-cols-3 gap-6 mt-10">
     <div class="bg-black text-yellow-500 p-6 rounded-lg">⚡ Premium</div>
     <div class="bg-black text-yellow-500 p-6 rounded-lg">🎯 Foco</div>
     <div class="bg-black text-yellow-500 p-6 rounded-lg">🏆 Resultados</div>
   </div>`,

  `<div class="grid grid-cols-3 gap-6 mt-10">
     <div class="bg-gradient-to-r from-red-500 to-orange-500 text-white p-6 rounded-lg">🔥 Energia</div>
     <div class="bg-gradient-to-r from-blue-500 to-green-500 text-white p-6 rounded-lg">🌍 Sustentável</div>
     <div class="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-lg">🎨 Criatividade</div>
   </div>`
];

// Footer Presets
export const footerPresets = [
  `<footer class="bg-white text-gray-700 py-10 text-center">© 2026 Minha Marca</footer>`,
  `<footer class="bg-black text-white py-10">...</footer>`,
  `<footer class="bg-gradient-to-r from-purple-700 to-pink-700 text-white py-10">...</footer>`,
  `<footer class="bg-gray-900 text-white py-10">...</footer>`,
  `<footer class="bg-blue-600 text-white py-10">...</footer>`,
  `<footer class="bg-white text-black py-10">...</footer>`,
  `<footer class="bg-gradient-to-r from-green-500 to-blue-500 text-white py-10">...</footer>`,
  `<footer class="bg-black text-yellow-500 py-10">...</footer>`,
  `<footer class="bg-gray-100 text-gray-700 py-10">...</footer>`,
  `<footer class="bg-gradient-to-r from-red-500 to-orange-500 text-white py-10">...</footer>`
];
// Header Presets
export const headerPresets = [
  `<header class="bg-transparent text-black p-6 flex justify-between">...</header>`,
  `<header class="bg-black text-white p-6 flex justify-between">...</header>`,
  `<header class="bg-gradient-to-r from-pink-500 to-yellow-500 text-white p-6 flex justify-between">...</header>`,
  `<header class="bg-white shadow-md text-black p-6 flex justify-between">...</header>`,
  `<header class="bg-blue-600 text-white p-6 flex justify-between">...</header>`
];

// Testimonials Presets
export const testimonialPresets = [
  `<section class="bg-gray-100 py-16 text-center">...</section>`,
  `<section class="bg-black text-white py-16">...</section>`,
  `<section class="bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-16">...</section>`,
  `<section class="bg-white text-black py-16">...</section>`,
  `<section class="bg-gray-900 text-white py-16">...</section>`
];

// Função geradora
export function generatePreset() {
  const hero = heroPresets[Math.floor(Math.random() * heroPresets.length)];
  const cards = cardPresets[Math.floor(Math.random() * cardPresets.length)];
  const footer = footerPresets[Math.floor(Math.random() * footerPresets.length)];
  const header = headerPresets[Math.floor(Math.random() * headerPresets.length)];
  const testimonials = testimonialPresets[Math.floor(Math.random() * testimonialPresets.length)];

  return `
    <html>
      <head><script src="https://cdn.tailwindcss.com"></script></head>
      <body>
        ${header}
        ${hero}
        ${cards}
        ${testimonials}
        ${footer}
      </body>
    </html>
  `;
}
