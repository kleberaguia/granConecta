export const ServiceComponent = (servicos: any[], variant: string = 'grid-3', estilo?: any, tokens?: any, aiData?: any) => {
    if (!servicos || servicos.length === 0) return '';

    const primaryColor = estilo?.primary_color || '#3b82f6';
    const borderRadius = tokens?.borderRadius || '12px';
    const letterSpacing = tokens?.letterSpacing || 'tracking-normal';
    const bodyFont = estilo?.body_font || 'sans-serif';

    const click = `onclick="refreshSection('services-section','services')"`;

    const refreshButton = `
        <div class="edit-overlay absolute top-4 right-4 z-50 opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
            <div class="bg-white/90 backdrop-blur shadow-2xl p-2 rounded-full text-gray-800 border border-gray-100 pointer-events-auto cursor-pointer">
                <svg class="w-4 h-4 animate-spin-hover" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
            </div>
        </div>
    `;

    switch (variant) {
        case 'mjv-innovation-grid': // Estilo MJV: Técnico, Limpo, Corporativo
            return `
            <section id="services-section" ${click} class="py-32 bg-white px-6 group relative cursor-pointer overflow-hidden">
                ${refreshButton}
                <div class="max-w-7xl mx-auto">
                    <div class="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
                        <div class="max-w-2xl">
                            <span class="text-primary font-black uppercase text-[10px] ${letterSpacing} mb-4 block">Nossas Soluções</span>
                            <h2 class="text-5xl md:text-7xl font-black text-gray-900 leading-tight italic" style="font-family: '${bodyFont}'">O que fazemos de melhor.</h2>
                        </div>
                        <p class="text-gray-500 max-w-xs text-sm leading-relaxed">Transformamos dados em design e estratégia para o seu negócio evoluir.</p>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-gray-100">
                        ${servicos.map((s, i) => `
                            <div class="p-12 border-b border-gray-100 md:border-r hover:bg-gray-50 transition-all group/item relative overflow-hidden h-[400px] flex flex-col justify-between">
                                <div class="relative z-10">
                                    <span class="text-4xl font-black opacity-10 mb-6 block">0${i + 1}</span>
                                    <h3 class="text-2xl font-black mb-4 uppercase tracking-tighter text-gray-900">${s.nome}</h3>
                                    <p class="text-gray-500 text-sm leading-relaxed line-clamp-4">${s.descricao}</p>
                                </div>
                                <div class="relative z-10 flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest opacity-0 group-hover/item:opacity-100 transition-all translate-y-4 group-hover/item:translate-y-0">
                                    Explorar Solução <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                                </div>
                                <div class="absolute -bottom-20 -right-20 w-40 h-40 bg-primary/5 rounded-full group-hover/item:scale-[3] transition-transform duration-700"></div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>`;

        case 'artstones-showcase': // Estilo Artstones: Visual, Minimalista, Galeria de Luxo
            return `
            <section id="services-section" ${click} class="py-32 bg-[#f8f8f8] px-6 group relative cursor-pointer">
                ${refreshButton}
                <div class="max-w-7xl mx-auto text-center mb-24">
                    <h2 class="text-4xl md:text-5xl font-light text-gray-800 uppercase tracking-[0.3em] mb-6">Expertise & Arte</h2>
                    <div class="w-12 h-px bg-gray-400 mx-auto"></div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
                    ${servicos.map((s, i) => `
                        <div class="group/card flex flex-col items-center text-center">
                            <div class="relative w-full aspect-[16/9] overflow-hidden mb-8 shadow-2xl" style="border-radius: ${borderRadius}">
                                <img src="${s.imagemUrl || 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800'}" 
                                     class="w-full h-full object-cover grayscale group-hover/card:grayscale-0 group-hover/card:scale-105 transition-all duration-1000" />
                                <div class="absolute inset-0 bg-black/10 group-hover/card:bg-transparent transition-colors"></div>
                            </div>
                            <h3 class="text-xl font-medium text-gray-900 uppercase tracking-widest mb-4 italic">${s.nome}</h3>
                            <p class="text-gray-500 text-sm max-w-md font-light italic leading-relaxed mb-6">${s.descricao}</p>
                            <div class="h-px w-8 bg-gray-300 group-hover/card:w-24 transition-all duration-500"></div>
                        </div>
                    `).join('')}
                </div>
            </section>`;

        case 'grid-3':
        default: // Seu padrão original refinado com Design Tokens
            return `
            <section id="services-section" ${click} class="py-24 bg-white px-6 group relative cursor-pointer">
                ${refreshButton}
                <div class="max-w-7xl mx-auto text-center mb-16">
                    <h2 class="text-4xl font-black mb-4" style="color: ${primaryColor}">${aiData.servicos_titulo || 'Nossos Serviços'}</h2>
                    <p class="opacity-60 max-w-2xl mx-auto">${aiData.servicos_subtitulo || 'Qualidade garantida em cada projeto.'}</p>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    ${servicos.map(s => `
                        <div class="p-8 border border-gray-100 hover:shadow-2xl transition-all" style="border-radius: ${borderRadius}">
                            <div class="w-12 h-12 mb-6 flex items-center justify-center text-white" style="background-color: ${primaryColor}; border-radius: ${borderRadius}">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" stroke-width="2"/></svg>
                            </div>
                            <h3 class="text-xl font-bold mb-4 uppercase italic">${s.nome}</h3>
                            <p class="opacity-70 text-sm leading-relaxed">${s.descricao}</p>
                        </div>
                    `).join('')}
                </div>
            </section>`;
    }
};