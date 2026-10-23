import type { ContentDensity, LayoutFamily } from "../TemplateTypes";
import type {
  DesignScale,
  TitleTreatment,
  TypographyMood,
  TypographySystem,
} from "./DesignTokens";

export class TypographyEngine {
  static resolve(family: LayoutFamily, density: ContentDensity): TypographySystem {
    const mood = resolveMood(family);
    const multiplier = density === "airy" ? 1.08 : density === "compact" ? 0.94 : 1;
    const px = (value: number) => `${Math.round(value * multiplier)}px`;

    const scale: DesignScale = {
      display: `clamp(${px(56)}, 8.4vw, ${px(124)})`,
      h1: `clamp(${px(46)}, 6.6vw, ${px(96)})`,
      h2: `clamp(${px(34)}, 4.7vw, ${px(72)})`,
      body: `clamp(${px(16)}, 1.45vw, ${px(19)})`,
      small: px(12),
    };

    switch (family) {
      case "luxury-editorial":
        return base(mood, "editorial-mixed", '"Cormorant Garamond","Playfair Display",serif', '"Inter",sans-serif', '"Playfair Display",serif', 600, "-.058em", .84, "11ch", scale);
      case "magazine-story":
        return base(mood, "display-serif", '"Playfair Display","Cormorant Garamond",serif', '"Inter",sans-serif', '"Cormorant Garamond",serif', 600, "-.05em", .88, "12ch", scale);
      case "conversion-sales":
        return base(mood, "bold-grotesk", '"Montserrat","Inter",sans-serif', '"Inter",sans-serif', '"Cormorant Garamond",serif', 800, "-.055em", .9, "13ch", scale);
      case "minimal-premium":
        return base(mood, "minimal-display", '"Cormorant Garamond","Playfair Display",serif', '"Inter",sans-serif', '"Cormorant Garamond",serif', 500, "-.045em", .91, "14ch", scale);
      case "marketplace-grid":
        return base(mood, "commerce-display", '"Montserrat","Inter",sans-serif', '"Inter",sans-serif', '"Playfair Display",serif', 750, "-.05em", .92, "12ch", scale);
      default:
        return base(mood, "human-elegant", '"Playfair Display","Cormorant Garamond",serif', '"Inter",sans-serif', '"Cormorant Garamond",serif', 600, "-.035em", .95, "13ch", scale);
    }
  }
}

function resolveMood(family: LayoutFamily): TypographyMood {
  if (family === "luxury-editorial" || family === "magazine-story") return "editorial";
  if (family === "conversion-sales") return "bold";
  if (family === "minimal-premium") return "minimal";
  if (family === "marketplace-grid") return "modern";
  return "human";
}

function base(
  mood: TypographyMood,
  titleTreatment: TitleTreatment,
  headingFamily: string,
  bodyFamily: string,
  accentFamily: string,
  titleWeight: number,
  titleTracking: string,
  titleLineHeight: number,
  maxTitleWidth: string,
  scale: DesignScale,
): TypographySystem {
  return {
    mood,
    titleTreatment,
    headingFamily,
    bodyFamily,
    accentFamily,
    titleWeight,
    titleTracking,
    titleLineHeight,
    maxTitleWidth,
    scale,
  };
}
