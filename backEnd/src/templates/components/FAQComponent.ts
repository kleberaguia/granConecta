export const FAQComponent = (faq: any[], variant: string = 'split', estilo?: any, tokens?: any, aiData?: any) => {
    if (!faq || faq.length === 0) return '';

    const primaryColor = estilo?.primary_color || '#3b82f6';
    const borderRadius = tokens?.borderRadius || '12px';
    const letterSpacing = tokens?.letterSpacing || 'tracking-normal';
    const bodyFont = estilo?.body_font || 'sans-serif';

    const click = `onclick="refreshSection('faq-section','faq')"`;

    const refreshButton = `
        <div class="edit-overlay absolute top-4 right-4 z-50 opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
            <div class="bg-white/90 backdrop-blur shadow-2xl p-2 rounded-full text-gray-800 border border-gray-100 pointer-events-auto cursor-pointer">
                <svg class="w-4 h-4 animate-spin-hover" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
            </div>
        </div>
    `;

    const tituloFaq = aiData?.faq_titulo || "Perguntas Frequentes";

    switch (variant) {
        case 'mjv-minimal-accordion': // Padrão MJV: Limpo, Corporativo, Sem bordas pesadas
            return `
            <section id="faq-section" ${click} class="py-32 bg-white px-6 group relative cursor-pointer">
                ${refreshButton}
                <div class="max-w-4xl mx-auto">
                    <div class="mb-20">
                        <span class="text-primary font-black uppercase text-[10px] ${letterSpacing} mb-4 block">Suporte e Dúvidas</span>
                        <h2 class="text-5xl md:text-6xl font-black text-gray-900 tracking-tighter italic" style="font-family: '${bodyFont}'">${tituloFaq}</h2>
                    </div>
                    <div class="space-y-2">
                        ${faq.map(item => `
                            <details class="group/faq border-b border-gray-100 transition-all duration-300">
                                <summary class="flex justify-between items-center py-8 cursor-pointer list-none">
                                    <span class="text-xl font-bold text-gray-800 group-hover/faq:text-primary transition-colors uppercase tracking-tight">${item.q}</span>
                                    <div class="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover/faq:bg-primary group-hover/faq:text-white transition-all">
                                        <svg class="w-5 h-5 transition-transform duration-300 group-open:rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                                    </div>
                                </summary>
                                <div class="pb-10 text-gray-500 leading-relaxed text-lg max-w-3xl">
                                    ${item.a}
                                </div>
                            </details>
                        `).join('')}
                    </div>
                </div>
            </section>`;

        case 'artstones-editorial': // Padrão Artstones: Fino, Espaçado, Elegante
            return `
            <section id="faq-section" ${click} class="py-32 bg-[#f8f8f8] px-6 group relative cursor-pointer">
                ${refreshButton}
                <div class="max-w-5xl mx-auto">
                    <div class="text-center mb-24">
                        <h2 class="text-4xl font-light text-gray-800 uppercase tracking-[0.4em] mb-4">${tituloFaq}</h2>
                        <div class="w-12 h-px bg-primary mx-auto"></div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-12">
                        ${faq.map((item, index) => `
                            <div class="group/item flex flex-col border-l border-gray-200 pl-8 hover:border-primary transition-colors">
                                <span class="text-[10px] font-bold text-primary/40 uppercase tracking-widest mb-4">Questão 0${index + 1}</span>
                                <h4 class="text-lg font-medium text-gray-900 uppercase tracking-widest mb-4 italic leading-tight">${item.q}</h4>
                                <p class="text-sm text-gray-500 font-light italic leading-relaxed">${item.a}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>`;

        case 'luxury-boutique':
            // Sua variante luxury consolidada com os tokens
            const luxuryItems = faq.map(item => `
                <details class="group border-b border-[#b5927b]/20 mb-2 overflow-hidden transition-all duration-500">
                    <summary class="flex justify-between items-center py-8 cursor-pointer list-none">
                        <span class="text-xl font-serif italic text-[#5c4a33] pr-8">${item.q}</span>
                        <span class="text-[#b5927b] transition-transform duration-500 group-open:rotate-45">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4"></path></svg>
                        </span>
                    </summary>
                    <div class="pb-8 text-[#8a765e] font-light leading-relaxed max-w-3xl">
                        ${item.a}
                    </div>
                </details>
            `).join('');

            return `
            <section id="faq-section" class="py-32 bg-[#fdfaf7] px-6 lg:px-8 group relative overflow-hidden">
                ${refreshButton}
                <div class="max-w-4xl mx-auto">
                    <div class="text-center mb-24">
                        <h2 class="text-4xl md:text-5xl font-serif italic text-[#5c4a33] mb-6">${tituloFaq}</h2>
                        <div class="w-12 h-px bg-[#b5927b] mx-auto mb-6"></div>
                    </div>
                    <div ${click} class="cursor-pointer">
                        ${luxuryItems}
                    </div>
                </div>
            </section>`;

        case 'grid':
        case 'split':
        default:
            const detailsItems = faq.map(item => `
                <details class="group bg-white mb-4 border border-gray-100 shadow-sm overflow-hidden transition-all" style="border-radius: ${borderRadius}">
                    <summary class="flex justify-between items-center font-bold cursor-pointer list-none p-6 text-lg">
                        <span>${item.q}</span>
                        <span class="transition-transform group-open:rotate-180 w-8 h-8 flex items-center justify-center rounded-full" style="background-color: ${primaryColor}15; color: ${primaryColor}">
                            <svg fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24"><polyline points="6 9 12 15 18 9"/></svg>
                        </span>
                    </summary>
                    <div class="opacity-70 px-6 pb-6 leading-relaxed">
                        ${item.a}
                    </div>
                </details>
            `).join('');
            
            return `
            <section id="faq-section" class="py-24 px-6 lg:px-8 group relative bg-transparent">
                ${refreshButton}
                <div class="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16">
                    <div class="lg:w-1/3">
                        <h2 class="text-4xl md:text-5xl font-black mb-6 leading-tight ${letterSpacing}">${tituloFaq}</h2>
                        <div class="w-16 h-2 rounded-full mb-8" style="background-color: ${primaryColor}"></div>
                    </div>
                    <div ${click} class="lg:w-2/3 cursor-pointer">${detailsItems}</div>
                </div>
            </section>`;
    }
};