import type {
  CtaAction,
  NormalizedTemplateRequest,
  TemplatePalette,
  TemplateRendererV2Input,
  TemplateSectionKey,
  TemplateV2Product,
  TemplateV2Service,
} from "./TemplateTypes";

import { DEFAULT_TEMPLATE_PALETTE } from "./TemplateTypes";

export class TemplateRendererV2 {
  static render(input: TemplateRendererV2Input): string {
    const { request, variation, visualContext } = input;

    const palette: TemplatePalette = {
      ...DEFAULT_TEMPLATE_PALETTE,
      ...(variation.colors || {}),
      ...(request.colors || {}),
      ...(request.resolvedBrandPalette?.palette || {}),
    };

    const sections = variation.sectionOrder
      .map((section) =>
        renderSection({
          section,
          request,
          variation,
          visualContext,
          palette,
        }),
      )
      .filter(Boolean)
      .join("\n");

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(request.businessName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Montserrat:wght@400;500;600;700;800;900&family=Playfair+Display:wght@500;600;700&family=Cormorant+Garamond:wght@500;600;700&display=swap" rel="stylesheet" />
<style>${buildCss(palette, variation.family)}</style>
</head>
<body
  class="gc-v2 gc-v2-family-${safeClass(variation.family)} gc-v2-theme-${safeClass(visualContext.themeName)}"
  data-gc-template-renderer="renderer-v2"
  data-gc-layout-family="${escapeAttr(variation.family)}"
  data-gc-variation-index="${variation.variationIndex}"
>
${sections}
</body>
</html>`;
  }
}

function renderSection(input: {
  section: TemplateSectionKey;
  request: NormalizedTemplateRequest;
  variation: TemplateRendererV2Input["variation"];
  visualContext: TemplateRendererV2Input["visualContext"];
  palette: TemplatePalette;
}): string {
  const { section } = input;

  const map: Partial<Record<TemplateSectionKey, () => string>> = {
    topbar: () => renderTopbar(input),
    header: () => renderHeader(input),
    hero: () => renderHero(input),
    categories: () => renderCategories(input),
    featured: () => renderFeatured(input),
    products: () => renderProducts(input),
    services: () => renderServices(input),
    benefits: () => renderBenefits(input),
    about: () => renderAbout(input),
    testimonials: () => renderTestimonials(input),
    faq: () => renderFaq(input),
    contact: () => renderContact(input),
    footer: () => renderFooter(input),
  };

  return map[section]?.() || "";
}

function renderTopbar(input: {
  request: NormalizedTemplateRequest;
  variation: TemplateRendererV2Input["variation"];
}): string {
  const isService = input.request.pageKind === "servico";

  const items = isService
    ? ["Orçamento rápido", "Atendimento profissional", "Fale direto", "GranConecta"]
    : ["Compra prática", "Produtos selecionados", "Ofertas e novidades", "GranConecta"];

  return `<div class="gc-topbar">
  <div class="gc-container gc-topbar__inner">
    ${items.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
  </div>
</div>`;
}

function renderHeader(input: {
  request: NormalizedTemplateRequest;
}): string {
  const isService = input.request.pageKind === "servico";
  const mainHref = isService ? "#services" : "#products";
  const mainLabel = isService ? "Serviços" : "Produtos";

  return `<header class="gc-header" id="inicio">
  <div class="gc-container gc-header__inner">
    <a class="gc-brand" href="#inicio">${escapeHtml(input.request.businessName)}</a>
    <nav class="gc-nav">
      <a href="#inicio">Início</a>
      <a href="${mainHref}">${mainLabel}</a>
      <a href="#about">Sobre</a>
      <a href="#contact">Contato</a>
    </nav>
  </div>
</header>`;
}

function renderHero(input: {
  request: NormalizedTemplateRequest;
  variation: TemplateRendererV2Input["variation"];
  visualContext: TemplateRendererV2Input["visualContext"];
}): string {
  const { request, variation, visualContext } = input;
  const isService = request.pageKind === "servico";

  const title =
    request.copy?.heroTitle ||
    request.selectedVariation?.heroTitle ||
    request.aiVariation?.heroTitle ||
    defaultHeroTitle(request.businessName, visualContext.categoryName || request.businessSegment, isService);

  const subtitle =
    request.copy?.heroSubtitle ||
    request.selectedVariation?.heroSubtitle ||
    request.aiVariation?.heroSubtitle ||
    defaultHeroSubtitle(visualContext.categoryName || request.businessSegment, isService);

  const primary = actionButton({
    action: variation.primaryAction,
    label: labelForAction(variation.primaryAction, isService),
    primary: true,
  });

  const secondary = actionButton({
    action: variation.secondaryAction,
    label: labelForAction(variation.secondaryAction, isService),
    primary: false,
  });

  return `<section class="gc-hero gc-hero--${safeClass(variation.heroStyle)}" id="hero">
  <div class="gc-container gc-hero__inner">
    <div class="gc-hero__copy">
      <span class="gc-kicker">${escapeHtml(visualContext.categoryName || request.businessSegment)}</span>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(subtitle)}</p>
      <div class="gc-actions">
        ${primary}
        ${secondary}
      </div>
    </div>

    ${renderHeroMedia(visualContext, variation.heroStyle, request.businessName)}
  </div>
</section>`;
}

function renderHeroMedia(
  visualContext: TemplateRendererV2Input["visualContext"],
  heroStyle: string,
  businessName: string,
): string {
  const gallery = Array.from(
    new Set(
      [
        ...(visualContext.heroMedia?.gallery || []),
        ...(visualContext.heroImages || []),
        visualContext.heroImage,
        visualContext.categoryImage,
      ]
        .map((item) => String(item || "").trim())
        .filter(Boolean),
    ),
  );

  if (!gallery.length) return "";

  const primary = gallery[0];
  const secondary = gallery[1];
  const tertiary = gallery[2];

  const composition =
    (heroStyle === "magazine" || heroStyle === "catalog") &&
    Boolean(secondary);

  if (!composition) {
    return `<div class="gc-hero__media gc-hero__media--single">
      <img class="gc-hero__image gc-hero__image--primary" src="${escapeAttr(primary)}" alt="${escapeAttr(businessName)}" />
    </div>`;
  }

  return `<div class="gc-hero__media gc-hero__media--composition">
    <img class="gc-hero__image gc-hero__image--primary" src="${escapeAttr(primary)}" alt="${escapeAttr(businessName)}" />
    ${secondary ? `<img class="gc-hero__image gc-hero__image--secondary" src="${escapeAttr(secondary)}" alt="" />` : ""}
    ${tertiary ? `<img class="gc-hero__image gc-hero__image--tertiary" src="${escapeAttr(tertiary)}" alt="" />` : ""}
  </div>`;
}

function renderCategories(input: {
  request: NormalizedTemplateRequest;
  visualContext: TemplateRendererV2Input["visualContext"];
}): string {
  if (input.request.pageKind === "servico") return "";

  const categories = [
    input.visualContext.categoryName || input.request.businessSegment,
    "Mais vendidos",
    "Ofertas",
    "Novidades",
  ];

  return `<section class="gc-categories" id="categories">
  <div class="gc-container">
    <div class="gc-section-heading">
      <span>Explore</span>
      <h2>Escolha por categoria</h2>
      <p>Produtos organizados para facilitar sua compra.</p>
    </div>
    <div class="gc-category-grid">
      ${categories
        .map(
          (item, index) => `<button type="button" class="gc-category-card" data-action="${index === 2 ? "open-offers" : "open-products"}">
        <img src="${escapeAttr(input.visualContext.categoryImage || input.visualContext.defaultProductImage || "")}" alt="${escapeAttr(item || "")}" />
        <strong>${escapeHtml(item || "Categoria")}</strong>
      </button>`,
        )
        .join("")}
    </div>
  </div>
</section>`;
}

function renderFeatured(input: {
  request: NormalizedTemplateRequest;
  variation: TemplateRendererV2Input["variation"];
  visualContext: TemplateRendererV2Input["visualContext"];
}): string {
  const isService = input.request.pageKind === "servico";

  const action: CtaAction = isService ? "request-quote" : "open-offers";

  return `<section class="gc-featured" id="featured">
  <div class="gc-container gc-featured__inner">
    <div>
      <span>${isService ? "Atendimento especial" : "Oferta em destaque"}</span>
      <h2>${isService ? "Solicite uma condição personalizada" : "Aproveite descontos e combos"}</h2>
      <p>${isService ? "Fale com o prestador e explique o que você precisa." : "Veja produtos em promoção, kits e oportunidades para comprar melhor."}</p>
    </div>
    ${actionButton({
      action,
      label: isService ? "Solicitar orçamento" : "Aproveitar desconto real",
      primary: true,
    })}
  </div>
</section>`;



}
function renderProducts(input: {
  request: NormalizedTemplateRequest;
  variation: TemplateRendererV2Input["variation"];
  visualContext: TemplateRendererV2Input["visualContext"];
}): string {
  if (input.request.pageKind === "servico") return "";

  const products = ensureProducts(input.request.products, input.visualContext);

  return `<section class="gc-products gc-products--${safeClass(input.variation.productStyle)}" id="products" data-gc-products="true">
  <div class="gc-container">
    <div class="gc-section-heading">
      <span>${input.visualContext.categoryName || "Loja online"}</span>
      <h2>${productSectionTitle(input.visualContext.themeName)}</h2>
      <p>Escolha, adicione ao carrinho ou salve na lista de desejo.</p>
    </div>

    <div class="gc-products-grid gc-products-grid--${safeClass(input.variation.productStyle)}">
      ${products.map((product) => renderProductCard(product, input.variation.productStyle)).join("")}
    </div>
  </div>
</section>`;
}

function renderProductCard(
  product: TemplateV2Product,
  style: string,
): string {
  const price = Number(product.price || 0);
  const originalPrice = Number(product.originalPrice || 0);
  const hasDiscount = originalPrice > price && price > 0;

  return `<article class="gc-product-card gc-product-card--${safeClass(style)}" data-gc-product-card="true" data-product-id="${escapeAttr(product.id)}">
  <div class="gc-product-card__image">
    <img src="${escapeAttr(product.imageUrl || "")}" alt="${escapeAttr(product.name)}" data-gc-product-image="true" />
    ${hasDiscount ? `<span class="gc-badge">Oferta</span>` : ""}
  </div>

  <div class="gc-product-card__body">
    <h3>${escapeHtml(product.name)}</h3>
    <p>${escapeHtml(product.description || "Produto selecionado para você.")}</p>

    <div class="gc-price">
      ${
        price > 0
          ? `${hasDiscount ? `<small>${formatPrice(originalPrice)}</small>` : ""}<strong>${formatPrice(price)}</strong>`
          : `<strong>Consulte</strong>`
      }
    </div>

    <div class="gc-card-actions">
      ${
        price > 0
          ? `<button type="button" data-action="add-to-cart" data-gc-action="add-to-cart" data-gc-add-to-cart="true" data-product-id="${escapeAttr(product.id)}" data-product-name="${escapeAttr(product.name)}" data-product-price="${escapeAttr(price)}" data-product-image="${escapeAttr(product.imageUrl || "")}">Adicionar</button>`
          : `<button type="button" data-action="open-product" data-gc-action="open-product" data-product-id="${escapeAttr(product.id)}">Ver detalhes</button>`
      }

      <button type="button" data-action="add-to-wishlist" data-gc-action="add-to-wishlist" data-gc-wishlist="true" data-product-id="${escapeAttr(product.id)}" data-product-name="${escapeAttr(product.name)}" data-product-image="${escapeAttr(product.imageUrl || "")}">
        Desejo
      </button>
    </div>
  </div>
</article>`;
}

function renderServices(input: {
  request: NormalizedTemplateRequest;
  variation: TemplateRendererV2Input["variation"];
  visualContext: TemplateRendererV2Input["visualContext"];
}): string {
  if (input.request.pageKind !== "servico") return "";

  const services = ensureServices(input.request.services, input.visualContext);

  return `<section class="gc-services" id="services">
  <div class="gc-container">
    <div class="gc-section-heading">
      <span>${input.visualContext.categoryName || "Serviços"}</span>
      <h2>Escolha como podemos ajudar</h2>
      <p>Veja as opções, solicite orçamento ou fale direto pelo atendimento.</p>
    </div>

    <div class="gc-services-grid">
      ${services.map(renderServiceCard).join("")}
    </div>
  </div>
</section>`;
}

function renderServiceCard(service: TemplateV2Service): string {
  return `<article class="gc-service-card" data-gc-service-card="true" data-service-id="${escapeAttr(service.id)}">
  <div class="gc-service-icon">${escapeHtml(service.icon || "✅")}</div>
  <h3>${escapeHtml(service.title)}</h3>
  <p>${escapeHtml(service.description || "Serviço profissional com atendimento direto.")}</p>
  <strong>${escapeHtml(service.badge || "Atendimento")}</strong>

  <div class="gc-card-actions gc-service-actions">
    <button type="button" data-action="open-service" data-gc-action="open-service" data-service-id="${escapeAttr(service.id)}">Ver serviço</button>
    <button type="button" data-action="request-quote" data-gc-action="request-quote" data-service-id="${escapeAttr(service.id)}">Solicitar orçamento</button>
    <button type="button" data-action="open-chat" data-gc-action="open-chat">Chat</button>
    <button type="button" data-action="open-whatsapp" data-gc-action="open-whatsapp">WhatsApp</button>
  </div>
</article>`;
}

function renderBenefits(input: {
  request: NormalizedTemplateRequest;
}): string {
  const isService = input.request.pageKind === "servico";

  const benefits = isService
    ? [
        ["Atendimento rápido", "O cliente solicita orçamento em poucos cliques."],
        ["Mais confiança", "A página apresenta seu serviço com clareza."],
        ["Contato direto", "Chat e WhatsApp sempre acessíveis."],
        ["Presença profissional", "Visual preparado para gerar pedidos."],
      ]
    : [
        ["Compra prática", "O cliente vê, deseja e adiciona produtos."],
        ["Ofertas visíveis", "Combos e descontos ganham destaque."],
        ["Carrinho integrado", "Botões com ações padronizadas."],
        ["Atendimento próximo", "Chat e WhatsApp disponíveis."],
      ];

  return `<section class="gc-benefits" id="benefits">
  <div class="gc-container gc-benefits-grid">
    ${benefits
      .map(
        ([title, text]) => `<article class="gc-benefit-card">
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(text)}</span>
    </article>`,
      )
      .join("")}
  </div>
</section>`;
}

function renderAbout(input: {
  request: NormalizedTemplateRequest;
  visualContext: TemplateRendererV2Input["visualContext"];
}): string {
  const isService = input.request.pageKind === "servico";

  const title =
    input.request.copy?.aboutTitle ||
    `Sobre ${input.request.businessName}`;

  const text =
    input.request.copy?.aboutText ||
    (isService
      ? "Um atendimento profissional pensado para resolver sua necessidade com clareza, agilidade e confiança."
      : "Uma loja preparada para apresentar produtos, ofertas e atendimento de forma simples e profissional.");

  const image = isService
    ? input.visualContext.defaultServiceImage
    : input.visualContext.defaultProductImage;

  return `<section class="gc-about" id="about">
  <div class="gc-container gc-about__inner">
    <div class="gc-about__copy">
      <span>Nossa diferença</span>
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(text)}</p>
      ${actionButton({
        action: isService ? "request-quote" : "open-chat",
        label: isService ? "Solicitar atendimento" : "Falar com atendimento",
        primary: true,
      })}
    </div>

    <div class="gc-about__image">
      <img src="${escapeAttr(image || "")}" alt="${escapeAttr(title)}" />
    </div>
  </div>
</section>`;
}

function renderTestimonials(input: {
  request: NormalizedTemplateRequest;
}): string {
  const isService = input.request.pageKind === "servico";

  const title = isService
    ? "Confiança no atendimento"
    : "Clientes que gostam da experiência";

  return `<section class="gc-testimonials" id="testimonials">
  <div class="gc-container">
    <div class="gc-section-heading">
      <span>Depoimentos</span>
      <h2>${title}</h2>
      <p>Use esta área para destacar confiança, qualidade e satisfação.</p>
    </div>

    <div class="gc-testimonial-grid">
      ${["Atendimento excelente e rápido.", "Visual profissional e fácil de entender.", "Recomendo pela praticidade."]
        .map(
          (text) => `<article class="gc-testimonial-card">
        <p>“${escapeHtml(text)}”</p>
        <strong>Cliente GranConecta</strong>
      </article>`,
        )
        .join("")}
    </div>
  </div>
</section>`;
}

function renderFaq(input: {
  request: NormalizedTemplateRequest;
}): string {
  const isService = input.request.pageKind === "servico";

  const items = isService
    ? [
        ["Como solicito orçamento?", "Clique em solicitar orçamento e envie os detalhes do que precisa."],
        ["Posso falar antes pelo chat?", "Sim. O chat ajuda no primeiro atendimento."],
        ["O atendimento é pelo condomínio?", "A página facilita o contato com o prestador cadastrado."],
      ]
    : [
        ["Como faço para comprar?", "Adicione produtos ao carrinho ou fale com a loja pelo chat."],
        ["Posso salvar interesse?", "Sim. Use a lista de desejo para demonstrar interesse."],
        ["Tem ofertas e combos?", "Use o botão de ofertas para ver promoções e oportunidades."],
      ];

  return `<section class="gc-faq" id="faq">
  <div class="gc-container">
    <div class="gc-section-heading">
      <span>Dúvidas frequentes</span>
      <h2>Antes de continuar</h2>
    </div>

    <div class="gc-faq-list">
      ${items
        .map(
          ([question, answer]) => `<details>
        <summary>${escapeHtml(question)}</summary>
        <p>${escapeHtml(answer)}</p>
      </details>`,
        )
        .join("")}
    </div>
  </div>
</section>`;
}

function renderContact(input: {
  request: NormalizedTemplateRequest;
}): string {
  const isService = input.request.pageKind === "servico";

  return `<section class="gc-contact" id="contact">
  <div class="gc-container gc-contact__inner">
    <div>
      <span>Contato</span>
      <h2>${isService ? "Precisa de um orçamento?" : "Quer falar com a loja?"}</h2>
      <p>${isService ? "Explique sua necessidade e receba atendimento." : "Fale pelo chat, WhatsApp ou veja as ofertas disponíveis."}</p>
    </div>

    <div class="gc-actions">
      ${actionButton({
        action: isService ? "request-quote" : "open-chat",
        label: isService ? "Solicitar orçamento" : "Falar no chat",
        primary: true,
      })}
      ${actionButton({
        action: "open-whatsapp",
        label: "WhatsApp",
        primary: false,
      })}
    </div>
  </div>
</section>`;
}

function renderFooter(input: {
  request: NormalizedTemplateRequest;
}): string {
  return `<footer class="gc-footer" id="footer">
  <div class="gc-container gc-footer__inner">
    <strong>${escapeHtml(input.request.businessName)}</strong>
    <span>Página criada com GranConecta</span>
  </div>
</footer>`;
}

function buildCss(palette: TemplatePalette, family: string): string {
  return `
*{box-sizing:border-box}
:root{
  --gc-background:${palette.background};
  --gc-surface:${palette.surface};
  --gc-primary:${palette.primary};
  --gc-secondary:${palette.secondary};
  --gc-accent:${palette.accent};
  --gc-text:${palette.text};
  --gc-muted:${palette.mutedText};
  --gc-radius:24px;
  --gc-shadow:0 24px 70px rgba(15,23,42,.10);
  --gc-heading-font:${family === "magazine-story" || family === "luxury-editorial" ? `"Playfair Display"` : `"Montserrat"`};
  --gc-body-font:"Inter";
}
html{scroll-behavior:smooth}
body{margin:0;background:var(--gc-background);color:var(--gc-text);font-family:var(--gc-body-font),Arial,sans-serif;overflow-x:hidden}
img{max-width:100%;display:block}
a{text-decoration:none;color:inherit}
button{font-family:inherit}
.gc-container{width:min(1180px,calc(100% - 40px));margin:0 auto}
.gc-topbar{background:var(--gc-primary);color:var(--gc-surface);font-size:12px;font-weight:800;letter-spacing:.06em}
.gc-topbar__inner{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;text-align:center;padding:10px 0}
.gc-header{position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--gc-background) 88%,transparent);backdrop-filter:blur(14px);border-bottom:1px solid rgba(15,23,42,.08)}
.gc-header__inner{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:18px 0}
.gc-brand{font-family:var(--gc-heading-font),serif;font-size:28px;font-weight:900;color:var(--gc-primary)}
.gc-nav{display:flex;align-items:center;gap:22px;flex-wrap:wrap}
.gc-nav a{font-size:14px;font-weight:800;color:var(--gc-muted)}
.gc-hero{padding:94px 0;background:linear-gradient(135deg,var(--gc-background),var(--gc-surface))}
.gc-hero__inner{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center}
.gc-hero__copy h1{font-family:var(--gc-heading-font),serif;font-size:clamp(42px,6vw,82px);line-height:.96;letter-spacing:-.055em;margin:0 0 22px}
.gc-hero__copy p{font-size:18px;line-height:1.75;color:var(--gc-muted);margin:0 0 30px;max-width:680px}
.gc-kicker,.gc-section-heading span,.gc-about__copy span,.gc-contact span,.gc-featured span{display:inline-flex;margin-bottom:12px;color:var(--gc-accent);font-size:12px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}
.gc-actions{display:flex;gap:12px;flex-wrap:wrap}
.gc-btn{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:14px 26px;border-radius:999px;border:1px solid transparent;font-weight:900;cursor:pointer}
.gc-btn--primary{background:var(--gc-accent);color:#111827}
.gc-btn--secondary{background:transparent;color:var(--gc-primary);border-color:rgba(15,23,42,.18)}
.gc-hero__media{position:relative;min-width:0}
.gc-hero__media--single .gc-hero__image--primary,.gc-about__image img{width:100%;height:520px;object-fit:cover;border-radius:var(--gc-radius);box-shadow:var(--gc-shadow)}
.gc-hero__media--composition{min-height:540px}
.gc-hero__media--composition .gc-hero__image{position:absolute;object-fit:cover;box-shadow:var(--gc-shadow)}
.gc-hero__media--composition .gc-hero__image--primary{inset:0 8% 8% 0;width:84%;height:88%;border-radius:var(--gc-radius)}
.gc-hero__media--composition .gc-hero__image--secondary{right:0;bottom:0;width:38%;height:42%;border:8px solid var(--gc-surface);border-radius:calc(var(--gc-radius) * .72)}
.gc-hero__media--composition .gc-hero__image--tertiary{right:3%;top:2%;width:28%;height:28%;border:7px solid var(--gc-surface);border-radius:50%}
.gc-section-heading{text-align:center;max-width:760px;margin:0 auto 38px}
.gc-section-heading h2{font-family:var(--gc-heading-font),serif;font-size:clamp(34px,4vw,54px);line-height:1;margin:0 0 12px;letter-spacing:-.04em}
.gc-section-heading p{margin:0;color:var(--gc-muted);line-height:1.7}
.gc-categories,.gc-featured,.gc-products,.gc-services,.gc-about,.gc-testimonials,.gc-faq{padding:86px 0}
.gc-category-grid,.gc-products-grid,.gc-services-grid,.gc-benefits-grid,.gc-testimonial-grid{display:grid;gap:24px}
.gc-category-grid{grid-template-columns:repeat(4,1fr)}
.gc-products-grid,.gc-services-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
.gc-benefits-grid{grid-template-columns:repeat(4,1fr)}
.gc-testimonial-grid{grid-template-columns:repeat(3,1fr)}
.gc-category-card,.gc-product-card,.gc-service-card,.gc-benefit-card,.gc-testimonial-card,details{background:var(--gc-surface);border:1px solid rgba(15,23,42,.08);border-radius:var(--gc-radius);box-shadow:var(--gc-shadow);overflow:hidden}
.gc-category-card{padding:16px;text-align:left;cursor:pointer}
.gc-category-card img{width:100%;height:140px;object-fit:cover;border-radius:18px;margin-bottom:12px}
.gc-featured{background:var(--gc-primary);color:var(--gc-surface)}
.gc-featured__inner{display:flex;align-items:center;justify-content:space-between;gap:28px}
.gc-featured h2{font-family:var(--gc-heading-font),serif;font-size:clamp(34px,4vw,58px);line-height:1;margin:0 0 14px}
.gc-featured p{color:color-mix(in srgb,var(--gc-surface) 75%,transparent);max-width:650px}
.gc-product-card{display:flex;flex-direction:column}
.gc-product-card__image{position:relative;background:#f8fafc}
.gc-product-card__image img{width:100%;height:300px;object-fit:contain;padding:18px}
.gc-badge{position:absolute;top:16px;left:16px;background:var(--gc-accent);color:#111827;border-radius:999px;padding:7px 12px;font-size:12px;font-weight:900}
.gc-product-card__body,.gc-service-card{padding:22px;display:flex;flex-direction:column;gap:12px}
.gc-product-card h3,.gc-service-card h3{font-family:var(--gc-heading-font),serif;font-size:24px;line-height:1.15;margin:0}
.gc-product-card p,.gc-service-card p{margin:0;color:var(--gc-muted);line-height:1.6}
.gc-price{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.gc-price small{text-decoration:line-through;color:var(--gc-muted);font-weight:800}
.gc-price strong{font-size:22px;color:var(--gc-accent);font-weight:900}
.gc-card-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:auto}
.gc-card-actions button{min-height:44px;border:0;border-radius:999px;background:var(--gc-primary);color:var(--gc-surface);font-weight:900;cursor:pointer}
.gc-card-actions [data-gc-wishlist]{background:transparent;color:var(--gc-primary);border:1px solid rgba(15,23,42,.15)}
.gc-service-icon{font-size:34px}
.gc-benefits{padding:34px 0;background:var(--gc-surface)}
.gc-benefit-card{padding:24px}
.gc-benefit-card strong{display:block;margin-bottom:8px}
.gc-benefit-card span{display:block;color:var(--gc-muted);line-height:1.55}
.gc-about{background:var(--gc-surface)}
.gc-about__inner{display:grid;grid-template-columns:1fr 1fr;gap:54px;align-items:center}
.gc-about__copy h2,.gc-contact h2{font-family:var(--gc-heading-font),serif;font-size:clamp(34px,4vw,58px);line-height:1;margin:0 0 18px}
.gc-about__copy p,.gc-contact p{color:var(--gc-muted);line-height:1.8;margin:0 0 26px}
.gc-testimonial-card{padding:24px}
.gc-testimonial-card p{color:var(--gc-muted);line-height:1.7}
.gc-faq-list{display:grid;gap:14px;max-width:860px;margin:0 auto}
details{padding:20px}
summary{font-weight:900;cursor:pointer}
details p{color:var(--gc-muted);line-height:1.7}
.gc-contact{padding:86px 0;background:var(--gc-primary);color:var(--gc-surface)}
.gc-contact p,.gc-contact span{color:var(--gc-surface)}
.gc-contact__inner{display:flex;align-items:center;justify-content:space-between;gap:28px}
.gc-footer{background:var(--gc-primary);color:var(--gc-surface);padding:34px 0}
.gc-footer__inner{display:flex;align-items:center;justify-content:space-between;gap:18px}

body.gc-v2-family-conversion-sales .gc-hero{background:radial-gradient(circle at top right,var(--gc-accent),var(--gc-primary) 42%,#020617 100%);color:var(--gc-surface)}
body.gc-v2-family-conversion-sales .gc-hero p{color:#cbd5e1}
body.gc-v2-family-conversion-sales .gc-header{background:var(--gc-primary)}
body.gc-v2-family-conversion-sales .gc-brand,
body.gc-v2-family-conversion-sales .gc-nav a{color:var(--gc-surface)}
body.gc-v2-family-conversion-sales .gc-product-card,
body.gc-v2-family-conversion-sales .gc-service-card{border:2px solid #111827;box-shadow:8px 8px 0 #111827;border-radius:12px}

body.gc-v2-family-marketplace-grid .gc-hero{padding:62px 0}
body.gc-v2-family-marketplace-grid .gc-products-grid{grid-template-columns:repeat(4,minmax(0,1fr))}
body.gc-v2-family-marketplace-grid .gc-product-card__image img{height:240px}
body.gc-v2-family-marketplace-grid .gc-product-card h3{font-family:Montserrat,Arial,sans-serif;font-size:18px}

body.gc-v2-family-magazine-story .gc-hero__media--single .gc-hero__image--primary,
body.gc-v2-family-magazine-story .gc-about__image img{border-radius:90px 0 90px 0}
body.gc-v2-family-magazine-story .gc-hero__media--composition .gc-hero__image--primary{border-radius:90px 0 90px 0}
body.gc-v2-family-magazine-story .gc-products-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
body.gc-v2-family-magazine-story .gc-product-card{box-shadow:none}
body.gc-v2-family-magazine-story .gc-product-card__image img{height:420px}

body.gc-v2-family-minimal-premium .gc-topbar{display:none}
body.gc-v2-family-minimal-premium .gc-hero{text-align:center}
body.gc-v2-family-minimal-premium .gc-hero__inner{display:flex;flex-direction:column;max-width:920px}
body.gc-v2-family-minimal-premium .gc-actions{justify-content:center}
body.gc-v2-family-minimal-premium .gc-product-card{box-shadow:none;border-radius:0}

@media(max-width:980px){
  .gc-topbar__inner,.gc-category-grid,.gc-products-grid,.gc-services-grid,.gc-benefits-grid,.gc-testimonial-grid{grid-template-columns:repeat(2,1fr)}
  .gc-hero__inner,.gc-about__inner{grid-template-columns:1fr}
  .gc-featured__inner,.gc-contact__inner,.gc-header__inner,.gc-footer__inner{flex-direction:column;text-align:center}
  .gc-nav,.gc-actions{justify-content:center}
}

@media(max-width:640px){
  .gc-container{width:min(100% - 28px,1180px)}
  .gc-topbar__inner,.gc-category-grid,.gc-products-grid,.gc-services-grid,.gc-benefits-grid,.gc-testimonial-grid{grid-template-columns:1fr}
  .gc-hero{padding:58px 0}
  .gc-hero__copy{text-align:center}
  .gc-hero__copy h1{font-size:42px}
  .gc-hero__media--single .gc-hero__image--primary,.gc-about__image img{height:330px}
  .gc-hero__media--composition{min-height:380px}
  .gc-hero__media--composition .gc-hero__image--primary{height:82%}
  .gc-hero__media--composition .gc-hero__image--secondary{width:44%;height:38%}
  .gc-hero__media--composition .gc-hero__image--tertiary{width:30%;height:25%}
  .gc-card-actions{grid-template-columns:1fr}
}
`;
}

function ensureProducts(
  products: TemplateV2Product[],
  visualContext: TemplateRendererV2Input["visualContext"],
): TemplateV2Product[] {
  if (products.length) {
    return products.slice(0, 12).map((product, index) => ({
      ...product,
      imageUrl:
        product.imageUrl ||
        visualContext.defaultProductImage ||
        visualContext.categoryImage,
      description:
        product.description ||
        defaultProductDescription(visualContext.themeName),
      name: product.name || `Produto ${index + 1}`,
    }));
  }

  return [1, 2, 3].map((item) => ({
    id: `placeholder-${item}`,
    name: defaultProductName(visualContext.themeName, item),
    description: defaultProductDescription(visualContext.themeName),
    price: 0,
    imageUrl: visualContext.defaultProductImage || visualContext.categoryImage,
  }));
}

function ensureServices(
  services: TemplateV2Service[],
  visualContext: TemplateRendererV2Input["visualContext"],
): TemplateV2Service[] {
  if (services.length) return services.slice(0, 6);

  return [
    {
      id: "service-1",
      title: defaultServiceName(visualContext.themeName, 1),
      description: "Explique sua necessidade e receba atendimento profissional.",
      icon: "✅",
      badge: "Especialidade",
    },
    {
      id: "service-2",
      title: "Atendimento rápido",
      description: "Fale pelo chat ou WhatsApp para iniciar o contato.",
      icon: "⚡",
      badge: "Agilidade",
    },
    {
      id: "service-3",
      title: "Orçamento claro",
      description: "Solicite informações antes de contratar.",
      icon: "🤝",
      badge: "Confiança",
    },
  ];
}

function actionButton(input: {
  action: CtaAction;
  label: string;
  primary: boolean;
}): string {
  return `<button type="button" class="gc-btn ${input.primary ? "gc-btn--primary" : "gc-btn--secondary"}" data-action="${escapeAttr(input.action)}" data-gc-action="${escapeAttr(input.action)}">${escapeHtml(input.label)}</button>`;
}

function labelForAction(action: CtaAction, isService: boolean): string {
  const labels: Record<CtaAction, string> = {
    "add-to-cart": "Adicionar ao carrinho",
    "open-cart": "Abrir carrinho",
    "add-to-wishlist": "Lista de desejo",
    "open-product": "Ver detalhes",
    "open-products": isService ? "Ver serviços" : "Ver produtos",
    "open-offers": "Aproveitar desconto real",
    "open-combos": "Ver combos",
    "open-chat": "Falar no chat",
    "open-whatsapp": "WhatsApp",
    contact: "Fale conosco",
    "open-service": "Ver serviço",
    "request-quote": "Solicitar orçamento",
    "request-service": "Solicitar atendimento",
    "schedule-service": "Agendar atendimento",
    "hire-service": "Quero contratar",
    "open-provider": "Ver profissional",
  };

  return labels[action] || "Saiba mais";
}

function productSectionTitle(themeName: string): string {
  if (themeName.includes("food")) return "Cardápio em destaque";
  if (themeName.includes("fashion")) return "Coleção em destaque";
  if (themeName.includes("auto")) return "Peças e acessórios em destaque";
  if (themeName.includes("drink")) return "Seleção especial";
  if (themeName.includes("pet")) return "Produtos para seu pet";
  return "Vitrine de produtos";
}

function defaultHeroTitle(
  businessName: string,
  categoryName: string,
  isService: boolean,
): string {
  if (isService) {
    return `${businessName}: atendimento profissional para você`;
  }

  return `${businessName}: produtos escolhidos para encantar`;
}

function defaultHeroSubtitle(categoryName: string, isService: boolean): string {
  if (isService) {
    return `Conheça soluções de ${categoryName} com atendimento direto, orçamento fácil e contato rápido.`;
  }

  return `Conheça opções de ${categoryName}, veja ofertas, salve desejos e compre com praticidade.`;
}

function defaultProductName(themeName: string, index: number): string {
  if (themeName.includes("food")) {
    return ["Combo especial", "Favorito da casa", "Pedido destaque"][index - 1] || "Produto especial";
  }

  if (themeName.includes("fashion")) {
    return ["Look destaque", "Peça especial", "Coleção da loja"][index - 1] || "Peça especial";
  }

  if (themeName.includes("auto")) {
    return ["Peça automotiva", "Acessório destaque", "Item de reposição"][index - 1] || "Peça automotiva";
  }

  if (themeName.includes("drink")) {
    return ["Seleção premium", "Bebida especial", "Combo destaque"][index - 1] || "Produto especial";
  }

  return ["Produto destaque", "Produto especial", "Produto favorito"][index - 1] || "Produto especial";
}

function defaultProductDescription(themeName: string): string {
  if (themeName.includes("food")) {
    return "Opção preparada para destacar sabor, desejo e pedido rápido.";
  }

  if (themeName.includes("fashion")) {
    return "Peça selecionada para valorizar estilo, coleção e experiência de compra.";
  }

  if (themeName.includes("auto")) {
    return "Produto selecionado para manutenção, cuidado ou personalização automotiva.";
  }

  if (themeName.includes("drink")) {
    return "Seleção especial para momentos, presentes e experiências.";
  }

  return "Produto selecionado da loja.";
}

function defaultServiceName(themeName: string, index: number): string {
  if (themeName.includes("technical")) {
    return ["Instalação técnica", "Manutenção elétrica", "Atendimento emergencial"][index - 1] || "Serviço técnico";
  }

  if (themeName.includes("construction")) {
    return ["Reforma e reparos", "Manutenção geral", "Orçamento de obra"][index - 1] || "Serviço de construção";
  }

  if (themeName.includes("clean")) {
    return ["Limpeza residencial", "Higienização", "Limpeza especializada"][index - 1] || "Serviço de limpeza";
  }

  return ["Serviço principal", "Atendimento rápido", "Orçamento profissional"][index - 1] || "Serviço profissional";
}

function formatPrice(value: number): string {
  const price = Number(value || 0);

  if (!price) return "Consulte";

  return price.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function safeClass(value: string): string {
  return (
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "default"
  );
}

function escapeHtml(value: any): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(value: any): string {
  return escapeHtml(value)
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}