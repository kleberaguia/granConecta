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

export function renderHeroMagazine(context: RenderContext): string {
  const data = resolveHeroData(context);

  const portraitPreferred =
    context.visualContext.media?.hero?.find(
      (asset) => asset.orientation === "portrait",
    )?.url;

  const primary = portraitPreferred || data.images[0] || data.image;
  const secondary = data.images.find(
    (image) => image && image !== primary,
  );

  const image = primary
    ? `<img src="${escapeAttr(primary)}" alt="${escapeAttr(data.title)}" loading="eager" decoding="async" />`
    : `<div class="gc-hero-magazine__placeholder" role="img" aria-label="${escapeAttr(data.title)}"></div>`;

  const secondaryMedia = secondary
    ? `<figure class="gc-hero-magazine__secondary">
        <img src="${escapeAttr(secondary)}" alt="${escapeAttr(context.request.businessName || data.kicker)}" loading="lazy" decoding="async" />
      </figure>`
    : "";

  return `<section class="gc-hero gc-hero-magazine gc-hero-magazine--media-plan gc-hero--dna" ${heroDnaAttrs(context)} id="hero" data-hero-composition="${escapeAttr(context.designSystem?.heroComposition || "portrait-story")}">
    <span class="gc-hero-decor gc-hero-decor--line"></span>
    <div class="gc-container gc-hero-magazine__inner">
      <div class="gc-hero-magazine__media">
        <div class="gc-hero-magazine__number">01</div>
        ${image}
        ${secondaryMedia}
        <span class="gc-hero-magazine__caption">${escapeHtml(context.request.businessName || data.kicker || "Atendimento")}</span>
      </div>

      <div class="gc-hero-magazine__copy">
        ${heroKicker(data.kicker)}
        ${heroTitle(data, context)}
        ${heroSupportingCopy(data)}
        ${heroTrust(data)}
        ${heroActions(data)}
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
