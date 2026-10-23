import type { RenderContext } from "./render-engine/renderTypes";

export type PageArchetype =
  | "LUXURY_EDITORIAL"
  | "CINEMATIC_STORY"
  | "BOUTIQUE_COMMERCE"
  | "MAGAZINE_STORY"
  | "MINIMAL_PREMIUM"
  | "MODERN_CONVERSION";

export type PageHeroStructure =
  | "ASYMMETRIC_OVERLAP"
  | "EDITORIAL_SPLIT"
  | "CINEMATIC_COVER"
  | "BOTTOM_LEFT_COVER"
  | "MAGAZINE_OVERLAP"
  | "PORTRAIT_STAGE"
  | "MINIMAL_STAGE"
  | "PRODUCT_COLLAGE";

export type PageProductLayout =
  | "EDITORIAL_GRID"
  | "COMMERCE_GRID"
  | "FEATURED_STRIP"
  | "MAGAZINE_CARDS"
  | "MINIMAL_GRID"
  | "CONVERSION_GRID"
  | "PRODUCT_STORY";

export type PageAboutLayout =
  | "IMAGE_LEFT"
  | "IMAGE_RIGHT"
  | "FULL_BLEED_STORY"
  | "EDITORIAL_OVERLAP"
  | "MINIMAL_CENTER"
  | "METRICS_SPLIT";

export type PageGalleryLayout =
  | "MASONRY"
  | "CINEMATIC"
  | "EDITORIAL_COLLAGE"
  | "CLEAN_GRID"
  | "PRODUCT_STORY"
  | "MINIMAL";

export type PageCtaLayout =
  | "EDITORIAL_BANNER"
  | "CINEMATIC_OVERLAY"
  | "COMMERCE_PANEL"
  | "MAGAZINE_BLOCK"
  | "MINIMAL_INLINE"
  | "CONVERSION_PANEL";

export type PageFooterLayout =
  | "EDITORIAL_LARGE"
  | "CINEMATIC_DARK"
  | "COMMERCE_COMPACT"
  | "MAGAZINE_COLUMNS"
  | "MINIMAL"
  | "INSTITUTIONAL";

export type PageSpacingRhythm =
  | "AIRY"
  | "EDITORIAL"
  | "CINEMATIC"
  | "COMMERCE"
  | "STORYTELLING"
  | "CONVERSION";

export type PageContentWidth =
  | "NARROW"
  | "BALANCED"
  | "WIDE"
  | "FULL_BLEED";

export type PageArchetypePlan = {
  archetype: PageArchetype;
  variationIndex: number;
  businessSeed: number;
  variationSeed: number;
  heroStructure: PageHeroStructure;
  sectionOrder: string[];
  productLayout: PageProductLayout;
  aboutLayout: PageAboutLayout;
  galleryLayout: PageGalleryLayout;
  ctaLayout: PageCtaLayout;
  footerLayout: PageFooterLayout;
  spacingRhythm: PageSpacingRhythm;
  contentWidth: PageContentWidth;
  cardStyle: string;
  navigationStyle: string;
  label: string;
};

type ArchetypeProfile = {
  heroStructures: readonly PageHeroStructure[];
  sectionOrders: readonly string[][];
  productLayouts: readonly PageProductLayout[];
  aboutLayouts: readonly PageAboutLayout[];
  galleryLayouts: readonly PageGalleryLayout[];
  ctaLayouts: readonly PageCtaLayout[];
  footerLayouts: readonly PageFooterLayout[];
  spacingRhythms: readonly PageSpacingRhythm[];
  contentWidths: readonly PageContentWidth[];
  cardStyles: readonly string[];
  navigationStyles: readonly string[];
};

const ALL_ARCHETYPES: readonly PageArchetype[] = [
  "LUXURY_EDITORIAL",
  "CINEMATIC_STORY",
  "BOUTIQUE_COMMERCE",
  "MAGAZINE_STORY",
  "MINIMAL_PREMIUM",
  "MODERN_CONVERSION",
];

const PROFILES: Record<PageArchetype, ArchetypeProfile> = {
  LUXURY_EDITORIAL: {
    heroStructures: ["ASYMMETRIC_OVERLAP", "EDITORIAL_SPLIT", "PORTRAIT_STAGE"],
    sectionOrders: [
      ["topbar", "header", "hero", "featured", "collections", "about", "gallery", "benefits", "testimonials", "faq", "final-cta", "footer"],
      ["header", "hero", "categories", "featured", "about", "collections", "gallery", "social", "faq", "final-cta", "footer"],
    ],
    productLayouts: ["EDITORIAL_GRID", "MAGAZINE_CARDS"],
    aboutLayouts: ["IMAGE_RIGHT", "EDITORIAL_OVERLAP"],
    galleryLayouts: ["EDITORIAL_COLLAGE", "MASONRY"],
    ctaLayouts: ["EDITORIAL_BANNER", "MAGAZINE_BLOCK"],
    footerLayouts: ["EDITORIAL_LARGE", "MAGAZINE_COLUMNS"],
    spacingRhythms: ["AIRY", "EDITORIAL"],
    contentWidths: ["WIDE", "BALANCED"],
    cardStyles: ["borderless-editorial", "minimal-line"],
    navigationStyles: ["minimal", "editorial", "transparent"],
  },

  CINEMATIC_STORY: {
    heroStructures: ["CINEMATIC_COVER", "BOTTOM_LEFT_COVER", "MAGAZINE_OVERLAP"],
    sectionOrders: [
      ["header", "hero", "about", "featured", "gallery", "how-it-works", "benefits", "testimonials", "final-cta", "footer"],
      ["header", "hero", "gallery", "about", "collections", "featured", "social", "contact", "final-cta", "footer"],
    ],
    productLayouts: ["FEATURED_STRIP", "MAGAZINE_CARDS"],
    aboutLayouts: ["FULL_BLEED_STORY", "IMAGE_LEFT"],
    galleryLayouts: ["CINEMATIC", "EDITORIAL_COLLAGE"],
    ctaLayouts: ["CINEMATIC_OVERLAY", "EDITORIAL_BANNER"],
    footerLayouts: ["CINEMATIC_DARK", "EDITORIAL_LARGE"],
    spacingRhythms: ["CINEMATIC", "STORYTELLING"],
    contentWidths: ["FULL_BLEED", "WIDE"],
    cardStyles: ["glass", "borderless-editorial"],
    navigationStyles: ["transparent", "minimal"],
  },

  BOUTIQUE_COMMERCE: {
    heroStructures: ["PRODUCT_COLLAGE", "EDITORIAL_SPLIT", "MINIMAL_STAGE"],
    sectionOrders: [
      ["topbar", "header", "hero", "categories", "featured", "offers", "collections", "benefits", "social", "newsletter", "footer"],
      ["header", "hero", "featured", "categories", "collections", "offers", "gallery", "benefits", "final-cta", "footer"],
    ],
    productLayouts: ["COMMERCE_GRID", "PRODUCT_STORY"],
    aboutLayouts: ["IMAGE_LEFT", "MINIMAL_CENTER"],
    galleryLayouts: ["PRODUCT_STORY", "CLEAN_GRID"],
    ctaLayouts: ["COMMERCE_PANEL", "EDITORIAL_BANNER"],
    footerLayouts: ["COMMERCE_COMPACT", "INSTITUTIONAL"],
    spacingRhythms: ["COMMERCE", "AIRY"],
    contentWidths: ["WIDE", "BALANCED"],
    cardStyles: ["soft-elevated", "glass", "sharp-grid"],
    navigationStyles: ["floating", "minimal"],
  },

  MAGAZINE_STORY: {
    heroStructures: ["MAGAZINE_OVERLAP", "PORTRAIT_STAGE", "ASYMMETRIC_OVERLAP"],
    sectionOrders: [
      ["header", "hero", "about", "featured", "collections", "gallery", "testimonials", "social", "final-cta", "footer"],
      ["topbar", "header", "hero", "featured", "about", "gallery", "how-it-works", "faq", "contact", "footer"],
    ],
    productLayouts: ["MAGAZINE_CARDS", "EDITORIAL_GRID"],
    aboutLayouts: ["EDITORIAL_OVERLAP", "IMAGE_RIGHT"],
    galleryLayouts: ["MASONRY", "EDITORIAL_COLLAGE"],
    ctaLayouts: ["MAGAZINE_BLOCK", "EDITORIAL_BANNER"],
    footerLayouts: ["MAGAZINE_COLUMNS", "EDITORIAL_LARGE"],
    spacingRhythms: ["STORYTELLING", "EDITORIAL"],
    contentWidths: ["BALANCED", "WIDE"],
    cardStyles: ["borderless-editorial", "sharp-grid"],
    navigationStyles: ["editorial", "minimal"],
  },

  MINIMAL_PREMIUM: {
    heroStructures: ["MINIMAL_STAGE", "EDITORIAL_SPLIT", "PORTRAIT_STAGE"],
    sectionOrders: [
      ["header", "hero", "featured", "about", "benefits", "gallery", "faq", "contact", "footer"],
      ["header", "hero", "collections", "featured", "about", "how-it-works", "final-cta", "footer"],
    ],
    productLayouts: ["MINIMAL_GRID", "EDITORIAL_GRID"],
    aboutLayouts: ["MINIMAL_CENTER", "IMAGE_LEFT"],
    galleryLayouts: ["MINIMAL", "CLEAN_GRID"],
    ctaLayouts: ["MINIMAL_INLINE", "EDITORIAL_BANNER"],
    footerLayouts: ["MINIMAL", "INSTITUTIONAL"],
    spacingRhythms: ["AIRY", "EDITORIAL"],
    contentWidths: ["BALANCED", "NARROW"],
    cardStyles: ["minimal-line", "borderless-editorial"],
    navigationStyles: ["minimal", "transparent"],
  },

  MODERN_CONVERSION: {
    heroStructures: ["CINEMATIC_COVER", "EDITORIAL_SPLIT", "PRODUCT_COLLAGE"],
    sectionOrders: [
      ["topbar", "header", "hero", "benefits", "featured", "how-it-works", "testimonials", "faq", "contact", "final-cta", "footer"],
      ["header", "hero", "featured", "benefits", "offers", "how-it-works", "about", "faq", "final-cta", "footer"],
    ],
    productLayouts: ["CONVERSION_GRID", "COMMERCE_GRID"],
    aboutLayouts: ["METRICS_SPLIT", "IMAGE_RIGHT"],
    galleryLayouts: ["CLEAN_GRID", "PRODUCT_STORY"],
    ctaLayouts: ["CONVERSION_PANEL", "COMMERCE_PANEL"],
    footerLayouts: ["INSTITUTIONAL", "COMMERCE_COMPACT"],
    spacingRhythms: ["CONVERSION", "COMMERCE"],
    contentWidths: ["WIDE", "BALANCED"],
    cardStyles: ["soft-elevated", "sharp-grid", "glass"],
    navigationStyles: ["floating", "minimal"],
  },
};

export class PageArchetypeResolver {
  static resolve(context: RenderContext): PageArchetypePlan {
    const request = context.request as any;
    const variationIndex = normalizeVariationIndex(
      context.variation?.variationIndex ?? context.request?.variationIndex ?? 0,
    );

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

    const businessSeed = hash(businessKey);

    const semantic = normalize([
      context.request.businessSegment,
      context.visualContext?.categoryName,
      context.request.descricao,
    ].filter(Boolean).join(" "));

    const eligibleArchetypes = resolveEligibleArchetypes(
      semantic,
      context.request.pageKind,
    );

    // As primeiras 5 variações usam macroarquiteturas diferentes.
    // O seed do negócio só rotaciona a ordem para que empresas do mesmo nicho
    // não recebam sempre a mesma sequência de variações.
    const orderedArchetypes = rotate(
      eligibleArchetypes,
      businessSeed % eligibleArchetypes.length,
    );

    const archetype =
      orderedArchetypes[variationIndex % orderedArchetypes.length] ??
      orderedArchetypes[0] ??
      "LUXURY_EDITORIAL";

    const variationSeed = hash(
      `${businessKey}|page-archetype|${variationIndex}|${archetype}`,
    );

    const profile = PROFILES[archetype];

    return {
      archetype,
      variationIndex,
      businessSeed,
      variationSeed,
      heroStructure: pick(profile.heroStructures, variationSeed, 1),
      sectionOrder: [...pick(profile.sectionOrders, variationSeed, 2)],
      productLayout: pick(profile.productLayouts, variationSeed, 3),
      aboutLayout: pick(profile.aboutLayouts, variationSeed, 4),
      galleryLayout: pick(profile.galleryLayouts, variationSeed, 5),
      ctaLayout: pick(profile.ctaLayouts, variationSeed, 6),
      footerLayout: pick(profile.footerLayouts, variationSeed, 7),
      spacingRhythm: pick(profile.spacingRhythms, variationSeed, 8),
      contentWidth: pick(profile.contentWidths, variationSeed, 9),
      cardStyle: pick(profile.cardStyles, variationSeed, 10),
      navigationStyle: pick(profile.navigationStyles, variationSeed, 11),
      label: `${humanizeArchetype(archetype)} · Variação ${variationIndex + 1}`,
    };
  }

  static resolveFive(context: RenderContext): PageArchetypePlan[] {
    return [0, 1, 2, 3, 4].map((variationIndex) =>
      this.resolve({
        ...context,
        variation: {
          ...context.variation,
          variationIndex,
        },
      }),
    );
  }
}

function resolveEligibleArchetypes(
  semantic: string,
  pageKind: string,
): PageArchetype[] {
  if (pageKind === "servico") {
    if (/(psicopedagog|psicolog|terapia|saude|saúde|consulta|educa|mentoria|aula|fono|nutri|estetica|estética)/.test(semantic)) {
      return [
        "MINIMAL_PREMIUM",
        "MAGAZINE_STORY",
        "CINEMATIC_STORY",
        "MODERN_CONVERSION",
        "LUXURY_EDITORIAL",
      ];
    }

    return [
      "MODERN_CONVERSION",
      "CINEMATIC_STORY",
      "MAGAZINE_STORY",
      "MINIMAL_PREMIUM",
      "LUXURY_EDITORIAL",
    ];
  }

  if (/(joia|semijoia|terco|terço|religios|catolic|católic|devoc|sagrado|boutique|artesan)/.test(semantic)) {
    return [
      "LUXURY_EDITORIAL",
      "CINEMATIC_STORY",
      "BOUTIQUE_COMMERCE",
      "MAGAZINE_STORY",
      "MINIMAL_PREMIUM",
    ];
  }

  if (/(comida|lanche|hamburg|pizza|doce|bolo|acai|açaí|bebida|cardapio|cardápio)/.test(semantic)) {
    return [
      "BOUTIQUE_COMMERCE",
      "MODERN_CONVERSION",
      "CINEMATIC_STORY",
      "MAGAZINE_STORY",
      "MINIMAL_PREMIUM",
    ];
  }

  if (/(academ|fitness|treino|crossfit|esport)/.test(semantic)) {
    return [
      "MODERN_CONVERSION",
      "CINEMATIC_STORY",
      "MAGAZINE_STORY",
      "MINIMAL_PREMIUM",
      "BOUTIQUE_COMMERCE",
    ];
  }

  if (/(imovel|imóvel|arquitet|construtor|decoracao|decoração)/.test(semantic)) {
    return [
      "CINEMATIC_STORY",
      "LUXURY_EDITORIAL",
      "MAGAZINE_STORY",
      "MINIMAL_PREMIUM",
      "MODERN_CONVERSION",
    ];
  }

  return [...ALL_ARCHETYPES];
}

function normalizeVariationIndex(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.trunc(parsed));
}

function rotate<T>(items: readonly T[], offset: number): T[] {
  if (!items.length) return [];
  const safeOffset = ((offset % items.length) + items.length) % items.length;
  return [...items.slice(safeOffset), ...items.slice(0, safeOffset)];
}

function pick<T>(items: readonly T[], seed: number, salt: number): T {
  const mixed = Math.abs((seed ^ Math.imul(salt + 29, 2654435761)) | 0);
  return items[mixed % items.length]!;
}

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function normalize(value: string): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function humanizeArchetype(value: PageArchetype): string {
  switch (value) {
    case "LUXURY_EDITORIAL": return "Luxury Editorial";
    case "CINEMATIC_STORY": return "Cinematic Story";
    case "BOUTIQUE_COMMERCE": return "Boutique Commerce";
    case "MAGAZINE_STORY": return "Magazine Story";
    case "MINIMAL_PREMIUM": return "Minimal Premium";
    case "MODERN_CONVERSION": return "Modern Conversion";
    default: return value;
  }
}
