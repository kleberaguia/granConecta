"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VitrineComponent = void 0;
const VitrineComponent = (produtos, variant = 'ecommerce-grid', estilo, tokens, aiData) => {
    if (!produtos || produtos.length === 0)
        return '';
    const primaryColor = estilo?.primary_color || '#3b82f6';
    const borderRadius = tokens?.borderRadius || '12px';
    const letterSpacing = tokens?.letterSpacing || 'tracking-normal';
    const shadow = tokens?.shadow || 'shadow-xl';
    const bodyFont = estilo?.body_font || 'sans-serif';
    const click = `onclick="refreshSection('vitrine-section','vitrine')"`;
    const refreshButton = `
        <div class="edit-overlay absolute top-4 right-4 z-50 opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
            <div class="bg-white/90 backdrop-blur shadow-2xl p-2 rounded-full text-gray-800 border border-gray-100 pointer-events-auto cursor-pointer">
                <svg class="w-4 h-4 animate-spin-hover" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
            </div>
        </div>
    `;
    const getImg = (url, index = 0) => {
        if (url)
            return url;
        const placeholders = [
            "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80",
            "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80",
            "https://images.unsplash.com/photo-1584302174644-629a444d0b2b?w=800&q=80"
        ];
        return placeholders[index % placeholders.length];
    };
    const tituloVitrine = aiData?.vitrine_titulo || "Nossa Seleção";
    switch (variant) {
        case 'mjv-innovation-catalog': // Padrão MJV: Tech, Clean, Corporativo
            return `
            <section id="vitrine-section" ${click} class="py-32 bg-white px-6 group relative cursor-pointer">
                ${refreshButton}
                <div class="max-w-7xl mx-auto">
                    <div class="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
                        <div class="max-w-2xl">
                            <span class="text-primary font-black uppercase text-[10px] ${letterSpacing} mb-4 block">Product Showcase</span>
                            <h2 class="text-5xl md:text-7xl font-black text-gray-900 leading-tight italic" style="font-family: '${bodyFont}'">${tituloVitrine}</h2>
                        </div>
                        <p class="text-gray-500 max-w-xs text-sm leading-relaxed border-l-2 border-primary pl-6">Soluções de alta performance desenhadas para o futuro do seu negócio.</p>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-12">
                        ${produtos.map((item, index) => `
                            <div class="group/item flex flex-col">
                                <div class="relative aspect-video overflow-hidden mb-8 bg-gray-50" style="border-radius: ${borderRadius}">
                                    <img src="${getImg(item.imagemUrl, index)}" class="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-110" />
                                    <div class="absolute inset-0 bg-gray-900/0 group-hover/item:bg-gray-900/40 transition-all flex items-center justify-center">
                                        <button class="bg-white text-gray-900 px-6 py-3 text-xs font-black uppercase tracking-widest opacity-0 group-hover/item:opacity-100 transition-all translate-y-4 group-hover/item:translate-y-0">Ver Detalhes</button>
                                    </div>
                                </div>
                                <div class="flex justify-between items-start">
                                    <div>
                                        <h3 class="text-xl font-black uppercase tracking-tighter text-gray-900 mb-2">${item.nome}</h3>
                                        <p class="text-gray-400 text-xs font-bold uppercase tracking-widest">Série Innovation 2026</p>
                                    </div>
                                    <span class="text-xl font-light text-primary">R$ ${item.preco}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>`;
        case 'artstones-curated': // Padrão Artstones: Galeria de Luxo, Grayscale, Minimal
            return `
            <section id="faq-section" ${click} class="py-32 bg-[#f8f8f8] px-6 group relative cursor-pointer">
                ${refreshButton}
                <div class="max-w-7xl mx-auto">
                    <div class="text-center mb-24">
                        <h2 class="text-4xl md:text-5xl font-light text-gray-800 uppercase tracking-[0.4em] mb-4">${tituloVitrine}</h2>
                        <div class="w-12 h-px bg-primary mx-auto"></div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-20">
                        ${produtos.map((item, index) => `
                            <div class="flex flex-col items-center group/card">
                                <div class="relative w-full aspect-[4/5] overflow-hidden mb-10 shadow-2xl" style="border-radius: ${borderRadius}">
                                    <img src="${getImg(item.imagemUrl, index)}" class="w-full h-full object-cover grayscale group-hover/card:grayscale-0 group-hover/card:scale-105 transition-all duration-1000" />
                                    <div class="absolute inset-0 border-[20px] border-white/0 group-hover/card:border-white/10 transition-all duration-500"></div>
                                </div>
                                <h3 class="text-2xl font-medium text-gray-900 uppercase tracking-[0.2em] mb-4 italic">${item.nome}</h3>
                                <p class="text-gray-400 text-xs uppercase tracking-widest mb-6">Obra autoral — Edição Limitada</p>
                                <span class="text-lg font-light text-gray-800 border-b border-primary pb-2">R$ ${item.preco}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>`;
        case 'luxury-boutique':
            // ... (Mantenha seu case luxury-boutique original aqui)
            return `
            <section id="vitrine-section" class="py-24 bg-[#fdfaf7] px-6 group relative">
                ${refreshButton}
                <div class="max-w-7xl mx-auto">
                    <div class="text-center mb-20">
                        <h2 class="text-4xl md:text-5xl font-serif italic text-[#5c4a33] mb-4">${tituloVitrine}</h2>
                        <p class="text-xs uppercase ${letterSpacing} text-[#8a765e]">Onde o brilho encontra a sofisticação</p>
                    </div>
                    <div ${click} class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 cursor-pointer">
                        ${produtos.map((item, index) => `
                            <div class="flex flex-col group/item">
                                <div class="relative aspect-[3/4] overflow-hidden mb-6 bg-gray-100" style="border-radius: ${borderRadius}">
                                    <img src="${getImg(item.imagemUrl, index)}" class="w-full h-full object-cover transition-transform duration-1000 group-hover/item:scale-110" />
                                    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 translate-y-12 group-hover/item:translate-y-0 transition-transform duration-500 w-full px-4">
                                        <button class="w-full bg-white/90 backdrop-blur-md py-3 text-xs uppercase ${letterSpacing} font-bold text-[#5c4a33] shadow-lg hover:bg-[#b5927b] hover:text-white transition-colors">
                                            Adicionar à sacola
                                        </button>
                                    </div>
                                </div>
                                <h3 class="text-lg font-serif text-[#5c4a33] mb-1">${item.nome}</h3>
                                <p class="text-[10px] uppercase ${letterSpacing} text-[#8a765e] mb-2">Coleção Exclusiva</p>
                                <span class="text-lg font-medium text-[#b5927b]">R$ ${item.preco}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>`;
        default:
            // ... (Mantenha seu case ecommerce-grid original aqui)
            return `
            <section id="vitrine-section" class="py-24 px-6 group relative">
                ${refreshButton}
                <div class="max-w-7xl mx-auto">
                    <div class="text-center mb-16">
                        <h2 class="text-4xl font-black mb-4">${tituloVitrine}</h2>
                        <div class="w-16 h-1 mx-auto rounded-full" style="background-color: ${primaryColor}"></div>
                    </div>
                    <div ${click} class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 cursor-pointer">
                        ${produtos.map((item, index) => `
                            <div class="flex flex-col h-full group/card bg-white transition-all duration-300 ${shadow}" 
                                 style="border-radius: ${borderRadius}; border: 1px solid ${primaryColor}10">
                                <div class="relative aspect-square overflow-hidden bg-gray-50" style="border-radius: ${borderRadius} ${borderRadius} 0 0">
                                    <img src="${getImg(item.imagemUrl, index)}" class="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-500" />
                                </div>
                                <div class="p-6 flex flex-col flex-grow">
                                    <h3 class="font-bold text-lg mb-2 transition-colors" style="color: ${primaryColor}">${item.nome}</h3>
                                    <p class="text-sm opacity-60 line-clamp-2 mb-6">${item.descricao}</p>
                                    <div class="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                                        <span class="font-extrabold text-xl" style="color: ${primaryColor}">R$ ${item.preco}</span>
                                        <button class="p-3 rounded-xl transition-all hover:scale-110" style="background-color: ${primaryColor}15; color: ${primaryColor}">
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>`;
    }
};
exports.VitrineComponent = VitrineComponent;
