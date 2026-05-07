export const injectFooter = (doc: Document, data: any) => {
  const footer = doc.getElementById("footer-section");
  if (!footer) return;

  const bgColor = data.footer_bg || "#111827";
  const textColor = data.footer_text || "#ffffff";
  const variant = data.footer_variant || "centered";
  
   const s = { ...data };

    console.log('ssssssssssss ', s)

    if (s.show_footer === false || s.show_footer=== 'false') {
        footer.style.display = "none";
        return; // Para a função aqui e não injeta nada
    } else {
        // Se for true, garantimos que ela volte a aparecer
        footer.style.display = "flex";
    }
  // --- 1. DICIONÁRIO DE ÍCONES (SVG PURO) ---
  const icons: any = {
    instagram: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.332 3.608 1.308.975.975 1.245 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.332 2.633-1.308 3.608-.975.975-2.242 1.245-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.332-3.608-1.308-.975-.975-1.245-2.242-1.308-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.332-2.633 1.308-3.608.975-.975 2.242-1.245 3.608-1.308 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-1.935.088-3.26.398-4.414 1.552-1.154 1.154-1.464 2.479-1.552 4.414-.058 1.28-.072 1.688-.072 4.947s.014 3.667.072 4.947c.088 1.935.398 3.26 1.552 4.414 1.154 1.154 2.479 1.464 4.414 1.552 1.28.058 1.688.072 4.947.072s3.667-.014 4.947-.072c1.935-.088 3.26-.398 4.414-1.552 1.154-1.154 1.464-2.479 1.552-4.414.058-1.28.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.088-1.935-.398-3.26-1.552-4.414-1.154-1.154-2.479-1.464-4.414-1.552-1.28-.058-1.688-.072-4.947-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.412.001 12.049a11.82 11.82 0 001.592 5.911L0 24l6.117-1.605a11.772 11.772 0 005.925 1.588h.005c6.635 0 12.046-5.412 12.049-12.05a11.829 11.829 0 00-3.56-8.519"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.454C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/></svg>'
  };

  // --- 2. LÓGICA DE LINKS DO SITE (DINÂMICO) ---
  const siteLinks = [
    { name: data.menu_home || "Início", key: "home" },
    { name: data.menu_produtos || "Produtos", key: "produtos" },
    { name: data.menu_servicos || "Serviços", key: "servicos" },
    { name: data.menu_sobre || "Sobre Nós", key: "sobre" },
    { name: data.menu_galeria || "Galeria", key: "galeria" },
    { name: data.menu_contato || "Contato", key: "contato" }
  ];

  const linksHTML = `
    <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px;">
      ${siteLinks.map(link => `
        <li>
          <a href="#${link.key}" style="color: inherit; text-decoration: none; font-size: 14px; opacity: 0.7; transition: 0.3s;" onmouseover="this.style.opacity=1; this.style.paddingLeft='5px'" onmouseout="this.style.opacity=0.7; this.style.paddingLeft='0'">
            ${link.name}
          </a>
        </li>
      `).join('')}
    </ul>
  `;

  // --- 3. LÓGICA DE REDES SOCIAIS ---
  const socialConfig = [
    { url: data.instagram_url, key: 'instagram' },
    { url: data.facebook_url, key: 'facebook' },
    { url: data.whatsapp_url, key: 'whatsapp' },
    { url: data.linkedin_url, key: 'linkedin' }
  ].filter(link => link.url);

  const socialHTML = `
    <div style="display: flex; gap: 12px; justify-content: ${variant === 'centered' ? 'center' : 'flex-start'}; align-items: center;">
      ${socialConfig.map(link => `
        <a href="${link.url}" target="_blank" style="width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: rgba(128,128,128,0.1); color: ${textColor}; text-decoration: none; transition: 0.3s;" onmouseover="this.style.background='rgba(128,128,128,0.2)'; this.style.transform='translateY(-3px)'" onmouseout="this.style.background='rgba(128,128,128,0.1)'; this.style.transform='translateY(0)'">
          <div style="width: 18px; height: 18px;">${icons[link.key]}</div>
        </a>
      `).join('')}
    </div>
  `;

  // --- 4. RENDERIZAÇÃO FINAL ---
  footer.style.cssText = `background-color: ${bgColor}; color: ${textColor}; padding: 80px 5% 40px 5%; font-family: sans-serif; position: relative; width: 100%; box-sizing: border-box;`;

  const logoHTML = data.footer_logo_url ? `<img src="${data.footer_logo_url}" style="max-height: 45px; margin-bottom: 20px; display: block;" />` : '';
  const descHTML = `<p style="font-size: 14px; opacity: 0.7; max-width: 350px; line-height: 1.6; margin-bottom: 20px;">${data.footer_desc || ''}</p>`;
  const copyrightHTML = `<span style="font-size: 12px; opacity: 0.5;">${data.copyright || `© ${new Date().getFullYear()} - Todos os direitos reservados.`}</span>`;

  if (variant === "corporate") {
    footer.innerHTML = `
      <div style="max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 60px; text-align: left;">
        <div>
          ${logoHTML}
          ${descHTML}
          ${socialHTML}
        </div>
        <div>
          <h4 style="font-size: 16px; font-weight: 800; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 1px;">Navegação</h4>
          ${linksHTML}
        </div>
        <div>
          <h4 style="font-size: 16px; font-weight: 800; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 1px;">Legal</h4>
          <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px;">
            <li><a href="#" style="color: inherit; text-decoration: none; font-size: 14px; opacity: 0.7;">Privacidade</a></li>
            <li><a href="#" style="color: inherit; text-decoration: none; font-size: 14px; opacity: 0.7;">Termos de Uso</a></li>
            <li><a href="#" style="color: inherit; text-decoration: none; font-size: 14px; opacity: 0.7;">Cookies</a></li>
          </ul>
        </div>
      </div>
      <div style="max-width: 1200px; margin: 60px auto 0; padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
        ${copyrightHTML}
      </div>
    `;
  } else {
    // Mantém o centralizado para outras variantes
    footer.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 30px;">
        <div>${logoHTML}${descHTML}</div>
        ${socialHTML}
        <div style="width: 50px; height: 1px; background: ${textColor}; opacity: 0.15;"></div>
        ${copyrightHTML}
      </div>
    `;
  }
};