import { API_URL } from "../../../../utils/config";

type PublishSettings = {
  storeWhatsapp?: string;
  telefoneWhatsapp?: string;
  telefone_whatsapp?: string;
  whatsapp?: string;
  store_whatsapp?: string;
  numero_whatsapp?: string;
  numeroWhatsapp?: string;
  telefone?: string;
  celular?: string;
  phone?: string;
  mobile?: string;
  storeName?: string;
  storeId?: string;
  storeSlug?: string;
  chatbotTipo?: string;
  chatbotOwnerId?: string;
  ownerId?: string;
  lojaId?: string;
  pageKind?: string;
  tipo?: string;
  tipoStore?: string;
  businessType?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  site?: string;
};

export async function prepareHtmlForPublish(
  html: string,
  settings: PublishSettings = {},
): Promise<string> {
  if (typeof html !== "string") {
    throw new Error("prepareHtmlForPublish esperava receber HTML em formato string.");
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  cleanupEditorArtifacts(doc);
  removeOrphanElementorProductDetailSections(doc);
  prepareHiddenSections(doc);
  attachStoreMetadata(doc, settings);
  attachDefaultButtonActions(doc, settings);
  normalizeInternalAnchors(doc);
  normalizeImages(doc);
  injectPublishedComponentStyles(doc);
  injectLandingRuntime(doc, settings);
  injectResponsiveFix(doc);

  const publishedHtml = `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;

  if (
    publishedHtml.includes("[object Object]") ||
    publishedHtml.includes("[object Promise]")
  ) {
    throw new Error(
      "HTML publicado invalido: foi detectado [object Object]/[object Promise].",
    );
  }

  return publishedHtml;
}

function normalizeText(value: string): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function cleanupEditorArtifacts(doc: Document): void {
  doc.querySelectorAll(".editor-hidden-section-label").forEach((el) => el.remove());

  doc
    .querySelectorAll<HTMLElement>("[contenteditable]")
    .forEach((el) => el.removeAttribute("contenteditable"));

  [
    "data-editor-section-bound",
    "data-editor-selected",
    "data-editor-focused",
    "data-editor-bound",
    "data-editor-editable",
    "data-editor-image-bound",
    "data-editor-image",
    "data-editor-bg-bound",
    "data-editor-background",
    "data-editor-text-align",
    "data-editor-inline-style",
    "data-gc-last-selected-product-card",
  ].forEach((attr) => {
    doc.querySelectorAll(`[${attr}]`).forEach((el) => el.removeAttribute(attr));
  });

  doc
    .querySelectorAll(
      "#granconecta-inline-editor-style, #granconecta-dynamic-editor-style, #granconecta-landing-runtime, #gc-generic-responsive-fix",
    )
    .forEach((el) => el.remove());

  doc.querySelectorAll<HTMLAnchorElement>("a[data-editor-original-href]").forEach((link) => {
    const original = link.getAttribute("data-editor-original-href") || "";
    if (original) link.setAttribute("href", original);
    link.removeAttribute("data-editor-original-href");
  });
}

function prepareHiddenSections(doc: Document): void {
  doc.querySelectorAll<HTMLElement>("[data-editor-hidden='true']").forEach((el) => {
    el.style.display = "none";
  });
}

function isOrphanElementorProductDetailSection(section: HTMLElement): boolean {
  if (
    section.matches(
      "[data-gc-products], [data-granconecta-products], .gc-vitrine-grid, .j2-grid",
    )
  ) {
    return false;
  }

  if (
    section.closest(
      "[data-gc-product-card='true'], [data-gc-wishlist-card='true'], .gc-vitrine-card, .j2-card",
    )
  ) {
    return false;
  }

  if (
    section.querySelector(
      "img, picture, video, [data-gc-product-card='true'], [data-gc-wishlist-card='true'], .gc-vitrine-card, .j2-card",
    )
  ) {
    return false;
  }

  const headings = section.querySelectorAll(
    ".elementor-widget-heading, .elementor-heading-title, h1, h2, h3, h4",
  );

  const button = Array.from(
    section.querySelectorAll<HTMLElement>(
      ".elementor-button-buy, .elementor-widget-button, a, button",
    ),
  ).find((el) => {
    const text = normalizeText(el.textContent || "");
    return text.includes("comprar") || text.includes("adicionar ao carrinho");
  });

  const text = normalizeText(section.textContent || "");

  return headings.length >= 2 && Boolean(button) && (/r\$\s*\d/.test(text) || text.includes("consulte"));
}

function removeOrphanElementorProductDetailSections(doc: Document): void {
  doc
    .querySelectorAll<HTMLElement>(
      "section.elementor-inner, section.elementor-section, .elementor-inner.elementor-section",
    )
    .forEach((section) => {
      if (isOrphanElementorProductDetailSection(section)) section.remove();
    });
}

function attachStoreMetadata(doc: Document, settings: PublishSettings): void {
  const ownerId =
    settings.chatbotOwnerId ||
    settings.ownerId ||
    settings.storeId ||
    settings.lojaId ||
    "";

  const tipo = settings.chatbotTipo || (isServicePage(settings) ? "PRESTADOR" : "LOJA");

  if (settings.storeId) doc.body.setAttribute("data-store-id", settings.storeId);
  if (settings.lojaId) doc.body.setAttribute("data-loja-id", settings.lojaId);
  if (ownerId) doc.body.setAttribute("data-chatbot-owner-id", ownerId);

  doc.body.setAttribute("data-chatbot-tipo", tipo);

  if (settings.storeSlug) doc.body.setAttribute("data-store-slug", settings.storeSlug);
  if (settings.storeName) doc.body.setAttribute("data-store-name", settings.storeName);

  const whatsapp = resolveSettingsWhatsapp(settings);

  if (whatsapp) {
    doc.body.setAttribute("data-store-whatsapp", whatsapp);
    doc.body.setAttribute("data-telefone-whatsapp", whatsapp);
    doc.body.setAttribute("data-whatsapp", whatsapp);
  }
}

function isServicePage(settings: PublishSettings): boolean {
  const text = normalizeText(
    [settings.pageKind, settings.tipoStore, settings.businessType, settings.tipo]
      .filter(Boolean)
      .join(" "),
  );

  return text.includes("servico") || text.includes("prestador");
}

function normalizeBrazilWhatsapp(value?: string | number | null): string {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55")) return digits;
  if (digits.length >= 10) return `55${digits}`;
  return digits;
}

function resolveSettingsWhatsapp(settings: PublishSettings): string {
  return normalizeBrazilWhatsapp(
    settings.telefoneWhatsapp ||
      settings.telefone_whatsapp ||
      settings.storeWhatsapp ||
      settings.store_whatsapp ||
      settings.whatsapp ||
      settings.numero_whatsapp ||
      settings.numeroWhatsapp ||
      settings.telefone ||
      settings.celular ||
      settings.phone ||
      settings.mobile ||
      "",
  );
}

function attachDefaultButtonActions(doc: Document, settings: PublishSettings): void {
  const service = isServicePage(settings);

  doc.querySelectorAll<HTMLElement>("a, button, [role='button'], .elementor-button").forEach((el) => {
    if (el.closest(".gc-chatbot-widget")) return;

    const text = normalizeText(el.textContent || "");
    const href = el instanceof HTMLAnchorElement ? el.getAttribute("href") || "" : "";

    const alreadyHasAction =
      el.hasAttribute("data-gran-action") ||
      el.hasAttribute("data-gc-action") ||
      el.hasAttribute("data-action") ||
      el.hasAttribute("data-gc-add-to-cart") ||
      el.hasAttribute("data-gc-wishlist");

    if (alreadyHasAction) {
      syncGranActionAttributes(el);
      return;
    }

    if (text.includes("instagram")) return setExternalLink(el, settings.instagram);
    if (text.includes("facebook")) return setExternalLink(el, settings.facebook);
    if (text.includes("tiktok")) return setExternalLink(el, settings.tiktok);

    if (text.includes("whatsapp") || href.includes("wa.me") || href.includes("whatsapp")) {
      return setWhatsappAction(el, settings);
    }

    if (
      includesAny(text, [
        "falar no chat",
        "falar com atendimento",
        "falar com atendente",
        "falar agora",
        "chat",
        "atendimento",
        "fale conosco",
        "tirar duvida",
        "duvida",
      ])
    ) {
      return setAction(el, "open-chat");
    }

    if (
      service &&
      includesAny(text, ["orcamento", "agendar", "contratar", "solicitar"])
    ) {
      return setAction(el, "request-quote");
    }

    if (
      includesAny(text, [
        "ver produtos",
        "ver produto",
        "produtos",
        "catalogo",
        "vitrine",
        "colecao",
        "colecoes",
        "cardapio",
        "menu",
        "nossas pecas",
        "nossas opcoes",
        "conheca nossas colecoes",
        "escolher presente",
      ])
    ) {
      return setAction(el, "open-products");
    }

    if (includesAny(text, ["desejo", "favorito", "interesse", "lista de desejos"])) {
      el.setAttribute("data-gc-wishlist", "true");
      return setAction(el, "add-to-wishlist");
    }

    if (
      includesAny(text, [
        "comprar",
        "comprar agora",
        "adicionar",
        "adicionar ao carrinho",
        "carrinho",
        "garantir",
        "adquirir",
        "pedir agora",
        "fazer pedido",
      ])
    ) {
      el.setAttribute("data-gc-add-to-cart", "true");
      return setAction(el, "add-to-cart");
    }

    if (
      includesAny(text, [
        "propaganda",
        "ver propaganda",
        "promocao",
        "promocoes",
        "oferta",
        "ofertas",
        "destaque premium",
      ])
    ) {
      return setAction(el, "open-premium-ad");
    }
  });
}

function syncGranActionAttributes(element: HTMLElement): void {
  const action =
    element.getAttribute("data-gran-action") ||
    element.getAttribute("data-gc-action") ||
    element.getAttribute("data-action") ||
    "";

  if (action) {
    element.setAttribute("data-gran-action", action);
    element.setAttribute("data-gc-action", action);
    element.setAttribute("data-action", action);
  }

  if (action === "add-to-cart") {
    element.setAttribute("data-gc-add-to-cart", "true");
  }

  if (action === "add-to-wishlist") {
    element.setAttribute("data-gc-wishlist", "true");
  }
}

function includesAny(text: string, words: string[]): boolean {
  return words.some((word) => text.includes(normalizeText(word)));
}

function setAction(element: HTMLElement, action: string): void {
  element.setAttribute("data-gran-action", action);
  element.setAttribute("data-action", action);
  element.setAttribute("data-gc-action", action);

  if (action === "add-to-cart") {
    element.setAttribute("data-gc-add-to-cart", "true");
  }

  if (action === "add-to-wishlist") {
    element.setAttribute("data-gc-wishlist", "true");
  }

  if (element instanceof HTMLAnchorElement && action !== "open-whatsapp") {
    element.setAttribute("href", "#");
    element.removeAttribute("target");
    element.removeAttribute("rel");
  }
}

function setExternalLink(element: HTMLElement, url?: string): void {
  const value = String(url || "").trim();
  if (!value) return;

  if (element instanceof HTMLAnchorElement) {
    element.setAttribute("href", value.startsWith("http") ? value : `https://${value}`);
    element.setAttribute("target", "_blank");
    element.setAttribute("rel", "noopener noreferrer");
  }
}

function setWhatsappAction(element: HTMLElement, settings: PublishSettings): void {
  const phone = resolveSettingsWhatsapp(settings);

  setAction(element, "open-whatsapp");

  if (phone) element.setAttribute("data-whatsapp", phone);

  if (element instanceof HTMLAnchorElement && phone) {
    const message = `Olá${settings.storeName ? `, vim pelo site da ${settings.storeName}` : ", vim pelo site"}.`;
    element.setAttribute("href", `https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
    element.setAttribute("target", "_blank");
    element.setAttribute("rel", "noopener noreferrer");
  }
}

function normalizeInternalAnchors(doc: Document): void {
  const sections = Array.from(
    doc.querySelectorAll<HTMLElement>(
      "section, header, footer, .elementor-inner, .elementor-section",
    ),
  );

  const findByText = (words: string[]) =>
    sections.find((section) =>
      words.some((word) =>
        normalizeText(section.textContent || "").includes(normalizeText(word)),
      ),
    );

  if (sections[0] && !doc.getElementById("inicio")) sections[0].id = "inicio";

  const products =
    doc.querySelector<HTMLElement>(
      "[data-gc-products], [data-granconecta-products], .gc-vitrine-grid, .gc-products",
    ) || findByText(["vitrine", "produtos", "destaques", "colecao", "colecoes"]);

  if (products && !doc.getElementById("products")) products.id = "products";

  const contact = findByText(["contato", "fale conosco", "atendimento"]);
  if (contact && !doc.getElementById("contact")) contact.id = "contact";

  const premiumAd = findByText(["propaganda", "promocao", "oferta", "destaque premium"]);
  if (premiumAd && !doc.getElementById("premium-ad")) premiumAd.id = "premium-ad";
}

function normalizeImages(doc: Document): void {
  const apiRoot = String(API_URL || "http://localhost:3000")
    .replace(/\/$/, "")
    .replace(/\/api$/, "");

  doc.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
    const src = img.getAttribute("src") || "";

    if (src && !/^(https?:|data:|blob:)/i.test(src)) {
      const clean = src.replace(/\\/g, "/");
      const uploadIndex = clean.toLowerCase().indexOf("/uploads/");

      const next =
        uploadIndex >= 0
          ? `${apiRoot}${clean.slice(uploadIndex)}`
          : clean.startsWith("/")
            ? `${apiRoot}${clean}`
            : `${apiRoot}/uploads/images/${clean}`;

      img.setAttribute("src", next);
    }

    img.setAttribute("loading", img.getAttribute("loading") || "lazy");
    img.setAttribute("decoding", img.getAttribute("decoding") || "async");
  });
}

function injectPublishedComponentStyles(doc: Document): void {
  doc.getElementById("granconecta-published-component-style")?.remove();

  const style = doc.createElement("style");
  style.id = "granconecta-published-component-style";
  style.textContent = `
    .gc-vitrine-grid,
    .gc-products-grid,
    .gc-category-grid,
    .gc-categories-grid,
    .gc-category-cards,
    div:has(> .gc-category-card),
    .j2-grid,
    [data-gc-products],
    [data-granconecta-products],
    [data-gc-products] > div,
    [data-gc-products] > div > div,
    .gc-generated-products-grid,
    [data-granconecta-products] > div,
    [data-granconecta-products] > div > div {
      display: grid !important;
      grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr)) !important;
      gap: 22px !important;
      align-items: stretch !important;
    }

    .gc-vitrine-grid--bold,
    .gc-vitrine-grid--classic,
    .gc-vitrine-grid--catalog,
    .gc-vitrine-grid--boutique,
    .gc-vitrine-grid--minimal {
      grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr)) !important;
    }

    @media (hover: hover) and (pointer: fine) {
      .gc-vitrine-grid,
      .gc-products-grid,
      .gc-category-grid,
      .gc-categories-grid,
      .gc-category-cards,
      div:has(> .gc-category-card),
      .j2-grid,
      [data-gc-products],
      [data-granconecta-products],
      [data-gc-products] > div,
    [data-gc-products] > div > div,
    .gc-generated-products-grid,
      [data-granconecta-products] > div,
    [data-granconecta-products] > div > div {
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)) !important;
      }
    }

    @media (max-width: 640px) {
      .gc-vitrine-grid,
      .gc-products-grid,
      .gc-category-grid,
      .gc-categories-grid,
      .gc-category-cards,
      div:has(> .gc-category-card),
      .j2-grid,
      [data-gc-products] > div,
    [data-gc-products] > div > div,
    .gc-generated-products-grid,
      [data-granconecta-products] > div,
    [data-granconecta-products] > div > div {
        grid-template-columns: 1fr !important;
      }
    }

    /* Mantem grade em desktop mesmo quando o iframe/janela esta estreito. */
    @media (max-width: 640px) and (hover: hover) and (pointer: fine) {
      .gc-vitrine-grid,
      .gc-products-grid,
      .gc-category-grid,
      .gc-categories-grid,
      .gc-category-cards,
      div:has(> .gc-category-card),
      .j2-grid,
      [data-gc-products],
      [data-granconecta-products],
      [data-gc-products] > div,
      [data-gc-products] > div > div,
      .gc-generated-products-grid,
      [data-granconecta-products] > div,
      [data-granconecta-products] > div > div {
        display: grid !important;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)) !important;
        gap: 22px !important;
      }
    }
    .gc-vitrine-card,
    .j2-card,
    [data-gc-product-card="true"],
    [data-gc-wishlist-card="true"] {
      display: flex !important;
      flex-direction: column !important;
      gap: 12px !important;
      min-width: 0 !important;
      height: 100% !important;
      padding: 14px !important;
      border-radius: 18px !important;
      background: #fff !important;
      border: 1px solid rgba(15, 23, 42, .10) !important;
      box-shadow: 0 16px 40px rgba(15, 23, 42, .08) !important;
      overflow: hidden !important;
    }

    .gc-vitrine-card-image,
    .elementor-image-frame {
      width: 100% !important;
      min-height: 160px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      background: #f8fafc !important;
      border-radius: 14px !important;
      overflow: hidden !important;
    }

    .gc-vitrine-card-image img,
    .elementor-image-frame img,
    [data-gc-product-image="true"] {
      width: 100% !important;
      height: 100% !important;
      object-fit: contain !important;
      object-position: center !important;
      display: block !important;
    }

    .gc-vitrine-card-body,
    .gc-image-product-body {
      display: flex !important;
      flex-direction: column !important;
      gap: 8px !important;
      flex: 1 !important;
    }

    .gc-price-stack {
      display: flex !important;
      flex-wrap: wrap !important;
      align-items: center !important;
      gap: 7px !important;
      color: #0f766e !important;
      font-weight: 900 !important;
    }

    .gc-price-old {
      color: #94a3b8 !important;
      text-decoration: line-through !important;
      font-size: 12px !important;
    }

    .gc-discount-badge {
      border-radius: 999px !important;
      background: #dcfce7 !important;
      color: #166534 !important;
      padding: 3px 8px !important;
      font-size: 11px !important;
      font-weight: 900 !important;
    }

    .gc-card-actions {
      display: flex !important;
      gap: 8px !important;
      margin-top: auto !important;
      flex-wrap: wrap !important;
      width: 100% !important;
    }

    .gc-card-actions button,
    .gc-card-actions a,
    [data-gc-add-to-cart],
    [data-gc-wishlist],
    [data-gran-action="add-to-cart"],
    [data-gran-action="add-to-wishlist"] {
      appearance: none !important;
      -webkit-appearance: none !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex: 1 1 120px !important;
      min-height: 42px !important;
      border: 0 !important;
      border-radius: 999px !important;
      padding: 10px 14px !important;
      font: 900 13px Montserrat, Arial, sans-serif !important;
      line-height: 1.15 !important;
      text-align: center !important;
      text-decoration: none !important;
      cursor: pointer !important;
      white-space: normal !important;
      box-shadow: none !important;
    }

    [data-gc-add-to-cart],
    [data-gran-action="add-to-cart"] {
      background: #111827 !important;
      color: #fff !important;
    }

    [data-gc-wishlist],
    [data-gran-action="add-to-wishlist"] {
      background: #f1f5f9 !important;
      color: #0f172a !important;
      border: 1px solid rgba(15, 23, 42, .10) !important;
    }

    .elementor-button[data-gc-add-to-cart],
    .elementor-button[data-gc-wishlist],
    a.elementor-button[data-gc-add-to-cart],
    a.elementor-button[data-gc-wishlist] {
      text-transform: none !important;
    }
  `;

  doc.head?.appendChild(style);
}

function injectLandingRuntime(doc: Document, settings: PublishSettings): void {
  const script = doc.createElement("script");
  script.id = "granconecta-landing-runtime";

  const storeId = JSON.stringify(settings.storeId || settings.lojaId || "");
  const storeName = JSON.stringify(settings.storeName || "");
  const storeWhatsapp = JSON.stringify(resolveSettingsWhatsapp(settings));

  script.textContent = `
    (function(){
      var storeId = ${storeId};
      var storeName = ${storeName};
      var storeWhatsapp = ${storeWhatsapp};

      function closest(el, selector) {
        return el && el.closest ? el.closest(selector) : null;
      }

      function normalizeText(value) {
        return String(value || '')
          .normalize('NFD')
          .replace(/[\\u0300-\\u036f]/g, '')
          .toLowerCase()
          .trim();
      }

      function postToParent(type, payload) {
        window.parent.postMessage({
          type: type,
          payload: payload || {},
          storeId: storeId,
          lojaId: storeId,
          storeName: storeName,
          origem: 'LANDING_PAGE'
        }, '*');
      }

      function openWhatsapp(actionEl) {
        var phone =
          (actionEl && actionEl.getAttribute('data-whatsapp')) ||
          document.body.getAttribute('data-store-whatsapp') ||
          document.body.getAttribute('data-telefone-whatsapp') ||
          document.body.getAttribute('data-whatsapp') ||
          storeWhatsapp ||
          '';

        var digits = String(phone || '').replace(/\\D/g, '');

        if (digits && !digits.startsWith('55') && digits.length >= 10) {
          digits = '55' + digits;
        }

        var message =
          (actionEl && actionEl.getAttribute('data-message')) ||
          ('Olá, vim pelo site' + (storeName ? ' da ' + storeName : '') + '.');

        postToParent('OPEN_WHATSAPP', {
          whatsapp: digits,
          telefoneWhatsapp: digits,
          storeWhatsapp: digits,
          storeId: storeId,
          lojaId: storeId,
          storeName: storeName,
          message: message,
          url: digits ? ('https://wa.me/' + digits + '?text=' + encodeURIComponent(message)) : ''
        });
      }

      document.addEventListener('click', function(event){
        var target = event.target;

        var actionEl = closest(
          target,
          '[data-gran-action], [data-gc-action], [data-action], [data-gc-add-to-cart], [data-gc-wishlist]'
        );

        if (!actionEl) return;

        var action =
          actionEl.getAttribute('data-gran-action') ||
          actionEl.getAttribute('data-gc-action') ||
          actionEl.getAttribute('data-action') ||
          '';

        var text = normalizeText(actionEl.innerText || actionEl.textContent || '');

        var card = closest(
          actionEl,
          '[data-product-id], [data-gc-product-card="true"], .gc-vitrine-card, .j2-card'
        );

        var productId =
          actionEl.getAttribute('data-product-id') ||
          (card && card.getAttribute('data-product-id')) ||
          '';

        if (
          actionEl.hasAttribute('data-gc-add-to-cart') ||
          action === 'add-to-cart' ||
          action === 'open-cart'
        ) {
          event.preventDefault();

          postToParent('GC_ADD_TO_CART', {
            productId: productId,
            storeId: storeId,
            lojaId: storeId,
            storeName: storeName
          });

          return;
        }

        if (
          actionEl.hasAttribute('data-gc-wishlist') ||
          action === 'add-to-wishlist'
        ) {
          event.preventDefault();

          postToParent('GC_WISHLIST', {
            productId: productId,
            storeId: storeId,
            lojaId: storeId,
            storeName: storeName
          });

          return;
        }

        if (action === 'open-products') {
          event.preventDefault();

          postToParent('GC_OPEN_PRODUCTS', {
            storeId: storeId,
            lojaId: storeId,
            storeName: storeName
          });

          return;
        }

        if (action === 'open-premium-ad') {
          event.preventDefault();

          postToParent('GC_OPEN_PREMIUM_AD', {
            storeId: storeId,
            lojaId: storeId,
            storeName: storeName
          });

          return;
        }

        if (action === 'request-quote') {
          event.preventDefault();

          postToParent('GC_REQUEST_QUOTE', {
            storeId: storeId,
            lojaId: storeId,
            storeName: storeName
          });

          return;
        }

        if (action === 'open-whatsapp' || text.includes('whatsapp')) {
          event.preventDefault();
          openWhatsapp(actionEl);
          return;
        }

        if (action === 'open-chat') {
          event.preventDefault();

          postToParent('GC_OPEN_CHAT', {
            storeId: storeId,
            lojaId: storeId,
            storeName: storeName,
            origem: 'LANDING_PAGE'
          });

          return;
        }
      }, true);
    })();
  `;

  doc.body.appendChild(script);
}

function injectResponsiveFix(doc: Document): void {
  const style = doc.createElement("style");
  style.id = "gc-generic-responsive-fix";
  style.textContent = `
    html, body {
      width: 100% !important;
      max-width: 100% !important;
      overflow-x: hidden !important;
    }

    *, *::before, *::after {
      box-sizing: border-box !important;
    }

    img, video, iframe {
      max-width: 100% !important;
    }

    .gc-vitrine-card-image,
    .elementor-image-frame {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      overflow: hidden !important;
    }

    .gc-vitrine-card-image img,
    .elementor-image-frame img,
    [data-gc-product-image="true"] {
      object-fit: contain !important;
      object-position: center !important;
    }

    @media (max-width: 640px) {
      section,
      header,
      footer,
      main,
      .elementor-section,
      .elementor-inner,
      .elementor-container,
      .elementor-column,
      .elementor-widget-wrap {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        overflow-x: hidden !important;
      }
    }
  `;

  doc.head?.appendChild(style);
}


