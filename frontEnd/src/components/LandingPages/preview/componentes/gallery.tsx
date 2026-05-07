export const injectGallery = (
    doc: Document, 
    data: any, 
    primaryColor: string, 
    defaultLabel?: string
) => {
    const gallerySection = doc.getElementById("gallery-section") as HTMLElement;
    if (!gallerySection) return;

    const s = { ...data };
    
    // --- 1. AMBIENTE E FUNDO ---
    // Usamos padding dinâmico para garantir respiro visual em telas retina
    Object.assign(gallerySection.style, {
        display: "block",
        padding: "80px 5%",
        boxSizing: "border-box",
        position: "relative"
    });

    if (s.galeria_bg_gradient_active && s.galeria_bg_color_2) {
        gallerySection.style.backgroundImage = `linear-gradient(180deg, ${s.galeria_bg_color || "#ffffff"} 0%, ${s.galeria_bg_color_2} 100%)`;
    } else {
        gallerySection.style.backgroundColor = s.galeria_bg_color || "#ffffff";
        gallerySection.style.backgroundImage = "none";
    }

    // --- 2. ESTRUTURA BASE ---
    gallerySection.innerHTML = `
        <div class="gallery-container" style="max-width: 1200px; margin: 0 auto;">
            <div class="gallery-header" style="margin-bottom: 50px; text-align: center;">
                <h2 class="gallery-title" style="margin: 0;"></h2>
            </div>
            <div class="gallery-grid"></div>
            <div class="gallery-action" style="margin-top: 50px; text-align: center;"></div>
        </div>
    `;

    const titleEl = gallerySection.querySelector(".gallery-title") as HTMLElement;
    const gridEl = gallerySection.querySelector(".gallery-grid") as HTMLElement;
    const actionEl = gallerySection.querySelector(".gallery-action") as HTMLElement;

    // --- 3. TÍTULO DINÂMICO (Lógica de Autoridade) ---
    if (titleEl) {
        // ✅ Prioridade: Nome do Editor > Rótulo da IA/Banco > Fallback
        titleEl.innerText = s.galeria_titulo || defaultLabel || "Nossos Trabalhos";
        
        Object.assign(titleEl.style, {
            fontFamily: s.galeria_title_font || "'Montserrat', sans-serif",
            fontWeight: s.galeria_title_bold ? "800" : "700",
            fontStyle: s.galeria_title_italic ? "italic" : "normal",
            fontSize: "clamp(2rem, 4vw, 3rem)",
            color: s.galeria_title_color || "#1a1a1a",
            letterSpacing: "-0.02em",
            lineHeight: "1.2"
        });
    }

    // --- 4. ENGINE DE LAYOUT (Grid Dinâmico) ---
    if (gridEl) {
        const images = Array.isArray(s.galeria) ? s.galeria : [];
        const layout = s.gallery_layout || "modern-card";

        // CSS Variável conforme layout escolhido no painel
        const layoutConfigs: Record<string, string> = {
            'carousel': `display: flex; gap: 20px; overflow-x: auto; padding-bottom: 20px; scroll-snap-type: x mandatory;`,
            'masonry': `columns: 2 250px; column-gap: 20px;`,
            'polaroid': `display: flex; flex-wrap: wrap; gap: 30px; justify-content: center;`,
            'modern-card': `display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;`
        };

        gridEl.style.cssText += layoutConfigs[layout] || layoutConfigs['modern-card'];

        gridEl.innerHTML = images.map((item: any, idx: number) => {
            const imgUrl = typeof item === 'string' ? item : (item.url || item.image);
            if (!imgUrl) return "";

            // Customização por estilo
            let cardStyle = "position: relative; overflow: hidden; border-radius: 12px; background: #eee; transition: 0.4s ease;";
            let imgStyle = "width: 100%; height: 100%; object-fit: cover; display: block; transition: 0.6s;";

            if (layout === 'polaroid') {
                cardStyle = `background: white; padding: 10px 10px 40px 10px; box-shadow: 0 10px 20px rgba(0,0,0,0.1); transform: rotate(${idx % 2 === 0 ? '1deg' : '-1deg'}); border-radius: 2px; width: 260px;`;
            } else if (layout === 'carousel') {
                cardStyle += "flex-shrink: 0; width: 300px; aspect-ratio: 4/5; scroll-snap-align: start;";
            } else {
                cardStyle += "aspect-ratio: 1/1;";
            }

            return `
                <div class="gallery-item" style="${cardStyle}" onmouseover="this.querySelector('img').style.transform='scale(1.1)'" onmouseout="this.querySelector('img').style.transform='scale(1)'">
                    <img src="${imgUrl}" style="${imgStyle}" loading="lazy" />
                    ${item.caption ? `
                        <div style="position:absolute; bottom:0; left:0; right:0; padding:15px; background:linear-gradient(transparent, rgba(0,0,0,0.8)); color:#fff; font-size:12px; font-weight:600;">
                            ${item.caption}
                        </div>
                    ` : ""}
                </div>
            `;
        }).join('');
    }

    // --- 5. BOTÃO DE CONVERSÃO (CTA) ---
    if (actionEl && s.gallery_cta_text) {
        actionEl.innerHTML = `
            <a href="https://wa.me/${s.store_whatsapp || ''}" target="_blank" style="
                display: inline-block;
                padding: 15px 40px;
                background: ${s.gallery_cta_bg || primaryColor};
                color: ${s.gallery_cta_text_color || '#ffffff'};
                border-radius: 8px;
                text-decoration: none;
                font-weight: 800;
                text-transform: uppercase;
                font-size: 12px;
                letter-spacing: 1px;
                transition: 0.3s;
            ">
                ${s.gallery_cta_text}
            </a>
        `;
    }
};