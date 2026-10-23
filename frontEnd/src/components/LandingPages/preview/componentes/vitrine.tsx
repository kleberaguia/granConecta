import { API_URL } from "../../../../utils/config";

export const injectVitrine = (
  doc: Document,
  data: any,
  primaryColor: string
) => {
  const section = doc.getElementById("vitrine-section");
  if (!section) return;

  const s = { ...data };
  const bType = data.business_type;

  const resolveImage = (p: any) => {
    const imagemRaw = p.image_url || p.imageUrl || p.imagem;
    if (!imagemRaw) return "https://via.placeholder.com/400x400?text=Sem+Foto";
    if (imagemRaw.startsWith('http') || imagemRaw.startsWith('data:')) return imagemRaw;
    const baseUrl = API_URL.replace(/\/$/, '');
    return `${baseUrl}/uploads/images/${imagemRaw.replace(/^\//, '')}`;
  };

  const renderCard = (p: any, titleColor: string, cardBg: string) => {
    const img = resolveImage(p);
    const isLoja = bType === 'loja';

    const temDesconto = p.old_price && Number(p.old_price) > Number(p.price);
    
    const precoAtual = p.price
      ? Number(p.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : "Sob Consulta";

    const precoAntigo = temDesconto
      ? Number(p.old_price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : null;

    const percentual = temDesconto 
      ? Math.round(((p.old_price - p.price) / p.old_price) * 100) 
      : 0;

    const mainBtn = isLoja
      ? `<button data-product-id="${p.id}" data-product-name="${p.name}" data-product-price="${p.price}" data-product-image="${img}" class="action-btn" style="width:100%; padding:12px; background:${primaryColor}; color:#fff; border:none; border-radius:8px; font-weight:900; text-transform:uppercase; cursor:pointer; font-size: 11px; transition: 0.2s;">Adicionar ao Carrinho</button>`
      : `<button data-action="service-request" data-service-name="${p.name}" class="action-btn" style="width:100%; padding:12px; background:${primaryColor}; color:#fff; border:none; border-radius:8px; font-weight:900; text-transform:uppercase; cursor:pointer; font-size: 11px; transition: 0.2s;">Solicitar Orçamento</button>`;

    const waBtn = isLoja
      ? `<a href="https://wa.me/${s.whatsapp_number}?text=Quero encomendar ${p.name}" data-action="whatsapp-lead" style="display:block; margin-top:8px; text-align:center; color:${primaryColor}; font-weight:600; text-decoration:none; font-size:12px;">Encomendar pelo WhatsApp</a>`
      : "";

    return `
    <div class="product-card item-vitrine" 
         data-searchable="${(p.name || '').toLowerCase()}"
         style="background:${cardBg}; padding:15px; border-radius:16px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); display: flex; flex-direction: column; height: 100%; transition: 0.3s; position:relative;">
      
      ${temDesconto ? `
        <div style="position:absolute; top:10px; right:10px; background:#ff4757; color:#fff; padding:4px 10px; border-radius:8px; font-size:10px; font-weight:900; z-index:5; box-shadow: 0 4px 10px rgba(255,71,87,0.3);">
          ${percentual}% OFF
        </div>
      ` : ""}

      <div class="product-image-container" style="aspect-ratio:1/1; margin-bottom:12px; border-radius:12px; overflow:hidden; background:#f8f9fa; display:flex; align-items:center; justify-content:center; padding:10px;">
        <img src="${img}" class="product-img-render" style="max-width:100%; max-height:100%; object-fit:contain; display: block; transition: 0.5s;"/>
      </div>

      <h3 style="font-size:16px; font-weight:800; color:${titleColor}; margin-bottom:8px; line-height: 1.2;">${p.name || 'Item'}</h3>
      
      <div style="margin-top: auto;">
        <div style="margin-bottom:12px;">
          ${temDesconto ? `<span style="text-decoration: line-through; color: #a1a1a1; font-size: 12px; display: block; margin-bottom: -4px;">${precoAntigo}</span>` : ""}
          <span style="font-size:18px; font-weight:900; color:${primaryColor};">${precoAtual}</span>
        </div>
        ${mainBtn}
        ${waBtn}
      </div>
    </div>
    `;
  };

  const renderList = (field: string) => {
    const items = Array.isArray(s[field]) ? s[field] : [];
    if (items.length === 0) return "";

    const title = s[`${field}_titulo`] || (field === 'produtos' ? 'Nossos Itens' : field);
    const titleColor = s[`${field}_title_color`] || primaryColor;
    const cardBg = s[`${field}_card_bg`] || '#ffffff';
    const layout = s.vitrine_layout || 'grid-modern';

    return `
      <div class="vitrine-group" style="margin-bottom: 50px;">
        <h2 style="color: ${titleColor}; text-align: center; font-size: 28px; font-weight: 900; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 1px;">${title}</h2>
        <div class="layout-wrapper ${layout}">
          ${items.map((p: any) => renderCard(p, titleColor, cardBg)).join('')}
        </div>
      </div>
    `;
  };

  if (!doc.getElementById("vitrine-styles")) {
    const style = doc.createElement("style");
    style.id = "vitrine-styles";
    style.innerHTML = `
      /* Layouts de Grade */
      .grid-modern { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:25px; }
      
      /* Estilo Glassmorphism */
      .card-glass { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:25px; }
      .card-glass .product-card { background: rgba(255,255,255,0.6) !important; backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.3); }

      /* Estilo Bento (Apple) */
      .bento-box { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:20px; }
      .bento-box .product-card { border-radius: 30px !important; border: none !important; background: #f2f2f7 !important; }

      /* Estilo Lista Luxury (Horizontal) */
      .list-luxury { display: flex; flex-direction: column; gap: 20px; }
      .list-luxury .product-card { flex-direction: row !important; align-items: center; height: 200px; }
      .list-luxury .product-image-container { width: 180px; height: 100%; margin-bottom: 0 !important; margin-right: 15px; }

      /* Interações */
      .product-card:hover { transform: translateY(-8px); box-shadow: 0 12px 30px rgba(0,0,0,0.1) !important; }
      .product-card:hover .product-img-render { transform: scale(1.1); }
      .action-btn:active { transform: scale(0.95); }
      
      @media (max-width: 600px) {
        .list-luxury .product-card { flex-direction: column !important; height: auto; }
        .list-luxury .product-image-container { width: 100%; }
      }
    `;
    doc.head.appendChild(style);
  }

  section.innerHTML = `
    <div style="max-width:1200px; margin:0 auto; padding:60px 5%; background:${s.produtos_bg_color || 'transparent'}; font-family:${s.vitrine_font || 'inherit'};">
      ${renderList('produtos')}
      ${renderList('combos')}
      ${renderList('bebidas')}
      ${(!s.produtos?.length && !s.combos?.length && !s.bebidas?.length) ?
      `<p style="text-align:center; opacity:0.5; padding: 40px;">Escolha itens no painel para exibir na vitrine.</p>` : ""}
    </div>
  `;
};