export const LogosSectionComponent = (logos: any[], variant: string = 'inline', estilo?: any, tokens?: any) => {
    const hasLogos = logos && logos.length > 0;
    const itemsToRender = hasLogos ? logos : [1, 2, 3, 4, 5];

    // Design Tokens
    const primaryColor = estilo?.primary_color || '#3b82f6';
    const borderRadius = tokens?.borderRadius || '12px';
    const letterSpacing = tokens?.letterSpacing || 'tracking-normal';

    const click = `onclick="refreshSection('logos-section','logos')"`;

    const refreshButton = `
        <div class="edit-overlay absolute top-2 right-2 z-50 opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
            <div class="bg-white/90 backdrop-blur shadow-xl p-1.5 rounded-full text-gray-800 border border-gray-100 pointer-events-auto cursor-pointer">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
            </div>
        </div>
    `;

    // 🔥 PLACEHOLDERS ADAPTATIVOS
    const placeholders = [
        `<svg class="h-6 md:h-7 fill-current opacity-30 group-hover:opacity-100 transition-all" style="color: ${primaryColor}" viewBox="0 0 120 30"><text x="0" y="22" font-family="serif" font-size="20" font-weight="700" letter-spacing="2">LUNA</text></svg>`,
        `<svg class="h-6 md:h-7 fill-current opacity-30 group-hover:opacity-100 transition-all" style="color: ${primaryColor}" viewBox="0 0 120 30"><text x="0" y="22" font-family="sans-serif" font-size="20" font-weight="900">ACME</text></svg>`,
        `<svg class="h-6 md:h-7 fill-current opacity-30 group-hover:opacity-100 transition-all" style="color: ${primaryColor}" viewBox="0 0 120 30"><text x="0" y="22" font-family="serif" font-size="20" font-style="italic">Vogue</text></svg>`,
        `<svg class="h-6 md:h-7 fill-current opacity-30 group-hover:opacity-100 transition-all" style="color: ${primaryColor}" viewBox="0 0 120 30"><text x="0" y="22" font-family="sans-serif" font-size="18" font-weight="300" letter-spacing="4">ELITE</text></svg>`,
        `<svg class="h-6 md:h-7 fill-current opacity-30 group-hover:opacity-100 transition-all" style="color: ${primaryColor}" viewBox="0 0 120 30"><text x="0" y="22" font-family="serif" font-size="20" font-weight="600">Pure</text></svg>`
    ];

    const renderLogo = (l: any, i: number) => {
        if (hasLogos && l.url) {
            return `<img src="${l.url}" class="h-7 md:h-8 object-contain opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500" alt="Logo Parceiro" loading="lazy" />`;
        }
        return placeholders[i % placeholders.length];
    };

    switch (variant) {
        case 'luxury-boutique':
            return `
            <section id="logos-section" class="py-12 bg-[#fdfaf7] px-6 group relative overflow-hidden">
                ${refreshButton}
                <div ${click} class="max-w-7xl mx-auto flex flex-col items-center cursor-pointer">
                    <p class="text-[10px] uppercase ${letterSpacing} text-[#8a765e] mb-10 opacity-60">Destaque na Mídia e Parcerias</p>
                    <div class="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-70 grayscale">
                        ${itemsToRender.map((l, i) => renderLogo(l, i)).join('')}
                    </div>
                    <div class="w-16 h-px bg-[#b5927b] mt-12 opacity-30"></div>
                </div>
            </section>`;

        case 'grid-box':
            return `
            <section id="logos-section" class="py-16 bg-transparent px-6 lg:px-8 group relative">
                ${refreshButton}
                <div ${click} class="max-w-7xl mx-auto cursor-pointer">
                    <p class="text-xs font-black ${letterSpacing} uppercase text-center mb-10" style="color: ${primaryColor}">Tecnologias & Parceiros</p>
                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        ${itemsToRender.map((l, i) => `
                            <div class="bg-white dark:bg-gray-900 border border-gray-100 h-28 flex items-center justify-center p-6 hover:shadow-xl transition-all" style="border-radius: ${borderRadius}">
                                ${renderLogo(l, i)}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>`;

        case 'marquee':
            return `
            <section id="logos-section" class="py-12 bg-white dark:bg-gray-950 border-y border-gray-100 overflow-hidden relative group">
                ${refreshButton}
                <style>
                    @keyframes infinite-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                    .animate-infinite-scroll { animation: infinite-scroll 40s linear infinite; width: max-content; }
                </style>
                <div ${click} class="animate-infinite-scroll flex items-center gap-20 px-10 cursor-pointer">
                    ${[...itemsToRender, ...itemsToRender].map((l, i) => renderLogo(l, i)).join('')}
                </div>
            </section>`;

        case 'stats-inline':
            return `
            <section id="logos-section" class="py-16 bg-transparent px-6 lg:px-8 group relative border-y border-gray-50">
                ${refreshButton}
                <div ${click} class="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-10 cursor-pointer">
                    <div class="flex flex-col text-center lg:text-left shrink-0">
                        <h3 class="text-5xl font-black pro-title" style="color: ${primaryColor}">+5.000</h3>
                        <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">Clientes Atendidos</p>
                    </div>
                    <div class="w-px h-16 hidden lg:block" style="background-color: ${primaryColor}30"></div>
                    <div class="flex flex-wrap justify-center lg:justify-end items-center gap-10 md:gap-14">
                        ${itemsToRender.map((l, i) => renderLogo(l, i)).join('')}
                    </div>
                </div>
            </section>`;

        case 'trusted-badge':
        default:
            return `
            <section id="logos-section" class="py-20 bg-transparent px-6 lg:px-8 group relative">
                ${refreshButton}
                <div ${click} class="max-w-7xl mx-auto text-center flex flex-col items-center cursor-pointer">
                    <div class="inline-flex items-center gap-3 px-6 py-2 rounded-full border mb-12" style="background-color: ${primaryColor}05; border-color: ${primaryColor}20">
                        <span class="w-2 h-2 rounded-full animate-ping" style="background-color: ${primaryColor}"></span>
                        <span class="text-[10px] font-black tracking-widest uppercase" style="color: ${primaryColor}">Confiança & Autoridade</span>
                    </div>
                    <div class="flex flex-wrap justify-center items-center gap-12 md:gap-24">
                        ${itemsToRender.map((l, i) => renderLogo(l, i)).join('')}
                    </div>
                </div>
            </section>`;
    }
};