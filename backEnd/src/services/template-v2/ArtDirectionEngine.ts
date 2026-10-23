import type { RenderContext } from "./render-engine/renderTypes";
import type { PageArchetypePlan } from "./PageArchetypeResolver";
import type { VisualDNA } from "./design-system/VisualDNAEngine";

export type ArtDirectionLevel = "STANDARD" | "HIGH_IMPACT";
export type HighImpactDirection = "EDITORIAL_LUXURY" | "CINEMATIC";

export type ArtDirectionPlan = {
  level: ArtDirectionLevel;
  direction: HighImpactDirection | "STANDARD";
  seed: number;
  heroScale: "STANDARD" | "MONUMENTAL";
  heroHeight: "STANDARD" | "FULL_VIEWPORT";
  headlineScale: "STANDARD" | "EXTREME";
  headlineOverlap: boolean;
  imageComposition: "STANDARD" | "OVERLAP" | "FULL_BLEED";
  imageCount: 1 | 2 | 3;
  sectionTransition: "STANDARD" | "OVERLAP";
  sectionBleed: boolean;
  featuredProductMode: "STANDARD" | "CAMPAIGN";
  whitespace: "STANDARD" | "DRAMATIC";
  gridBreak: boolean;
  decorativeTypography: boolean;
  label: string;
};

export class ArtDirectionEngine {
  static resolve(
    context: RenderContext,
    pageArchetype: PageArchetypePlan,
    visualDNA: VisualDNA,
  ): ArtDirectionPlan {
    const variationIndex = Math.max(
      0,
      Math.trunc(Number(pageArchetype.variationIndex || 0)),
    );

    const request = context.request as any;
    const businessKey = [
      request.storeId,
      request.lojaId,
      request.businessId,
      request.usuarioId,
      request.raw?.storeId,
      request.raw?.lojaId,
      request.raw?.businessId,
      request.raw?.usuarioId,
      context.request.businessName,
      context.request.businessSegment,
    ].filter(Boolean).join("|") || "granconecta";

    const seed = hash(
      `${businessKey}|art-direction|${variationIndex}|${pageArchetype.archetype}`,
    );

    const eligible = resolveEligibleDirections(pageArchetype, visualDNA);

    // V1: alto impacto somente quando a macroarquitetura suporta a linguagem.
    // As demais variações permanecem STANDARD e preservam o renderer atual.
    if (!eligible.length) return standard(seed);

    const direction = eligible[seed % eligible.length]!;

    if (direction === "CINEMATIC") {
      return {
        level: "HIGH_IMPACT",
        direction,
        seed,
        heroScale: "MONUMENTAL",
        heroHeight: "FULL_VIEWPORT",
        headlineScale: "EXTREME",
        headlineOverlap: true,
        imageComposition: "FULL_BLEED",
        imageCount: resolveImageCount(context, 2),
        sectionTransition: "OVERLAP",
        sectionBleed: true,
        featuredProductMode: "CAMPAIGN",
        whitespace: "DRAMATIC",
        gridBreak: true,
        decorativeTypography: true,
        label: "High Impact · Cinematic",
      };
    }

    return {
      level: "HIGH_IMPACT",
      direction: "EDITORIAL_LUXURY",
      seed,
      heroScale: "MONUMENTAL",
      heroHeight: "FULL_VIEWPORT",
      headlineScale: "EXTREME",
      headlineOverlap: true,
      imageComposition: "OVERLAP",
      imageCount: resolveImageCount(context, 2),
      sectionTransition: "OVERLAP",
      sectionBleed: true,
      featuredProductMode: "CAMPAIGN",
      whitespace: "DRAMATIC",
      gridBreak: true,
      decorativeTypography: true,
      label: "High Impact · Editorial Luxury",
    };
  }
}

function resolveEligibleDirections(
  page: PageArchetypePlan,
  dna: VisualDNA,
): HighImpactDirection[] {
  if (page.archetype === "CINEMATIC_STORY") {
    return ["CINEMATIC"];
  }

  if (page.archetype === "LUXURY_EDITORIAL") {
    return ["EDITORIAL_LUXURY"];
  }

  // Magazine pode receber linguagem editorial de alto impacto quando
  // o próprio DNA já aponta para uma composição editorial/cinematográfica.
  if (
    page.archetype === "MAGAZINE_STORY" &&
    ["magazine-story", "luxury-editorial", "cinematic-story"].includes(dna.archetype)
  ) {
    return ["EDITORIAL_LUXURY"];
  }

  return [];
}

function resolveImageCount(context: RenderContext, preferred: 1 | 2 | 3): 1 | 2 | 3 {
  const vc = context.visualContext as any;
  const candidates = [
    ...(Array.isArray(vc?.heroImages) ? vc.heroImages : []),
    vc?.heroMedia?.primary,
    vc?.heroMedia?.secondary,
    vc?.heroMedia?.tertiary,
  ].filter(Boolean);

  if (candidates.length >= preferred) return preferred;
  if (candidates.length >= 1) return 1;
  return 1;
}

function standard(seed: number): ArtDirectionPlan {
  return {
    level: "STANDARD",
    direction: "STANDARD",
    seed,
    heroScale: "STANDARD",
    heroHeight: "STANDARD",
    headlineScale: "STANDARD",
    headlineOverlap: false,
    imageComposition: "STANDARD",
    imageCount: 1,
    sectionTransition: "STANDARD",
    sectionBleed: false,
    featuredProductMode: "STANDARD",
    whitespace: "STANDARD",
    gridBreak: false,
    decorativeTypography: false,
    label: "Standard",
  };
}

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
