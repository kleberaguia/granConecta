export const injectServices = (doc: Document, data: any, primaryColor: string) => {
    const section = doc.getElementById("services-section") as HTMLElement;
    if (!section) return;

    const s = { ...data };
    
    // Verificação de visibilidade
    if (s.show_services === false || s.show_services === 'false') {
        section.style.display = "none";
        return;
    } else {
        section.style.display = "block";
    }

    const servicesList = s.services_items || [];
    const mode = s.services_mode || 'cards';

    // Variáveis de Estilo
    const cardBg = s.services_card_bg || '#ffffff'; 
    const cardTextColor = s.services_card_text_color || '#1a252f';
    const iconColor = s.services_icon_color || primaryColor || '#f39c12';
    const sectionBg = s.services_bg_section || 'transparent';
    const titleSize = s.services_title_size || '1.2rem';

    const renderIcon = (iconClass: string) => {
        const fullClass = iconClass.startsWith('fa') ? iconClass : `fas fa-${iconClass}`;
        return `<i class="${fullClass}" style="font-size: 3rem; color: ${mode === 'glass' ? '#fff' : iconColor} !important; margin-bottom: 20px; display: block;"></i>`;
    };

    let servicesHtml = '';

    if (mode === 'list') {
        servicesHtml = `
            <div style="max-width: 800px; margin: 0 auto; text-align: ${s.services_align || 'left'};">
                ${servicesList.map((item: any) => `
                    <div style="display: flex; align-items: center; gap: 20px; padding: 20px; border-bottom: 1px solid rgba(0,0,0,0.05); color: ${cardTextColor} !important;">
                        <div style="width: 50px; text-align: center;">${renderIcon(item.icon)}</div>
                        <div>
                            <h3 style="font-size: ${titleSize}; margin: 0; font-weight: 700; color: inherit !important;">${item.title}</h3>
                            <p style="opacity: 0.7; margin-top: 5px; color: inherit !important;">${item.desc}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        const getCardBaseStyle = () => {
            if (mode === 'glass') return `background: rgba(255,255,255,0.05) !important; backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); color: #fff !important;`;
            if (mode === 'minimal') return `background: transparent !important; border: 2px solid ${iconColor} !important; color: ${cardTextColor} !important;`;
            
            // AQUI É ONDE A COR DO CARD É APLICADA
            return `background-color: ${cardBg} !important; color: ${cardTextColor} !important; box-shadow: 0 10px 30px rgba(0,0,0,0.05);`;
        };

        servicesHtml = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px;">
                ${servicesList.map((item: any) => `
                    <div class="service-card" style="padding: 40px; border-radius: 20px; transition: 0.3s; text-align: ${s.services_align || 'center'}; ${getCardBaseStyle()}">
                        ${renderIcon(item.icon)}
                        <h3 style="margin-bottom: 15px; font-weight: 700; font-size: ${titleSize}; color: inherit !important;">${item.title}</h3>
                        <p style="opacity: 0.8; font-size: 0.95rem; color: inherit !important;">${item.desc}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }

    section.innerHTML = `
        <div style="padding: 100px 8%; background-color: ${sectionBg} !important; transition: all 0.3s ease;">
            <h2 style="font-size: 2.5rem; margin-bottom: 60px; text-align: center; font-weight: 900; color: ${mode === 'glass' ? '#fff' : 'inherit'} !important;">
                ${s.services_title || 'Nossos Serviços'}
            </h2>
            ${servicesHtml}
        </div>
    `;
};