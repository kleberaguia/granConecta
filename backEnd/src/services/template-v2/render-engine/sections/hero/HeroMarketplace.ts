import type { RenderContext } from "../../renderTypes";
import {
  escapeAttr,
  escapeHtml,
  heroActions,
  heroKicker,
  heroSupportingCopy,
  heroTitle,
  resolveHeroData,
} from "./HeroShared";

export function renderHeroMarketplace(context: RenderContext): string {
  const data = resolveHeroData(context);
  const products = context.request.products.slice(0, 3);

  const cards = products.length
    ? products.map((product) => ({
        name: product.name,
        image:
          product.imageUrl ||
          context.visualContext.defaultProductImage ||
          data.image,
        price:
          Number(product.price || 0) > 0
            ? Number(product.price || 0).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })
            : "Ver produto",
      }))
    : [
        {
          name: "Produto destaque",
          image: context.visualContext.defaultProductImage || data.image,
          price: "Ver produto",
        },
        {
          name: "Oferta especial",
          image: context.visualContext.defaultProductImage || data.image,
          price: "Ver oferta",
        },
        {
          name: "Mais vendido",
          image: context.visualContext.defaultProductImage || data.image,
          price: "Ver detalhes",
        },
      ];

  return `<section class="gc-hero gc-hero-marketplace gc-hero--dna" ${heroDnaAttrs(context)} id="hero" data-hero-composition="${escapeAttr(context.designSystem?.heroComposition || "catalog-dynamic")}">
  <div class="gc-container gc-hero-marketplace__inner">
    <div class="gc-hero-marketplace__copy">
      ${heroKicker(data.kicker)}
      ${heroTitle(data, context)}
      ${heroSupportingCopy(data)}
      ${heroActions(data)}
    </div>

    <div class="gc-hero-marketplace__cards">
      ${cards
        .map(
          (card) => `<button type="button" class="gc-hero-marketplace__card" data-action="open-products" data-gc-action="open-products">
        <img src="${escapeAttr(card.image || "")}" alt="${escapeAttr(card.name)}" />
        <strong>${escapeHtml(card.name)}</strong>
        <span>${escapeHtml(card.price)}</span>
      </button>`,
        )
        .join("")}
    </div>
  </div>
</section>`;
}

function heroDnaAttrs(context: RenderContext): string {
  const dna = context.visualDNA;
  if (!dna) return "";

  return [
    `data-dna-hero="${escapeAttr(dna.heroComposition)}"`,
    `data-dna-image="${escapeAttr(dna.imageTreatment)}"`,
    `data-dna-content="${escapeAttr(dna.contentPosition)}"`,
    `data-dna-headline="${escapeAttr(dna.headlineTreatment)}"`,
    `data-dna-decoration="${escapeAttr(dna.decoration)}"`,
  ].join(" ");
}
