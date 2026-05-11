"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeaturesSectionComponent = void 0;
const FeaturesSectionComponent = (beneficios, variant = 'grid-3', estilo, tokens, aiData) => {
    if (!beneficios || beneficios.length === 0)
        return '';
    const primaryColor = estilo?.primary_color || '#3b82f6';
    const borderRadius = tokens?.borderRadius || '12px';
    const letterSpacing = tokens?.letterSpacing || 'tracking-normal';
    const shadow = tokens?.shadow || 'shadow-lg';
    const bodyFont = estilo?.body_font || 'sans-serif';
    const click = `onclick="refreshSection('features-section','features')"`;
    const refreshButton = `
        <div class="edit-overlay absolute top-4 right-4 z-50 opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
            <div class="bg-white/90 backdrop-blur shadow-2xl p-2 rounded-full text-gray-800 border border-gray-100 pointer-events-auto cursor-pointer">
                <svg class="w-4 h-4 animate-spin-hover" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
            </div>
        </div>
    `;
    const starIcon = `<svg class="w-6 h-6" style="color: ${primaryColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>`;
    switch (variant) {
        case 'mjv-innovation-bento': // Padrão MJV: Grid Assimétrico e Moderno
            return `
            <section id="features-section" ${click} class="py-32 bg-white px-6 group relative cursor-pointer">
                ${refreshButton}
                <div class="max-w-7xl mx-auto">
                    <div class="mb-20">
                        <span class="text-primary font-black uppercase text-[10px] ${letterSpacing} mb-4 block">Diferenciais Competitivos</span>
                        <h2 class="text-5xl md:text-6xl font-black text-gray-900 tracking-tighter italic" style="font-family: '${bodyFont}'">Inovação em cada etapa.</h2>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        ${beneficios.map((item, index) => `
                            <div class="${index === 0 || index === 3 ? 'md:col-span-2' : 'md:col-span-1'} p-10 bg-gray-50 hover:bg-gray-900 group/card transition-all duration-700 flex flex-col justify-between h-[350px]" style="border-radius: ${borderRadius}">
                                <div class="w-12 h-12 flex items-center justify-center bg-white shadow-sm group-hover/card:bg-primary transition-colors" style="border-radius: ${borderRadius}">
                                    ${starIcon}
                                </div>
                                <div>
                                    <h4 class="text-xl font-black uppercase tracking-tighter mb-4 group-hover/card:text-white transition-colors">${item.titulo}</h4>
                                    <p class="text-sm text-gray-500 group-hover/card:text-gray-400 transition-colors leading-relaxed">${item.desc}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>`;
        case 'artstones-minimal-list': // Padrão Artstones: Editorial, Elegante e Fino
            return `
            <section id="features-section" ${click} class="py-32 bg-[#f8f8f8] px-6 group relative cursor-pointer">
                ${refreshButton}
                <div class="max-w-7xl mx-auto flex flex-col md:flex-row gap-20">
                    <div class="md:w-1/3">
                        <h2 class="text-4xl font-light text-gray-800 uppercase tracking-[0.3em] leading-tight mb-8">Por que nos escolher</h2>
                        <div class="w-12 h-px bg-primary"></div>
                    </div>
                    <div class="md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-20">
                        ${beneficios.map((item, index) => `
                            <div class="flex flex-col border-l border-gray-200 pl-8 hover:border-primary transition-colors">
                                <span class="text-[10px] font-bold text-primary uppercase tracking-widest mb-4">Critério 0${index + 1}</span>
                                <h4 class="text-lg font-medium text-gray-900 uppercase tracking-widest mb-4 italic">${item.titulo}</h4>
                                <p class="text-sm text-gray-500 font-light italic leading-relaxed">${item.desc}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>`;
        case 'luxury-boutique':
            return `
            <section id="features-section" ${click} class="py-24 bg-[#fdfaf7] px-6 lg:px-8 group relative overflow-hidden cursor-pointer">
                ${refreshButton}
                <div class="max-w-7xl mx-auto">
                    <div class="flex flex-col md:flex-row gap-16 items-start mb-24">
                        <div class="flex-1">
                            <h2 class="text-4xl md:text-6xl font-serif italic text-[#5c4a33] leading-tight mb-6">Excelência em<br>cada detalhe.</h2>
                            <div class="w-20 h-px bg-[#b5927b]"></div>
                        </div>
                        <p class="flex-1 text-lg text-[#8a765e] font-light leading-relaxed md:pt-4">
                            Nossa dedicação se reflete em pilares fundamentais que garantem a autenticidade e o brilho de cada entrega.
                        </p>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-16">
                        ${beneficios.slice(0, 3).map((item, index) => `
                            <div class="flex flex-col">
                                <span class="text-4xl font-serif italic text-[#b5927b]/40 mb-6">0${index + 1}</span>
                                <h4 class="text-xl font-bold uppercase ${letterSpacing} text-[#5c4a33] mb-4">${item.titulo}</h4>
                                <p class="text-[#8a765e] leading-relaxed font-light">${item.desc}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>`;
        case 'dark-glow':
            return `
            <section id="features-section" ${click} class="py-32 bg-black px-6 lg:px-8 overflow-hidden relative group cursor-pointer">
                ${refreshButton}
                <div class="max-w-7xl mx-auto relative z-10">
                    <div class="text-center max-w-2xl mx-auto mb-20">
                        <h2 class="text-sm font-bold uppercase ${letterSpacing} mb-4" style="color: ${primaryColor}">Inovação Constante</h2>
                        <h3 class="text-4xl md:text-5xl font-black text-white leading-tight">Elevando o seu negócio.</h3>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        ${beneficios.map(item => `
                            <div class="group/glow relative bg-gray-900 border border-gray-800 p-8 hover:border-white/20 transition-all duration-500" style="border-radius: ${borderRadius}">
                                <div class="absolute inset-0 blur-2xl opacity-0 group-hover/glow:opacity-20 transition-opacity" style="background-color: ${primaryColor}; border-radius: ${borderRadius}"></div>
                                <div class="w-14 h-14 rounded-full bg-black border border-gray-800 flex items-center justify-center mb-6">
                                    ${starIcon}
                                </div>
                                <h4 class="text-xl font-bold text-white mb-4">${item.titulo}</h4>
                                <p class="text-gray-400 leading-relaxed">${item.desc}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>`;
        case 'grid-3':
        default:
            return `
            <section id="features-section" ${click} class="py-28 px-6 lg:px-8 group relative bg-transparent cursor-pointer">
                ${refreshButton}
                <div class="max-w-7xl mx-auto">
                    <div class="text-center max-w-2xl mx-auto mb-20">
                        <h2 class="text-3xl md:text-5xl font-extrabold mb-6 tracking-tight">Benefícios</h2>
                        <div class="w-20 h-1.5 mx-auto rounded-full" style="background-color: ${primaryColor}"></div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                        ${beneficios.map(item => `
                            <div class="bg-white p-8 ${shadow} transition-all duration-500 group/item hover:-translate-y-2" style="border-radius: ${borderRadius}; border: 1px solid ${primaryColor}05">
                                <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-6" style="background-color: ${primaryColor}10">
                                    ${starIcon}
                                </div>
                                <h4 class="text-xl font-bold mb-4 tracking-tight">${item.titulo}</h4>
                                <p class="opacity-70 leading-relaxed">${item.desc}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>`;
    }
};
exports.FeaturesSectionComponent = FeaturesSectionComponent;
