export const FinalCTAComponent = (aiData: any, variant: string = 'centered-card', estilo?: any, tokens?: any) => {

    const titulo = aiData?.cta_titulo || "O sucesso do seu projeto está a um clique.";
    const subtitulo = aiData?.cta_subtitulo || "Fale com nossos especialistas.";
    const textoBotao = aiData?.cta_button_text || "Começar Agora";

    // Novas Variáveis de Estilo Customizável
    const bgColor = aiData?.cta_bg_color || '#fdfaf7';
    const titleColor = aiData?.cta_title_color || '#5c4a33';
    const btnBg = aiData?.cta_btn_bg || estilo?.primary_color || '#b5927b';
    const btnTextColor = aiData?.cta_btn_text_color || '#ffffff';
    const fontFamily = aiData?.cta_font_family || 'inherit';

    const bgImg = aiData?.bgUrl || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1600";
    const wppLink = aiData?.telefone ? `https://wa.me/${aiData.telefone}` : "#";
    const borderRadius = tokens?.borderRadius || '12px';
    const letterSpacing = tokens?.letterSpacing || 'tracking-normal';

    const click = `onclick="refreshSection('cta-section','cta')"`;

    const overline = aiData?.cta_overline || "Próximo Passo";

    // Função auxiliar para aplicar a fonte inline se não for classe tailwind
    const fontStyle = fontFamily.includes("'") ? `font-family: ${fontFamily};` : "";

    switch (variant) {
        case 'minimal-elegant':
            return `
            <section id="cta-section" class="py-32 px-6 lg:px-8 border-t border-black/5 group relative overflow-hidden" style="background-color: ${bgColor}">
                <div ${click} class="max-w-4xl mx-auto text-center cursor-pointer">
                    <h2 class="text-xs font-bold ${letterSpacing} uppercase mb-6" style="color: ${titleColor}; opacity: 0.7">
    ${overline}
</h2>
                    <h3 class="text-5xl md:text-7xl mb-6 leading-tight pro-title" style="color: ${titleColor}; ${fontStyle}">
                        ${titulo}
                    </h3>
                    <p class="pro-subtitle mb-10 max-w-2xl mx-auto" style="color: ${titleColor}; opacity: 0.8">${subtitulo}</p>
                    <div class="w-16 h-px mx-auto mb-10" style="background-color: ${titleColor}"></div>
                    <a href="${wppLink}" class="pro-btn inline-block px-12 py-5 text-sm font-bold ${letterSpacing} uppercase transition-all duration-500 hover:scale-105"
                       style="background-color: ${btnBg}; color: ${btnTextColor}; border-radius: ${borderRadius}">
                        ${textoBotao}
                    </a>
                </div>
            </section>`;

        case 'glassmorphism':
            return `
            <section id="cta-section" class="relative py-32 px-6 lg:px-8 flex items-center justify-center min-h-[60vh] bg-cover bg-center group" style="background-image: url('${bgImg}');">
                <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
                <div ${click} class="relative z-10 w-full max-w-4xl bg-white/10 backdrop-blur-xl border border-white/20 p-12 md:p-20 shadow-2xl text-center cursor-pointer" style="border-radius: ${borderRadius}">
                    <h2 class="text-4xl md:text-6xl font-black mb-6 tracking-tight pro-title" style="color: #ffffff; ${fontStyle}">
                        ${titulo}
                    </h2>
                    <p class="text-xl mb-10 max-w-2xl mx-auto opacity-90 pro-subtitle" style="color: rgba(255,255,255,0.9)">
                        ${subtitulo}
                    </p>
                    <a href="${wppLink}" class="pro-btn inline-block px-10 py-4 font-bold text-lg shadow-xl hover:scale-105 transition-all duration-300"
                        style="background-color: ${btnBg}; color: ${btnTextColor}; border-radius: ${borderRadius}">
                        ${textoBotao}
                    </a>
                </div>
            </section>`;

        // ... Você aplicaria a mesma lógica de variáveis nos outros cases (split, centered-card)
        default:
            return `
            <section id="cta-section" class="py-24 px-6 lg:px-8 bg-transparent group relative" style="background-color: ${bgColor}">
                <div ${click} class="max-w-5xl mx-auto bg-gray-950 p-12 lg:p-24 text-center relative overflow-hidden shadow-2xl border border-white/5 cursor-pointer" style="border-radius: ${borderRadius}">
                    <div class="absolute inset-0 opacity-30" style="background: radial-gradient(circle at top left, ${btnBg}, transparent)"></div>
                    <div class="relative z-10">
                        <h2 class="text-4xl md:text-6xl font-black mb-6 tracking-tight pro-title" style="color: #ffffff; ${fontStyle}">${titulo}</h2>
                        <p class="text-xl mb-10 max-w-2xl mx-auto opacity-80 pro-subtitle" style="color: #e5e7eb">${subtitulo}</p>
                        <a href="${wppLink}" class="pro-btn inline-block px-10 py-5 font-bold text-xl transition-all duration-300 hover:scale-105"
                           style="background-color: ${btnBg}; color: ${btnTextColor}; border-radius: ${borderRadius}">
                            ${textoBotao}
                        </a>
                    </div>
                </div>
            </section>`;
    }
};