import type { RenderContext } from "./render-engine/renderTypes";

export type AboutSectionVariant =
  | "editorial-overlap"
  | "cinematic-story"
  | "boutique-brand"
  | "magazine-numbered"
  | "minimal-centered"
  | "conversion-proof";

export type ProductSectionVariant =
  | "editorial-showcase"
  | "cinematic-strip"
  | "commerce-grid"
  | "magazine-feature"
  | "minimal-sparse"
  | "conversion-grid";

export type GallerySectionVariant =
  | "editorial-art"
  | "cinematic-wide"
  | "commerce-lookbook"
  | "magazine-mosaic"
  | "minimal-grid"
  | "conversion-proof";

export type HeaderSectionVariant =
  | "luxury-centered"
  | "cinematic-overlay"
  | "commerce-nav"
  | "magazine-masthead"
  | "minimal-clean"
  | "conversion-action";

export type FooterSectionVariant =
  | "luxury-editorial"
  | "cinematic-dark"
  | "commerce-columns"
  | "magazine-columns"
  | "minimal-clean"
  | "conversion-action";

export type SectionVariantPlan = {
  about: AboutSectionVariant;
  products: ProductSectionVariant;
  gallery: GallerySectionVariant;
  header: HeaderSectionVariant;
  footer: FooterSectionVariant;
};

export class SectionVariantEngine {
  static resolve(context: RenderContext): SectionVariantPlan {
    switch (context.pageArchetype?.archetype) {
      case "LUXURY_EDITORIAL":
        return {
          about: "editorial-overlap",
          products: "editorial-showcase",
          gallery: "editorial-art",
          header: "luxury-centered",
          footer: "luxury-editorial",
        };
      case "CINEMATIC_STORY":
        return {
          about: "cinematic-story",
          products: "cinematic-strip",
          gallery: "cinematic-wide",
          header: "cinematic-overlay",
          footer: "cinematic-dark",
        };
      case "BOUTIQUE_COMMERCE":
        return {
          about: "boutique-brand",
          products: "commerce-grid",
          gallery: "commerce-lookbook",
          header: "commerce-nav",
          footer: "commerce-columns",
        };
      case "MAGAZINE_STORY":
        return {
          about: "magazine-numbered",
          products: "magazine-feature",
          gallery: "magazine-mosaic",
          header: "magazine-masthead",
          footer: "magazine-columns",
        };
      case "MINIMAL_PREMIUM":
        return {
          about: "minimal-centered",
          products: "minimal-sparse",
          gallery: "minimal-grid",
          header: "minimal-clean",
          footer: "minimal-clean",
        };
      case "MODERN_CONVERSION":
        return {
          about: "conversion-proof",
          products: "conversion-grid",
          gallery: "conversion-proof",
          header: "conversion-action",
          footer: "conversion-action",
        };
      default:
        return {
          about: legacyAbout(context),
          products: legacyProducts(context),
          gallery: legacyGallery(context),
          header: legacyHeader(context),
          footer: legacyFooter(context),
        };
    }
  }
}

function legacyAbout(context: RenderContext): AboutSectionVariant {
  switch (context.variation.family) {
    case "magazine-story": return "magazine-numbered";
    case "minimal-premium": return "minimal-centered";
    case "conversion-sales": return "conversion-proof";
    case "marketplace-grid": return "boutique-brand";
    default: return "editorial-overlap";
  }
}

function legacyProducts(context: RenderContext): ProductSectionVariant {
  switch (context.variation.productStyle) {
    case "catalog": return "commerce-grid";
    case "bold": return "conversion-grid";
    case "magazine": return "magazine-feature";
    case "minimal": return "minimal-sparse";
    default: return "editorial-showcase";
  }
}


function legacyGallery(context: RenderContext): GallerySectionVariant {
  switch (context.variation.family) {
    case "luxury-editorial": return "editorial-art";
    case "conversion-sales": return "conversion-proof";
    case "magazine-story": return "magazine-mosaic";
    case "minimal-premium": return "minimal-grid";
    default: return "commerce-lookbook";
  }
}

function legacyHeader(context: RenderContext): HeaderSectionVariant {
  switch (context.variation.family) {
    case "luxury-editorial": return "luxury-centered";
    case "conversion-sales": return "conversion-action";
    case "magazine-story": return "magazine-masthead";
    case "minimal-premium": return "minimal-clean";
    default: return "commerce-nav";
  }
}

function legacyFooter(context: RenderContext): FooterSectionVariant {
  switch (context.variation.family) {
    case "luxury-editorial": return "luxury-editorial";
    case "conversion-sales": return "conversion-action";
    case "magazine-story": return "magazine-columns";
    case "minimal-premium": return "minimal-clean";
    default: return "commerce-columns";
  }
}