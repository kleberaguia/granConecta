export function renderElementorTemplate(template: any, estilo: any = {}) {
  const content = template?.content || [];

  // Função auxiliar para aplicar estilos globais do objeto 'estilo'
  // const getGlobalStyle = () => `
  //   <style>
  //     .elementor-wrapper { background-color: ${estilo.body_bg || '#0E0E0E'}; color: ${estilo.body_text_color || '#ffffff'}; font-family: '${estilo.body_font || 'Inter'}', sans-serif; }
  //     .primary-color { color: ${estilo.primary_color || '#DE1F5A'}; }
  //     .bg-primary { background-color: ${estilo.primary_color || '#DE1F5A'}; }
  //   </style>
  // `;

  const renderElement = (el: any): string => {
    const settings = el.settings || {};

    // RENDERIZAÇÃO DE CONTAINER
    if (el.elType === "container") {
      const children = (el.elements || []).map(renderElement).join("");
      const bgStyle = settings.background_image?.url ? `background-image: url('${settings.background_image.url}'); background-size: cover;` : '';
      return `<div style="width: 100%; ${bgStyle} padding: ${settings.padding?.top || 0}px 0;">${children}</div>`;
    }

    // RENDERIZAÇÃO DE HEADING
    if (el.widgetType === "heading") {
      return `<h2 style="color: ${settings.title_color || '#ffffff'}; font-size: ${settings.typography_font_size?.size || 32}px; font-weight: ${settings.typography_font_weight || '700'}; margin: 10px 0;">
                ${settings.title || ""}
              </h2>`;
    }

    // RENDERIZAÇÃO DE IMAGEM
    if (el.widgetType === "image") {
      return `<img src="${settings.image?.url || ''}" style="max-width: 100%; height: auto;" />`;
    }

    // RENDERIZAÇÃO DE BOTÃO
    if (el.widgetType === "button") {
      return `<a href="${settings.link?.url || '#'}" style="background: ${estilo.primary_color || '#DE1F5A'}; color: #fff; padding: 12px 24px; border-radius: ${estilo.border_style || '8px'}; text-decoration: none; display: inline-block;">
                ${settings.text || "ENTRE EM CONTATO"}
              </a>`;
    }

    // RECURSÃO (Se tiver filhos e não for container)
    if (el.elements && el.elements.length > 0) {
      return el.elements.map(renderElement).join("");
    }

    return "";
  };

  return `
    <link rel="stylesheet" href="https://canalaprendendosites.com.br/wp-content/plugins/elementor/assets/css/frontend-lite.min.css">
    <style>
      /* CSS DE FUNDAÇÃO PARA SALVAR O LAYOUT */
      body { background-color: ${estilo.body_bg || '#0E0E0E'}; }
      .elementor-section { width: 100% !important; display: block !important; }
      .elementor-container { display: flex !important; flex-wrap: wrap !important; width: 100% !important; }
      img { max-width: 100% !important; height: auto !important; }
    </style>
    <div class="elementor-wrapper">
      ${content.map(renderElement).join("")}
    </div>
  `;
}
