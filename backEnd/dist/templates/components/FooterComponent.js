"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FooterComponent = void 0;
const FooterComponent = (aiData, variant = 'multi-column', estilo, tokens) => {
    const { nome_marca, telefone, email, endereco } = aiData;
    const ano = new Date().getFullYear();
    // Design Tokens & Estilo
    const primaryColor = estilo?.primary_color || '#3b82f6';
    const borderRadius = tokens?.borderRadius || '12px';
    const letterSpacing = tokens?.letterSpacing || 'tracking-normal';
    const bodyFont = estilo?.body_font || 'sans-serif';
    const click = `onclick="refreshSection('footer-section','footer')"`;
    const icons = {
        whatsapp: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.67-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>`,
        instagram: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.332 3.608 1.308.975.975 1.247 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.332 2.633-1.308 3.608-.975.975-2.242 1.247-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.332-3.608-1.308-.975-.975-1.247-2.242-1.308-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.332-2.633 1.308-3.608.975-.975 2.242-1.247 3.608-1.308 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-4.78 4.621-4.78 4.78-.058 1.281-.072 1.688-.072 4.948s.014 3.667.072 4.947c.2 4.358 4.621 4.78 4.78 4.78 1.281.058 1.688.072 4.948.072s3.667-.014 4.947-.072c4.358-.2 4.78-4.621 4.78-4.78.058-1.281.072-1.688.072-4.948s-.014-3.667-.072-4.947c-.2-4.358-4.621-4.78-4.78-4.78-1.281-.058-1.688-.072-4.948-.072z"/></svg>`
    };
    const refreshButton = `
        <div class="edit-overlay absolute bottom-4 right-4 z-50 opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
            <div class="bg-white/90 backdrop-blur shadow-2xl p-2 rounded-full text-gray-800 border border-gray-100 pointer-events-auto cursor-pointer">
                <svg class="w-4 h-4 animate-spin-hover" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
            </div>
        </div>
    `;
    switch (variant) {
        case 'mjv-innovation-footer': // Padrão MJV: Tech, Gigante, Bold
            return `
            <footer id="footer-section" ${click} class="bg-white pt-32 pb-12 px-6 group relative cursor-pointer border-t border-gray-100">
                ${refreshButton}
                <div class="max-w-7xl mx-auto">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-20 mb-32">
                        <div>
                            <h2 class="text-7xl md:text-9xl font-black tracking-tighter text-gray-900 italic mb-10 leading-[0.8]">
                                Vamos <br> criar juntos.
                            </h2>
                            <a href="mailto:${email}" class="text-2xl font-bold border-b-4 border-primary pb-2 hover:opacity-50 transition-all">${email}</a>
                        </div>
                        <div class="grid grid-cols-2 gap-10">
                            <div class="flex flex-col gap-6">
                                <span class="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Navegação</span>
                                <nav class="flex flex-col gap-4 text-2xl font-bold italic tracking-tighter">
                                    <a class="hover:text-primary transition-colors">Produtos</a>
                                    <a class="hover:text-primary transition-colors">Expertise</a>
                                    <a class="hover:text-primary transition-colors">Carreiras</a>
                                </nav>
                            </div>
                            <div class="flex flex-col gap-6">
                                <span class="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Social</span>
                                <nav class="flex flex-col gap-4 text-2xl font-bold italic tracking-tighter">
                                    <a class="hover:text-primary transition-colors">Instagram</a>
                                    <a class="hover:text-primary transition-colors">LinkedIn</a>
                                </nav>
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-col md:flex-row justify-between items-end gap-10 border-t border-gray-100 pt-12">
                        <div class="text-4xl font-black italic uppercase tracking-tighter">${nome_marca}</div>
                        <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400">© ${ano} — Direitos Reservados</p>
                    </div>
                </div>
            </footer>`;
        case 'artstones-signature': // Padrão Artstones: Assinatura, Luxo, Minimalista
            return `
            <footer id="footer-section" ${click} class="bg-[#f8f8f8] py-32 px-6 group relative cursor-pointer text-center">
                ${refreshButton}
                <div class="max-w-4xl mx-auto">
                    <div class="text-4xl font-light tracking-[0.5em] text-gray-800 uppercase mb-12">${nome_marca}</div>
                    <div class="w-12 h-px bg-primary mx-auto mb-16"></div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20 text-[11px] uppercase tracking-[0.3em] font-medium text-gray-500">
                        <div class="flex flex-col gap-4">
                            <span class="text-gray-900 font-bold tracking-widest mb-2">Contato</span>
                            <span>${telefone}</span>
                            <span>${email}</span>
                        </div>
                        <div class="flex flex-col gap-4">
                            <span class="text-gray-900 font-bold tracking-widest mb-2">Atendimento</span>
                            <span>Segunda à Sexta</span>
                            <span>09:00 — 18:00</span>
                        </div>
                        <div class="flex flex-col gap-4">
                            <span class="text-gray-900 font-bold tracking-widest mb-2">Onde estamos</span>
                            <span class="max-w-[150px] mx-auto">${endereco || "Showroom Digital"}</span>
                        </div>
                    </div>

                    <div class="flex justify-center gap-12 mb-20 text-gray-400">
                        <a class="hover:text-primary transition-colors">${icons.instagram}</a>
                        <a class="hover:text-primary transition-colors">${icons.whatsapp}</a>
                    </div>

                    <p class="text-[9px] uppercase tracking-[0.5em] text-gray-300">© ${ano} — ${nome_marca} Signature Collection</p>
                </div>
            </footer>`;
        case 'luxury-boutique':
            return `
            <footer id="footer-section" ${click} class="bg-[#fdfaf7] py-24 px-6 border-t border-[#b5927b]/10 text-center group relative cursor-pointer">
                ${refreshButton}
                <div class="max-w-4xl mx-auto flex flex-col items-center">
                    <div class="text-3xl font-serif italic text-[#5c4a33] mb-8 tracking-tight">${nome_marca}</div>
                    <nav class="flex flex-wrap justify-center gap-10 mb-12">
                        <a href="#" class="text-[10px] uppercase ${letterSpacing} font-bold text-[#8a765e] hover:opacity-50 transition-all">Coleções</a>
                        <a href="#" class="text-[10px] uppercase ${letterSpacing} font-bold text-[#8a765e] hover:opacity-50 transition-all">Sobre</a>
                        <a href="#" class="text-[10px] uppercase ${letterSpacing} font-bold text-[#8a765e] hover:opacity-50 transition-all">Atendimento</a>
                    </nav>
                    <div class="flex gap-8 mb-16">
                        <a href="#" class="text-[#b5927b] hover:opacity-50 transition-all">${icons.instagram}</a>
                        <a href="#" class="text-[#b5927b] hover:opacity-50 transition-all">${icons.whatsapp}</a>
                    </div>
                    <p class="text-[10px] uppercase ${letterSpacing} text-[#8a765e] opacity-60 max-w-sm leading-relaxed mb-12">${endereco || "Design autoral e curadoria exclusiva."}</p>
                    <div class="pt-12 border-t border-[#b5927b]/10 w-full text-[9px] uppercase ${letterSpacing} text-[#8a765e] opacity-40">
                        © ${ano} ${nome_marca} • Direitos Reservados
                    </div>
                </div>
            </footer>`;
        case 'dark-premium':
            return `
            <footer id="footer-section" ${click} class="bg-black text-white pt-24 pb-12 px-6 overflow-hidden relative group cursor-pointer">
                ${refreshButton}
                <div class="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                <div class="max-w-7xl mx-auto">
                    <div class="flex flex-col md:flex-row justify-between items-center mb-20 gap-10">
                        <div class="text-4xl font-black italic tracking-tighter" style="color: ${primaryColor}">${nome_marca}</div>
                        <div class="flex gap-4">
                            <a href="#" class="w-12 h-12 flex items-center justify-center border border-white/10 hover:bg-white hover:text-black transition-all" style="border-radius: ${borderRadius}">${icons.instagram}</a>
                            <a href="#" class="w-12 h-12 flex items-center justify-center border border-white/10 hover:bg-white hover:text-black transition-all" style="border-radius: ${borderRadius}">${icons.whatsapp}</a>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16 border-t border-white/5 py-16">
                        <div>
                            <h4 class="text-xs font-bold uppercase ${letterSpacing} mb-6" style="color: ${primaryColor}">Contatos</h4>
                            <p class="text-2xl font-bold mb-2">${telefone}</p>
                            <p class="opacity-50 text-sm">${email}</p>
                        </div>
                        <div>
                            <h4 class="text-xs font-bold uppercase ${letterSpacing} mb-6" style="color: ${primaryColor}">Local</h4>
                            <p class="opacity-60 leading-relaxed">${endereco || "Atendimento Digital Premium"}</p>
                        </div>
                    </div>
                    <div class="text-center mt-12 text-[10px] uppercase ${letterSpacing} opacity-20">
                        © ${ano} ${nome_marca} • Desenvolvido com Inteligência
                    </div>
                </div>
            </footer>`;
        case 'multi-column':
        default:
            return `
            <footer id="footer-section" ${click} class="bg-gray-50 pt-20 pb-10 px-6 border-t border-gray-100 group relative cursor-pointer">
                ${refreshButton}
                <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div class="md:col-span-1">
                        <div class="text-2xl font-black mb-6" style="color: ${primaryColor}">${nome_marca}</div>
                        <p class="opacity-60 text-sm leading-relaxed">Excelência e compromisso em cada detalhe.</p>
                    </div>
                    <div>
                        <h4 class="font-bold mb-6 uppercase text-[10px] ${letterSpacing}" style="color: ${primaryColor}">Links Rápidos</h4>
                        <ul class="space-y-3 text-sm opacity-70">
                            <li>Serviços</li>
                            <li>Galeria</li>
                            <li>FAQ</li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="font-bold mb-6 uppercase text-[10px] ${letterSpacing}" style="color: ${primaryColor}">Legal</h4>
                        <ul class="space-y-3 text-sm opacity-70">
                            <li>Privacidade</li>
                            <li>Termos</li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="font-bold mb-6 uppercase text-[10px] ${letterSpacing}" style="color: ${primaryColor}">Atendimento</h4>
                        <p class="text-sm opacity-70 mb-4">${endereco || "Fale conosco."}</p>
                        <a href="tel:${telefone}" class="text-lg font-black" style="color: ${primaryColor}">${telefone}</a>
                    </div>
                </div>
                <div class="max-w-7xl mx-auto pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p class="text-[10px] uppercase ${letterSpacing} opacity-40">© ${ano} ${nome_marca}</p>
                    <div class="flex gap-4">
                        <div class="w-8 h-8 flex items-center justify-center text-white" style="background-color: ${primaryColor}; border-radius: ${borderRadius}">${icons.whatsapp}</div>
                        <div class="w-8 h-8 flex items-center justify-center text-white" style="background-color: ${primaryColor}; border-radius: ${borderRadius}">${icons.instagram}</div>
                    </div>
                </div>
            </footer>`;
    }
};
exports.FooterComponent = FooterComponent;
