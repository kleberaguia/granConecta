import { API_URL } from "../../../../api/api";

export const injectHeader = (
  doc: Document,
  aiData: any,
  textColor: string
) => {
  const header = doc.getElementById("main-header") as HTMLElement;
  if (!header) return;

  const s = { ...aiData };
  const bType = String(s.business_type || "servico").toLowerCase();

  const headerStyle = aiData.header_style_type || 'full';
  const bgType = aiData.header_bg_type || 'solid';

  header.style.borderRadius = "0px";
  header.style.width = "100%";
  header.style.margin = "0";
  header.style.backdropFilter = "none";


  if (bgType === 'gradient') {
    header.style.background = `linear-gradient(135deg, ${aiData.header_grad_1 || '#ffffff'}, ${aiData.header_grad_2 || '#f8fafc'})`;
  } else {
    header.style.background = aiData.header_bg || "#ffffff";
  }

  // 2. Aplicar Formato (Glass ou Floating)
  if (headerStyle === 'glass') {
    const hex = s.header_bg || "#ffffff";

    // 1. Cor de fundo com opacidade (70%)
    const bgColor = hex.startsWith('#') && hex.length === 7 ? hex + "B3" : "rgba(255, 255, 255, 0.7)";

    Object.assign(header.style, {
      background: bgColor,
      borderBottom: "1px solid rgba(255, 255, 255, 0.3)", // Borda de brilho
      boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",       // Sombra suave
    });

    // 2. O efeito de desfoque (Crucial para o Glass)
    header.style.setProperty('backdrop-filter', 'blur(12px)');
    header.style.setProperty('-webkit-backdrop-filter', 'blur(12px)');


    // 3. Garantir que os links fiquem legíveis
    header.style.color = s.header_text_color || "#000000";
  }

  else if (headerStyle === 'floating') {
    header.style.width = "90%";
    header.style.left = "5%"; // Centraliza o floating
    header.style.margin = "10px auto";
    header.style.borderRadius = "50px"; // O valor fixo '50px' funciona, mas garanta que não haja nada sobrescrevendo abaixo
    header.style.boxShadow = "0 10px 25px -5px rgba(0, 0, 0, 0.1)";
  }

  // Ajuste para imagem flutuante do Hero (caso exista)
  const floatingImg = doc.querySelector('.hero-floating-image') as HTMLElement;


  if (floatingImg) {
    floatingImg.style.borderRadius = aiData.hero_floating_radius || '0px';

  }

  const getFullImageUrl = (url: string) => {
    if (!url) return "";
    // Se for Base64 ou URL completa (http), mantém
    if (url.startsWith("data:") || url.startsWith("http")) return url;
    // Se for apenas o nome do arquivo, aponta para a pasta de uploads do servidor
    return `${API_URL}/uploads/images/${url}`;
  };

  // --- 1. Labels dinâmicos ---
  const getLabels = () => {
    const baseLabels: Record<string, string> = {
      hero: "Início",
      sobre: "Sobre",
      testimonials: "Clientes",
      faq: "Dúvidas",
      cta: "Contato",
      gallery: "Galeria",
    };
    baseLabels["vitrine"] =
      bType === "loja" ? s.produtos_titulo || "Produtos" : "Serviços";
    return baseLabels;
  };

  const labels = getLabels();

  // --- 2. Tipografia ---
  const chosenFont = s.header_font || "Montserrat";
  const fontId = `google-font-${chosenFont.replace(/\s+/g, "-")}`;
  if (!doc.getElementById(fontId)) {
    const link = doc.createElement("link");
    link.id = fontId;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${chosenFont.replace(
      /\s+/g,
      "+"
    )}:wght@300;400;700;800&display=swap`;
    doc.head.appendChild(link);
  }
  header.style.fontFamily = `'${chosenFont}', sans-serif`;

  // --- 3. Estrutura ---
  header.innerHTML = `
    <div class="nav-container">
      <div class="logo-wrapper"></div>
      <nav class="menu-links"></nav>
      <div class="cta-wrapper"></div>
    </div>`;

  const navContainer = header.querySelector(".nav-container") as HTMLElement;
  const logoWrapper = navContainer.querySelector(".logo-wrapper") as HTMLElement;
  const menuNav = navContainer.querySelector(".menu-links") as HTMLElement;
  const ctaWrapper = navContainer.querySelector(".cta-wrapper") as HTMLElement;

  // --- 4. Logo (COM ARREDONDAMENTO APLICADO) ---
  logoWrapper.innerHTML = "";
  if (s.logo_url) {
    const logoImg = doc.createElement("img");
    logoImg.src = getFullImageUrl(s.logo_url);
    logoImg.style.objectFit = "contain";
    logoImg.style.width = `${s.logo_width || 120}px`;

    // ADICIONE ESTA LINHA:
    // Garante que se vier um número do aiData, ele vire string com 'px'
    const radius = s.logo_radius !== undefined ? s.logo_radius : 0;
    logoImg.style.borderRadius = typeof radius === 'number' ? `${radius}px` : radius;

    logoImg.style.height = "auto";
    logoImg.style.maxWidth = "100%";
    logoImg.style.maxHeight = "100%";
    logoImg.className = "logo-img";
    logoWrapper.appendChild(logoImg);
  }

  // --- 5. Links do menu com âncoras ---
  menuNav.innerHTML = "";
  const sectionsToRender = [
    "hero",
    "vitrine",
    "gallery",
    "sobre",
    "testimonials",
    "faq",
    "cta",
  ];

  sectionsToRender.forEach((id) => {
    let isVisible = s[`show_${id}`] !== false;
    if (id === "vitrine" && bType !== "loja") isVisible = false;
    if (id === "gallery" && bType !== "servico" && !s.show_gallery)
      isVisible = false;

    if (isVisible) {
      const a = doc.createElement("a");
      a.setAttribute("href", `#${id}-section`);
      a.setAttribute("onclick", `document.getElementById('${id}-section').scrollIntoView({ behavior: 'smooth' }); return false;`);
      a.innerText = labels[id] || id;

      Object.assign(a.style, {
        fontSize: `${s.menu_size || 14}px`,
        color: s.header_text_color || textColor || "#FFFFFF",
        textDecoration: "none",
        fontWeight: "700",
        textTransform: "uppercase",
        padding: "8px 15px",
        transition: "all 0.2s ease",
        display: "inline-block",
      });

      a.onmouseenter = () =>
        (a.style.color = s.header_hover_color || "#3b82f6");
      a.onmouseleave = () =>
        (a.style.color = s.header_text_color || textColor || "#FFFFFF");

      menuNav.appendChild(a);
    }
  });

  // --- 6. Botão CTA ---
  ctaWrapper.innerHTML = "";
  if (s.header_show_cta_button) {
    const btn = doc.createElement("button");
    btn.innerText = s.header_cta_text || "CONTATO";

    if (s.cta_whatsapp_link) {
      btn.setAttribute("data-action", "whatsapp-lead");
      btn.setAttribute("href", s.cta_whatsapp_link);
    } else {
      btn.setAttribute("data-action", "service-request");
      btn.setAttribute("data-service-name", s.titulo || "Contato Geral");
    }



    Object.assign(btn.style, {
      backgroundColor: s.header_cta_bg || "#22c55e",
      color: s.header_cta_color || "#ffffff",
      padding: "10px 22px",
      borderRadius: `${s.header_cta_radius || 8}px`,
      fontSize: "13px",
      fontWeight: "800",
      border: "none",
      cursor: "pointer",
      textTransform: "uppercase",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      display: "inline-block",
      whiteSpace: "nowrap",
      transition: "all 0.3s ease",
      fontFamily: "inherit",
    });

    btn.onmouseenter = () => (btn.style.transform = "scale(1.05)");
    btn.onmouseleave = () => (btn.style.transform = "scale(1)");

    ctaWrapper.appendChild(btn);
  }

  // --- 7. Layout dinâmico ---
  const pos = s.logo_position || "left";
  Object.assign(navContainer.style, {
    maxWidth: "1280px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    padding: "15px 5%",
    width: "100%",
    gap: "20px",
  });

  [logoWrapper, menuNav, ctaWrapper].forEach((el) => {
    el.style.flex = "0 1 auto";
    el.style.textAlign = "center";
    el.style.width = "auto";
  });

  if (pos === "center") {
    navContainer.style.flexDirection = "column";
    navContainer.style.justifyContent = "center";
    navContainer.style.gap = "15px";

    logoWrapper.style.order = "1";
    menuNav.style.order = "2";
    ctaWrapper.style.order = "3";

    menuNav.style.width = "100%";
    menuNav.style.textAlign = "center";
  } else if (pos === "left") {
    navContainer.style.flexDirection = "row";
    navContainer.style.justifyContent = "space-between";

    logoWrapper.style.order = "1";
    menuNav.style.order = "2";
    menuNav.style.flex = "1";
    ctaWrapper.style.order = "3";
  } else if (pos === "right") {
    navContainer.style.flexDirection = "row";
    navContainer.style.justifyContent = "space-between";

    menuNav.style.order = "1";
    menuNav.style.flex = "1";
    menuNav.style.textAlign = "left";
    ctaWrapper.style.order = "2";
    logoWrapper.style.order = "3";
  }

  // --- 8. Configurações finais ---
  header.style.position = s.header_sticky ? "fixed" : "absolute";
  header.style.width = "100%";
  header.style.top = "0";
  header.style.left = "0";
  header.style.zIndex = "2000";
  //header.style.background = s.header_bg || "transparent";
};