"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SidebarComponent = void 0;
const SidebarComponent = ({ aiData, estilo }) => {
    const primaryColor = estilo?.primary_color || '#b5927b';
    const bgColor = aiData?.header_bg || '#ffffff';
    const textColor = aiData?.header_text_color || '#111827';
    const headerFont = aiData?.header_font || 'Montserrat';
    // 🔥 Pegamos o tamanho, mas limitamos para o Sidebar (ex: max 200px) 
    // para não ocupar a tela toda no mobile
    const rawSize = Number(aiData?.logo_width || 120);
    const size = Math.min(rawSize, 200);
    const isLuxurious = ['Great Vibes', 'Alex Brush', 'Dancing Script', 'Pinyon Script'].includes(headerFont);
    const renderLogo = aiData?.logo_url
        ? `<img src="${aiData.logo_url}" style="
            width: ${size}px; 
            height: auto;
            max-height: 120px;
            object-fit: contain;
            display: block;
            transition: all 0.3s ease;
        " />`
        : `<span style="
            font-family:'${headerFont}';
            font-weight:900;
            color:${textColor};
            font-size:${Math.min(24, size / 5)}px;
            white-space:nowrap;
        ">${aiData?.nome_marca || 'Marca'}</span>`;
    const navStyle = `
        font-family: '${headerFont}', ${isLuxurious ? 'cursive' : 'sans-serif'};
        color: ${textColor};
        font-size: ${aiData?.menu_size || 18}px;
    `;
    return `
    <aside id="mobile-sidebar"
        class="fixed inset-y-0 right-0 z-[1000] w-full md:w-[400px] transform translate-x-full transition-all duration-500 flex flex-col shadow-2xl"
        style="background-color:${bgColor}; visibility:hidden;">

        <div class="p-8 flex flex-col h-full">

            <div class="flex justify-between items-center mb-12 gap-4" style="min-height: 60px;">
                <div class="flex-1 flex items-center overflow-hidden">
                    ${renderLogo}
                </div>
                <button onclick="toggleSidebar(false)" class="text-4xl flex-shrink-0" style="color:${textColor}; line-height: 1;">&times;</button>
            </div>

            <nav class="flex flex-col gap-6">
                ${['Início', 'Serviços', 'Galeria', 'Contato'].map((l, i) => `
                    <a href="#" style="${navStyle}" class="font-bold hover:opacity-50 transition-all flex items-center">
                        <span style="color:${primaryColor}; font-size:12px; margin-right:10px; font-family: sans-serif;">
                            0${i + 1}
                        </span>
                        ${l}
                    </a>
                `).join('')}
            </nav>

            <div class="mt-auto pt-10 border-t border-black/5">
                <p style="font-size:12px; opacity:.5; ${navStyle}">
                    © 2026 ${aiData?.nome_marca || 'GranConecta'}
                </p>
            </div>

        </div>
    </aside>`;
};
exports.SidebarComponent = SidebarComponent;
