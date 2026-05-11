"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestimonialsComponent = void 0;
const TestimonialsComponent = (depoimentos, variant = 'masonry', estilo, tokens) => {
    if (!depoimentos || depoimentos.length === 0)
        return '';
    // Design Tokens
    const primaryColor = estilo?.primary_color || '#3b82f6';
    const borderRadius = tokens?.borderRadius || '12px';
    const letterSpacing = tokens?.letterSpacing || 'tracking-normal';
    const shadow = tokens?.shadow || 'shadow-lg';
    const click = `onclick="refreshSection('testimonials-section','testimonials')"`;
    const refreshButton = `
        <div class="edit-overlay absolute top-4 right-4 z-50 opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
            <div class="bg-white/90 backdrop-blur shadow-2xl p-2 rounded-full text-gray-800 border border-gray-200 pointer-events-auto">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
            </div>
        </div>
    `;
    const stars = `
        <div class="flex gap-1 text-yellow-400 mb-4">
            ${[1, 2, 3, 4, 5].map(() => `<svg class="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>`).join('')}
        </div>
    `;
    const getAvatar = (name) => {
        const safeName = (name && name.trim()) ? name : "C";
        return `
            <div class="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-inner" style="background-color: ${primaryColor}">
                ${safeName.substring(0, 1).toUpperCase()}
            </div>
        `;
    };
    switch (variant) {
        case 'minimal-elegant':
            return `
            <section id="testimonials-section" class="py-32 bg-[#fdfaf7] px-6 lg:px-8 group relative overflow-hidden">
                ${refreshButton}
                <div class="max-w-7xl mx-auto">
                    <div class="text-center mb-20">
                        <div class="w-12 h-px bg-[#b5927b] mx-auto mb-8"></div>
                        <h2 class="text-3xl font-serif italic text-[#5c4a33]">Experiências de nossos clientes</h2>
                    </div>
                    <div ${click} class="grid grid-cols-1 lg:grid-cols-3 gap-16 cursor-pointer">
                        ${depoimentos.slice(0, 3).map(item => `
                            <div class="text-center flex flex-col items-center">
                                <p class="font-serif italic text-xl text-[#8a765e] leading-relaxed mb-8">"${item.texto}"</p>
                                <div class="w-10 h-10 rounded-full mb-4 opacity-80">${getAvatar(item.nome)}</div>
                                <h4 class="text-xs font-bold uppercase ${letterSpacing} text-[#5c4a33]">${item.nome}</h4>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>`;
        case 'dark-marquee':
            return `
            <section id="testimonials-section" class="py-24 bg-gray-950 overflow-hidden relative group">
                ${refreshButton}
                <style>
                    @keyframes scroll-testimonials { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                    .animate-scroll-testimonials { animation: scroll-testimonials 40s linear infinite; width: max-content; }
                </style>
                <div ${click} class="animate-scroll-testimonials flex items-center gap-6 px-6 cursor-pointer">
                    ${[...depoimentos, ...depoimentos].map(item => `
                        <div class="w-[380px] shrink-0 bg-gray-900/50 backdrop-blur-sm border border-white/5 p-8" style="border-radius: ${borderRadius}">
                            ${stars}
                            <p class="text-gray-300 text-lg mb-8 italic leading-relaxed">"${item.texto}"</p>
                            <div class="flex items-center gap-4">
                                ${getAvatar(item.nome)}
                                <div>
                                    <h4 class="font-bold text-white">${item.nome}</h4>
                                    <p class="text-xs uppercase ${letterSpacing} text-gray-500">${item.cargo || 'Cliente'}</p>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>`;
        case 'bento-grid':
            return `
            <section id="testimonials-section" class="py-24 px-6 group relative">
                ${refreshButton}
                <div class="max-w-7xl mx-auto">
                    <div ${click} class="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr cursor-pointer">
                        ${depoimentos.map((item, index) => `
                            <div class="${index === 0 ? 'md:col-span-2 md:row-span-2' : 'col-span-1'} bg-white p-8 ${shadow} flex flex-col justify-between transition-all hover:scale-[1.01]" 
                                 style="border-radius: ${borderRadius}; border: 1px solid ${primaryColor}10">
                                <div>
                                    ${stars}
                                    <p class="${index === 0 ? 'text-2xl md:text-3xl' : 'text-lg'} font-medium text-gray-800 leading-relaxed mb-8 italic">"${item.texto}"</p>
                                </div>
                                <div class="flex items-center gap-4 border-t border-gray-50 pt-6">
                                    ${getAvatar(item.nome)}
                                    <div><h4 class="font-bold">${item.nome}</h4><p class="text-xs uppercase ${letterSpacing}" style="color: ${primaryColor}">${item.cargo || 'Cliente'}</p></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>`;
        case 'masonry':
        default:
            return `
            <section id="testimonials-section" class="py-24 px-6 group relative">
                ${refreshButton}
                <div class="max-w-7xl mx-auto columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                    ${depoimentos.map(item => `
                        <div ${click} class="break-inside-avoid bg-white p-8 ${shadow} border border-gray-100 cursor-pointer transition-all hover:shadow-2xl" 
                             style="border-radius: ${borderRadius}">
                            ${stars}
                            <p class="text-gray-700 leading-relaxed mb-6 italic">"${item.texto}"</p>
                            <div class="flex items-center gap-4">
                                ${getAvatar(item.nome)}
                                <div><h4 class="font-bold">${item.nome}</h4><p class="text-xs" style="color: ${primaryColor}">${item.cargo || 'Cliente'}</p></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>`;
    }
};
exports.TestimonialsComponent = TestimonialsComponent;
