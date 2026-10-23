import type {
  LandingCompositionArchetype,
  LandingCompositionGroup,
  LandingCompositionPlan,
  NormalizedTemplateRequest,
  TemplateSectionKey,
  TemplateVariationV2,
} from "./TemplateTypes";
import type { PageArchetypePlan } from "./PageArchetypeResolver";

type ServiceDesignBriefLike = {
  id?: string;
  layoutFamily?: string;
  hero?: { composition?: string };
  services?: { layout?: string };
  about?: { layout?: string };
  testimonials?: { layout?: string };
  finalCta?: { layout?: string };
  footer?: { layout?: string };
};

function getServiceDesignBrief(request: NormalizedTemplateRequest): ServiceDesignBriefLike | undefined {
  const raw = (request as any)?.raw || {};
  const direct =
    (request as any)?.serviceDesignBrief ||
    raw?.serviceDesignBrief ||
    raw?.selectedVariation?.serviceDesignBrief ||
    raw?.aiVariation?.serviceDesignBrief;

  if (direct && typeof direct === "object") return direct;

  const id = String(
    (request as any)?.serviceDesignBriefId ||
    raw?.serviceDesignBriefId ||
    raw?.selectedVariation?.serviceDesignBriefId ||
    raw?.aiVariation?.serviceDesignBriefId ||
    "",
  ).trim();

  return id ? { id } : undefined;
}


type LayoutBaseAiLike = {
  id?: string;
  name?: string;
  segmentFamily?: string;
  sections?: unknown;
  layout?: { sections?: unknown };
};

function getLayoutBaseAiContext(request: NormalizedTemplateRequest) {
  const raw = (request as any)?.raw || {};
  const selectedVariation =
    (request as any)?.selectedVariation ||
    raw?.selectedVariation ||
    {};
  const aiVariation =
    (request as any)?.aiVariation ||
    raw?.aiVariation ||
    {};

  const layoutBase: LayoutBaseAiLike | undefined =
    (request as any)?.layoutBase ||
    selectedVariation?.layoutBase ||
    aiVariation?.layoutBase ||
    raw?.layoutBase;

  const layoutBaseId = String(
    (request as any)?.layoutBaseId ||
      selectedVariation?.layoutBaseId ||
      aiVariation?.layoutBaseId ||
      raw?.layoutBaseId ||
      layoutBase?.id ||
      "",
  ).trim();

  const generationMode = String(
    (request as any)?.generationMode ||
      selectedVariation?.generationMode ||
      aiVariation?.generationMode ||
      raw?.generationMode ||
      "",
  ).trim();

  const variationComposition =
    (request as any)?.composition ||
    selectedVariation?.composition ||
    aiVariation?.composition ||
    raw?.composition;

  return {
    enabled:
      request.pageKind === "servico" &&
      generationMode === "layout-base-ai" &&
      Boolean(layoutBaseId),
    generationMode,
    layoutBaseId,
    layoutBase,
    selectedVariation,
    aiVariation,
    variationComposition,
  };
}

export class LandingCompositionResolver {
  static resolve(
    request: NormalizedTemplateRequest,
    variation: TemplateVariationV2,
    pageArchetype?: PageArchetypePlan,
  ): LandingCompositionPlan {
    const creative = request.creativeDirection;
    const archetype = resolveArchetype(request, variation);
    const available = resolveAvailableSections(request, variation);
    const serviceDesignBrief = request.pageKind === "servico"
      ? getServiceDesignBrief(request)
      : undefined;
    const suppressed = new Set<TemplateSectionKey>(creative?.suppressSections || []);

    const allow = (section: TemplateSectionKey): boolean =>
      available.has(section) && !suppressed.has(section);

    const pick = (sections: TemplateSectionKey[]): TemplateSectionKey[] =>
      sections.filter(allow);

    const layoutBaseAi = getLayoutBaseAiContext(request);

    const groups =
      layoutBaseAi.enabled
        ? buildLayoutBaseAiServiceGroups(request, pick, layoutBaseAi)
        : request.pageKind === "servico"
          ? buildPremiumServiceGroups(request, pageArchetype, pick, serviceDesignBrief)
          : pageArchetype
            ? buildPageArchetypeGroups(request, pageArchetype, pick)
            : buildStoreGroups(archetype, pick);

    const sectionOrder = unique(groups.flatMap((group) => group.sections));
    const missing = [...available].filter(
      (section) => !suppressed.has(section) && !sectionOrder.includes(section),
    );

    if (missing.length) {
      const footerIndex = groups.findIndex((group) => group.sections.includes("footer"));
      const extra = group(
        "supporting-content",
        "trust",
        missing.filter((section) => section !== "footer"),
        "page",
        false,
        false,
        "gc-composition__supporting",
      );

      if (extra.sections.length) {
        if (footerIndex >= 0) groups.splice(footerIndex, 0, extra);
        else groups.push(extra);
      }
    }

    return {
      archetype,
      groups: groups.filter((group) => group.sections.length > 0),
      sectionOrder: unique(groups.flatMap((group) => group.sections)),
      bodyClass:
        request.pageKind === "servico"
          ? layoutBaseAi.enabled
            ? `gc-composition gc-composition--${archetype} gc-page--service gc-service-layout-base-ai gc-service-layout-base--${slug(layoutBaseAi.layoutBaseId)} gc-service-segment--${slug(String((request as any)?.segmentFamily || layoutBaseAi.layoutBase?.segmentFamily || ""))}`
            : `gc-composition gc-composition--${archetype} gc-page--service gc-service-layout--${resolvePremiumServiceVariant(pageArchetype, serviceDesignBrief)}${pageArchetype ? ` gc-page-archetype gc-page-archetype--${pageArchetype.archetype.toLowerCase().replace(/_/g, "-")}` : ""}`
          : pageArchetype
            ? `gc-composition gc-composition--${archetype} gc-page-archetype gc-page-archetype--${pageArchetype.archetype.toLowerCase().replace(/_/g, "-")}`
            : `gc-composition gc-composition--${archetype}`,
      suppressSections: [...suppressed],
    };
  }
}

function resolveArchetype(
  request: NormalizedTemplateRequest,
  variation: TemplateVariationV2,
): LandingCompositionArchetype {
  const creative = request.creativeDirection;
  const family = variation.family;

  if (family === "marketplace-grid") return "catalog-flow";
  if (family === "conversion-sales") return "conversion-flow";
  if (family === "magazine-story") return "human-authority";
  if (family === "minimal-premium") return "editorial-signature";

  if (request.pageKind === "loja") return "commerce-showcase";

  if (creative?.archetype === "human-story") return "human-authority";
  if (creative?.archetype === "conversion-impact") return "conversion-flow";
  if (creative?.archetype === "minimal-elegant") return "editorial-signature";
  return "authority-premium";
}

function resolveAvailableSections(
  request: NormalizedTemplateRequest,
  variation: TemplateVariationV2,
): Set<TemplateSectionKey> {
  const creative = request.creativeDirection;
  const source = creative?.sectionOrder?.length
    ? creative.sectionOrder
    : variation.sectionOrder;

  const sections = new Set<TemplateSectionKey>(source);

  sections.add("header");
  sections.add("hero");
  sections.add("footer");
  sections.add("final-cta");

  if (request.businessMaterials?.some((item) => item.type === "VIDEO")) {
    sections.add("video");
  }

  const imageMaterials = request.businessMaterials?.filter((item) => item.type !== "VIDEO") || [];
  if (imageMaterials.length >= 2) {
    sections.add("gallery");
  }

  if (hasSocial(request)) {
    sections.add("social");
  }

  if (hasLocation(request)) {
    sections.add("location");
  }

  if (hasNewsletter(request)) {
    sections.add("newsletter");
  }

  if (request.pageKind === "loja") {
    sections.add("products");
    sections.add("contact");

    const categories = new Set(
      request.products
        .map((product) => String(product.categoryName || "").trim())
        .filter(Boolean),
    );

    if (categories.size >= 2) sections.add("collections");
    if (hasOffers(request)) sections.add("offers");

    if (
      variation.family === "marketplace-grid" ||
      variation.family === "conversion-sales"
    ) {
      sections.add("categories");
      sections.add("benefits");
    }

    if (
      variation.family === "luxury-editorial" ||
      variation.family === "magazine-story" ||
      variation.family === "minimal-premium"
    ) {
      sections.add("about");
    }

    if (variation.family === "conversion-sales") {
      sections.add("how-it-works");
      sections.add("faq");
    }
  } else {
    sections.add("services");
    sections.add("contact");
    sections.add("how-it-works");
    sections.add("benefits");

    if (
      variation.family === "luxury-editorial" ||
      variation.family === "magazine-story" ||
      variation.family === "minimal-premium"
    ) {
      sections.add("about");
    }

    if (variation.family === "conversion-sales") {
      sections.add("faq");
      sections.add("featured");
    }
  }

  if (hasTestimonials(request)) {
    sections.add("testimonials");
  }

  return sections;
}


/**
 * Macrocomposição V4.
 *
 * Quando PageArchetypePlan está disponível, ele passa a definir a arquitetura
 * da página inteira. Os builders antigos continuam abaixo como fallback,
 * preservando compatibilidade com chamadas legadas.
 */
function buildPageArchetypeGroups(
  request: NormalizedTemplateRequest,
  plan: PageArchetypePlan,
  pick: (sections: TemplateSectionKey[]) => TemplateSectionKey[],
): LandingCompositionGroup[] {
  const nav = group(
    "navigation",
    "navigation",
    pick(["topbar", "header"]),
    plan.navigationStyle === "transparent" ? "page" : "surface",
    false,
    true,
    `gc-composition__navigation gc-page-navigation--${slug(plan.navigationStyle)}`,
  );

  switch (plan.archetype) {
    case "LUXURY_EDITORIAL":
      return [
        nav,
        pageGroup(plan, "luxury-hero", "hero-stage", pick(["hero"]), "page", false, true),
        pageGroup(plan, "luxury-featured", "offer", pick(primaryOfferSections(request, ["featured", "products", "services"])), "soft", true, true),
        pageGroup(plan, "luxury-discovery", "offer", pick(["collections", "categories", "offers"]), "page", false, true),
        pageGroup(plan, "luxury-story", "story", pick(["about", "gallery"]), "surface", false, true),
        pageGroup(plan, "luxury-proof", "trust", pick(["benefits", "testimonials", "video"]), "page", false, true),
        pageGroup(plan, "luxury-social", "story", pick(["social", "newsletter"]), "soft", false, true),
        pageGroup(plan, "luxury-close", "conversion", pick(["contact", "final-cta"]), "brand", false, true),
        pageGroup(plan, "luxury-footer", "closing", pick(["location", "footer"]), "surface", false, true),
      ];

    case "CINEMATIC_STORY":
      return [
        nav,
        pageGroup(plan, "cinematic-hero", "hero-stage", pick(["hero"]), "contrast", false, true),
        pageGroup(plan, "cinematic-story", "story", pick(["about", "gallery"]), "page", false, true),
        pageGroup(plan, "cinematic-offer", "offer", pick(primaryOfferSections(request, ["featured", "products", "services", "collections"])), "surface", true, true),
        pageGroup(plan, "cinematic-process", "trust", pick(["how-it-works", "benefits"]), "soft", false, true),
        pageGroup(plan, "cinematic-proof", "story", pick(["video", "testimonials", "social"]), "page", false, true),
        pageGroup(plan, "cinematic-close", "conversion", pick(["faq", "contact", "final-cta"]), "contrast", false, true),
        pageGroup(plan, "cinematic-footer", "closing", pick(["location", "footer"]), "contrast", false, true),
      ];

    case "BOUTIQUE_COMMERCE":
      return [
        nav,
        pageGroup(plan, "boutique-hero", "hero-stage", pick(["hero", "categories"]), "page", false, true),
        pageGroup(plan, "boutique-featured", "offer", pick(primaryOfferSections(request, ["featured", "products", "services"])), "surface", true, true),
        pageGroup(plan, "boutique-commerce", "offer", pick(["offers", "collections"]), "soft", false, true),
        pageGroup(plan, "boutique-confidence", "trust", pick(["benefits", "how-it-works"]), "surface", false, true),
        pageGroup(plan, "boutique-media", "story", pick(["gallery", "social", "about"]), "page", false, true),
        pageGroup(plan, "boutique-conversion", "conversion", pick(["newsletter", "contact", "final-cta"]), "brand", false, true),
        pageGroup(plan, "boutique-footer", "closing", pick(["location", "footer"]), "surface", false, true),
      ];

    case "MAGAZINE_STORY":
      return [
        nav,
        pageGroup(plan, "magazine-hero", "hero-stage", pick(["hero"]), "page", false, true),
        pageGroup(plan, "magazine-story", "story", pick(["about"]), "surface", false, true),
        pageGroup(plan, "magazine-feature", "offer", pick(primaryOfferSections(request, ["featured", "products", "services"])), "page", false, true),
        pageGroup(plan, "magazine-collections", "offer", pick(["collections", "offers"]), "soft", false, true),
        pageGroup(plan, "magazine-gallery", "story", pick(["gallery", "video"]), "surface", false, true),
        pageGroup(plan, "magazine-proof", "trust", pick(["testimonials", "benefits", "how-it-works"]), "page", false, true),
        pageGroup(plan, "magazine-social", "story", pick(["social", "newsletter"]), "surface", false, true),
        pageGroup(plan, "magazine-close", "conversion", pick(["faq", "contact", "final-cta"]), "brand", false, true),
        pageGroup(plan, "magazine-footer", "closing", pick(["location", "footer"]), "surface", false, true),
      ];

    case "MINIMAL_PREMIUM":
      return [
        nav,
        pageGroup(plan, "minimal-hero", "hero-stage", pick(["hero"]), "page", false, true),
        pageGroup(plan, "minimal-offer", "offer", pick(primaryOfferSections(request, ["featured", "products", "services", "collections"])), "surface", false, true),
        pageGroup(plan, "minimal-story", "story", pick(["about"]), "page", false, true),
        pageGroup(plan, "minimal-proof", "trust", pick(["benefits", "gallery", "how-it-works"]), "surface", false, true),
        pageGroup(plan, "minimal-questions", "trust", pick(["faq", "testimonials"]), "page", false, true),
        pageGroup(plan, "minimal-close", "conversion", pick(["contact", "final-cta"]), "brand", false, true),
        pageGroup(plan, "minimal-footer", "closing", pick(["social", "location", "footer"]), "surface", false, true),
      ];

    case "MODERN_CONVERSION":
    default:
      return [
        nav,
        pageGroup(plan, "conversion-hero", "hero-stage", pick(["hero", "featured"]), "contrast", false, true),
        pageGroup(plan, "conversion-benefits", "trust", pick(["benefits"]), "surface", true, true),
        pageGroup(plan, "conversion-offer", "offer", pick(primaryOfferSections(request, ["products", "services", "offers"])), "page", false, true),
        pageGroup(plan, "conversion-process", "trust", pick(["how-it-works", "testimonials"]), "soft", false, true),
        pageGroup(plan, "conversion-story", "story", pick(["about", "gallery", "video"]), "surface", false, true),
        pageGroup(plan, "conversion-questions", "conversion", pick(["faq", "contact"]), "page", false, true),
        pageGroup(plan, "conversion-cta", "conversion", pick(["final-cta"]), "contrast", false, true),
        pageGroup(plan, "conversion-footer", "closing", pick(["social", "location", "footer"]), "contrast", false, true),
      ];
  }
}

function primaryOfferSections(
  request: NormalizedTemplateRequest,
  preferred: TemplateSectionKey[],
): TemplateSectionKey[] {
  const commercialCore: TemplateSectionKey =
    request.pageKind === "loja" ? "products" : "services";

  const result = [...preferred];
  if (!result.includes(commercialCore)) result.push(commercialCore);
  return unique(result);
}

function pageGroup(
  plan: PageArchetypePlan,
  id: string,
  kind: LandingCompositionGroup["kind"],
  sections: TemplateSectionKey[],
  surface: LandingCompositionGroup["surface"],
  overlapPrevious = false,
  continuous = false,
): LandingCompositionGroup {
  return group(
    id,
    kind,
    sections,
    surface,
    overlapPrevious,
    continuous,
    [
      `gc-page-group`,
      `gc-page-group--${slug(plan.archetype)}`,
      `gc-page-group--${slug(plan.spacingRhythm)}`,
      `gc-page-width--${slug(plan.contentWidth)}`,
      `gc-page-card--${slug(plan.cardStyle)}`,
      `gc-page-products--${slug(plan.productLayout)}`,
      `gc-page-about--${slug(plan.aboutLayout)}`,
      `gc-page-gallery--${slug(plan.galleryLayout)}`,
      `gc-page-cta--${slug(plan.ctaLayout)}`,
      `gc-page-footer--${slug(plan.footerLayout)}`,
    ].join(" "),
  );
}

function slug(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildStoreGroups(
  archetype: LandingCompositionArchetype,
  pick: (sections: TemplateSectionKey[]) => TemplateSectionKey[],
): LandingCompositionGroup[] {
  const nav = group("navigation", "navigation", pick(["topbar", "header"]), "surface", false, true, "gc-composition__navigation");

  switch (archetype) {
    case "catalog-flow":
      return [
        nav,
        group("catalog-hero", "hero-stage", pick(["hero", "categories"]), "page", false, true, "gc-composition__hero-stage"),
        group("catalog-core", "offer", pick(["collections", "products", "offers"]), "soft", true, true, "gc-composition__catalog-stage"),
        group("commerce-confidence", "trust", pick(["benefits", "how-it-works"]), "surface", false, true, "gc-composition__trust-stage"),
        group("commerce-social", "story", pick(["gallery", "social"]), "page", false, true, "gc-composition__story-stage"),
        group("commerce-conversion", "conversion", pick(["newsletter", "contact", "final-cta"]), "brand", false, true, "gc-composition__conversion-stage"),
        group("commerce-location", "closing", pick(["location", "footer"]), "surface", false, true, "gc-composition__closing"),
      ];

    case "conversion-flow":
      return [
        nav,
        group("conversion-hero", "hero-stage", pick(["hero", "featured"]), "contrast", false, true, "gc-composition__hero-stage"),
        group("conversion-products", "offer", pick(["offers", "products"]), "surface", true, true, "gc-composition__offer-bridge"),
        group("conversion-process", "trust", pick(["benefits", "how-it-works", "testimonials"]), "soft", false, true, "gc-composition__trust-stage"),
        group("conversion-media", "story", pick(["gallery", "video"]), "page", false, true, "gc-composition__story-stage"),
        group("conversion-close", "conversion", pick(["faq", "social", "contact", "final-cta"]), "contrast", false, true, "gc-composition__conversion-stage"),
        group("closing", "closing", pick(["location", "footer"]), "contrast", false, true, "gc-composition__closing"),
      ];

    case "human-authority":
      return [
        nav,
        group("magazine-hero", "hero-stage", pick(["hero"]), "page", false, true, "gc-composition__hero-stage"),
        group("magazine-story", "story", pick(["about", "gallery"]), "surface", false, true, "gc-composition__story-stage"),
        group("magazine-collections", "offer", pick(["collections", "products"]), "soft", false, true, "gc-composition__offer-stage"),
        group("magazine-proof", "trust", pick(["testimonials", "video"]), "page", false, true, "gc-composition__trust-stage"),
        group("magazine-social", "story", pick(["social", "newsletter"]), "surface", false, true, "gc-composition__story-stage"),
        group("magazine-close", "conversion", pick(["contact", "final-cta"]), "brand", false, true, "gc-composition__conversion-stage"),
        group("closing", "closing", pick(["location", "footer"]), "surface", false, true, "gc-composition__closing"),
      ];

    case "editorial-signature":
      return [
        nav,
        group("minimal-hero", "hero-stage", pick(["hero"]), "page", false, true, "gc-composition__hero-stage"),
        group("minimal-products", "offer", pick(["products"]), "surface", false, true, "gc-composition__offer-stage"),
        group("minimal-story", "story", pick(["about"]), "page", false, true, "gc-composition__story-stage"),
        group("minimal-gallery", "story", pick(["gallery"]), "surface", false, true, "gc-composition__story-stage"),
        group("minimal-social", "trust", pick(["social"]), "page", false, true, "gc-composition__trust-stage"),
        group("minimal-close", "conversion", pick(["contact", "final-cta"]), "brand", false, true, "gc-composition__conversion-stage"),
        group("closing", "closing", pick(["location", "footer"]), "surface", false, true, "gc-composition__closing"),
      ];

    case "commerce-showcase":
    default:
      return [
        nav,
        group("luxury-hero", "hero-stage", pick(["hero"]), "page", false, true, "gc-composition__hero-stage"),
        group("luxury-bestsellers", "offer", pick(["products"]), "soft", true, true, "gc-composition__offer-stage"),
        group("luxury-story", "story", pick(["about", "gallery"]), "surface", false, true, "gc-composition__story-stage"),
        group("luxury-discovery", "offer", pick(["collections", "offers"]), "page", false, true, "gc-composition__offer-stage"),
        group("luxury-proof", "trust", pick(["testimonials", "benefits"]), "surface", false, true, "gc-composition__trust-stage"),
        group("luxury-social", "story", pick(["social", "newsletter"]), "soft", false, true, "gc-composition__story-stage"),
        group("luxury-close", "conversion", pick(["contact", "final-cta"]), "brand", false, true, "gc-composition__conversion-stage"),
        group("closing", "closing", pick(["location", "footer"]), "surface", false, true, "gc-composition__closing"),
      ];
  }
}


/**
 * SERVICE_PREMIUM_WARM V1
 *
 * Composição exclusiva para páginas de serviço.
 * Não interfere no fluxo de loja.
 *
 * A página privilegia uma narrativa coerente:
 * navegação → hero → serviços → autoridade → processo/prova → conversão → footer.
 * Se uma seção não possuir conteúdo real, o renderer correspondente pode retornar vazio.
 */
function resolvePremiumServiceVariant(
  plan?: PageArchetypePlan,
  brief?: ServiceDesignBriefLike,
): string {
  // O brief escolhido no Gerador tem prioridade sobre o PageArchetype.
  switch (String(brief?.id || "").toUpperCase()) {
    case "SERVICE_CINEMATIC": return "premium-cinematic";
    case "SERVICE_MAGAZINE": return "premium-magazine";
    case "SERVICE_MINIMAL": return "premium-minimal";
    case "SERVICE_CONVERSION": return "premium-conversion";
    case "SERVICE_WARM_EDITORIAL": return "premium-warm";
  }

  // Fallback para páginas antigas sem serviceDesignBrief.
  switch (plan?.archetype) {
    case "CINEMATIC_STORY": return "premium-cinematic";
    case "MAGAZINE_STORY": return "premium-magazine";
    case "MINIMAL_PREMIUM": return "premium-minimal";
    case "MODERN_CONVERSION":
    case "BOUTIQUE_COMMERCE": return "premium-conversion";
    case "LUXURY_EDITORIAL":
    default: return "premium-warm";
  }
}

/**
 * SERVICE PREMIUM V2
 *
 * Mantém a qualidade premium, mas varia a macrocomposição conforme o
 * PageArchetype. Loja não passa por este método.
 */

/**
 * Novo fluxo de macrocomposição para páginas de SERVIÇO geradas por layout-base + IA.
 *
 * Importante:
 * - não é usado por lojas;
 * - não remove os builders legados;
 * - usa somente chaves de seção já suportadas pelo SectionLibrary;
 * - conteúdo sem dados reais continua sujeito ao filtro/renderer existente.
 */
function buildLayoutBaseAiServiceGroups(
  request: NormalizedTemplateRequest,
  pick: (sections: TemplateSectionKey[]) => TemplateSectionKey[],
  ctx: ReturnType<typeof getLayoutBaseAiContext>,
): LandingCompositionGroup[] {
  const baseId = String(ctx.layoutBaseId || "").toUpperCase();
  const composition = ctx.variationComposition || {};

  const aiClass = [
    "gc-service-layout-base-group",
    `gc-service-layout-base-group--${slug(ctx.layoutBaseId)}`,
    composition?.heroLayout ? `gc-ai-hero--${slug(String(composition.heroLayout))}` : "",
    composition?.sectionRhythm ? `gc-ai-rhythm--${slug(String(composition.sectionRhythm))}` : "",
  ].filter(Boolean).join(" ");

  const serviceGroup = (
    id: string,
    kind: LandingCompositionGroup["kind"],
    sections: TemplateSectionKey[],
    surface: LandingCompositionGroup["surface"],
    className: string,
  ): LandingCompositionGroup =>
    group(
      id,
      kind,
      pick(sections),
      surface,
      false,
      true,
      `${aiClass} ${className}`,
    );

  const nav = serviceGroup(
    "layout-base-navigation",
    "navigation",
    ["topbar", "header"],
    "surface",
    "gc-layout-base__navigation",
  );
  const hero = serviceGroup(
    "layout-base-hero",
    "hero-stage",
    ["hero"],
    "page",
    "gc-layout-base__hero",
  );
  const services = serviceGroup(
    "layout-base-services",
    "offer",
    ["services"],
    "soft",
    "gc-layout-base__services",
  );
  const authority = serviceGroup(
    "layout-base-authority",
    "story",
    ["about", "benefits"],
    "surface",
    "gc-layout-base__authority",
  );
  const process = serviceGroup(
    "layout-base-process",
    "trust",
    ["how-it-works"],
    "soft",
    "gc-layout-base__process",
  );
  const media = serviceGroup(
    "layout-base-media",
    "story",
    ["gallery", "video"],
    "page",
    "gc-layout-base__media",
  );
  const proof = serviceGroup(
    "layout-base-proof",
    "trust",
    ["testimonials"],
    "surface",
    "gc-layout-base__proof",
  );
  const questions = serviceGroup(
    "layout-base-questions",
    "trust",
    ["faq"],
    "page",
    "gc-layout-base__questions",
  );
  const conversion = serviceGroup(
    "layout-base-conversion",
    "conversion",
    ["contact", "final-cta"],
    "brand",
    "gc-layout-base__conversion",
  );
  const footer = serviceGroup(
    "layout-base-footer",
    "closing",
    ["social", "location", "footer"],
    "surface",
    "gc-layout-base__footer",
  );

  // As três famílias-base têm narrativa própria.
  // A ordem abaixo é deliberadamente isolada do fluxo antigo.
  switch (baseId) {
    case "SERVICE_CONSTRUCTION_01":
      return [
        nav, hero, services, media, authority, process, proof, questions, conversion, footer,
      ].filter((item) => item.sections.length > 0);

    case "SERVICE_BEAUTY_01":
      return [
        nav, hero, services, media, authority, proof, process, questions, conversion, footer,
      ].filter((item) => item.sections.length > 0);

    case "SERVICE_HEALTH_01":
    default:
      return [
        nav, hero, services, authority, process, media, proof, questions, conversion, footer,
      ].filter((item) => item.sections.length > 0);
  }
}

function buildPremiumServiceGroups(
  request: NormalizedTemplateRequest,
  plan: PageArchetypePlan | undefined,
  pick: (sections: TemplateSectionKey[]) => TemplateSectionKey[],
  brief?: ServiceDesignBriefLike,
): LandingCompositionGroup[] {
  const variant = resolvePremiumServiceVariant(plan, brief);

  const serviceGroup = (
    id: string,
    kind: LandingCompositionGroup["kind"],
    sections: TemplateSectionKey[],
    surface: LandingCompositionGroup["surface"],
    className: string,
  ): LandingCompositionGroup =>
    group(
      id,
      kind,
      pick(sections),
      surface,
      false,
      true,
      `gc-service-premium-group ${className} gc-service-premium-group--${variant}`,
    );

  const nav = serviceGroup(
    "service-premium-navigation",
    "navigation",
    ["topbar", "header"],
    "surface",
    "gc-service-premium-group--navigation",
  );

  const hero = serviceGroup(
    "service-premium-hero",
    "hero-stage",
    ["hero"],
    variant === "premium-cinematic" ? "brand" : "page",
    "gc-service-premium-group--hero",
  );

  const services = serviceGroup(
    "service-premium-services",
    "offer",
    ["services"],
    variant === "premium-minimal" ? "surface" : "soft",
    "gc-service-premium-group--services",
  );

  const authority = serviceGroup(
    "service-premium-authority",
    "story",
    ["about", "benefits"],
    "surface",
    "gc-service-premium-group--authority",
  );

  const results = serviceGroup(
    "service-premium-results",
    "story",
    ["gallery", "video"],
    "page",
    "gc-service-premium-group--results",
  );

  const process = serviceGroup(
    "service-premium-process",
    "trust",
    ["how-it-works"],
    "soft",
    "gc-service-premium-group--process",
  );

  const proof = serviceGroup(
    "service-premium-proof",
    "trust",
    ["testimonials"],
    variant === "premium-magazine" ? "surface" : "page",
    "gc-service-premium-group--proof",
  );

  const questions = serviceGroup(
    "service-premium-questions",
    "trust",
    ["faq"],
    "surface",
    "gc-service-premium-group--questions",
  );

  const conversion = serviceGroup(
    "service-premium-conversion",
    "conversion",
    ["contact", "final-cta"],
    "brand",
    "gc-service-premium-group--conversion",
  );

  const footer = serviceGroup(
    "service-premium-footer",
    "closing",
    ["social", "location", "footer"],
    "surface",
    "gc-service-premium-group--footer",
  );

  switch (variant) {
    case "premium-cinematic":
      return [nav, hero, authority, results, services, proof, process, questions, conversion, footer]
        .filter((item) => item.sections.length > 0);

    case "premium-magazine":
      return [nav, hero, authority, proof, results, services, process, questions, conversion, footer]
        .filter((item) => item.sections.length > 0);

    case "premium-minimal":
      return [nav, hero, services, authority, process, conversion, footer]
        .filter((item) => item.sections.length > 0);

    case "premium-conversion":
      return [nav, hero, services, proof, process, authority, questions, conversion, results, footer]
        .filter((item) => item.sections.length > 0);

    case "premium-warm":
    default:
      return [nav, hero, services, authority, results, process, proof, questions, conversion, footer]
        .filter((item) => item.sections.length > 0);
  }
}


function buildServiceGroups(
  archetype: LandingCompositionArchetype,
  pick: (sections: TemplateSectionKey[]) => TemplateSectionKey[],
): LandingCompositionGroup[] {
  const nav = group("navigation", "navigation", pick(["topbar", "header"]), "surface", false, true, "gc-composition__navigation");

  switch (archetype) {
    case "human-authority":
      return [
        nav,
        group("hero-story", "hero-stage", pick(["hero"]), "brand", false, true, "gc-composition__hero-stage"),
        group("human-story", "story", pick(["about", "gallery"]), "soft", false, true, "gc-composition__story-stage"),
        group("services", "offer", pick(["services", "how-it-works"]), "surface", true, true, "gc-composition__offer-stage"),
        group("trust", "trust", pick(["benefits", "testimonials", "video"]), "page", false, true, "gc-composition__trust-stage"),
        group("social", "story", pick(["social"]), "surface", false, true, "gc-composition__story-stage"),
        group("conversion", "conversion", pick(["faq", "contact", "final-cta"]), "brand", false, true, "gc-composition__conversion-stage"),
        group("closing", "closing", pick(["location", "footer"]), "surface", false, true, "gc-composition__closing"),
      ];

    case "conversion-flow":
      return [
        nav,
        group("conversion-hero", "hero-stage", pick(["hero", "featured"]), "contrast", false, true, "gc-composition__hero-stage"),
        group("offer", "offer", pick(["services"]), "surface", true, true, "gc-composition__offer-bridge"),
        group("process", "trust", pick(["how-it-works", "benefits", "testimonials"]), "soft", false, true, "gc-composition__trust-stage"),
        group("media", "story", pick(["gallery", "video"]), "page", false, true, "gc-composition__story-stage"),
        group("questions", "conversion", pick(["faq", "contact", "final-cta"]), "contrast", false, true, "gc-composition__conversion-stage"),
        group("closing", "closing", pick(["social", "location", "footer"]), "contrast", false, true, "gc-composition__closing"),
      ];

    case "editorial-signature":
      return [
        nav,
        group("editorial-hero", "hero-stage", pick(["hero"]), "page", false, true, "gc-composition__hero-stage"),
        group("story", "story", pick(["about"]), "surface", false, true, "gc-composition__story-stage"),
        group("offer", "offer", pick(["services"]), "page", false, true, "gc-composition__offer-stage"),
        group("proof", "trust", pick(["benefits", "gallery"]), "soft", false, true, "gc-composition__trust-stage"),
        group("social", "story", pick(["social"]), "surface", false, true, "gc-composition__story-stage"),
        group("conversion", "conversion", pick(["contact", "final-cta"]), "brand", false, true, "gc-composition__conversion-stage"),
        group("closing", "closing", pick(["location", "footer"]), "surface", false, true, "gc-composition__closing"),
      ];

    case "authority-premium":
    default:
      return [
        nav,
        group("authority-hero", "hero-stage", pick(["hero"]), "brand", false, true, "gc-composition__hero-stage"),
        group("services-bridge", "offer", pick(["services"]), "surface", true, true, "gc-composition__offer-bridge"),
        group("authority-story", "story", pick(["about", "gallery"]), "soft", false, true, "gc-composition__story-stage"),
        group("benefits", "trust", pick(["how-it-works", "benefits", "testimonials"]), "surface", false, true, "gc-composition__trust-stage"),
        group("media", "story", pick(["video", "social"]), "page", false, true, "gc-composition__story-stage"),
        group("closing-conversion", "conversion", pick(["faq", "contact", "final-cta"]), "brand", false, true, "gc-composition__conversion-stage"),
        group("closing", "closing", pick(["location", "footer"]), "surface", false, true, "gc-composition__closing"),
      ];
  }
}

function hasSocial(request: NormalizedTemplateRequest): boolean {
  const raw = request.raw || {};
  return Boolean(
    raw.instagram || raw.instagramUrl || raw.facebook || raw.facebookUrl ||
    raw.tiktok || raw.tiktokUrl || raw.youtube || raw.linkedin ||
    raw.whatsapp || raw.telefone_whatsapp || raw.store_whatsapp || raw.site || raw.website,
  );
}

function hasLocation(request: NormalizedTemplateRequest): boolean {
  const raw = request.raw || {};
  return Boolean(
    raw.enderecoCompleto || raw.addressText || raw.logradouro || raw.endereco ||
    raw.address || raw.cidade || raw.city || raw.googleMapsUrl || raw.mapsUrl,
  );
}

function hasNewsletter(request: NormalizedTemplateRequest): boolean {
  const raw = request.raw || {};
  return Boolean(raw.newsletterEnabled || raw.newsletter_enabled || raw.email || raw.store_email);
}

function hasOffers(request: NormalizedTemplateRequest): boolean {
  const raw = request.raw || {};
  if (Array.isArray(raw.offers) && raw.offers.length) return true;
  if (Array.isArray(raw.ofertas) && raw.ofertas.length) return true;
  return request.products.some((product) => {
    const price = Number(product.price || 0);
    const original = Number(product.originalPrice || 0);
    return price > 0 && original > price;
  });
}

function hasTestimonials(request: NormalizedTemplateRequest): boolean {
  const raw = request.raw || {};
  const candidates = [
    raw.testimonials,
    raw.depoimentos,
    raw.reviews,
    request.answers?.testimonials,
    request.answers?.depoimentos,
  ];
  return candidates.some((item) => Array.isArray(item) && item.length > 0);
}

function group(
  id: string,
  kind: LandingCompositionGroup["kind"],
  sections: TemplateSectionKey[],
  surface: LandingCompositionGroup["surface"],
  overlapPrevious = false,
  continuous = false,
  className?: string,
): LandingCompositionGroup {
  return { id, kind, sections, surface, overlapPrevious, continuous, className };
}

function unique<T>(items: readonly T[]): T[] {
  return [...new Set(items)];
}