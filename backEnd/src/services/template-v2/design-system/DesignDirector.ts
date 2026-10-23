import type {
  NormalizedTemplateRequest,
  TemplatePalette,
  TemplateVariationV2,
  TemplateVisualContext,
} from "../TemplateTypes";
import type { DesignDirection, ResolvedDesignSystem } from "./DesignTokens";
import { CompositionEngine } from "./CompositionEngine";
import { DecorativeLayerEngine } from "./DecorativeLayerEngine";
import { MediaTreatmentEngine } from "./MediaTreatmentEngine";
import { MotionEngine } from "./MotionEngine";
import { TypographyEngine } from "./TypographyEngine";

export type DesignDirectorInput = {
  request: NormalizedTemplateRequest;
  variation: TemplateVariationV2;
  visualContext: TemplateVisualContext;
  palette: TemplatePalette;
};

export class DesignDirector {
  static resolve(input: DesignDirectorInput): ResolvedDesignSystem {
    const { request, variation, visualContext, palette } = input;
    const creative = request.creativeDirection;
    const hero = MediaTreatmentEngine.inspect(visualContext);
    const density = creative?.density || "balanced";
    const typography = TypographyEngine.resolve(variation.family, density);
    const direction = resolveDirection(variation.family, request.pageKind);
    const heroComposition = CompositionEngine.resolveHero(variation.family, hero);

    return {
      direction,
      family: variation.family,
      density,
      rhythm: creative?.sectionRhythm || (variation.family === "minimal-premium" ? "airy" : "alternating"),
      decoration: DecorativeLayerEngine.resolve(variation.family, creative?.decorationStyle),
      imageStyle: creative?.imageStyle || (direction === "cinematic-impact" ? "cinematic" : "editorial"),
      typographyMood: typography.mood,
      typography,
      motion: MotionEngine.resolve(direction),
      heroComposition,
      mediaTreatment: MediaTreatmentEngine.resolveTreatment(direction, hero.imageCount),
      navigation: direction === "cinematic-impact" ? "transparent" : direction === "minimal-premium" ? "minimal" : "floating",
      cardTreatment: direction === "cinematic-impact" ? "glass" : direction === "minimal-premium" ? "flat" : "editorial",
      radius: direction === "soft-human" ? "organic" : direction === "minimal-premium" ? "none" : direction === "luxury-editorial" ? "small" : "medium",
      shadow: direction === "minimal-premium" ? "none" : direction === "cinematic-impact" ? "deep" : "editorial",
      maxWidth: CompositionEngine.maxWidth(variation.family),
      sectionSpace: density === "airy" ? 132 : density === "compact" ? 76 : 104,
      scale: typography.scale,
      palette,
      hero,
    };
  }
}

function resolveDirection(family: TemplateVariationV2["family"], pageKind: NormalizedTemplateRequest["pageKind"]): DesignDirection {
  switch (family) {
    case "luxury-editorial": return "luxury-editorial";
    case "conversion-sales": return "cinematic-impact";
    case "magazine-story": return "editorial-story";
    case "minimal-premium": return "minimal-premium";
    case "marketplace-grid": return "commerce-dynamic";
    default: return pageKind === "servico" ? "soft-human" : "commerce-dynamic";
  }
}
