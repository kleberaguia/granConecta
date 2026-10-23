export const headerSidebarPresets = [
  {
    "preset_name": "header_claro_sidebar_escuro",
    "header_bg": "bg-white/90 backdrop-blur-md border-b border-gray-100",
    "header_text_color": "text-gray-900",
    "sidebar_bg": "bg-gray-950",
    "sidebar_text_color": "text-white",
    "logo_type": "solid",
    "logo_variant": "/img/logo1.png",
    
    // 🔥 NOVIDADES: Posicionamento e Tipografia
    "menu_position": "justify-end", // Joga os links para a direita
    "menu_typography": "font-sans text-sm font-bold uppercase tracking-widest", // Letras pequenas, maiúsculas e espaçadas
    "menu_hover": "hover:text-primary hover:-translate-y-0.5 transition-all",
    "menu_items": ["Início", "Soluções", "Diferenciais", "Contato"]
  },
  {
    "preset_name": "header_escuro_sidebar_claro",
    "header_bg": "bg-black/95 border-b border-white/10",
    "header_text_color": "text-white",
    "sidebar_bg": "bg-gray-50",
    "sidebar_text_color": "text-gray-900",
    "logo_type": "transparent",
    "logo_variant": "/img/logo-transparent.png",
    
    "menu_position": "justify-center", // Centraliza os links (Estilo luxo/editorial)
    "menu_typography": "font-serif text-lg font-medium tracking-wide", // Fonte com serifa, maior e elegante
    "menu_hover": "hover:opacity-70 transition-opacity",
    "menu_items": ["Início", "Serviços", "Contato"]
  },
  {
    "preset_name": "header_gradient_sidebar_colorido",
    "header_bg": "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600",
    "header_text_color": "text-white",
    "sidebar_bg": "bg-indigo-900",
    "sidebar_text_color": "text-white",
    "logo_type": "solid",
    "logo_variant": "/img/logo-solid.png",
    
    "menu_position": "justify-start ml-8", // Links colados no logo
    "menu_typography": "font-sans text-base font-bold tracking-tight", // Fonte grossa e juntinha
    "menu_hover": "hover:text-yellow-300 transition-colors",
    "menu_items": ["Início", "Portfólio", "Preços", "Contato"]
  },
  {
    "preset_name": "header_transparente_sidebar_gradient",
    "header_bg": "bg-transparent absolute top-0 w-full z-50", // Fica invisível sobre a imagem do Hero
    "header_text_color": "text-white",
    "sidebar_bg": "bg-gradient-to-b from-primary to-black",
    "sidebar_text_color": "text-white",
    "logo_type": "transparent",
    "logo_variant": "/img/logo-white.png",
    
    "menu_position": "justify-end gap-8", 
    "menu_typography": "font-mono text-sm font-semibold uppercase tracking-widest drop-shadow-md", // Fonte tech de programação
    "menu_hover": "hover:bg-white/20 px-4 py-2 rounded-full transition-all", // O hover cria um "botão" em volta do link
    "menu_items": ["Início", "Features", "Docs", "Contato"]
  },
  {
    "preset_name": "glassmorphism_premium",
    "header_bg": "bg-white/10 backdrop-blur-2xl border-b border-white/20 shadow-sm", // Vidro fosco
    "header_text_color": "text-gray-800 dark:text-white",
    "sidebar_bg": "bg-white/40 backdrop-blur-3xl",
    "sidebar_text_color": "text-gray-900",
    "logo_type": "transparent",
    "logo_variant": "/img/logo-glass.png",
    
    "menu_position": "justify-center gap-10", 
    "menu_typography": "font-sans text-sm font-semibold tracking-normal", 
    "menu_hover": "hover:text-primary hover:scale-110 transition-transform",
    "menu_items": ["Home", "Benefícios", "Testemunhos", "FAQ"]
  },
  {
    "preset_name": "brutalism_minimal",
    "header_bg": "bg-white border-b-4 border-black", // Traço grosso preto de borda
    "header_text_color": "text-black",
    "sidebar_bg": "bg-primary border-r-4 border-black",
    "sidebar_text_color": "text-black",
    "logo_type": "solid",
    "logo_variant": "/img/logo-black.png",
    
    "menu_position": "justify-end gap-6", 
    "menu_typography": "font-sans text-xl font-black uppercase tracking-tighter", // Letras gigantes, em negrito e grudadas
    "menu_hover": "hover:bg-black hover:text-white px-2 py-1 transition-colors", // Inverte a cor inteira no hover
    "menu_items": ["Start", "Work", "About", "Ping Us"]
  },
  {
    "preset_name": "boutique_elegant",
    "header_bg": "bg-[#f8f5f2]/80 backdrop-blur-md border-b border-black/10",
    "header_text_color": "text-gray-800",
    "sidebar_bg": "bg-[#f8f5f2]",
    "sidebar_text_color": "text-[#3e2f25]",
    "logo_type": "text",
    "logo_variant": "",
    "menu_position": "justify-center", // Centralizado como no seu código
    "menu_typography": "font-sans text-sm tracking-wide", 
    "menu_hover": "hover:text-primary transition-colors",
    "menu_items": ["Coleções", "Peças Únicas", "Nossa História", "Contato"]
  }
];