export const injectCTA = (doc: Document, data: any) => {
    const section = doc.getElementById("cta-section") as HTMLElement;
    if (!section) return;

    const variant = data.cta_variant || "minimal-elegant";
    const bgImg = data.cta_image || "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069";

    const s = { ...data };

    console.log('ssssssssssss ', s)

    if (s.show_cta === false || s.show_cta === 'false') {
        section.style.display = "none";
        return; // Para a função aqui e não injeta nada
    } else {
        // Se for true, garantimos que ela volte a aparecer
        section.style.display = "flex";
    }
    // --- NOVAS VARIÁVEIS DE TIPOGRAFIA E RESPIRO ---
    const fontFamily = data.cta_font_family || "inherit";
    const fontWeight = data.cta_font_bold ? "900" : "400";
    const fontStyle = data.cta_font_italic ? "italic" : "normal";
    const paddingY = data.cta_padding_y || "120px";
    const maxWidth = data.cta_max_width || "1200px";
    const borderRadius = data.cta_border_radius || "0px";

    // --- LÓGICA DE FUNDO (COR SÓLIDA OU GRADIENTE) ---
    let backgroundStyle = `background-color: ${data.cta_bg_color || '#fdfaf7'};`;
    if (data.cta_bg_gradient_active && data.cta_bg_grad_1 && data.cta_bg_grad_2) {
        backgroundStyle = `background: linear-gradient(135deg, ${data.cta_bg_grad_1}, ${data.cta_bg_grad_2});`;
    }

    // Base da Seção (Atualizada com Respiro, Gradiente e Border Radius)
    section.style.cssText = `
        padding: ${paddingY} 5%;
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: 500px;
        ${backgroundStyle}
        border-radius: ${borderRadius};
        font-family: ${fontFamily}, sans-serif;
        font-weight: ${fontWeight};
        font-style: ${fontStyle};
        box-sizing: border-box;
        overflow: hidden;
    `;

    if (variant === 'glassmorphism') {
        section.style.backgroundImage = `url('${bgImg}')`;
        section.style.backgroundSize = "cover";
        section.style.backgroundPosition = "center";
        section.style.backgroundAttachment = "fixed";

        section.innerHTML = `
            <div style="
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(20px) saturate(180%);
                -webkit-backdrop-filter: blur(20px) saturate(180%);
                border: 1px solid rgba(255, 255, 255, 0.2);
                padding: 80px 40px;
                border-radius: 40px;
                text-align: center;
                max-width: 900px;
                width: 100%;
                box-shadow: 0 30px 60px rgba(0,0,0,0.2);
            ">
                ${generateHTMLContent(data, "#ffffff")}
            </div>
        `;
    } else if (variant === 'split') {
        // No split, garantimos que o gradiente de fundo não sobreponha a imagem lateral se ela existir
        section.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 60px; max-width: ${maxWidth}; align-items: center; width: 100%; margin: 0 auto;">
                <div style="text-align: left;">
                    ${generateHTMLContent(data, data.cta_title_color || "#333")}
                </div>
                <div style="
                    height: 500px; 
                    background: url('${bgImg}') center/cover; 
                    border-radius: 30px; 
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                "></div>
            </div>
        `;
    } else if (variant === 'centered-card') {
        section.innerHTML = `
            <div style="
                background: ${data.cta_title_color || '#111'};
                padding: 100px 60px;
                border-radius: 40px;
                text-align: center;
                max-width: ${maxWidth};
                width: 100%;
                box-shadow: 0 25px 50px rgba(0,0,0,0.15);
            ">
                ${generateHTMLContent(data, "#ffffff")}
            </div>
        `;
    } else {
        // Minimalista
        section.innerHTML = `<div style="text-align: center; max-width: ${maxWidth}; width: 100%; margin: 0 auto;">
            ${generateHTMLContent(data, data.cta_title_color || "#333")}
        </div>`;
    }
};

function generateHTMLContent(data: any, textColor: string) {
    const isGradient = data.cta_btn_gradient_active === true;
    const btnBg = isGradient
        ? `linear-gradient(45deg, ${data.cta_btn_grad_1 || '#3b82f6'}, ${data.cta_btn_grad_2 || '#8b5cf6'})`
        : (data.cta_button_bg || '#3b82f6');

    // 🔥 DEFINA A AÇÃO DO BOTÃO
    // Se for um prestador, a ação padrão é abrir o modal de serviço
    const actionAttr = data.cta_whatsapp_link
        ? `data-action="whatsapp-lead" href="${data.cta_whatsapp_link}"`
        : `data-action="service-request"`;

    const categoriaId = data.cta_categoria_id || data.categoriaId || "";
    const descricao = data.cta_descricao || "";

    return `
        <h3 style="text-transform: uppercase; letter-spacing: 4px; font-size: 13px; font-weight: 800; color: ${textColor}; opacity: 0.7; margin-bottom: 20px; font-family: inherit;">
            ${data.cta_overline || ""}
        </h3>
        <h2 style="font-size: clamp(32px, 5vw, 48px); font-weight: 900; color: ${textColor}; margin-bottom: 25px; line-height: 1.1; font-family: inherit;">
            ${data.cta_titulo || "Título do CTA"}
        </h2>
        <p style="font-size: 18px; color: ${textColor}; opacity: 0.9; margin-bottom: 40px; line-height: 1.6; font-family: inherit;">
            ${data.cta_subtitulo || ""}
        </p>
        
        <button 
          ${actionAttr}
          data-service-name="${data.cta_titulo}"
          data-service-description="${descricao}"
          data-service-category-id="${categoriaId}"
          class="cta-btn" 
          style="
            background: ${btnBg}; 
            color: ${data.cta_button_text_color || '#fff'}; 
            padding: 22px 50px; 
            border-radius: 50px; 
            border: none; 
            font-weight: 800; 
            text-transform: uppercase; 
            letter-spacing: 2px; 
            cursor: pointer; 
            transition: 0.3s;
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
            font-family: inherit;
        " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 15px 30px rgba(0,0,0,0.2)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 10px 20px rgba(0,0,0,0.1)'">
            ${data.cta_button_text || "Botão"}
        </button>
    `;
}