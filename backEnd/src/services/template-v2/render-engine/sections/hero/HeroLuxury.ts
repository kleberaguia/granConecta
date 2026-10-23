import type { RenderContext } from "../../renderTypes";
import {
  escapeAttr,
  escapeHtml,
  heroActions,
  heroKicker,
  heroSupportingCopy,
  heroTitle,
  heroTrust,
  resolveHeroData,
} from "./HeroShared";

export function renderHeroLuxury(context: RenderContext): string {
  const data = resolveHeroData(context);
  const primary = data.images[0] || data.image;
  const secondary = data.images.find((image) => image && image !== primary);

  const primaryMedia = primary
    ? `<img src="${escapeAttr(primary)}" alt="${escapeAttr(data.title)}" loading="eager" decoding="async" />`
    : `<div class="gc-hero-luxury__placeholder" role="img" aria-label="${escapeAttr(data.title)}"></div>`;

  const secondaryMedia = secondary
    ? `<div class="gc-hero-luxury__secondary">
        <img src="${escapeAttr(secondary)}" alt="${escapeAttr(context.request.businessName || data.kicker)}" loading="lazy" decoding="async" />
      </div>`
    : "";

  return `<section class="gc-hero gc-hero-luxury gc-hero-luxury--media-plan gc-hero--dna" ${heroDnaAttrs(context)} id="hero" data-hero-composition="${escapeAttr(context.designSystem?.heroComposition || "editorial-overlap")}">
    <span class="gc-hero-decor gc-hero-decor--orb"></span>
    <span class="gc-hero-decor gc-hero-decor--line"></span>
    <div class="gc-container gc-hero-luxury__inner">
      <div class="gc-hero-luxury__copy">
        ${heroKicker(data.kicker)}
        ${heroTitle(data, context)}
        ${heroSupportingCopy(data)}
        ${heroTrust(data)}
        ${heroActions(data)}
      </div>

      <div class="gc-hero-luxury__media">
        <div class="gc-hero-luxury__frame">${primaryMedia}</div>
        ${secondaryMedia}
        <div class="gc-hero-luxury__signature">
          <span>${escapeHtml(context.request.businessName || data.kicker)}</span>
          <small>${data.isService ? "Atendimento profissional" : "Seleção especial"}</small>
        </div>
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
