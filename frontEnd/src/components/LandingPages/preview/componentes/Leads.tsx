export const injectLeads = (doc: Document, aiData: any, primaryColor: string) => {
    const section = doc.getElementById("leads-section") as HTMLElement;
    if (!section || aiData.show_lead_magnet === false) {
        if (section) section.innerHTML = "";
        return;
    }

    const s = { ...aiData };
    const layout = s.magnet_layout || "classic";

    // --- 1. APLICAÇÃO DA COR DE FUNDO DA SEÇÃO ---
    section.style.padding = "80px 5%";
    section.style.background = s.magnet_bg_section || "#ffffff";

    // Lógica para cor do texto automática (Contraste)
    // Se o fundo for escuro (diferente de branco/claro), usamos texto branco
    const isDarkBg = s.magnet_bg_section && s.magnet_bg_section !== '#ffffff' && s.magnet_bg_section !== '#f8fafc';
    const titleColor = isDarkBg ? '#ffffff' : '#0f172a';
    const subColor = isDarkBg ? 'rgba(255,255,255,0.7)' : '#64748b';

    // Ajuste para Glassmorphism (precisa de um fundo escuro/colorido para o efeito aparecer)
    if (layout === 'glass' && !s.magnet_bg_section) {
        section.style.background = `linear-gradient(135deg, ${primaryColor}, #1e293b)`;
    }

    let contentHtml = "";

    // --- 2. SWITCH DE LAYOUTS ---
    switch (layout) {
        case "modern": // CENTRALIZADO
            contentHtml = `
                <div style="max-width: 800px; margin: 0 auto; text-align: center; padding: 60px; background: ${isDarkBg ? 'rgba(255,255,255,0.05)' : '#fff'}; border-radius: 40px; box-shadow: ${isDarkBg ? 'none' : '0 30px 60px rgba(0,0,0,0.05)'}; border: 1px solid ${isDarkBg ? 'rgba(255,255,255,0.1)' : '#f1f5f9'};">
                    <h2 style="font-size: 32px; font-weight: 900; margin-bottom: 15px; color: ${titleColor};">${s.magnet_titulo || "Baixe nosso guia"}</h2>
                    <p style="color: ${subColor}; margin-bottom: 30px;">${s.magnet_subtitulo || "Conteúdo exclusivo para você."}</p>
                    <div style="display: flex; gap: 10px; max-width: 500px; margin: 0 auto; flex-wrap: wrap;">
                        <input type="email" placeholder="Seu melhor e-mail" style="flex: 1; min-width: 200px; padding: 16px; border-radius: 15px; border: 1px solid #e2e8f0; outline: none;">
                        <button style="background: ${s.magnet_btn_bg || primaryColor}; color: #fff; padding: 16px 30px; border-radius: 15px; font-weight: 800; border: none; cursor: pointer; flex-grow: 1;">${s.magnet_btn || "Enviar"}</button>
                    </div>
                </div>`;
            break;

        case "glass": // TRANSPARENTE
            contentHtml = `
                <div style="max-width: 1000px; margin: 0 auto; background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.2); border-radius: 24px; padding: 50px; color: #fff; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 30px;">
                    <div style="flex: 1; min-width: 300px;">
                        <h2 style="font-size: 26px; font-weight: 800; margin: 0;">${s.magnet_titulo}</h2>
                        <p style="opacity: 0.8; margin-top: 10px;">${s.magnet_subtitulo}</p>
                    </div>
                    <div style="display: flex; gap: 10px; flex: 1; min-width: 300px;">
                        <input type="email" placeholder="E-mail" style="flex:1; padding: 14px; border-radius: 12px; border: none; background: rgba(255,255,255,0.9);">
                        <button style="background: #fff; color: #000; padding: 14px 25px; border-radius: 12px; font-weight: 800; border: none; cursor: pointer;">${s.magnet_btn}</button>
                    </div>
                </div>`;
            break;

        case "split": // COM IMAGEM
            contentHtml = `
                <div style="max-width: 1100px; margin: 0 auto; display: flex; background: ${isDarkBg ? 'rgba(255,255,255,0.05)' : '#fff'}; border-radius: 30px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1); flex-wrap: wrap; border: 1px solid ${isDarkBg ? 'rgba(255,255,255,0.1)' : 'transparent'};">
                    <div style="flex: 1; min-width: 300px; background: url('${s.bgUrl || s.foto_perfil_url}') center/cover; min-height: 300px;"></div>
                    <div style="flex: 1; min-width: 300px; padding: 50px; display: flex; flex-direction: column; justify-content: center;">
                        <h2 style="font-size: 28px; font-weight: 900; margin-bottom: 15px; color: ${titleColor};">${s.magnet_titulo}</h2>
                        <p style="color: ${subColor}; margin-bottom: 25px;">${s.magnet_subtitulo}</p>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <input type="email" placeholder="Seu mellhor e-mail" style="padding: 16px; border-radius: 12px; border: 1px solid #cbd5e1; outline: none;">
                            <button style="background: ${s.magnet_btn_bg || primaryColor}; color: #fff; padding: 16px; border-radius: 12px; font-weight: 800; border: none; cursor: pointer;">${s.magnet_btn}</button>
                        </div>
                    </div>
                </div>`;
            break;

        case "minimal": // DISCRETO
            contentHtml = `
                <div style="max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: center; gap: 30px; flex-wrap: wrap;">
                    <div style="text-align: center;">
                        <span style="font-weight: 800; font-size: 15px; text-transform: uppercase; color: ${titleColor}; letter-spacing: 1px;">${s.magnet_titulo}</span>
                        <p style="font-size: 12px; color: ${subColor}; margin: 5px 0 0 0;">${s.magnet_subtitulo}</p>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <input type="email" placeholder="Seu e-mail" style="padding: 12px 15px; border-radius: 10px; border: 1px solid #e2e8f0; width: 250px; outline: none;">
                        <button style="background: ${s.magnet_btn_bg || primaryColor}; color: #fff; padding: 12px 25px; border-radius: 10px; font-weight: 800; border: none; cursor: pointer;">${s.magnet_btn}</button>
                    </div>
                </div>`;
            break;

        default: // CLASSIC
            contentHtml = `
                <div style="max-width: 1000px; margin: 0 auto; background: ${isDarkBg ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}; border-radius: 30px; padding: 50px; display: flex; align-items: center; gap: 40px; flex-wrap: wrap; border: 1px solid ${isDarkBg ? 'rgba(255,255,255,0.1)' : '#e2e8f0'};">
                    <div style="flex: 1; min-width: 300px;">
                        <h2 style="font-size: 28px; font-weight: 900; color: ${titleColor}; margin-bottom: 15px; line-height: 1.2;">${s.magnet_titulo}</h2>
                        <p style="font-size: 16px; color: ${subColor}; margin: 0;">${s.magnet_subtitulo}</p>
                    </div>
                    <div style="flex: 1; min-width: 300px; display: flex; gap: 10px;">
                        <input type="email" placeholder="E-mail..." style="flex: 1; padding: 15px 20px; border-radius: 12px; border: 1px solid #cbd5e1; outline: none;">
                        <button style="background: ${s.magnet_btn_bg || primaryColor}; color: #fff; padding: 15px 30px; border-radius: 12px; font-weight: 800; border: none; cursor: pointer;">${s.magnet_btn}</button>
                    </div>
                </div>`;
    }

    section.innerHTML = contentHtml;
};