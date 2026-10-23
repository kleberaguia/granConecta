import { LandingCreativeDirection, NormalizedTemplateRequest, TemplateSectionKey, TemplateVariationV2 } from "./TemplateTypes";

export class CommercialCreativeDirectionResolver {
  static resolve(
    request: NormalizedTemplateRequest,
    variation: TemplateVariationV2,
  ): LandingCreativeDirection {
    const testimonials = resolveProvidedTestimonials(request);
    const trustItems = resolveTrustItems(request);

    return request.pageKind === "servico"
      ? resolveServiceDirection(request, variation, testimonials, trustItems)
      : resolveStoreDirection(request, variation, testimonials, trustItems);
  }
}

function resolveServiceDirection(
  request: NormalizedTemplateRequest,
  variation: TemplateVariationV2,
  testimonials: string[],
  trustItems: string[],
): LandingCreativeDirection {
  const suppressSections: TemplateSectionKey[] =
    testimonials.length > 0 ? [] : ["testimonials"];

  switch (variation.family) {
    case "conversion-sales":
      return {
        archetype: "conversion-impact",
        heroVariant: "immersive-cover",
        servicesVariant: "problem-grid",
        benefitsVariant: "numbers",
        aboutVariant: "minimal",
        trustVariant: testimonials.length
          ? "real-testimonials"
          : trustItems.length
            ? "credentials"
            : "proof-strip",
        faqVariant: "accordion",
        contactVariant: "conversion-band",
        sectionRhythm: "compact",
        decorationStyle: "bold-blocks",
        imageStyle: "professional-clean",
        density: "compact",
        sectionOrder: uniqueSections([
          "header",
          "hero",
          "contact",
          "services",
          "benefits",
          "about",
          ...(testimonials.length ? ["testimonials" as const] : []),
          "faq",
          "footer",
        ]),
        suppressSections,
        trustItems,
      };

    case "magazine-story":
      return {
        archetype: "human-story",
        heroVariant: "portrait-editorial",
        servicesVariant: "editorial-list",
        benefitsVariant: "editorial",
        aboutVariant: "portrait-story",
        trustVariant: testimonials.length
          ? "real-testimonials"
          : "credentials",
        faqVariant: "split-accordion",
        contactVariant: "editorial-card",
        sectionRhythm: "alternating",
        decorationStyle: "organic",
        imageStyle: "human-warm",
        density: "airy",
        sectionOrder: uniqueSections([
          "header",
          "hero",
          "about",
          "services",
          "benefits",
          ...(testimonials.length ? ["testimonials" as const] : []),
          "faq",
          "contact",
          "footer",
        ]),
        suppressSections,
        trustItems,
      };

    case "minimal-premium":
      return {
        archetype: "minimal-elegant",
        heroVariant: "minimal-stage",
        servicesVariant: "process-led",
        benefitsVariant: "trust-strip",
        aboutVariant: "founder-note",
        trustVariant: testimonials.length
          ? "real-testimonials"
          : trustItems.length
            ? "credentials"
            : "none",
        faqVariant: "minimal",
        contactVariant: "minimal",
        sectionRhythm: "airy",
        decorationStyle: "none",
        imageStyle: "editorial",
        density: "airy",
        sectionOrder: uniqueSections([
          "header",
          "hero",
          "services",
          "about",
          "benefits",
          ...(testimonials.length ? ["testimonials" as const] : []),
          "faq",
          "contact",
          "footer",
        ]),
        suppressSections,
        trustItems,
      };

    default:
      return {
        archetype: "authority-editorial",
        heroVariant: "authority-split",
        servicesVariant: "bento",
        benefitsVariant: "trust-strip",
        aboutVariant: "editorial-split",
        trustVariant: testimonials.length
          ? "real-testimonials"
          : trustItems.length
            ? "credentials"
            : "proof-strip",
        faqVariant: "split-accordion",
        contactVariant: "editorial-card",
        sectionRhythm: "alternating",
        decorationStyle: "editorial-lines",
        imageStyle: "professional-clean",
        density: "balanced",
        sectionOrder: uniqueSections([
          "topbar",
          "header",
          "hero",
          "services",
          "benefits",
          "about",
          ...(testimonials.length ? ["testimonials" as const] : []),
          "faq",
          "contact",
          "footer",
        ]),
        suppressSections,
        trustItems,
      };
  }
}

function resolveStoreDirection(
  request: NormalizedTemplateRequest,
  variation: TemplateVariationV2,
  testimonials: string[],
  trustItems: string[],
): LandingCreativeDirection {
  const suppressSections: TemplateSectionKey[] =
    testimonials.length > 0 ? [] : ["testimonials"];

  switch (variation.family) {
    case "marketplace-grid":
      return {
        archetype: "commerce-catalog",
        heroVariant: "catalog-showcase",
        productsVariant: "catalog-grid",
        benefitsVariant: "trust-strip",
        aboutVariant: "minimal",
        trustVariant: testimonials.length
          ? "real-testimonials"
          : "proof-strip",
        faqVariant: "accordion",
        contactVariant: "commerce-banner",
        sectionRhythm: "compact",
        decorationStyle: "geometric",
        imageStyle: "product-clean",
        density: "compact",
        sectionOrder: uniqueSections([
          "header",
          "hero",
          "categories",
          "products",
          "featured",
          "benefits",
          ...(testimonials.length ? ["testimonials" as const] : []),
          "faq",
          "contact",
          "footer",
        ]),
        suppressSections,
        trustItems,
      };

    case "conversion-sales":
      return {
        archetype: "commerce-campaign",
        heroVariant: "campaign-cinematic",
        productsVariant: "featured-carousel",
        benefitsVariant: "numbers",
        aboutVariant: "brand-manifesto",
        trustVariant: testimonials.length
          ? "real-testimonials"
          : "proof-strip",
        faqVariant: "accordion",
        contactVariant: "commerce-banner",
        sectionRhythm: "immersive",
        decorationStyle: "bold-blocks",
        imageStyle: "cinematic",
        density: "balanced",
        sectionOrder: uniqueSections([
          "header",
          "hero",
          "featured",
          "products",
          "benefits",
          ...(testimonials.length ? ["testimonials" as const] : []),
          "contact",
          "faq",
          "footer",
        ]),
        suppressSections,
        trustItems,
      };

    case "magazine-story":
      return {
        archetype: "commerce-luxury",
        heroVariant: "product-stage",
        productsVariant: "editorial",
        benefitsVariant: "editorial",
        aboutVariant: "brand-manifesto",
        trustVariant: testimonials.length
          ? "real-testimonials"
          : "credentials",
        faqVariant: "split-accordion",
        contactVariant: "editorial-card",
        sectionRhythm: "editorial",
        decorationStyle: "soft-luxury",
        imageStyle: "product-luxury",
        density: "airy",
        sectionOrder: uniqueSections([
          "header",
          "hero",
          "about",
          "categories",
          "products",
          "featured",
          "benefits",
          ...(testimonials.length ? ["testimonials" as const] : []),
          "faq",
          "contact",
          "footer",
        ]),
        suppressSections,
        trustItems,
      };

    case "minimal-premium":
      return {
        archetype:
          request.commercialStrategy?.objective === "show-catalog"
            ? "commerce-catalog"
            : "commerce-luxury",
        heroVariant: "minimal-stage",
        productsVariant: "luxury-grid",
        benefitsVariant: "trust-strip",
        aboutVariant: "minimal",
        trustVariant: testimonials.length ? "real-testimonials" : "none",
        faqVariant: "minimal",
        contactVariant: "minimal",
        sectionRhythm: "airy",
        decorationStyle: "none",
        imageStyle: "product-clean",
        density: "airy",
        sectionOrder: uniqueSections([
          "header",
          "hero",
          "products",
          "benefits",
          "about",
          ...(testimonials.length ? ["testimonials" as const] : []),
          "faq",
          "contact",
          "footer",
        ]),
        suppressSections,
        trustItems,
      };

    default:
      return {
        archetype: "commerce-luxury",
        heroVariant: "product-stage",
        productsVariant: "luxury-grid",
        benefitsVariant: "trust-strip",
        aboutVariant: "brand-manifesto",
        trustVariant: testimonials.length
          ? "real-testimonials"
          : trustItems.length
            ? "credentials"
            : "proof-strip",
        faqVariant: "split-accordion",
        contactVariant: "commerce-banner",
        sectionRhythm: "editorial",
        decorationStyle: "soft-luxury",
        imageStyle: "product-luxury",
        density: "airy",
        sectionOrder: uniqueSections([
          "topbar",
          "header",
          "hero",
          "categories",
          "featured",
          "products",
          "benefits",
          "about",
          ...(testimonials.length ? ["testimonials" as const] : []),
          "faq",
          "contact",
          "footer",
        ]),
        suppressSections,
        trustItems,
      };
  }
}

function resolveProvidedTestimonials(
  request: NormalizedTemplateRequest,
): string[] {
  const raw = request.raw || {};
  const answers = request.answers || {};

  const candidates = [
    raw?.testimonials,
    raw?.depoimentos,
    raw?.reviews,
    answers?.testimonials,
    answers?.depoimentos,
  ];

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;

    return candidate
      .map((item) => {
        if (typeof item === "string") return item.trim();

        return String(
          item?.text ||
            item?.texto ||
            item?.testimonial ||
            item?.depoimento ||
            "",
        ).trim();
      })
      .filter(Boolean);
  }

  return [];
}

function resolveTrustItems(
  request: NormalizedTemplateRequest,
): string[] {
  const strategyItems =
    request.commercialStrategy?.trustItems?.filter(Boolean) || [];

  if (strategyItems.length) {
    return strategyItems.slice(0, 6);
  }

  const raw = request.raw || {};
  const answers = request.answers || {};

  const candidates = [
    raw?.trustItems,
    raw?.credenciais,
    raw?.diferenciais,
    answers?.trustItems,
    answers?.credenciais,
    answers?.diferenciais,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      const values = candidate
        .map((item) => String(item || "").trim())
        .filter(Boolean);

      if (values.length) return values.slice(0, 6);
    }

    if (typeof candidate === "string" && candidate.trim()) {
      return candidate
        .split(/[|;\n]/g)
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 6);
    }
  }

  return [];
}

function uniqueSections(
  sections: TemplateSectionKey[],
): TemplateSectionKey[] {
  return [...new Set(sections)];
}