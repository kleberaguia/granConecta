import type { RenderContext } from "../../renderTypes";
import {
  escapeAttr,
  heroActions,
  heroKicker,
  heroSupportingCopy,
  heroTitle,
  resolveHeroData,
} from "./HeroShared";

export function renderHeroFood(context: RenderContext): string {
  const data = resolveHeroData(context);

  return `<section class="gc-hero gc-hero-food gc-hero--dna" ${heroDnaAttrs(context)} id="hero">
  <div class="gc-container gc-hero-food__inner">
    <div class="gc-hero-food__copy">
      ${heroKicker(data.kicker)}
      ${heroTitle(data, context)}
      ${heroSupportingCopy(data)}
      ${heroActions(data)}

      <div class="gc-hero-food__badges">
        <span>🔥 Combos</span>
        <span>🍔 Favoritos</span>
        <span>⚡ Pedido rápido</span>
      </div>
    </div>

    <div class="gc-hero-food__media">
      <div class="gc-hero-food__offer">Oferta especial</div>
      <img src="${escapeAttr(data.image)}" alt="${escapeAttr(data.title)}" />
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
