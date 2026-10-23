import type { TemplateV2Product } from "../../TemplateTypes";
import type { RenderContext } from "../renderTypes";
import { SectionVariantEngine } from "../../SectionVariantEngine";

export function renderProducts(context: RenderContext): string {
  if (context.request.pageKind === "servico") return "";

  const products = ensureProducts(context);
  const variant = SectionVariantEngine.resolve(context).products;

  switch (variant) {
    case "editorial-showcase":
      return renderEditorialShowcaseProducts(context, products);

    case "cinematic-strip":
      return renderCinematicStripProducts(context, products);

    case "commerce-grid":
      return renderCommerceGridProducts(context, products);

    case "magazine-feature":
      return renderMagazineFeatureProducts(context, products);

    case "minimal-sparse":
      return renderMinimalSparseProducts(context, products);

    case "conversion-grid":
      return renderConversionGridProducts(context, products);

    default:
      return renderBoutiqueProducts(context, products);
  }
}


function renderEditorialShowcaseProducts(
  context: RenderContext,
  products: TemplateV2Product[],
): string {
  const [featured, ...rest] = products;
  const secondary = rest.slice(0, 5);

  return renderProductSectionShell({
    context,
    style: "editorial-showcase",
    title: productSectionTitle(context),
    subtitle: "Uma curadoria apresentada com mais respiro, imagem e presença editorial.",
    content: `<div class="gc-products-editorial-showcase">
      ${featured ? `<div class="gc-products-editorial-showcase__featured">${renderFeaturedProductCard(featured)}</div>` : ""}
      <div class="gc-products-editorial-showcase__rail">
        ${secondary.map((product) => renderProductCard(product, "editorial")).join("")}
      </div>
    </div>`,
  });
}

function renderCinematicStripProducts(
  context: RenderContext,
  products: TemplateV2Product[],
): string {
  return renderProductSectionShell({
    context,
    style: "cinematic-strip",
    title: productSectionTitle(context),
    subtitle: "Destaques apresentados em uma sequência visual ampla e contínua.",
    content: `<div class="gc-products-cinematic-strip">
      ${products
        .slice(0, 8)
        .map(
          (product, index) => `<div class="gc-products-cinematic-strip__item" data-strip-index="${index + 1}">
            ${renderProductCard(product, "cinematic")}
          </div>`,
        )
        .join("")}
    </div>`,
  });
}

function renderCommerceGridProducts(
  context: RenderContext,
  products: TemplateV2Product[],
): string {
  return renderProductSectionShell({
    context,
    style: "commerce-grid",
    title: productSectionTitle(context),
    subtitle: "Produtos organizados para facilitar descoberta, comparação e compra.",
    content: `<div class="gc-products-commerce-grid">
      ${products.map((product) => renderProductCard(product, "commerce")).join("")}
    </div>`,
  });
}

function renderMagazineFeatureProducts(
  context: RenderContext,
  products: TemplateV2Product[],
): string {
  const [first, second, ...rest] = products;

  return renderProductSectionShell({
    context,
    style: "magazine-feature",
    title: productSectionTitle(context),
    subtitle: "Uma vitrine com ritmo de revista, combinando destaque e descoberta.",
    content: `<div class="gc-products-magazine-feature">
      ${first ? `<div class="gc-products-magazine-feature__lead">${renderFeaturedProductCard(first)}</div>` : ""}
      <div class="gc-products-magazine-feature__column">
        ${second ? renderProductCard(second, "magazine") : ""}
        ${rest.slice(0, 4).map((product) => renderProductCard(product, "magazine")).join("")}
      </div>
    </div>`,
  });
}

function renderMinimalSparseProducts(
  context: RenderContext,
  products: TemplateV2Product[],
): string {
  return renderProductSectionShell({
    context,
    style: "minimal-sparse",
    title: productSectionTitle(context),
    subtitle: "Uma seleção essencial, com foco no produto e menos interferência visual.",
    content: `<div class="gc-products-minimal-sparse">
      ${products
        .slice(0, 8)
        .map(
          (product, index) => `<div class="gc-products-minimal-sparse__item gc-products-minimal-sparse__item--${index % 2 === 0 ? "left" : "right"}">
            ${renderMinimalProductRow(product)}
          </div>`,
        )
        .join("")}
    </div>`,
  });
}

function renderConversionGridProducts(
  context: RenderContext,
  products: TemplateV2Product[],
): string {
  return renderProductSectionShell({
    context,
    style: "conversion-grid",
    title: "Escolha uma opção",
    subtitle: "Produtos apresentados com foco em decisão rápida e ação direta.",
    content: `<div class="gc-products-conversion-grid">
      ${products.map((product) => renderProductCard(product, "conversion")).join("")}
    </div>`,
  });
}

function renderBoutiqueProducts(
  context: RenderContext,
  products: TemplateV2Product[],
): string {
  return renderProductSectionShell({
    context,
    style: "boutique",
    title: productSectionTitle(context),
    subtitle: "Produtos selecionados para gerar desejo, compra e contato rápido.",
    content: `<div class="gc-products-grid gc-products-grid--boutique">
      ${products.map((product) => renderProductCard(product, "boutique")).join("")}
    </div>`,
  });
}

function renderCatalogProducts(
  context: RenderContext,
  products: TemplateV2Product[],
): string {
  return renderProductSectionShell({
    context,
    style: "catalog",
    title: productSectionTitle(context),
    subtitle: "Catálogo organizado para escolher, comparar e comprar com praticidade.",
    content: `<div class="gc-products-grid gc-products-grid--catalog">
      ${products.map((product) => renderProductCard(product, "catalog")).join("")}
    </div>`,
  });
}

function renderBoldProducts(
  context: RenderContext,
  products: TemplateV2Product[],
): string {
  return renderProductSectionShell({
    context,
    style: "bold",
    title: "Ofertas que chamam atenção",
    subtitle: "Produtos em destaque com foco em conversão, desejo e ação imediata.",
    content: `<div class="gc-products-list gc-products-list--bold">
      ${products.map((product) => renderProductCard(product, "bold")).join("")}
    </div>`,
  });
}

function renderMagazineProducts(
  context: RenderContext,
  products: TemplateV2Product[],
): string {
  const [first, ...rest] = products;

  return renderProductSectionShell({
    context,
    style: "magazine",
    title: productSectionTitle(context),
    subtitle: "Uma vitrine editorial para apresentar produtos com mais presença visual.",
    content: `<div class="gc-products-magazine">
      ${first ? renderFeaturedProductCard(first) : ""}
      <div class="gc-products-magazine__side">
        ${rest.map((product) => renderProductCard(product, "magazine")).join("")}
      </div>
    </div>`,
  });
}

function renderMinimalProducts(
  context: RenderContext,
  products: TemplateV2Product[],
): string {
  return renderProductSectionShell({
    context,
    style: "minimal",
    title: productSectionTitle(context),
    subtitle: "Uma seleção limpa e objetiva para compra rápida.",
    content: `<div class="gc-products-minimal-list">
      ${products.map(renderMinimalProductRow).join("")}
    </div>`,
  });
}

function renderProductSectionShell(input: {
  context: RenderContext;
  style: string;
  title: string;
  subtitle: string;
  content: string;
}): string {
  return `<section class="gc-products gc-products--${escapeAttr(input.style)}" id="products" data-gc-products="true">
  <div class="gc-container">
    <div class="gc-section-heading">
      <span>${escapeHtml(input.context.visualContext.categoryName || "Loja online")}</span>
      <h2>${escapeHtml(input.title)}</h2>
      <p>${escapeHtml(input.subtitle)}</p>
    </div>

    ${input.content}
  </div>
</section>`;
}

function renderProductCard(product: TemplateV2Product, style: string): string {
  const price = Number(product.price || 0);
  const originalPrice = Number(product.originalPrice || 0);
  const hasDiscount = originalPrice > price && price > 0;
  const image = product.imageUrl || "";

  return `<article class="gc-product-card gc-product-card--${escapeAttr(style)}" data-gc-product-card="true" data-product-id="${escapeAttr(product.id)}">
  <div class="gc-product-card__image">
    <img src="${escapeAttr(image)}" alt="${escapeAttr(product.name)}" data-gc-product-image="true" />
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
          ? `<button type="button" data-action="add-to-cart" data-gc-action="add-to-cart" data-gc-add-to-cart="true" data-product-id="${escapeAttr(product.id)}" data-product-name="${escapeAttr(product.name)}" data-product-price="${escapeAttr(price)}" data-product-image="${escapeAttr(image)}">Adicionar</button>`
          : `<button type="button" data-action="open-product" data-gc-action="open-product" data-product-id="${escapeAttr(product.id)}" data-product-name="${escapeAttr(product.name)}" data-product-image="${escapeAttr(image)}">Ver detalhes</button>`
      }

      <button type="button" data-action="add-to-wishlist" data-gc-action="add-to-wishlist" data-gc-wishlist="true" data-product-id="${escapeAttr(product.id)}" data-product-name="${escapeAttr(product.name)}" data-product-image="${escapeAttr(image)}">
        Desejo
      </button>
    </div>
  </div>
</article>`;
}

function renderFeaturedProductCard(product: TemplateV2Product): string {
  const price = Number(product.price || 0);
  const image = product.imageUrl || "";

  return `<article class="gc-product-featured" data-gc-product-card="true" data-product-id="${escapeAttr(product.id)}">
  <div class="gc-product-featured__image">
    <img src="${escapeAttr(image)}" alt="${escapeAttr(product.name)}" />
  </div>

  <div class="gc-product-featured__body">
    <span>Produto destaque</span>
    <h3>${escapeHtml(product.name)}</h3>
    <p>${escapeHtml(product.description || "Produto selecionado para ganhar destaque na vitrine.")}</p>

    <div class="gc-price">
      <strong>${price > 0 ? formatPrice(price) : "Consulte"}</strong>
    </div>

    <div class="gc-card-actions">
      ${
        price > 0
          ? `<button type="button" data-action="add-to-cart" data-gc-action="add-to-cart" data-gc-add-to-cart="true" data-product-id="${escapeAttr(product.id)}" data-product-name="${escapeAttr(product.name)}" data-product-price="${escapeAttr(price)}" data-product-image="${escapeAttr(image)}">Adicionar ao carrinho</button>`
          : `<button type="button" data-action="open-product" data-gc-action="open-product" data-product-id="${escapeAttr(product.id)}">Ver detalhes</button>`
      }
      <button type="button" data-action="add-to-wishlist" data-gc-action="add-to-wishlist" data-gc-wishlist="true" data-product-id="${escapeAttr(product.id)}" data-product-name="${escapeAttr(product.name)}" data-product-image="${escapeAttr(image)}">Lista de desejo</button>
    </div>
  </div>
</article>`;
}

function renderMinimalProductRow(product: TemplateV2Product): string {
  const price = Number(product.price || 0);
  const image = product.imageUrl || "";

  return `<article class="gc-product-row" data-gc-product-card="true" data-product-id="${escapeAttr(product.id)}">
  <img src="${escapeAttr(image)}" alt="${escapeAttr(product.name)}" />

  <div>
    <h3>${escapeHtml(product.name)}</h3>
    <p>${escapeHtml(product.description || "Produto selecionado da loja.")}</p>
  </div>

  <strong>${price > 0 ? formatPrice(price) : "Consulte"}</strong>

  <div class="gc-product-row__actions">
    ${
      price > 0
        ? `<button type="button" data-action="add-to-cart" data-gc-action="add-to-cart" data-gc-add-to-cart="true" data-product-id="${escapeAttr(product.id)}" data-product-name="${escapeAttr(product.name)}" data-product-price="${escapeAttr(price)}" data-product-image="${escapeAttr(image)}">Adicionar</button>`
        : `<button type="button" data-action="open-product" data-gc-action="open-product" data-product-id="${escapeAttr(product.id)}">Detalhes</button>`
    }
    <button type="button" data-action="add-to-wishlist" data-gc-action="add-to-wishlist" data-gc-wishlist="true" data-product-id="${escapeAttr(product.id)}" data-product-name="${escapeAttr(product.name)}" data-product-image="${escapeAttr(image)}">Desejo</button>
  </div>
</article>`;
}

function ensureProducts(context: RenderContext): TemplateV2Product[] {
  const products = context.request.products || [];

  if (products.length) {
    return products.slice(0, 12).map((product, index) => ({
      ...product,
      id: product.id || `product-${index + 1}`,
      name: product.name || defaultProductName(context, index + 1),
      description:
        product.description || defaultProductDescription(context),
      imageUrl:
        product.imageUrl ||
        productMedia(context, index) ||
        context.visualContext.defaultProductImage ||
        context.visualContext.categoryImage ||
        context.visualContext.heroImage ||
        "",
    }));
  }

  return [1, 2, 3].map((index) => ({
    id: `placeholder-${index}`,
    name: defaultProductName(context, index),
    description: defaultProductDescription(context),
    price: 0,
    imageUrl:
      productMedia(context, index - 1) ||
      context.visualContext.defaultProductImage ||
      context.visualContext.categoryImage ||
      context.visualContext.heroImage ||
      "",
  }));
}

function productMedia(context: RenderContext, index: number): string {
  const pool = context.visualContext.media?.products || [];
  if (!pool.length) return "";
  return pool[Math.abs(index) % pool.length]?.url || "";
}

function productSectionTitle(context: RenderContext): string {
  const themeName = context.visualContext.themeName || "";

  if (themeName.includes("food")) return "Cardápio em destaque";
  if (themeName.includes("fashion")) return "Coleção em destaque";
  if (themeName.includes("auto")) return "Peças e acessórios em destaque";
  if (themeName.includes("drink")) return "Seleção especial";
  if (themeName.includes("pet")) return "Produtos para seu pet";

  return "Vitrine de produtos";
}

function defaultProductName(context: RenderContext, index: number): string {
  const themeName = context.visualContext.themeName || "";

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

  if (themeName.includes("pet")) {
    return ["Produto pet", "Item especial", "Favorito do pet"][index - 1] || "Produto pet";
  }

  return ["Produto destaque", "Produto especial", "Produto favorito"][index - 1] || "Produto especial";
}

function defaultProductDescription(context: RenderContext): string {
  const themeName = context.visualContext.themeName || "";

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

  if (themeName.includes("pet")) {
    return "Produto selecionado para cuidado, diversão ou bem-estar do seu pet.";
  }

  return "Produto selecionado da loja.";
}

function formatPrice(value: number): string {
  const price = Number(value || 0);

  if (!price) return "Consulte";

  return price.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
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