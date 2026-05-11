"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeroComponent = void 0;
const HeroComponent = (aiData, variant, estilo, tokens) => {
    const { primary_color, body_font } = estilo;
    const isSplit = aiData.hero_split_mode === true;
    return `
  <section id="hero-section" 
      class="relative w-full min-h-screen flex items-center overflow-hidden transition-all duration-500"
      style="background: ${isSplit ? '#fff' : 'none'};">

      <!-- Camada de fundo -->
      <div class="hero-bg-layer absolute inset-0 z-0 transition-opacity duration-700"
           style="background-image: url('${aiData.bgUrl}');
                  background-size: cover;
                  background-position: center;
                  opacity: ${isSplit ? '0' : '1'};">
      </div>

      <!-- Overlay -->
      <div class="hero-overlay absolute inset-0 z-20 transition-opacity"
           style="background: black; opacity: ${isSplit ? '0' : (aiData.hero_overlay_opacity ?? 0.3)};">
      </div>

      <!-- Conteúdo principal -->
      <div class="max-w-7xl mx-auto px-6 w-full min-h-screen flex items-center z-30">
          <div class="hero-content grid ${isSplit ? 'lg:grid-cols-2' : 'grid-cols-1'} gap-12 items-center w-full">

              <!-- Texto -->
              <div class="hero-text-container flex flex-col">
                  <h1 class="edit-hero-title leading-tight mb-6"
                      style="font-family:'${body_font}';
                             font-size:${aiData.hero_title_size || '3rem'};
                             color:${isSplit ? '#111' : (aiData.hero_title_color || '#fff')};">
                      ${aiData.titulo || 'Título Hero'}
                  </h1>
                  <p class="edit-hero-subtitle mb-8"
                     style="color:${isSplit ? '#555' : (aiData.hero_sub_color || '#ddd')};">
                      ${aiData.subtitulo || ''}
                  </p>
                  <button class="px-8 py-4 text-white font-bold w-fit"
                          style="background:${primary_color};
                                 border-radius:${tokens.borderRadius};">
                      ${aiData.texto_botao || 'Saiba Mais'}
                  </button>
              </div>

              <!-- Imagem no modo split -->
              ${isSplit ? `
              <div class="hero-image-container flex justify-center">
                  <img src="${aiData.bgUrl}" 
                       class="w-full h-[500px] object-cover shadow-2xl"
                       style="border-radius:${tokens.borderRadius}" />
              </div>
              ` : ''}

          </div>
      </div>
  </section>`;
};
exports.HeroComponent = HeroComponent;
