"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GalleryComponent = void 0;
const GalleryComponent = (imagens = [], variant = 'grid', estilo, tokens, aiData) => {
    const fotos = imagens || [];
    if (fotos.length === 0)
        return '';
    const primaryColor = estilo?.primary_color || '#3b82f6';
    const borderRadius = tokens?.borderRadius || '12px';
    const bodyFont = estilo?.body_font || 'sans-serif';
    // 🔥 CONFIGURAÇÕES DINÂMICAS DO EDITOR
    const sectionBg = aiData?.gallery_bg_color || (variant === 'artstones-masonry' ? '#f8f8f8' : 'white');
    const ctaText = aiData?.gallery_cta_text || "";
    const ctaBg = aiData?.gallery_cta_bg || primaryColor;
    const ctaTextColor = aiData?.gallery_cta_color || "#ffffff";
    const tituloGaleria = aiData?.galeria_titulo || "Galeria de Projetos";
    const titleAlign = aiData?.gallery_title_align || 'center';
    const titleColor = aiData?.gallery_title_color || primaryColor;
    const click = `onclick="refreshSection('gallery-section','gallery')"`;
    const refreshButton = `
        <div class="edit-overlay absolute top-4 right-4 z-50 opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
            <div class="bg-white/90 backdrop-blur shadow-2xl p-2 rounded-full text-gray-800 border border-gray-100 pointer-events-auto cursor-pointer">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
            </div>
        </div>
    `;
    // 🔥 GRID DE IMAGENS COM CLASSES PARA O INJETOR
    const renderGrid = () => `
        <div class="gallery-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-8 w-full px-2">
            ${fotos.map((url, i) => {
        const glowShadow = `0 20px 40px -15px ${primaryColor}33`;
        return `
                <div class="gallery-item aspect-square overflow-hidden group/img relative cursor-zoom-in transition-all duration-500 hover:-translate-y-2 shadow-lg" 
                     onclick="event.stopPropagation(); window.parent.postMessage({type: 'openZoom', url: '${url}'}, '*')"
                     style="
                        border-radius: ${borderRadius}; 
                        box-shadow: ${glowShadow};
                        border: 1px solid ${primaryColor}15;
                     ">
                    
                    <img src="${url}" class="w-full h-full object-cover transition-all duration-700 group-hover/img:scale-110" loading="lazy" />
                    
                    <div class="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                         <span class="text-white text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md bg-white/10 px-4 py-2 rounded-full border border-white/20 shadow-lg">
                            Visualizar
                         </span>
                    </div>
                </div>
            `;
    }).join('')}
        </div>
    `;
    return `
    <section id="gallery-section" ${click} 
        class="py-32 px-6 group relative cursor-pointer transition-all duration-500 overflow-hidden" 
        style="background-color: ${sectionBg};">
        
        ${refreshButton}

        <div class="max-w-7xl mx-auto flex flex-col items-${titleAlign === 'center' ? 'center' : titleAlign === 'right' ? 'flex-end' : 'flex-start'}">
            
            <header class="gallery-header mb-20 w-full" style="text-align: ${titleAlign};">
                <h2 class="gallery-title text-4xl md:text-6xl font-black tracking-tighter mb-4 italic" 
                    style="font-family: '${bodyFont}'; color: ${titleColor};">
                    ${tituloGaleria}
                </h2>
                <div class="gallery-divider w-20 h-1.5 rounded-full" 
                     style="background: ${primaryColor}; 
                     margin-left: ${titleAlign === 'center' || titleAlign === 'right' ? 'auto' : '0'}; 
                     margin-right: ${titleAlign === 'center' || titleAlign === 'left' ? 'auto' : '0'};">
                </div>
            </header>

            ${renderGrid()}

            ${ctaText ? `
                <div class="gallery-cta mt-20 text-center w-full">
                    <button onclick="event.stopPropagation(); window.parent.postMessage({type: 'openLead'}, '*')" 
                        class="px-10 py-5 text-lg font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl"
                        style="background: ${ctaBg}; color: ${ctaTextColor}; border-radius: 50px;">
                        ${ctaText}
                    </button>
                </div>
            ` : ''}
        </div>
    </section>`;
};
exports.GalleryComponent = GalleryComponent;
