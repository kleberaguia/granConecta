import { API_URL } from "../../../../utils/config";

export const injectSections = (doc: Document, data: any, textColor: string, businessType: string = 'food') => {


    const ehSetorAlimentacao = businessType === 'food';
    const renderProductList = (items: any[], title: string, titleColor: string, bgColor: string, cardBg: string, layout: string) => {
        if (!items || items.length === 0) return '';

        const gridStyle = layout === 'list'
            ? "display: flex; overflow-x: auto; gap: 20px; padding: 10px 0 20px 0; scrollbar-width: thin;"
            : "display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 30px;";

        return `
            <div style="background-color: ${bgColor || 'transparent'}; padding: 60px 5%; transition: all 0.3s ease;">
                <div style="max-width: 1200px; margin: 0 auto;">
                    <h3 style="color: ${titleColor || textColor}; font-size: 28px; font-weight: 800; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 1px;">
                        ${title}
                    </h3>
                    <div style="${gridStyle}">
                        ${items.map(item => {
            const imgUrl = item.image_url?.startsWith('data:') || item.image_url?.startsWith('http')
                ? item.image_url
                : `${API_URL}/uploads/images/${item.image_url}`;

            return `
                                <div style="background: ${cardBg || '#ffffff'}; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.03); min-width: 260px;">
                                    <div style="width: 100%; height: 200px; overflow: hidden;">
                                        <img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
                                    </div>
                                    <div style="padding: 20px;">
                                        <h4 style="margin: 0; font-size: 17px; font-weight: 700; color: ${textColor};">${item.name || item.nome}</h4>
                                        <p style="color: #2563eb; font-weight: 900; margin: 10px 0 0 0; font-size: 18px;">R$ ${item.price || item.preco}</p>
                                    </div>
                                </div>`;
        }).join('')}
                    </div>
                </div>
            </div>`;
    };

    // --- 0. SEÇÃO DESTAQUES DE QUALIDADE (Estrelinhas) ---
    const trustSection = doc.getElementById("trust_badges-section");
    if (trustSection) {
        const isVisible = data.show_trust_badges !== false && (data.trust_text || data.show_stars !== false);
        trustSection.style.display = isVisible ? 'block' : 'none';
        if (isVisible) {
            trustSection.innerHTML = `
                <div style="padding: 50px 5%; text-align: center; background: #f9fafb; border-bottom: 1px solid rgba(0,0,0,0.05);">
                    <div style="color: #fbbf24; font-size: 26px; margin-bottom: 15px; letter-spacing: 5px;">
                        ${data.show_stars !== false ? '★★★★★' : ''}
                    </div>
                    <h3 style="font-size: clamp(20px, 4vw, 24px); font-weight: 800; color: ${textColor}; margin: 0; line-height: 1.3;">
                        ${data.trust_text || "Qualidade e Satisfação Garantida"}
                    </h3>
                </div>`;
        }
    }

    // --- 1. SEÇÃO COMBOS ---
    const combosSection = doc.getElementById("combos-section");
    if (combosSection) {
        const isVisible = data.show_combos !== false && data.combos?.length > 0;
        combosSection.style.display = isVisible ? 'block' : 'none';
        if (isVisible) {
            combosSection.innerHTML = renderProductList(
                data.combos,
                data.combos_titulo || "Combos Mais Pedidos",
                data.combos_title_color,
                data.combos_bg_color,
                data.combos_card_bg,
                data.combos_layout || "grid"
            );
        }
    }

    // --- 2. SEÇÃO BEBIDAS ---
    const bebidasSection = doc.getElementById("bebidas-section");
    if (bebidasSection) {
        const isVisible = data.show_bebidas !== false && data.bebidas?.length > 0;
        bebidasSection.style.display = isVisible ? 'block' : 'none';
        if (isVisible) {
            bebidasSection.innerHTML = renderProductList(
                data.bebidas,
                data.bebidas_titulo || "Bebidas Geladas",
                data.bebidas_title_color,
                data.bebidas_bg_color,
                data.bebidas_card_bg,
                data.bebidas_layout || "grid"
            );
        }
    }

    // --- 3. SEÇÃO SOBRE ---
    const sobreSection = doc.getElementById("sobre-section");
    if (sobreSection) {
        const isVisible = data.show_sobre !== false && data.sobre_titulo;
        sobreSection.style.display = isVisible ? 'block' : 'none';
        if (isVisible) {
            sobreSection.style.backgroundColor = data.sobre_bg_color || "#f9fafb";
            sobreSection.innerHTML = `
                <div style="max-width: 1200px; margin: 0 auto; padding: 100px 5%; display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 80px; align-items: center;">
                    <div>
                        <h2 style="font-size: clamp(32px, 5vw, 48px); font-weight: 900; line-height: 1.1; margin-bottom: 25px; color: ${textColor};">
                            ${data.sobre_titulo || "Nossa História"}
                        </h2>
                        <div style="width: 60px; height: 4px; background: ${textColor}; margin-bottom: 30px; opacity: 0.2;"></div>
                        <p style="font-size: 18px; line-height: 1.8; color: ${textColor}; opacity: 0.8;">
                            ${data.sobre_texto || "Conte a trajetória da sua empresa aqui..."}
                        </p>
                    </div>
                    <div>
                        <img src="${data.sobre_img_url || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80'}" 
                             style="width: 100%; height: 450px; object-fit: cover; border-radius: 30px; box-shadow: 0 30px 60px rgba(0,0,0,0.1);" />
                    </div>
                </div>`;
        }
    }

    // --- 4. SEÇÃO DEPOIMENTOS ---
    const testSection = doc.getElementById("testimonials-section");
    if (testSection) {
        const isVisibleTest = data.show_testimonials !== false && data.testimonials?.length > 0;
        testSection.style.display = isVisibleTest ? 'block' : 'none';
        if (isVisibleTest) {
            const testimonials = data.testimonials || [];
            testSection.innerHTML = `
                <div style="padding: 100px 5%; background: ${data.test_bg_color || '#ffffff'};">
                    <h2 style="text-align: center; margin-bottom: 60px; font-size: 32px; font-weight: 900; color: ${textColor};">O que dizem nossos clientes</h2>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px; max-width: 1200px; margin: 0 auto;">
                        ${testimonials.map((t: any) => `
                            <div style="background: white; padding: 40px; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.03);">
                                <div style="color: #fbbf24; margin-bottom: 15px;">★★★★★</div>
                                <p style="color: ${textColor}; font-style: italic; margin-bottom: 20px; opacity: 0.8;">"${t.texto}"</p>
                                <h4 style="color: ${textColor}; font-weight: 800; margin: 0;">${t.nome}</h4>
                            </div>`).join('')}
                    </div>
                </div>`;
        }
    }

    // --- 5. SEÇÃO FAQ ---
    const faqSection = doc.getElementById("faq-section");
    if (faqSection && data.faq) {
        const isVisibleFaq = data.show_faq !== false && data.faq.length > 0;
        faqSection.style.display = isVisibleFaq ? 'block' : 'none';

        if (isVisibleFaq) {
            // Novas variáveis de estilo vindas do Editor
            const variant = data.faq_variant || 'modern';
            const accentColor = data.faq_accent_color || '#F16622';
            const fTextColor = data.faq_text_color || textColor || '#111827';
            const cardBg = data.faq_card_bg || '#ffffff';
            const sectionBg = data.faq_bg_color || '#ffffff';
            const marginBottom = data.faq_margin_bottom || 'py-24'; // Resolve o problema de sobreposição

            // Ajuste de Grid baseado na variante
            const gridClass = variant === 'split'
                ? "display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 30px;"
                : "display: flex; flex-direction: column; gap: 20px;";

            faqSection.innerHTML = `
        <div class="${marginBottom}" style="background-color: ${sectionBg}; transition: all 0.3s ease;">
            <div style="max-width: 1000px; margin: 0 auto; padding: 0 5%;">
                
                <div style="text-align: ${variant === 'split' ? 'left' : 'center'}; mb: 60px;">
                    <h2 style="font-size: clamp(28px, 5vw, 42px); font-weight: 900; margin-bottom: 20px; color: ${fTextColor};">
                        ${data.faq_titulo || 'Dúvidas Frequentes'}
                    </h2>
                    ${data.faq_subtitulo ? `<p style="color: ${fTextColor}; opacity: 0.7; margin-bottom: 30px;">${data.faq_subtitulo}</p>` : ''}
                    <div style="width: 60px; height: 5px; background: ${accentColor}; margin: ${variant === 'split' ? '0' : '0 auto'} 40px; border-radius: 10px;"></div>
                </div>

                <div style="${gridClass}">
                    ${data.faq.map((f: any) => {
                // Estilos baseados na variante
                const borderStyle = variant === 'minimal' ? `border-bottom: 1px solid ${accentColor}33;` : `border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 10px 30px rgba(0,0,0,0.02);`;
                const paddingStyle = variant === 'minimal' ? "padding: 20px 0;" : "padding: 30px; border-radius: 20px;";
                const finalCardBg = variant === 'minimal' ? 'transparent' : cardBg;

                return `
                        <div style="background: ${finalCardBg}; ${paddingStyle} ${borderStyle} transition: transform 0.3s ease;">
                            <h4 style="font-weight: 800; font-size: 17px; margin-bottom: 12px; color: ${fTextColor}; display: flex; gap: 10px;">
                                <span style="color: ${accentColor}">Q.</span>
                                ${f.pergunta}
                            </h4>
                            <div style="display: flex; gap: 10px;">
                                <div style="width: 2px; background: ${accentColor}; opacity: 0.3; border-radius: 10px;"></div>
                                <p style="font-size: 15px; line-height: 1.6; opacity: 0.8; color: ${fTextColor}; margin: 0;">
                                    ${f.resposta}
                                </p>
                            </div>
                        </div>`;
            }).join('')}
                </div>
            </div>
        </div>`;
        }
    }

    // --- 6. SERVIÇO EM DESTAQUE ---
    const featuredServiceSection = doc.getElementById("featured_service-section");
    if (featuredServiceSection) {
        const isVisible = data.show_featured_service !== false && data.featured_service_title;
        featuredServiceSection.style.display = isVisible ? 'block' : 'none';
        if (isVisible) {
            featuredServiceSection.innerHTML = `
            <div style="padding: 80px 5%; background: #0f172a; color: white; text-align: center;">
                <div style="max-width: 900px; margin: 0 auto;">
                    <h2 style="font-size: 36px; font-weight: 900; margin-bottom: 20px;">${data.featured_service_title}</h2>
                    <p style="font-size: 18px; opacity: 0.8; margin-bottom: 30px;">${data.featured_service_desc || ""}</p>
                    <button style="background: white; color: #000; padding: 14px 28px; border-radius: 999px; font-weight: 800; border: none; cursor: pointer;">
                        Solicitar agora
                    </button>
                </div>
            </div>`;
        }
    }

    // --- 7. SEÇÃO MESAS (RESERVA) ---
    const mesasSection = doc.getElementById("mesas-section");
    if (mesasSection) {
        // ✅ AGORA ESTÁ BLINDADO: 
        // Só aparece se for explicitamente 'food' E o usuário quiser mostrar (show_mesas)
        const isVisible = ehSetorAlimentacao && data.show_mesas !== false;

        mesasSection.style.display = isVisible ? 'block' : 'none';

        if (isVisible) {
            mesasSection.innerHTML = `
                <div style="padding: 80px 5%; background: ${data.mesas_bg_color || '#f9fafb'};">
                    <div style="max-width: 1000px; margin: 0 auto; text-align: center;">
                        <h2 style="font-size: 32px; font-weight: 900; margin-bottom: 20px; color: ${textColor};">
                            ${data.mesas_title || "Reserve sua mesa"}
                        </h2>
                        <p style="font-size: 16px; opacity: 0.7; margin-bottom: 30px; color: ${textColor};">
                            ${data.mesas_desc || "Garanta seu lugar com antecedência."}
                        </p>
                        <button onclick="window.open('https://wa.me/${data.store_whatsapp}', '_blank')"
                                style="background: #16a34a; color: white; padding: 14px 28px; border-radius: 999px; font-weight: 800; border: none; cursor: pointer;">
                            Reservar pelo WhatsApp
                        </button>
                    </div>
                </div>
            `;
        } else {
            mesasSection.innerHTML = ""; // Limpa o HTML se não for para mostrar
        }
    }
}