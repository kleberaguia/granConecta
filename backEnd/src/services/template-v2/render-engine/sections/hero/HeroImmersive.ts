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

export function renderHeroImmersive(context: RenderContext): string {
  const data = resolveHeroData(context);
  const image = resolveImmersiveImage(context) || data.image;

  if (!image) {
    // Sem uma capa real, mantém a arquitetura existente em vez de produzir
    // um full-bleed artificial.
    return "";
  }

  return `<section
    class="gc-hero gc-hero-immersive gc-hero--dna" ${heroDnaAttrs(context)}
    data-hero-composition="${escapeAttr(context.designSystem?.heroComposition || "cinematic-cover")}"
    id="hero"
    style="--gc-immersive-image:url('${escapeCssUrl(image)}')"
  >
    <div class="gc-hero-immersive__scrim"></div>
    <div class="gc-container gc-hero-immersive__inner">
      <div class="gc-hero-immersive__content">
        ${heroKicker(data.kicker)}
        ${heroTitle(data, context)}
        ${heroSupportingCopy(data)}
        ${heroActions(data)}
        ${heroTrust(data)}
      </div>
    </div>
  </section>`;
}

function resolveImmersiveImage(context: RenderContext): string {
  const hero = context.visualContext.media?.hero || [];

  const explicit = hero.find((asset) => {
    const placement = String(asset.placement || "").toUpperCase();
    return (
      ["HERO", "COVER", "CAPA", "HERO_IMAGE", "HERO-LANDSCAPE"].includes(placement) &&
      isWideEnough(asset.aspectRatio, asset.orientation)
    );
  });

  if (explicit?.url) return explicit.url;

  const landscape = hero.find((asset) =>
    isWideEnough(asset.aspectRatio, asset.orientation),
  );

  return landscape?.url || "";
}

function isWideEnough(
  aspectRatio?: number,
  orientation?: string,
): boolean {
  if (Number(aspectRatio) >= 1.45) return true;
  return String(orientation || "").toLowerCase() === "landscape";
}

function escapeCssUrl(value: string): string {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'");
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
