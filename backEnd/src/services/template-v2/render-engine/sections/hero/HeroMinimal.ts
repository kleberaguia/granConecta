import type { RenderContext } from "../../renderTypes";
import {
  escapeAttr,
  heroActions,
  heroKicker,
  heroSupportingCopy,
  heroTitle,
  heroTrust,
  resolveHeroData,
} from "./HeroShared";

export function renderHeroMinimal(context: RenderContext): string {
  const data = resolveHeroData(context);

  const cleanLandscape =
    context.visualContext.media?.hero?.find(
      (asset) => asset.orientation === "landscape",
    )?.url;

  const image = cleanLandscape || data.images[0] || data.image;

  const media = image
    ? `<div class="gc-hero-minimal__media">
        <img src="${escapeAttr(image)}" alt="${escapeAttr(data.title)}" loading="eager" decoding="async" />
      </div>`
    : "";

  return `<section class="gc-hero gc-hero-minimal gc-hero-minimal--media-plan gc-hero--dna" ${heroDnaAttrs(context)} id="hero" data-hero-composition="${escapeAttr(context.designSystem?.heroComposition || "minimal-stage")}">
    <div class="gc-container gc-hero-minimal__inner">
      ${heroKicker(data.kicker)}
      ${heroTitle(data, context)}
      ${heroSupportingCopy(data)}
      ${heroActions(data)}
      ${heroTrust(data)}
      ${media}
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
