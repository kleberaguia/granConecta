import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import api from "../../../api/api";
import { API_URL } from "../../../utils/config";

type ProductForVitrine = {
  id: string | number;
  name?: string;
  title?: string;
  titulo?: string;
  nome?: string;
  description?: string;
  descricao?: string;
  descricao_curta?: string;
  short_description?: string;
  detalhes?: string;
  price?: number | string;
  preco?: number | string;
  valor?: number | string;
  preco_venda?: number | string;
  valor_venda?: number | string;
  amount?: number | string;
  original_price?: number | string;
  preco_original?: number | string;
  old_price?: number | string;
  price_original?: number | string;
  valor_original?: number | string;
  promotional_price?: number | string;
  preco_promocional?: number | string;
  valor_promocional?: number | string;
  sale_price?: number | string;
  discount_price?: number | string;
  discount?: number | string;
  desconto?: number | string;
  discount_percent?: number | string;
  percentual_desconto?: number | string;
  discount_label?: string;
  image_url?: string;
  imageUrl?: string;
  image?: string;
  imagem_url?: string;
  imagem?: string;
  foto_perfil?: string;
  foto_url?: string;
  capa_url?: string;
  thumbnail_url?: string;
  foto?: string;
  displayName?: string;
  displayDescription?: string;
  displayPrice?: number | string;
};

type IframeViewerProps = {
  html: string;
  css?: string;
  instanceKey?: number | string;
  onHtmlChange?: (html: string) => void;
  onAddToCart?: (productId: string) => void | Promise<void>;
  selectedProducts?: ProductForVitrine[];
  isStorePage?: boolean;
  storeId?: string;
  storeWhatsapp?: string | number | null;
  telefoneWhatsapp?: string | number | null;
  whatsapp?: string | number | null;
  telefone?: string | number | null;
};

type ImageTarget = "image" | "background";

const IMAGE_PLACEHOLDER =
  "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=900&auto=format&fit=crop";

const PRODUCT_CARD_SELECTOR =
  "[data-gc-product-card='true'], [data-gc-wishlist-card='true'], .gc-vitrine-card, .gc-product-card, .j2-card, .elementor-widget-image";

const PRODUCT_SLOT_SELECTOR =
  "[data-gc-products], [data-granconecta-products], .gc-vitrine-grid, .j2-grid, .gc-products-grid, .gc-products";

const PRODUCT_IMAGE_FRAME_SELECTOR =
  ".gc-product-card__image, .gc-vitrine-card-image, .elementor-image-frame";

function onlyDigits(value?: string | number | null): string {
  return String(value || "").replace(/\D/g, "");
}

function normalizeBrazilWhatsapp(value?: string | number | null): string {
  const digits = onlyDigits(value);
  if (!digits) return "";
  return digits.startsWith("55") ? digits : `55${digits}`;
}

function extractWhatsappFromHtml(rawHtml?: string): string {
  const htmlText = String(rawHtml || "");

  const patterns = [
    /data-store-whatsapp=["']([^"']+)["']/i,
    /data-telefone-whatsapp=["']([^"']+)["']/i,
    /data-whatsapp=["']([^"']+)["']/i,
    /storeWhatsapp["']?\s*:\s*["']([^"']+)["']/i,
    /telefoneWhatsapp["']?\s*:\s*["']([^"']+)["']/i,
    /whatsapp["']?\s*:\s*["']([^"']+)["']/i,
  ];

  for (const pattern of patterns) {
    const match = htmlText.match(pattern);
    const normalized = normalizeBrazilWhatsapp(match?.[1] || "");
    if (normalized) return normalized;
  }

  return "";
}

export function IframeViewer({
  html,
  css = "",
  instanceKey = 0,
  onHtmlChange,
  onAddToCart,
  selectedProducts = [],
  isStorePage = false,
  storeId,
  storeWhatsapp,
  telefoneWhatsapp,
  whatsapp,
  telefone,
}: IframeViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const selectedSectionRef = useRef<HTMLElement | null>(null);
  const selectedElementRef = useRef<HTMLElement | null>(null);
  const selectedImageRef = useRef<HTMLImageElement | null>(null);
  const selectedImageTargetRef = useRef<ImageTarget>("image");
  const backgroundTargetRef = useRef<HTMLElement | null>(null);
  const selectedProductsRef = useRef<ProductForVitrine[]>(selectedProducts);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const lastInternalHtmlRef = useRef("");
  const commitTimerRef = useRef<number | null>(null);
  const initializedKeyRef = useRef<number | string | null>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [iframeHtml, setIframeHtml] = useState(html);
  const [iframeVersion, setIframeVersion] = useState(0);
  const [selectedLabel, setSelectedLabel] = useState(
    "Clique em uma parte da página",
  );
  const [toolbarPos, setToolbarPos] = useState({ x: 16, y: 16 });
  const [dragging, setDragging] = useState(false);
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
  const [selectedHidden, setSelectedHidden] = useState(false);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<ProductForVitrine[]>([]);

  const CATEGORY_CARD_SELECTOR = ".gc-category-card";

  const resolvedStoreWhatsapp = normalizeBrazilWhatsapp(
    storeWhatsapp ||
    telefoneWhatsapp ||
    whatsapp ||
    telefone ||
    extractWhatsappFromHtml(html) ||
    "",
  );

  useEffect(() => {
    selectedProductsRef.current = selectedProducts || [];
    const doc = iframeRef.current?.contentDocument;

    if (doc?.body) {
      applyStoreContextAttributes(doc);
      removeOrphanElementorProductDetailSections(doc);
      hydrateProductSlots(doc, true);
      normalizeProductActions(doc);
      enableEditor(doc);
      scheduleCommit();
    }
  }, [selectedProducts, storeId, resolvedStoreWhatsapp]);

  useEffect(() => {
    if (
      html === lastInternalHtmlRef.current &&
      initializedKeyRef.current === instanceKey
    ) {
      return;
    }

    initializedKeyRef.current = instanceKey;
    setIframeHtml(html);
    setIframeVersion((current) => current + 1);
    selectedSectionRef.current = null;
    selectedElementRef.current = null;
    selectedImageRef.current = null;
  }, [html, css, instanceKey]);

  useEffect(() => {
    if (!dragging) return;

    const move = (event: MouseEvent) => {
      event.preventDefault();

      const toolbar = toolbarRef.current;
      const toolbarWidth = toolbar?.offsetWidth || 280;
      const toolbarHeight =
        toolbar?.offsetHeight || (toolbarCollapsed ? 60 : 420);
      const maxX = Math.max(8, window.innerWidth - toolbarWidth - 8);
      const maxY = Math.max(8, window.innerHeight - toolbarHeight - 8);

      setToolbarPos({
        x: Math.max(8, Math.min(maxX, event.clientX - dragOffsetRef.current.x)),
        y: Math.max(8, Math.min(maxY, event.clientY - dragOffsetRef.current.y)),
      });
    };

    const up = () => setDragging(false);

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [dragging, toolbarCollapsed]);

  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      const type = event.data?.type;

      if (type === "GRANCONECTA_ADD_TO_CART" || type === "GC_ADD_TO_CART") {
        const productId = String(
          event.data?.productId || event.data?.payload?.productId || "",
        ).trim();

        if (productId) await onAddToCart?.(productId);
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onAddToCart]);

  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (doc) hydrateProductSlots(doc, true);
  }, [iframeHtml]);

  useEffect(() => {
    if (html !== lastInternalHtmlRef.current) {
      setIframeHtml(html);
    }
  }, [html]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      const doc = iframe.contentDocument;
      if (doc) hydrateProductSlots(doc, true);
    };

    iframe.addEventListener("load", handleLoad);
    return () => iframe.removeEventListener("load", handleLoad);
  }, []);

  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (doc?.body) hydrateProductSlots(doc, true);
  }, [selectedProducts]);

  function applyStoreContextAttributes(doc: Document) {
    if (!doc?.body) return;

    if (storeId) {
      doc.body.setAttribute("data-chatbot-owner-id", String(storeId));
      doc.body.setAttribute("data-store-id", String(storeId));
      doc.body.setAttribute("data-loja-id", String(storeId));
    }

    if (resolvedStoreWhatsapp) {
      doc.body.setAttribute("data-store-whatsapp", resolvedStoreWhatsapp);
      doc.body.setAttribute("data-telefone-whatsapp", resolvedStoreWhatsapp);
      doc.body.setAttribute("data-whatsapp", resolvedStoreWhatsapp);
    }

    const windowScriptId = "granconecta-iframe-window-context";

    if (!doc.getElementById(windowScriptId)) {
      const script = doc.createElement("script");
      script.id = windowScriptId;
      script.textContent = `
        window.GRAN_CHAT_CONTEXT = {
          chatbotTipo: "LOJA",
          chatbotOwnerId: ${JSON.stringify(storeId || "")},
          storeId: ${JSON.stringify(storeId || "")},
          lojaId: ${JSON.stringify(storeId || "")},
          origem: "LANDING_PAGE",
          storeWhatsapp: ${JSON.stringify(resolvedStoreWhatsapp || "")}
        };
      `;
      doc.head?.appendChild(script);
    }
  }

  function injectPreviewCss(rawHtml: string, rawCss: string) {
    const htmlText = String(rawHtml || "");
    const cssText = String(rawCss || "").trim();

    if (!cssText) return htmlText;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, "text/html");

      let style = doc.getElementById(
        "granconecta-generator-preview-css",
      ) as HTMLStyleElement | null;

      if (!style) {
        style = doc.createElement("style");
        style.id = "granconecta-generator-preview-css";
        (doc.head || doc.documentElement).appendChild(style);
      }

      style.textContent = cssText;

      if (
        /<html[\s>]/i.test(htmlText) ||
        /<!DOCTYPE html/i.test(htmlText)
      ) {
        return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
      }

      return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
  ${style.outerHTML}
</head>
<body>
  ${doc.body.innerHTML}
</body>
</html>`;
    } catch (error) {
      console.error(
        "IFRAME - ERRO AO INJETAR CSS DO GENERATOR",
        error,
      );

      return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
  <style id="granconecta-generator-preview-css">${cssText}</style>
</head>
<body>
  ${htmlText}
</body>
</html>`;
    }
  }

  function prepareHtml(rawHtml: string) {
    const htmlWithCss = injectPreviewCss(rawHtml, css);

    if (!storeId && !resolvedStoreWhatsapp) {
      return htmlWithCss;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(
        String(htmlWithCss || ""),
        "text/html",
      );

      if (!doc.body) return rawHtml;

      applyStoreContextAttributes(doc);

      doc.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
        const src = img.getAttribute("src") || "";
        const normalized = normalizeImageUrl(src);

        if (normalized) {
          img.setAttribute("src", normalized);
        }
      });

      return /<html[\s>]/i.test(String(htmlWithCss || "")) ||
        /<!DOCTYPE html/i.test(String(htmlWithCss || ""))
        ? `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`
        : doc.body.innerHTML;
    } catch {
      let next = String(htmlWithCss || "");

      if (storeId) {
        next = next
          .replace(
            'data-chatbot-owner-id=""',
            `data-chatbot-owner-id="${escapeHtmlAttr(storeId)}"`,
          )
          .replace(
            'data-store-id=""',
            `data-store-id="${escapeHtmlAttr(storeId)}"`,
          );
      }

      if (resolvedStoreWhatsapp) {
        next = next
          .replace(
            'data-store-whatsapp=""',
            `data-store-whatsapp="${escapeHtmlAttr(resolvedStoreWhatsapp)}"`,
          )
          .replace(
            'data-telefone-whatsapp=""',
            `data-telefone-whatsapp="${escapeHtmlAttr(
              resolvedStoreWhatsapp,
            )}"`,
          )
          .replace(
            'data-whatsapp=""',
            `data-whatsapp="${escapeHtmlAttr(resolvedStoreWhatsapp)}"`,
          );
      }

      return next;
    }
  }

  function getDocumentHtml() {
    const doc = iframeRef.current?.contentDocument;
    if (!doc?.documentElement) return html;
    return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
  }

  function commitHtml() {
    const next = getDocumentHtml();
    lastInternalHtmlRef.current = next;
    onHtmlChange?.(next);
  }

  function scheduleCommit() {
    if (commitTimerRef.current) window.clearTimeout(commitTimerRef.current);
    commitTimerRef.current = window.setTimeout(commitHtml, 250);
  }

  function normalizeText(value: string): string {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function normalizeImageUrl(value: string): string {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^(https?:|data:|blob:)/i.test(raw)) return raw;

    const configuredRoot = String(API_URL || "").replace(/\/$/, "").replace(/\/api$/, "");
    const browserRoot =
      typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

    const apiRoot = configuredRoot || browserRoot;
    const clean = raw.replace(/\\/g, "/");

    const uploadIndex = clean.toLowerCase().indexOf("/uploads/");
    if (uploadIndex >= 0) return `${apiRoot}${clean.slice(uploadIndex)}`;
    if (clean.startsWith("uploads/")) return `${apiRoot}/${clean}`;
    if (clean.startsWith("/")) return `${apiRoot}${clean}`;

    return `${apiRoot}/uploads/images/${clean}`;
  }


  function parseProductPrice(value: number | string | undefined | null): number {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;

    const raw = String(value ?? "")
      .replace(/R\$/gi, "")
      .replace(/\s/g, "")
      .trim();

    if (!raw) return 0;

    const normalized = raw.includes(",")
      ? raw.replace(/\./g, "").replace(",", ".")
      : raw;

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function formatProductPrice(value: number): string {
    if (!Number.isFinite(value) || value <= 0) return "Consulte";

    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function escapeHtmlText(value: string): string {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function escapeHtmlAttr(value: string): string {
    return escapeHtmlText(value).replace(/"/g, "&quot;");
  }

  function resolveProductData(product: ProductForVitrine) {
    const rawPrice = parseProductPrice(
      product.displayPrice ??
      product.promotional_price ??
      product.preco_promocional ??
      product.valor_promocional ??
      product.sale_price ??
      product.discount_price ??
      product.price ??
      product.preco ??
      product.valor ??
      product.preco_venda ??
      product.valor_venda ??
      product.amount ??
      0,
    );

    const originalPrice = parseProductPrice(
      product.original_price ??
      product.preco_original ??
      product.old_price ??
      product.price_original ??
      product.valor_original ??
      0,
    );

    const explicitDiscount = parseProductPrice(
      product.discount_percent ??
      product.percentual_desconto ??
      product.discount ??
      product.desconto ??
      0,
    );

    const computedDiscount =
      rawPrice > 0 && originalPrice > rawPrice
        ? Math.round(((originalPrice - rawPrice) / originalPrice) * 100)
        : 0;

    const discount = explicitDiscount > 0 ? explicitDiscount : computedDiscount;
    const discountLabel = escapeHtmlText(product.discount_label || "");

    const name = escapeHtmlText(
      product.displayName ||
      product.name ||
      product.nome ||
      product.title ||
      product.titulo ||
      "Produto",
    );

    const description = escapeHtmlText(
      product.displayDescription ||
      product.description ||
      product.descricao ||
      product.descricao_curta ||
      product.short_description ||
      product.detalhes ||
      "",
    );

    const imageUrl =
      normalizeImageUrl(
        product.image_url ||
        product.imageUrl ||
        product.imagem_url ||
        product.imagem ||
        product.image ||
        product.foto_perfil ||
        product.foto_url ||
        product.capa_url ||
        product.thumbnail_url ||
        product.foto ||
        "",
      ) || IMAGE_PLACEHOLDER;

    const hasPrice = rawPrice > 0;

    const priceHtml = hasPrice
      ? `${originalPrice > rawPrice
        ? `<span class="gc-price-old">${formatProductPrice(
          originalPrice,
        )}</span>`
        : ""
      }<strong class="gc-price-current">${formatProductPrice(
        rawPrice,
      )}</strong>${discount > 0 || discountLabel
        ? `<span class="gc-discount-badge">${discountLabel || `${discount}% OFF`
        }</span>`
        : ""
      }`
      : `<strong class="gc-price-current gc-price-consult">Consulte</strong>`;

    return {
      productId: escapeHtmlAttr(String(product.id || "")),
      name,
      description,
      imageUrl,
      image: escapeHtmlAttr(imageUrl),
      rawPrice,
      hasPrice,
      priceHtml,
    };
  }

  function isOrphanElementorProductDetailSection(section: HTMLElement): boolean {
    if (section.matches(PRODUCT_SLOT_SELECTOR)) return false;
    if (section.closest(PRODUCT_CARD_SELECTOR)) return false;
    if (
      section.querySelector(
        `img, picture, video, ${PRODUCT_CARD_SELECTOR}`,
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

    return (
      headings.length >= 2 &&
      Boolean(button) &&
      (/r\$\s*\d/.test(text) || text.includes("consulte"))
    );
  }

  function removeOrphanElementorProductDetailSections(doc: Document): number {
    let removed = 0;

    doc
      .querySelectorAll<HTMLElement>(
        "section.elementor-inner, section.elementor-section, .elementor-inner.elementor-section",
      )
      .forEach((section) => {
        if (!isOrphanElementorProductDetailSection(section)) return;
        section.remove();
        removed += 1;
      });

    return removed;
  }

  function isWishlistOnlyArea(element: HTMLElement): boolean {
    const section =
      element.closest<HTMLElement>(
        "#novidades, #presentes-de-fe, [data-gc-wishlist-section='true']",
      ) || element.closest<HTMLElement>("section, .elementor-section, .elementor-inner, [data-gc-products], [data-granconecta-products]");

    const text = normalizeText(
      [
        section?.id || "",
        section?.getAttribute("data-elementor-id") || "",
        section?.getAttribute("aria-label") || "",
        section?.textContent || "",
      ].join(" "),
    );

    return (
      text.includes("novidades") ||
      text.includes("novidade") ||
      text.includes("lancamentos") ||
      text.includes("presentes de fe") ||
      text.includes("presentes")
    );
  }

  function buildProductActions(
    data: ReturnType<typeof resolveProductData>,
    wishlistOnly: boolean,
  ): string {
    if (wishlistOnly || !data.hasPrice) {
      return `
      <button 
        type="button" 
        data-action="add-to-wishlist"
        data-gc-action="add-to-wishlist"
        data-gc-wishlist="true" 
        data-product-id="${data.productId}"
        data-product-name="${data.name}"
        data-product-image="${data.image}"
      >
        Lista de desejo
      </button>`;
    }

    return `
    <button 
      type="button" 
      data-action="add-to-cart"
      data-gc-action="add-to-cart"
      data-gc-add-to-cart="true" 
      data-product-id="${data.productId}" 
      data-product-name="${data.name}" 
      data-product-price="${data.rawPrice}" 
      data-product-image="${data.image}"
    >
      Adicionar ao carrinho
    </button>

    <button 
      type="button" 
      data-action="add-to-wishlist"
      data-gc-action="add-to-wishlist"
      data-gc-wishlist="true" 
      data-product-id="${data.productId}"
      data-product-name="${data.name}"
      data-product-image="${data.image}"
    >
      Lista de desejo
    </button>`;
  }

  function renderProductCard(product: ProductForVitrine) {
    const data = resolveProductData(product);
    const actionButton = buildProductActions(data, false);

    return `<article class="gc-vitrine-card" data-gc-product-card="true" data-product-id="${data.productId}">
      <div class="gc-vitrine-card-image">
        <img src="${data.image}" alt="${data.name}" data-gc-product-image="true" data-editor-image="true" />
      </div>
      <div class="gc-vitrine-card-body">
        <h3 contenteditable="true" data-editor-editable="true">${data.name}</h3>
        <p contenteditable="true" data-editor-editable="true">${data.description}</p>
        <div class="gc-price-stack" contenteditable="true" data-editor-editable="true">${data.priceHtml}</div>
        <div class="gc-card-actions">${actionButton}</div>
      </div>
    </article>`;
  }

  function getElementorProductCards(slot: HTMLElement): HTMLElement[] {
    return Array.from(slot.children).filter((child): child is HTMLElement => {
      if (!(child instanceof HTMLElement)) return false;

      if (child.matches(PRODUCT_CARD_SELECTOR)) return true;

      const hasImage = Boolean(child.querySelector("img"));
      const hasButton = Boolean(
        child.querySelector(
          ".elementor-button-buy, .elementor-widget-button, a, button",
        ),
      );
      const hasPrice = /r\$\s*\d|consulte/i.test(child.textContent || "");

      return hasImage && hasButton && hasPrice;
    });
  }

  function getProductSlots(doc: Document): HTMLElement[] {
    const slots = Array.from(
      doc.querySelectorAll<HTMLElement>(PRODUCT_SLOT_SELECTOR),
    );

    const elementorRows = Array.from(
      doc.querySelectorAll<HTMLElement>(".elementor-inner, .elementor-section"),
    ).filter((el) => getElementorProductCards(el).length >= 2);

    return Array.from(new Set([...slots, ...elementorRows]));
  }

  function hydrateProductSlots(doc: Document, force = false) {
    const products = selectedProductsRef.current || [];
    if (!products.length) return;

    const slots = getProductSlots(doc);
    if (!slots.length) return;

    slots.forEach((slot) => {
      if (!force && slot.getAttribute("data-gc-products-hydrated") === "true") {
        return;
      }

      slot.setAttribute("data-gc-products-hydrated", "true");

      const cards = getElementorProductCards(slot);

      if (cards.length) {
        cards.forEach((card, index) =>
          applyProductDataToCard(card, products[index % products.length]),
        );
        return;
      }

      slot.innerHTML = products.map(renderProductCard).join("");
    });
  }

  function markProductImage(img: HTMLImageElement) {
    img.setAttribute("data-gc-product-image", "true");
    img.setAttribute("data-editor-image", "true");
    img.style.setProperty("width", "100%", "important");
    img.style.setProperty("height", "100%", "important");
    img.style.setProperty("object-fit", "contain", "important");
    img.style.setProperty("object-position", "center", "important");
    img.style.setProperty("display", "block", "important");
    img.removeAttribute("srcset");
    img.removeAttribute("sizes");
  }

  function ensureCardImage(
    card: HTMLElement,
    imageUrl: string,
    alt: string,
    clickedImage?: HTMLImageElement | null,
  ) {
    let img =
      clickedImage && card.contains(clickedImage)
        ? clickedImage
        : card.querySelector<HTMLImageElement>("img");

    let frame =
      card.querySelector<HTMLElement>(PRODUCT_IMAGE_FRAME_SELECTOR) ||
      card.querySelector<HTMLElement>(".elementor-widget-image") ||
      null;

    if (!frame) {
      frame = card.ownerDocument.createElement("div");
      frame.className = card.classList.contains("gc-product-card")
        ? "gc-product-card__image"
        : "gc-vitrine-card-image";
      card.insertBefore(frame, card.firstChild);
    }

    if (!img) {
      frame.textContent = "";
      img = card.ownerDocument.createElement("img");
      frame.appendChild(img);
    }

    img.src = imageUrl;
    img.setAttribute("src", imageUrl);
    img.alt = alt;
    markProductImage(img);

    return img;
  }

  function ensureImageOnlyProductDetails(
    card: HTMLElement,
    data: ReturnType<typeof resolveProductData>,
  ) {
    let body = card.querySelector<HTMLElement>(":scope > .gc-image-product-body");
    const actions = card.querySelector<HTMLElement>(":scope > .gc-card-actions");

    if (!body) {
      body = card.ownerDocument.createElement("div");
      body.className = "gc-image-product-body";

      if (actions) card.insertBefore(body, actions);
      else card.appendChild(body);
    }

    body.innerHTML = `<h3 contenteditable="true" data-editor-editable="true">${data.name}</h3>
      ${data.description
        ? `<p contenteditable="true" data-editor-editable="true">${data.description}</p>`
        : ""
      }
      <div class="gc-price-stack" contenteditable="true" data-editor-editable="true">${data.priceHtml}</div>`;
  }

  type ProductCardData = ReturnType<typeof resolveProductData>;

  function configureProductActions(card: HTMLElement, data: ProductCardData) {
    let actions = card.querySelector<HTMLElement>(
      ":scope > .gc-card-actions, .gc-product-card__body .gc-card-actions, .gc-vitrine-card-body .gc-card-actions",
    );

    if (!actions) {
      actions = card.ownerDocument.createElement("div");
      actions.className = "gc-card-actions";

      const body = card.querySelector<HTMLElement>(
        ".gc-product-card__body, .gc-vitrine-card-body, .gc-image-product-body",
      );

      (body || card).appendChild(actions);
    }

    actions.innerHTML = buildProductActions(data, isWishlistOnlyArea(card));
  }

  function docContent(element: HTMLElement, text: string) {
    element.textContent = text;
  }

  function applyProductDataToCard(
    card: HTMLElement,
    product: ProductForVitrine,
    clickedImage?: HTMLImageElement | null,
  ) {
    const data = resolveProductData(product);

    card.setAttribute("data-product-id", data.productId);
    card.setAttribute("data-gc-product-card", "true");

    const img = ensureCardImage(card, data.imageUrl, data.name, clickedImage);

    const isImageOnly =
      card.matches(".elementor-widget-image, [data-gc-wishlist-card='true']") ||
      !card.querySelector(
        ".gc-product-card__body, .gc-vitrine-card-body, .j2-card",
      );

    if (isImageOnly) {
      card.setAttribute("data-gc-wishlist-card", "true");
      ensureImageOnlyProductDetails(card, data);
    } else {
      const title = card.querySelector<HTMLElement>(
        ".gc-product-card__body h3, .gc-vitrine-card-body h3, h3, h2, .elementor-heading-title",
      );

      const desc = card.querySelector<HTMLElement>(
        ".gc-product-card__body p, .gc-vitrine-card-body p, p",
      );

      let price =
        card.querySelector<HTMLElement>(".gc-price-stack") ||
        card.querySelector<HTMLElement>(".gc-price");

      if (!price) {
        price =
          Array.from(
            card.querySelectorAll<HTMLElement>("strong, span, h2, h3"),
          ).find((el) => /r\$\s*\d|consulte/i.test(el.textContent || "")) ||
          null;
      }

      if (title && !title.closest(PRODUCT_IMAGE_FRAME_SELECTOR)) {
        title.textContent = data.name;
      }

      if (desc && !desc.closest(PRODUCT_IMAGE_FRAME_SELECTOR)) {
        docContent(desc, data.description);
      }

      if (price && !price.closest(PRODUCT_IMAGE_FRAME_SELECTOR)) {
        price.innerHTML = data.priceHtml;
        price.classList.add("gc-price-stack");
      }
    }

    configureProductActions(card, data);
    selectedElementRef.current = card;
    selectedImageRef.current = img;
    markSelectedProductCard(card, img);
  }

  function normalizeProductActions(doc: Document) {
    doc.querySelectorAll<HTMLElement>(".elementor-widget-image").forEach((card) => {
      if (card.querySelector("img") && isWishlistOnlyArea(card)) {
        card.setAttribute("data-gc-wishlist-card", "true");
      }
    });

    doc
      .querySelectorAll<HTMLImageElement>(
        ".gc-vitrine-card img, .gc-product-card img, .j2-card img, [data-gc-product-card='true'] img, [data-gc-wishlist-card='true'] img",
      )
      .forEach(markProductImage);

    doc
      .querySelectorAll<HTMLElement>(
        "[data-gc-add-to-cart], [data-gc-wishlist]",
      )
      .forEach((button) => {
        button.setAttribute("type", "button");
        button.removeAttribute("href");

        if (button.hasAttribute("data-gc-add-to-cart")) {
          button.setAttribute("data-action", "add-to-cart");
          button.setAttribute("data-gc-action", "add-to-cart");
        }

        if (button.hasAttribute("data-gc-wishlist")) {
          button.setAttribute("data-action", "add-to-wishlist");
          button.setAttribute("data-gc-action", "add-to-wishlist");
        }
      });
  }

  function injectStyles(doc: Document) {
    if (doc.getElementById("granconecta-inline-editor-style")) return;

    const style = doc.createElement("style");
    style.id = "granconecta-inline-editor-style";
    style.textContent = `
      [data-editor-selected="true"] {
        outline: 3px solid #2563eb !important;
        outline-offset: 3px !important;
      }

      [contenteditable="true"] {
        cursor: text !important;
      }

      [data-gc-product-card="true"],
      [data-gc-wishlist-card="true"],
      .gc-vitrine-card,
      .gc-product-card,
      .j2-card {
        position: relative;
      }

      .gc-category-card {
        cursor: pointer !important;
        user-select: none !important;
      }

      .gc-category-card strong,
      .gc-category-card span,
      .gc-category-card p,
      .gc-category-card h3 {
        user-select: text !important;
      }

      [data-gc-product-image="true"] {
        max-width: 100% !important;
        display: block !important;
      }

      .gc-card-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .gc-card-actions button,
      [data-gc-add-to-cart],
      [data-gc-wishlist],
      [data-action="add-to-cart"],
      [data-action="add-to-wishlist"] {
        cursor: pointer !important;
        user-select: none !important;
      }

      [data-gc-add-to-cart],
      [data-action="add-to-cart"] {
        background: var(--gc-primary, #111827);
        color: var(--gc-surface, #ffffff);
      }

      [data-gc-wishlist],
      [data-action="add-to-wishlist"] {
        background: color-mix(in srgb, var(--gc-primary, #111827) 8%, #ffffff);
        color: var(--gc-primary, #111827);
      }

      .gc-image-product-body {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
    `;

    doc.head?.appendChild(style);
  }

  function bindCategoryCards(doc: Document) {
    doc.querySelectorAll<HTMLElement>(".gc-category-card").forEach((card) => {
      card.contentEditable = "false";
      card.removeAttribute("data-editor-editable");
      card.setAttribute("type", "button");

      card.querySelectorAll<HTMLElement>("strong, span, p, h3").forEach((text) => {
        text.contentEditable = "true";
        text.setAttribute("data-editor-editable", "true");
        text.addEventListener("input", scheduleCommit);
      });
    });
  }

  function enableEditor(doc: Document) {
    injectStyles(doc);
    normalizeProductActions(doc);

    doc
      .querySelectorAll<HTMLElement>(
        "h1,h2,h3,h4,p,span,strong,small,li,.elementor-heading-title,.elementor-button-text",
      )
      .forEach((el) => {
        if (
          el.closest(
            "script, style, svg, .gc-product-card__image, .gc-vitrine-card-image, .elementor-image-frame",
          )
        ) {
          return;
        }

        if (el.closest(".gc-category-card")) return;

        el.contentEditable = "true";
        el.setAttribute("data-editor-editable", "true");
        el.addEventListener("input", scheduleCommit);
      });

    bindCategoryCards(doc);

    doc
      .querySelectorAll<HTMLElement>(
        `section, header, footer, .elementor-section, .elementor-inner, ${PRODUCT_CARD_SELECTOR}`,
      )
      .forEach((section) => {
        if (section.getAttribute("data-editor-section-bound") === "true") return;

        section.setAttribute("data-editor-section-bound", "true");

        section.addEventListener(
          "click",
          (event) => {
            const target = event.target as HTMLElement;

            const categoryCard =
              target.closest<HTMLElement>(".gc-category-card");

            if (categoryCard) {
              selectedElementRef.current = categoryCard;
              selectedImageRef.current =
                categoryCard.querySelector<HTMLImageElement>("img");
              selectedImageTargetRef.current = "image";

              doc
                .querySelectorAll<HTMLElement>("[data-gc-last-selected-category-card='true']")
                .forEach((item) => {
                  if (item !== categoryCard) {
                    item.removeAttribute("data-gc-last-selected-category-card");
                  }
                });

              doc
                .querySelectorAll<HTMLElement>("[data-gc-last-selected-product-card='true']")
                .forEach((item) => {
                  item.removeAttribute("data-gc-last-selected-product-card");
                });

              categoryCard.setAttribute("data-gc-last-selected-category-card", "true");
              selectSection(categoryCard);
              return;
            }

            const productCard =
              target.closest<HTMLElement>(PRODUCT_CARD_SELECTOR);

            const actionButton = target.closest<HTMLElement>(
              "[data-action], [data-gc-action], [data-gc-add-to-cart], [data-gc-wishlist]",
            );

            if (productCard && isStorePage) {
              markSelectedProductCard(
                productCard,
                target.closest<HTMLImageElement>("img") ||
                productCard.querySelector<HTMLImageElement>("img"),
              );

              selectSection(productCard);

              if (actionButton) return;

              event.preventDefault();
              event.stopPropagation();

              if (!target.closest("[contenteditable='true']")) {
                openProductPickerForCard(productCard, selectedImageRef.current);
              }

              return;
            }

            selectedElementRef.current = target;

            if (target instanceof HTMLImageElement) {
              selectedImageRef.current = target;
            }

            selectSection(section);
          },
          true,
        );
      });

    doc.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
      img.setAttribute("data-editor-image", "true");
      img.style.cursor = "pointer";

      img.addEventListener("click", () => {
        selectedImageRef.current = img;
        selectedElementRef.current = img;
        selectedImageTargetRef.current = "image";

        selectSection(
          img.closest<HTMLElement>(
            `${CATEGORY_CARD_SELECTOR}, ${PRODUCT_CARD_SELECTOR}, section, .elementor-section, .elementor-inner`,
          ) || img,
        );
      });
    });

    bindActionEvents(doc);
  }

  function bindActionEvents(doc: Document) {
    if (doc.body.getAttribute("data-gc-action-listener-bound") === "true") {
      return;
    }

    doc.body.setAttribute("data-gc-action-listener-bound", "true");

    doc.addEventListener(
      "click",
      (event) => {
        const target = event.target as HTMLElement | null;

        const action = target?.closest<HTMLElement>(
          "[data-action], [data-gc-action], [data-gc-add-to-cart], [data-gc-wishlist]",
        );

        if (!action) return;

        const categoryCard = action.closest<HTMLElement>(".gc-category-card");

        if (categoryCard) {
          const categoryLabel =
            categoryCard.querySelector("strong")?.textContent?.trim() ||
            categoryCard.textContent?.trim() ||
            "";

          const categoryAction =
            categoryCard.getAttribute("data-action") ||
            categoryCard.getAttribute("data-gc-action") ||
            "open-products";

          event.preventDefault();
          event.stopPropagation();

          selectedElementRef.current = categoryCard;
          selectedImageRef.current = categoryCard.querySelector<HTMLImageElement>("img");

          doc
            .querySelectorAll<HTMLElement>("[data-gc-last-selected-category-card='true']")
            .forEach((item) => {
              if (item !== categoryCard) {
                item.removeAttribute("data-gc-last-selected-category-card");
              }
            });

          doc
            .querySelectorAll<HTMLElement>("[data-gc-last-selected-product-card='true']")
            .forEach((item) => {
              item.removeAttribute("data-gc-last-selected-product-card");
            });

          categoryCard.setAttribute("data-gc-last-selected-category-card", "true");

          selectSection(categoryCard);

          void openProductPicker();
          window.parent.postMessage(
            {
              type: "GC_OPEN_CATEGORY",
              storeId,
              payload: {
                category: categoryLabel,
                action: categoryAction,
                storeId,
                origem: "LANDING_PAGE",
              },
            },
            "*",
          );

          return;
        }

        const actionName =
          action.getAttribute("data-action") ||
          action.getAttribute("data-gc-action") ||
          "";

        const productCard = action.closest<HTMLElement>(
          `${PRODUCT_CARD_SELECTOR}, [data-product-id]`,
        );

        const productId = String(
          action.getAttribute("data-product-id") ||
          productCard?.getAttribute("data-product-id") ||
          "",
        ).trim();

        const isAddToCart =
          action.hasAttribute("data-gc-add-to-cart") ||
          actionName === "add-to-cart";

        const isWishlist =
          action.hasAttribute("data-gc-wishlist") ||
          actionName === "add-to-wishlist" ||
          actionName === "wishlist";

        const normalizedAction = actionName || "";

        const genericPayload = {
          productId,
          id: productId,
          produtoId: productId,
          titulo:
            action.getAttribute("data-product-name") ||
            productCard?.querySelector("h3")?.textContent?.trim() ||
            "Atendimento GranConecta",
          image:
            action.getAttribute("data-product-image") ||
            productCard?.querySelector("img")?.getAttribute("src") ||
            "",
          storeId,
          storeWhatsapp: resolvedStoreWhatsapp,
          telefoneWhatsapp: resolvedStoreWhatsapp,
          whatsapp: resolvedStoreWhatsapp,
          origem: "LANDING_PAGE",
          action: normalizedAction,
        };

        if (!isAddToCart && !isWishlist) {
          event.preventDefault();
          event.stopPropagation();

          if (normalizedAction === "open-whatsapp") {
            const number = resolvedStoreWhatsapp;

            if (number) {
              window.open(`https://wa.me/${number}`, "_blank");
            } else {
              window.parent.postMessage(
                {
                  type: "GC_OPEN_WHATSAPP",
                  storeId,
                  payload: genericPayload,
                },
                "*",
              );
            }

            return;
          }

          if (normalizedAction === "open-chat") {
            window.parent.postMessage(
              {
                type: "GC_OPEN_CHAT",
                storeId,
                payload: genericPayload,
              },
              "*",
            );
            return;
          }

          if (normalizedAction === "request-quote") {
            window.parent.postMessage(
              {
                type: "GC_REQUEST_QUOTE",
                storeId,
                payload: genericPayload,
              },
              "*",
            );
            return;
          }

          if (
            normalizedAction === "open-offers" ||
            normalizedAction === "open-combos" ||
            normalizedAction === "open-products" ||
            normalizedAction === "open-product" ||
            normalizedAction === "open-service"
          ) {
            window.parent.postMessage(
              {
                type: "GC_OPEN_ACTION",
                storeId,
                payload: genericPayload,
              },
              "*",
            );
            return;
          }

          return;
        }

        event.preventDefault();
        event.stopPropagation();

        if (isAddToCart && productId) {
          void onAddToCart?.(productId);

          window.parent.postMessage(
            {
              type: "GC_ADD_TO_CART",
              productId,
              storeId,
              payload: {
                ...genericPayload,
                titulo:
                  action.getAttribute("data-product-name") ||
                  productCard?.querySelector("h3")?.textContent?.trim() ||
                  "Produto",
              },
            },
            "*",
          );

          return;
        }

        if (isWishlist) {
          window.parent.postMessage(
            {
              type: "GC_WISHLIST",
              productId,
              storeId,
              payload: {
                ...genericPayload,
                titulo:
                  action.getAttribute("data-product-name") ||
                  productCard?.querySelector("h3")?.textContent?.trim() ||
                  "Tenho interesse",
                tipoInteresse: "LISTA_DE_DESEJO",
              },
            },
            "*",
          );
        }
      },
      true,
    );
  }

  function getBestBackgroundTarget(
    element?: HTMLElement | null,
  ): HTMLElement | null {
    const doc = iframeRef.current?.contentDocument;
    const selected =
      element ||
      selectedSectionRef.current ||
      selectedElementRef.current ||
      selectedImageRef.current ||
      null;

    if (!selected) {
      return (
        doc?.querySelector<HTMLElement>(
          ".hero, .gc-hero, .preset-hero, .j2-hero, [class*='hero'], section, .elementor-section, .elementor-inner",
        ) || null
      );
    }

    const productCard = selected.closest<HTMLElement>(PRODUCT_CARD_SELECTOR);
    const base = productCard || selected;

    const selectors = [
      ".hero",
      ".gc-hero",
      ".preset-hero",
      ".j2-hero",
      "[data-gc-hero-premium='true']",
      "[class*='hero']",
      "section",
      ".elementor-section",
      ".elementor-inner",
      "header",
    ].join(",");

    return (
      base.closest<HTMLElement>(selectors) ||
      base.querySelector<HTMLElement>(selectors) ||
      base
    );
  }

  function clearEditorBackgroundImage(element: HTMLElement) {
    element.style.removeProperty("background");
    element.style.removeProperty("background-image");
    element.style.removeProperty("background-size");
    element.style.removeProperty("background-position");
    element.style.removeProperty("background-repeat");
    element.style.removeProperty("--hero-image");
    element.style.removeProperty("--gc-hero-image");
    element.removeAttribute("data-editor-background-image");
  }

  function applyBackgroundImageToElement(target: HTMLElement, imageUrl: string) {
    const value = `url("${imageUrl}")`;

    const finalTarget =
      target.closest<HTMLElement>(
        ".hero, .gc-hero, .preset-hero, .j2-hero, [data-gc-hero-premium='true'], [class*='hero'], section, .elementor-section, .elementor-inner, header",
      ) || target;

    finalTarget
      .querySelectorAll<HTMLElement>("[data-editor-background-image]")
      .forEach((item) => {
        if (item !== finalTarget) clearEditorBackgroundImage(item);
      });

    finalTarget.style.setProperty("background-image", value, "important");
    finalTarget.style.setProperty("background-size", "cover", "important");
    finalTarget.style.setProperty("background-position", "center center", "important");
    finalTarget.style.setProperty("background-repeat", "no-repeat", "important");
    finalTarget.style.setProperty("--hero-image", value);
    finalTarget.style.setProperty("--gc-hero-image", value);
    finalTarget.setAttribute("data-editor-background-image", imageUrl);
  }

  function selectSection(section: HTMLElement) {
    selectedSectionRef.current?.removeAttribute("data-editor-selected");
    selectedSectionRef.current = section;
    section.setAttribute("data-editor-selected", "true");

    setSelectedLabel(
      section.getAttribute("data-elementor-id") ||
      section.getAttribute("id") ||
      String(section.className || "").split(" ")[0] ||
      "Selecionado",
    );

    setSelectedHidden(
      section.getAttribute("data-editor-hidden") === "true" ||
      section.style.display === "none",
    );
  }

  function markSelectedProductCard(
    card: HTMLElement,
    image?: HTMLImageElement | null,
  ) {
    card.ownerDocument
      .querySelectorAll<HTMLElement>(
        "[data-gc-last-selected-product-card='true']",
      )
      .forEach((item) => {
        if (item !== card) item.removeAttribute("data-gc-last-selected-product-card");
      });

    card.setAttribute("data-gc-last-selected-product-card", "true");
    selectedElementRef.current = card;
    selectedImageRef.current = image || card.querySelector<HTMLImageElement>("img");
  }

  async function openProductPicker() {
    try {
      const response = await api.get("/produtos/lojas/meus-produtos");
      const list = Array.isArray(response.data)
        ? response.data
        : response.data?.data ||
        response.data?.products ||
        response.data?.produtos ||
        [];

      setAvailableProducts(list);
    } catch (error) {
      console.error(error);
      setAvailableProducts([]);
    } finally {
      setProductPickerOpen(true);
    }
  }

  function openProductPickerForCard(
    card: HTMLElement,
    image?: HTMLImageElement | null,
  ) {
    markSelectedProductCard(card, image);
    selectedImageTargetRef.current = "image";
    selectSection(card);
    void openProductPicker();
  }

  function applyProductToCategoryCard(
    card: HTMLElement,
    product: ProductForVitrine,
  ) {
    const data = resolveProductData(product);

    card.setAttribute("data-product-id", data.productId);
    card.setAttribute("data-category-product-id", data.productId);
    card.setAttribute("data-action", "open-product");
    card.setAttribute("data-gc-action", "open-product");

    const img = card.querySelector<HTMLImageElement>("img");

    if (img) {
      img.src = data.imageUrl;
      img.setAttribute("src", data.imageUrl);
      img.alt = data.name;
      img.removeAttribute("srcset");
      img.removeAttribute("sizes");
      img.setAttribute("data-editor-image", "true");
      img.style.cursor = "pointer";
    }

    const title = card.querySelector<HTMLElement>("strong, h3, span");

    if (title) {
      title.textContent = data.name;
    }

    selectedElementRef.current = card;
    selectedImageRef.current = img || null;

    scheduleCommit();
  }

  function applyProductToSelectedCard(product: ProductForVitrine) {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;

    const markedCategory = doc.querySelector<HTMLElement>(
      "[data-gc-last-selected-category-card='true']",
    );

    if (markedCategory) {
      applyProductToCategoryCard(markedCategory, product);

      markedCategory.removeAttribute("data-gc-last-selected-category-card");

      setProductPickerOpen(false);
      enableEditor(doc);
      scheduleCommit();

      return;
    }

    const marked = doc.querySelector<HTMLElement>(
      "[data-gc-last-selected-product-card='true']",
    );

    let card =
      marked ||
      selectedImageRef.current?.closest<HTMLElement>(PRODUCT_CARD_SELECTOR) ||
      selectedElementRef.current?.closest<HTMLElement>(PRODUCT_CARD_SELECTOR) ||
      null;

    if (!card) {
      const container =
        selectedSectionRef.current?.querySelector<HTMLElement>(
          PRODUCT_SLOT_SELECTOR,
        ) ||
        selectedSectionRef.current ||
        doc.querySelector<HTMLElement>(
          `${PRODUCT_SLOT_SELECTOR}, #products, #novidades, #presentes-de-fe`,
        ) ||
        null;

      if (!container) {
        alert("Clique primeiro no card onde deseja inserir o produto.");
        return;
      }

      const wrapper = container.matches(PRODUCT_SLOT_SELECTOR)
        ? container
        : container.querySelector<HTMLElement>(
          ".gc-products-grid, .gc-vitrine-grid, .j2-grid",
        ) ||
        (() => {
          const grid = container.ownerDocument.createElement("div");
          grid.className = "gc-products-grid";
          container.appendChild(grid);
          return grid;
        })();

      const template = container.ownerDocument.createElement("template");
      template.innerHTML = renderProductCard(product);

      card = template.content.firstElementChild as HTMLElement | null;
      if (!card) return;

      wrapper.appendChild(card);
    }

    applyProductDataToCard(card, product, selectedImageRef.current);

    setProductPickerOpen(false);
    enableEditor(doc);
    scheduleCommit();
  }

  function getSelectedProductImageFrame(): HTMLElement | null {
    const doc = iframeRef.current?.contentDocument;

    const selected =
      doc?.querySelector<HTMLElement>(
        "[data-gc-last-selected-product-card='true']",
      ) ||
      selectedImageRef.current ||
      selectedElementRef.current ||
      selectedSectionRef.current ||
      doc?.querySelector<HTMLElement>("[data-editor-selected='true']");

    if (!selected) return null;

    const card =
      selected.closest<HTMLElement>(PRODUCT_CARD_SELECTOR) ||
      (selected.matches(PRODUCT_CARD_SELECTOR) ? selected : null);

    const image =
      selected instanceof HTMLImageElement
        ? selected
        : card?.querySelector<HTMLImageElement>("img") ||
        selected.querySelector<HTMLImageElement>("img");

    return (
      image?.closest<HTMLElement>(PRODUCT_IMAGE_FRAME_SELECTOR) ||
      card?.querySelector<HTMLElement>(PRODUCT_IMAGE_FRAME_SELECTOR) ||
      card ||
      null
    );
  }

  function resizeSelectedProductImage(direction: "smaller" | "larger") {
    const frame = getSelectedProductImageFrame();

    if (!frame) {
      alert("Clique primeiro na imagem do card.");
      return;
    }

    const current =
      Number.parseFloat(
        frame.style.getPropertyValue("--gc-card-image-height") ||
        frame.style.height ||
        "",
      ) ||
      frame.getBoundingClientRect().height ||
      240;

    const next = Math.max(
      150,
      Math.min(460, current + (direction === "larger" ? 32 : -32)),
    );

    frame.style.setProperty("--gc-card-image-height", `${next}px`);
    frame.style.setProperty("height", `${next}px`, "important");

    frame.querySelectorAll<HTMLImageElement>("img").forEach(markProductImage);
    scheduleCommit();
  }

  function extractUploadedImageUrl(payload: any): string {
    const direct =
      payload?.url ||
      payload?.path ||
      payload?.filename ||
      payload?.fileName ||
      payload?.imageUrl ||
      payload?.image_url ||
      payload?.data?.url ||
      payload?.data?.path ||
      "";

    if (direct) return normalizeImageUrl(String(direct));

    const firstFile =
      payload?.files?.[0] ||
      payload?.file?.[0] ||
      payload?.file ||
      payload?.foto_hero ||
      payload?.foto_perfil ||
      null;

    const nested =
      firstFile?.url ||
      firstFile?.path ||
      firstFile?.filename ||
      firstFile?.fileName ||
      firstFile?.imageUrl ||
      firstFile?.image_url ||
      "";

    return nested ? normalizeImageUrl(String(nested)) : "";
  }

  async function postImageUpload(
    endpoint: string,
    fieldName: string,
    file: File,
  ): Promise<string> {
    const formData = new FormData();
    formData.append(fieldName, file);

    const response = await api.post(endpoint, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return extractUploadedImageUrl(response.data);
  }

  async function uploadImage(file: File): Promise<string> {
    const attempts: Array<[string, string]> = [
      ["/uploads/images", "files"],
      ["/uploads/upload", "files"],
      ["/lojas/store/upload", "file"],
    ];

    let lastError: unknown = null;

    for (const [endpoint, fieldName] of attempts) {
      try {
        const uploadedUrl = await postImageUpload(endpoint, fieldName, file);
        if (uploadedUrl) return uploadedUrl;
      } catch (error) {
        lastError = error;
        console.warn(
          `Falha no upload em ${endpoint} com campo ${fieldName}`,
          error,
        );
      }
    }

    throw lastError || new Error("O upload da imagem não retornou uma URL.");
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    let url = "";

    try {
      url = await uploadImage(file);
    } catch (error: any) {
      console.error("Erro ao enviar imagem:", error?.response?.data || error);
      alert(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Não foi possível enviar a imagem.",
      );
      return;
    }

    if (!url) return;

    const doc = iframeRef.current?.contentDocument;
    const selectedCategoryCard =
      selectedElementRef.current?.closest<HTMLElement>(CATEGORY_CARD_SELECTOR) ||
      selectedSectionRef.current?.closest<HTMLElement>(CATEGORY_CARD_SELECTOR) ||
      doc?.querySelector<HTMLElement>("[data-gc-last-selected-category-card='true']");
    const categoryImage =
      selectedCategoryCard?.querySelector<HTMLImageElement>("img") || null;
    const targetImage =
      categoryImage ||
      selectedImageRef.current ||
      selectedElementRef.current?.querySelector<HTMLImageElement>("img");

    if (selectedImageTargetRef.current === "background") {
      const target = backgroundTargetRef.current || getBestBackgroundTarget();

      if (!target) {
        alert("Clique primeiro na seção/hero onde deseja trocar o fundo.");
        return;
      }

      applyBackgroundImageToElement(target, url);
      selectSection(target);
      backgroundTargetRef.current = target;
    } else if (targetImage) {
      targetImage.src = url;
      targetImage.setAttribute("src", url);
      targetImage.removeAttribute("srcset");

      if (targetImage.closest(PRODUCT_CARD_SELECTOR)) {
        markProductImage(targetImage);
      }
    }

    if (doc) enableEditor(doc);
    scheduleCommit();
  }

  function handleBackgroundColor(color: string) {
    const section = getBestBackgroundTarget();
    if (!section) return;

    section.style.setProperty("background", color, "important");
    section.style.setProperty("background-color", color, "important");

    selectSection(section);
    scheduleCommit();
  }

  function handleTextColor(color: string) {
    const target = selectedElementRef.current || selectedSectionRef.current;
    if (!target) return;

    target.style.setProperty("color", color, "important");

    target
      .querySelectorAll<HTMLElement>("h1,h2,h3,h4,p,span,strong,small,a,button,li")
      .forEach((el) => el.style.setProperty("color", color, "important"));

    scheduleCommit();
  }

  function handleTextAlign(align: "left" | "center" | "right") {
    const target = selectedElementRef.current || selectedSectionRef.current;
    if (!target) return;

    target.style.setProperty("text-align", align, "important");

    target
      .querySelectorAll<HTMLElement>("h1,h2,h3,h4,p,span,strong,small,a,button,li")
      .forEach((el) => el.style.setProperty("text-align", align, "important"));

    scheduleCommit();
  }

  function resizeSelectedText(direction: "smaller" | "larger") {
    const target = selectedElementRef.current;

    if (!target) {
      alert("Clique primeiro em um texto.");
      return;
    }

    const current = Number.parseFloat(target.style.fontSize || "") || 16;
    const next = Math.max(
      10,
      Math.min(72, current + (direction === "larger" ? 2 : -2)),
    );

    target.style.setProperty("font-size", `${next}px`, "important");
    scheduleCommit();
  }

  function adjustSelectedSectionSpacing(direction: "smaller" | "larger") {
    const section = selectedSectionRef.current;

    if (!section) {
      alert("Clique primeiro em uma seção.");
      return;
    }

    const currentTop = Number.parseFloat(section.style.paddingTop || "") || 40;
    const currentBottom =
      Number.parseFloat(section.style.paddingBottom || "") || 40;
    const delta = direction === "larger" ? 16 : -16;

    const nextTop = Math.max(0, Math.min(180, currentTop + delta));
    const nextBottom = Math.max(0, Math.min(180, currentBottom + delta));

    section.style.setProperty("padding-top", `${nextTop}px`, "important");
    section.style.setProperty("padding-bottom", `${nextBottom}px`, "important");

    scheduleCommit();
  }

  function duplicateSelectedSection() {
    const section = selectedSectionRef.current;

    if (!section?.parentElement) {
      alert("Clique primeiro em uma seção.");
      return;
    }

    const clone = section.cloneNode(true) as HTMLElement;
    clone.removeAttribute("data-editor-selected");
    clone.removeAttribute("data-gc-last-selected-product-card");

    section.parentElement.insertBefore(clone, section.nextSibling);

    enableEditor(section.ownerDocument);
    selectSection(clone);
    scheduleCommit();
  }

  function removeSelectedSection() {
    const section = selectedSectionRef.current;

    if (!section?.parentElement) {
      alert("Clique primeiro em uma seção.");
      return;
    }

    const confirmed = window.confirm("Remover esta seção da página?");
    if (!confirmed) return;

    const doc = section.ownerDocument;

    section.remove();
    selectedSectionRef.current = null;
    selectedElementRef.current = null;
    selectedImageRef.current = null;

    setSelectedLabel("Clique em uma parte da página");

    enableEditor(doc);
    scheduleCommit();
  }

  function hideSelectedElement() {
    const target = selectedElementRef.current || selectedSectionRef.current;

    if (!target) {
      alert("Clique primeiro no objeto que deseja ocultar.");
      return;
    }

    target.setAttribute("data-editor-hidden", "true");
    target.style.setProperty("display", "none", "important");

    setSelectedHidden(true);
    scheduleCommit();
  }

  function showSelectedElement() {
    const doc = iframeRef.current?.contentDocument;

    const target =
      selectedElementRef.current ||
      selectedSectionRef.current ||
      doc?.querySelector<HTMLElement>("[data-editor-hidden='true']");

    if (!target) {
      alert("Nenhum objeto oculto selecionado.");
      return;
    }

    target.removeAttribute("data-editor-hidden");
    target.style.removeProperty("display");

    setSelectedHidden(false);
    selectSection(target);
    scheduleCommit();
  }

  function handleIframeLoad() {
    const doc = iframeRef.current?.contentDocument;
    if (!doc?.body) return;

    applyStoreContextAttributes(doc);
    removeOrphanElementorProductDetailSections(doc);
    hydrateProductSlots(doc, true);
    normalizeProductActions(doc);
    enableEditor(doc);
    scheduleCommit();
  }

  function goBackToDashboard() {
    window.location.href = "http://localhost:5173/dashboard-empreendedor?tab=3";
  }

  function startToolbarDrag(event: ReactMouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;

    if (target.closest("button,input,select,textarea,label")) return;

    const toolbar = toolbarRef.current;
    const rect = toolbar?.getBoundingClientRect();

    if (!rect) return;

    dragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    event.preventDefault();
    event.stopPropagation();

    setDragging(true);
  }

  return (
    <div className="relative h-full flex-1 bg-slate-900">
      <div
        ref={toolbarRef}
        data-gc-floating-toolbar="true"
        className="fixed z-50 w-[280px] overflow-hidden rounded-2xl bg-white/95 shadow-2xl ring-1 ring-black/10 backdrop-blur"
        style={{ left: toolbarPos.x, top: toolbarPos.y }}
      >
        <div
          onMouseDown={startToolbarDrag}
          className="flex cursor-move items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 select-none"
        >
          <div className="min-w-0">
            <strong className="block text-sm font-black text-slate-800">
              Editor visual
            </strong>
            <span className="mt-1 block text-[10px] font-semibold leading-snug text-slate-500">
              {selectedLabel}
            </span>
            <span className="mt-1 block text-[10px] font-bold text-blue-600">
              Arraste por esta barra
            </span>
          </div>

          <div className="flex shrink-0 flex-col gap-2">
            <button
              type="button"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={goBackToDashboard}
              className="rounded-lg bg-blue-600 px-2 py-1 text-xs font-black text-white hover:bg-blue-700"
              title="Voltar para o dashboard empreendedor"
            >
              Voltar
            </button>

            <button
              type="button"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={() => setToolbarCollapsed((current) => !current)}
              className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-black text-slate-700 hover:bg-slate-200"
              title={toolbarCollapsed ? "Abrir menu" : "Fechar menu"}
            >
              {toolbarCollapsed ? "Abrir" : "Fechar"}
            </button>
          </div>
        </div>

        {!toolbarCollapsed && (
          <div
            className="max-h-[78vh] space-y-3 overflow-y-auto p-3 cursor-default"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <strong className="block text-xs font-black text-slate-800">
                Imagem
              </strong>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    selectedImageTargetRef.current = "image";
                    imageInputRef.current?.click();
                  }}
                  className="rounded-lg bg-slate-100 p-2 text-xs font-black text-slate-700 hover:bg-slate-200"
                >
                  Trocar
                </button>

                <button
                  type="button"
                  onClick={() => {
                    selectedImageTargetRef.current = "background";
                    const target = getBestBackgroundTarget();
                    backgroundTargetRef.current = target;
                    if (target) selectSection(target);
                    imageInputRef.current?.click();
                  }}
                  className="rounded-lg bg-slate-100 p-2 text-xs font-black text-slate-700 hover:bg-slate-200"
                >
                  Fundo
                </button>

                <button
                  type="button"
                  onClick={() => resizeSelectedProductImage("smaller")}
                  className="rounded-lg bg-slate-100 p-2 text-xs font-black text-slate-700 hover:bg-slate-200"
                >
                  Menor
                </button>

                <button
                  type="button"
                  onClick={() => resizeSelectedProductImage("larger")}
                  className="rounded-lg bg-slate-100 p-2 text-xs font-black text-slate-700 hover:bg-slate-200"
                >
                  Maior
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <strong className="block text-xs font-black text-slate-800">
                Cores
              </strong>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="text-[10px] font-black text-slate-500">
                  Fundo
                  <input
                    type="color"
                    title="Fundo"
                    onChange={(event) =>
                      handleBackgroundColor(event.target.value)
                    }
                    className="mt-1 h-9 w-full cursor-pointer rounded border"
                  />
                </label>

                <label className="text-[10px] font-black text-slate-500">
                  Texto
                  <input
                    type="color"
                    title="Texto"
                    onChange={(event) => handleTextColor(event.target.value)}
                    className="mt-1 h-9 w-full cursor-pointer rounded border"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <strong className="block text-xs font-black text-slate-800">
                Texto
              </strong>

              <div className="mt-2 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleTextAlign("left")}
                  className="rounded-lg bg-slate-100 p-2 text-xs font-black text-slate-700 hover:bg-slate-200"
                >
                  Esq.
                </button>

                <button
                  type="button"
                  onClick={() => handleTextAlign("center")}
                  className="rounded-lg bg-slate-100 p-2 text-xs font-black text-slate-700 hover:bg-slate-200"
                >
                  Centro
                </button>

                <button
                  type="button"
                  onClick={() => handleTextAlign("right")}
                  className="rounded-lg bg-slate-100 p-2 text-xs font-black text-slate-700 hover:bg-slate-200"
                >
                  Dir.
                </button>

                <button
                  type="button"
                  onClick={() => resizeSelectedText("smaller")}
                  className="rounded-lg bg-slate-100 p-2 text-xs font-black text-slate-700 hover:bg-slate-200"
                >
                  A-
                </button>

                <button
                  type="button"
                  onClick={() => resizeSelectedText("larger")}
                  className="rounded-lg bg-slate-100 p-2 text-xs font-black text-slate-700 hover:bg-slate-200"
                >
                  A+
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <strong className="block text-xs font-black text-slate-800">
                Seção
              </strong>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => adjustSelectedSectionSpacing("smaller")}
                  className="rounded-lg bg-slate-100 p-2 text-xs font-black text-slate-700 hover:bg-slate-200"
                >
                  Menos espaço
                </button>

                <button
                  type="button"
                  onClick={() => adjustSelectedSectionSpacing("larger")}
                  className="rounded-lg bg-slate-100 p-2 text-xs font-black text-slate-700 hover:bg-slate-200"
                >
                  Mais espaço
                </button>

                <button
                  type="button"
                  onClick={duplicateSelectedSection}
                  className="rounded-lg bg-blue-50 p-2 text-xs font-black text-blue-800 hover:bg-blue-100"
                >
                  Duplicar
                </button>

                <button
                  type="button"
                  onClick={
                    selectedHidden ? showSelectedElement : hideSelectedElement
                  }
                  className="rounded-lg bg-amber-50 p-2 text-xs font-black text-amber-800 hover:bg-amber-100"
                >
                  {selectedHidden ? "Mostrar objeto" : "Ocultar objeto"}
                </button>

                <button
                  type="button"
                  onClick={removeSelectedSection}
                  className="rounded-lg bg-red-50 p-2 text-xs font-black text-red-700 hover:bg-red-100"
                >
                  Remover
                </button>
              </div>
            </div>

            {isStorePage && (
              <button
                type="button"
                onClick={openProductPicker}
                className="w-full rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-left text-xs font-black text-emerald-900 hover:border-emerald-400"
              >
                Escolher produto do banco
              </button>
            )}
          </div>
        )}

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        <input
          ref={bgInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>

      <iframe
        ref={iframeRef}
        key={`${instanceKey}-${iframeVersion}`}
        srcDoc={prepareHtml(iframeHtml)}
        className="h-full w-full border-none"
        title="Preview"
        onLoad={handleIframeLoad}
        sandbox="allow-scripts allow-popups allow-forms allow-same-origin allow-modals"
      />

      {productPickerOpen && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-6">
          <div className="max-h-[80vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h3 className="text-lg font-black text-slate-800">
                  Escolher produto
                </h3>
                <p className="text-xs text-slate-500">
                  Clique em um produto para aplicar no card selecionado.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setProductPickerOpen(false)}
                className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-slate-700"
              >
                Fechar
              </button>
            </div>

            <div className="grid max-h-[65vh] grid-cols-1 gap-3 overflow-y-auto p-4 sm:grid-cols-2 md:grid-cols-3">
              {availableProducts.length === 0 && (
                <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                  <strong className="block text-sm text-slate-800">
                    Nenhum produto cadastrado ainda
                  </strong>
                  <p className="mt-2 text-xs text-slate-500">
                    Cadastre produtos primeiro para usar esta vitrine.
                  </p>
                </div>
              )}

              {availableProducts.map((product) => {
                const data = resolveProductData(product);

                const name =
                  product.displayName ||
                  product.name ||
                  product.nome ||
                  product.title ||
                  product.titulo ||
                  "Produto";

                const description =
                  product.displayDescription ||
                  product.description ||
                  product.descricao ||
                  product.descricao_curta ||
                  product.short_description ||
                  product.detalhes ||
                  "";

                return (
                  <button
                    type="button"
                    key={product.id}
                    onClick={() => applyProductToSelectedCard(product)}
                    className="overflow-hidden rounded-xl border bg-white text-left transition hover:border-blue-500 hover:shadow-lg"
                  >
                    <img
                      src={data.imageUrl}
                      alt={name}
                      className="h-36 w-full bg-slate-50 object-contain"
                    />

                    <div className="space-y-2 p-3">
                      <strong className="block text-sm leading-tight text-slate-800">
                        {name}
                      </strong>

                      {description ? (
                        <span className="line-clamp-2 block text-xs leading-snug text-slate-500">
                          {description}
                        </span>
                      ) : null}

                      <span
                        className="block text-xs font-black text-green-600"
                        dangerouslySetInnerHTML={{ __html: data.priceHtml }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}