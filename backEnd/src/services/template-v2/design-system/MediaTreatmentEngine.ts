import type { TemplateVisualContext } from "../TemplateTypes";
import type { MediaTreatment, ResolvedDesignSystem } from "./DesignTokens";

export class MediaTreatmentEngine {
  static inspect(visualContext: TemplateVisualContext): ResolvedDesignSystem["hero"] {
    const media = visualContext.media?.hero || [];
    const urls = Array.from(new Set([
      ...(visualContext.heroImages || []),
      ...(visualContext.heroMedia?.gallery || []),
      ...media.map((item) => item.url),
      visualContext.heroImage,
    ].filter(Boolean)));

    const hasLandscape = media.some((item) => item.orientation === "landscape" || Number(item.aspectRatio) >= 1.35);
    const hasPortrait = media.some((item) => item.orientation === "portrait" || (Number(item.aspectRatio) > 0 && Number(item.aspectRatio) < .86));
    const hasSquare = media.some((item) => item.orientation === "square" || (Number(item.aspectRatio) >= .86 && Number(item.aspectRatio) <= 1.16));

    return {
      imageCount: urls.length,
      hasLandscape,
      hasPortrait,
      hasSquare,
      mediaDominance: urls.length >= 2 ? "media" : urls.length === 1 ? "balanced" : "copy",
    };
  }

  static resolveTreatment(direction: string, imageCount: number): MediaTreatment {
    if (direction === "cinematic-impact") return "cinematic";
    if (direction === "luxury-editorial") return imageCount >= 2 ? "floating" : "framed";
    if (direction === "editorial-story") return imageCount >= 2 ? "mosaic" : "framed";
    if (direction === "minimal-premium") return "clean";
    if (direction === "commerce-dynamic") return "floating";
    return "framed";
  }
}
