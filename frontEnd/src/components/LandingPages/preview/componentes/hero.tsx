export const injectHero = (doc: Document, data: any, primaryColor: string) => {
    const section = doc.getElementById("hero-section") as HTMLElement;
    if (!section) return;

    const s = { ...data };

    // 1. VISIBILIDADE
    if (s.show_hero === false || s.show_hero === 'false') {
        section.style.display = "none";
        return;
    } else {
        section.style.display = "flex";
    }

    const layoutMode = s.hero_layout_mode || "classic";
    const imgUrl = s.bgUrl || s.hero_image_url;

    // --- LIMPEZA INICIAL ---
    section.innerHTML = '';

    // 2. CONFIGURAÇÃO DO FUNDO (IMAGEM VS DEGRADÊ)
    section.style.minHeight = s.hero_height || "85vh";
    section.style.position = "relative";
    section.style.overflow = "hidden";
    section.style.display = "flex";
    section.style.alignItems = s.hero_vertical === 'top' ? 'flex-start' : (s.hero_vertical === 'bottom' ? 'flex-end' : 'center');

    if (s.hero_bg_type === 'gradient') {
        section.style.backgroundImage = 'none';
        section.style.background = `linear-gradient(135deg, ${s.hero_grad_1 || '#111'}, ${s.hero_grad_2 || primaryColor})`;
    } else {
        section.style.background = 'none';
        section.style.backgroundImage = `url('${imgUrl}')`;
        section.style.backgroundSize = "cover";
        section.style.backgroundPosition = "center";
    }

    // 3. GESTÃO DE OVERLAYS
    if (s.hero_bg_type !== 'gradient') {
        if (layoutMode === "split") {
            const solidColor = s.hero_solid_color || primaryColor || "#000";
            const imgPos = s.hero_img_position || "right";
            const gradientSplit = imgPos === "right"
                ? `linear-gradient(to right, ${solidColor} 0%, ${solidColor} 55%, transparent 100%)`
                : `linear-gradient(to left, ${solidColor} 0%, ${solidColor} 55%, transparent 100%)`;

            const splitOverlay = doc.createElement("div");
            splitOverlay.className = "hero-split-overlay";
            Object.assign(splitOverlay.style, {
                position: "absolute", inset: "0", zIndex: "1", background: gradientSplit, transition: "all 0.5s ease"
            });
            section.prepend(splitOverlay);
        } else {
            const classicOverlay = doc.createElement("div");
            classicOverlay.className = "hero-overlay";
            Object.assign(classicOverlay.style, {
                position: "absolute", inset: "0", zIndex: "1", pointerEvents: "none",
                background: `rgba(0,0,0,${s.hero_overlay_opacity || 0.4})`
            });
            section.prepend(classicOverlay);
        }
    }

    // 4. LÓGICA DE ALINHAMENTO
    let textAli = s.hero_align || "center";
    let flexAli = textAli === 'left' ? 'flex-start' : (textAli === 'right' ? 'flex-end' : 'center');

    if (layoutMode === "split" && s.hero_bg_type !== 'gradient') {
        const imgPos = s.hero_img_position || "right";
        textAli = imgPos === "right" ? "left" : "right";
        flexAli = imgPos === "right" ? "flex-start" : "flex-end";
    }

    // 5. GESTÃO DE FONTES MODERNAS
    const titleFont = s.hero_title_font || "Montserrat"; // Fonte do Título
    const badgeFont = s.hero_badge_font || titleFont;    // Fonte do Badge
    const subFont = s.hero_sub_font || "Inter";        // Fonte do Subtítulo (Opcional)

    // Carrega as fontes escolhidas no Header do Iframe
    [titleFont, badgeFont, subFont].forEach(font => {
        const fontId = `google-font-${font.replace(/\s+/g, '-')}`;
        if (!doc.getElementById(fontId)) {
            const link = doc.createElement("link");
            link.id = fontId; link.rel = "stylesheet";
            link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s+/g, '+')}:wght@400;700;900&display=swap`;
            doc.head.appendChild(link);
        }
    });

    // 6. RENDERIZAÇÃO DO CONTEÚDO
    const badgeBg = s.hero_badge_bg || primaryColor;
    const badgeTextColor = s.hero_badge_color || "#ffffff";

    const contentHtml = `
    <div class="hero-container" style="width: 100%; max-width: 1200px; margin: 0 auto; padding: 80px 5%; display: flex; flex-direction: column; justify-content: center; z-index: 10; position: relative; min-height: inherit;">
        <div class="hero-text-box" style="text-align: ${textAli}; display: flex; flex-direction: column; align-items: ${flexAli}; width: 100%; ${textAli === 'right' ? 'margin-left: auto;' : (textAli === 'center' ? 'margin: 0 auto;' : '')}">
            
            ${s.hero_badge ? `
                <span style="
                    background: ${badgeBg} !important; 
                    color: ${badgeTextColor} !important; 
                    font-family: '${badgeFont}', sans-serif !important;
                    padding: 8px 22px; 
                    border-radius: 50px; 
                    font-size: 11px; 
                    font-weight: 900; 
                    text-transform: uppercase; 
                    margin-bottom: 25px; 
                    display: inline-block;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                    letter-spacing: 1px;
                ">
                    ${s.hero_badge}
                </span>` : ""}

            <h1 style="
                font-family: '${titleFont}', sans-serif !important; 
                font-size: ${s.hero_title_size || '56px'}; 
                color: ${s.hero_title_color || "#ffffff"}; 
                font-weight: 900; 
                line-height: 1.1; 
                margin: 0;
                letter-spacing: -1px;
            ">
                ${s.titulo || "Sua Promessa"}
            </h1>

            <p style="
                font-family: '${subFont}', sans-serif;
                font-size: ${s.hero_sub_size || '18px'}; 
                color: ${s.hero_sub_color || "rgba(255,255,255,0.9)"}; 
                margin-top: 25px; 
                line-height: 1.6; 
                max-width: 700px;
            ">
                ${s.subtitulo || ""}
            </p>
            
            <div class="cta-area" style="margin-top: 35px; position: relative; z-index: 20;">
               ${renderBtnOrSearch(s, primaryColor)}
            </div>
        </div>
    </div>`;

    section.insertAdjacentHTML('beforeend', contentHtml);
};

const renderBtnOrSearch = (s: any, primaryColor: string) => {
    if (String(s.hero_show_search) === 'true') {
        const whatsappNumber = (s.telefone || s.whatsapp || "").replace(/\D/g, '');

        console.log('whatsappNumberrrrrrrrrrrrrrrrrrrrrrrrrrr ', whatsappNumber)

        return `
        <div class="search-wrap" style="width: 100%; max-width: 500px; margin-top: 35px; position: relative; z-index: 30;">
            <div style="display:flex; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 10px 25px rgba(0,0,0,0.1); border: 1px solid #eee;">
                <input type="text" id="hero-search-input" 
                    placeholder="${s.hero_search_placeholder || 'O que você procura?'}" 
                    style="flex:1; padding:18px 20px; border:none; outline:none; font-size:15px; color: #333;">
                <button id="hero-search-btn" style="background:${s.hero_button_bg || primaryColor}; color:#fff; border:none; padding:0 30px; font-weight:900; cursor:pointer; transition: 0.3s; text-transform: uppercase; font-size: 12px;">
                    BUSCAR
                </button>
            </div>
        </div>

        <script>
            (function() {
                const btn = document.getElementById('hero-search-btn');
                const input = document.getElementById('hero-search-input');

                btn.addEventListener('click', function() {
                    const query = input.value.trim().toLowerCase();
                    if (!query) return;

                    // 1. Tenta encontrar nos elementos da página (cards de produtos/serviços)
                    // Ajuste o seletor '.product-card' para a classe que você usa nos seus cards
                    const items = Array.from(document.querySelectorAll('.item-vitrine, .service-card, [data-searchable]'));
                    let found = false;

                    items.forEach(item => {
                        const text = item.textContent.toLowerCase();
                        if (text.includes(query)) {
                            item.style.display = 'block';
                            item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            found = true;
                        } else {
                            item.style.display = 'none'; // Esconde o que não combina
                        }
                    });

                    // 2. Se não encontrou nada na tela, dispara o WhatsApp
                    if (!found) {
                        const message = encodeURIComponent("Olá! Procurei por '" + input.value + "' no site e não encontrei. Vocês teriam disponível?");
                        const waUrl = "https://wa.me/${whatsappNumber}?text=" + message;
                        window.open(waUrl, '_blank');
                    }
                });

                // Permitir buscar ao apertar Enter
                input.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') btn.click();
                });
            })();
        </script>
        `;
    }

    // Fallback para o botão normal de WhatsApp se a busca estiver desligada
    const bgBtn = s.hero_button_bg || primaryColor || '#25D366';

    const rawNumber = (s.store_whatsapp || s.whatsapp || s.telefone || "").replace(/\D/g, '');
    const finalNumber = (rawNumber.length === 11 || rawNumber.length === 10) ? `55${rawNumber}` : rawNumber;
    const waLink = finalNumber ? `https://wa.me/${finalNumber}` : "#";

    return `
        <a href="${waLink}" 
        target="_blank" 
        rel="noopener noreferrer"
        style="background:${bgBtn}; color:${s.hero_button_color || '#fff'}; padding:16px 35px; border-radius:${s.hero_button_radius || '50px'}; text-decoration:none; font-weight:800; text-transform:uppercase; display:inline-flex; align-items:center; gap:10px; margin-top:35px; box-shadow: 0 8px 20px rgba(0,0,0,0.1);">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.305 1.652zm6.599-3.835c1.511.895 2.994 1.375 4.503 1.375 5.311 0 9.633-4.322 9.635-9.633.001-2.572-1.002-4.99-2.823-6.81s-4.238-2.822-6.81-2.823c-5.312 0-9.635 4.322-9.635 9.635 0 1.635.451 3.221 1.304 4.609l-.993 3.627 3.819-.98z"/></svg>
            ${s.hero_button_text || "Conversar no WhatsApp"}
        </a>`;
};