import type { RenderContext } from "../../renderTypes";
import {
  escapeAttr,
  escapeHtml,
  familyVariant,
  getSectionVariant,
  sectionHeading,
} from "../SectionLibraryShared";

export function renderOffersByContext(context: RenderContext): string {
  if (context.request.pageKind !== "loja") return "";

  const discounted = context.request.products.filter((product) => {
    const price = Number(product.price || 0);
    const original = Number(product.originalPrice || 0);
    return price > 0 && original > price;
  });

  const explicitOffers = Array.isArray(context.request.raw?.offers)
    ? context.request.raw.offers
    : Array.isArray(context.request.raw?.ofertas)
      ? context.request.raw.ofertas
      : [];

  if (!discounted.length && !explicitOffers.length) return "";

  const fallback = familyVariant(context, {
    "luxury-editorial": "editorial",
    "marketplace-grid": "grid",
    "conversion-sales": "impact",
    "magazine-story": "story",
    "minimal-premium": "minimal",
  }, "grid");
  const variant = getSectionVariant(context, "offers", fallback);

  const offers = discounted.slice(0, 4).map((product) => ({
    id: product.id,
    title: product.name,
    image: product.imageUrl || "",
    price: Number(product.price || 0),
    original: Number(product.originalPrice || 0),
  }));

  return `<section class="gc-offers gc-offers--${variant}" id="offers">
    <div class="gc-container">
      ${sectionHeading("Ofertas", "Oportunidades em destaque")}
      <div class="gc-offers-grid">
        ${offers.map((item) => `<article class="gc-offer-card" data-product-id="${escapeAttr(item.id)}">
          ${item.image ? `<img src="${escapeAttr(item.image)}" alt="${escapeAttr(item.title)}" loading="lazy" />` : ""}
          <div><span>Oferta</span><h3>${escapeHtml(item.title)}</h3><small>${formatPrice(item.original)}</small><strong>${formatPrice(item.price)}</strong>
          <button type="button" data-gc-action="open-product" data-product-id="${escapeAttr(item.id)}">Ver oferta</button></div>
        </article>`).join("")}
      </div>
    </div>
  </section>`;
}

function formatPrice(value: number): string {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
