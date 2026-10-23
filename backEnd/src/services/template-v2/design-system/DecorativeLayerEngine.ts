import type { DecorationStyle, LayoutFamily } from "../TemplateTypes";

export class DecorativeLayerEngine {
  static resolve(family: LayoutFamily, requested?: DecorationStyle): DecorationStyle {
    if (requested && requested !== "none") return requested;
    if (family === "luxury-editorial") return "soft-luxury";
    if (family === "magazine-story") return "editorial-lines";
    if (family === "conversion-sales") return "bold-blocks";
    if (family === "minimal-premium") return "none";
    return "geometric";
  }
}
