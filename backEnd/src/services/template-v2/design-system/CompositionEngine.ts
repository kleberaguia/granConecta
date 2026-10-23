import type { LayoutFamily } from "../TemplateTypes";
import type { HeroComposition, ResolvedDesignSystem } from "./DesignTokens";

export class CompositionEngine {
  static resolveHero(
    family: LayoutFamily,
    hero: ResolvedDesignSystem["hero"],
  ): HeroComposition {
    if (family === "conversion-sales") return hero.hasLandscape ? "cinematic-cover" : "conversion-stage";
    if (family === "magazine-story") return hero.imageCount >= 2 ? "portrait-story" : "editorial-overlap";
    if (family === "minimal-premium") return "minimal-stage";
    if (family === "marketplace-grid") return "catalog-dynamic";
    return hero.imageCount >= 2 ? "editorial-overlap" : "portrait-story";
  }

  static maxWidth(family: LayoutFamily): number {
    if (family === "magazine-story") return 1320;
    if (family === "luxury-editorial") return 1280;
    if (family === "conversion-sales") return 1360;
    return 1180;
  }
}
