import type {
  ImageTemplateAsset,
  ImageTemplateCrop,
  ImageTemplateElement,
  ImageTemplateElementStyle,
  ImageTemplateMode,
  ImageTemplateSection,
  ImageTemplateSectionLayout,
  ImageTemplateSectionType,
  ImageTemplateSpec,
  ImageTemplateTheme,
} from "./ImageTemplateTypes";

const validModes: ImageTemplateMode[] = [
  "institutional",
  "service",
  "commerce",
];

const validSectionTypes: ImageTemplateSectionType[] = [
  "header",
  "hero",
  "products",
  "services",
  "about",
  "gallery",
  "testimonials",
  "cta",
  "faq",
  "footer",
  "custom",
];

export class ImageTemplateValidator {
  static validate(input: unknown): ImageTemplateSpec {
    if (!input || typeof input !== "object") {
      throw new Error("Template inválido.");
    }

    const template = input as Partial<ImageTemplateSpec>;
    const mode = validModes.includes(template.mode as ImageTemplateMode)
      ? (template.mode as ImageTemplateMode)
      : "institutional";

    const sections = this.normalizeSections(template.sections, mode);

    if (!sections.length) {
      throw new Error(
        "Nenhuma seção válida foi identificada na imagem.",
      );
    }

    return {
      version: "1.0",
      id: this.normalizeId(template.id, "template"),
      name: this.normalizeText(template.name) || "Template por imagem",
      mode,
      sourceImageUrl: this.normalizeOptionalText(template.sourceImageUrl),
      theme: this.normalizeTheme(template.theme),
      assets: this.normalizeAssets(template.assets),
      sections,
      metadata: {
        createdAt:
          this.normalizeOptionalText(template.metadata?.createdAt) ||
          new Date().toISOString(),
        generatedBy:
          template.metadata?.generatedBy === "manual" ? "manual" : "ai",
        storeId: this.normalizeOptionalText(template.metadata?.storeId),
        sourceImagePath: this.normalizeOptionalText(
          template.metadata?.sourceImagePath,
        ),
        sourceImageName: this.normalizeOptionalText(
          template.metadata?.sourceImageName,
        ),
        sourceImageMimeType: this.normalizeOptionalText(
          template.metadata?.sourceImageMimeType,
        ),
      },
    };
  }

  private static normalizeTheme(
    input?: Partial<ImageTemplateTheme>,
  ): ImageTemplateTheme {
    return {
      primaryColor: this.normalizeColor(input?.primaryColor, "#0754a5"),
      secondaryColor: this.normalizeColor(input?.secondaryColor, "#dbeafe"),
      backgroundColor: this.normalizeColor(input?.backgroundColor, "#ffffff"),
      surfaceColor: this.normalizeColor(input?.surfaceColor, "#f8fafc"),
      textColor: this.normalizeColor(input?.textColor, "#172033"),
      mutedTextColor: this.normalizeColor(input?.mutedTextColor, "#64748b"),
      headingFont: this.normalizeText(input?.headingFont) || "Montserrat",
      bodyFont: this.normalizeText(input?.bodyFont) || "Montserrat",
      borderRadius: this.clampNumber(input?.borderRadius, 0, 64, 8),
    };
  }

  private static normalizeAssets(
    input?: ImageTemplateAsset[],
  ): ImageTemplateAsset[] {
    if (!Array.isArray(input)) return [];

    return input
      .filter((asset) => asset && typeof asset === "object")
      .map((asset, index) => {
        const crop = this.normalizeCrop(asset.crop);
        const url =
          this.normalizeText(asset.url) ||
          `asset://placeholder-${index + 1}`;

        return {
          id: this.normalizeId(asset.id, `asset-${index + 1}`),
          type: this.oneOf(
            asset.type,
            ["image", "background", "icon", "video"] as const,
            "image",
          ),
          role: this.optionalOneOf(
            asset.role,
            ["background", "content", "product", "decorative"] as const,
          ),
          url,
          alt: this.normalizeOptionalText(asset.alt),
          source: this.oneOf(
            asset.source,
            ["uploaded", "extracted", "generated", "placeholder"] as const,
            crop ? "extracted" : "placeholder",
          ),
          crop,
        };
      });
  }

  private static normalizeCrop(
    input?: Partial<ImageTemplateCrop>,
  ): ImageTemplateCrop | undefined {
    if (!input || typeof input !== "object") return undefined;

    const width = this.normalizeOptionalNumber(input.width, 0.1, 100);
    const height = this.normalizeOptionalNumber(input.height, 0.1, 100);

    if (width === undefined || height === undefined) return undefined;

    const x = this.clampNumber(input.x, 0, 100 - width, 0);
    const y = this.clampNumber(input.y, 0, 100 - height, 0);

    return { x, y, width, height };
  }

  private static normalizeSections(
    input: ImageTemplateSection[] | undefined,
    mode: ImageTemplateMode,
  ): ImageTemplateSection[] {
    if (!Array.isArray(input)) return [];

    return input
      .filter((section) => section && typeof section === "object")
      .map((section, index) => this.normalizeSection(section, index, mode));
  }

  private static normalizeSection(
    section: ImageTemplateSection,
    index: number,
    mode: ImageTemplateMode,
  ): ImageTemplateSection {
    const sectionType = validSectionTypes.includes(section.type)
      ? section.type
      : "custom";
    const sectionId = this.normalizeId(section.id, `section-${index + 1}`);
    const commerceEnabled = mode === "commerce" && sectionType === "products";

    return {
      id: sectionId,
      type: sectionType,
      title: this.normalizeOptionalText(section.title),
      hidden: section.hidden === true,
      layout: this.normalizeLayout(section.layout),
      elements: this.normalizeElements(section.elements, sectionId),
      commerce: commerceEnabled
        ? {
            enabled: true,
            source: this.oneOf(
              section.commerce?.source,
              ["featured", "newest", "category", "manual"] as const,
              "featured",
            ),
            categoryId: this.normalizeOptionalText(
              section.commerce?.categoryId,
            ),
            productIds: Array.isArray(section.commerce?.productIds)
              ? section.commerce.productIds.map(String)
              : undefined,
            columns: this.clampNumber(
              section.commerce?.columns,
              1,
              6,
              section.layout?.columns || 3,
            ),
            limit: this.clampNumber(section.commerce?.limit, 1, 50, 8),
            showPrice: section.commerce?.showPrice !== false,
            showDescription: section.commerce?.showDescription !== false,
            showGallery: section.commerce?.showGallery !== false,
            showAddToCart: section.commerce?.showAddToCart !== false,
          }
        : undefined,
    };
  }

  private static normalizeLayout(
    layout?: Partial<ImageTemplateSectionLayout>,
  ): ImageTemplateSectionLayout {
    return {
      columns: this.clampNumber(layout?.columns, 1, 6, 1),
      minHeight: this.normalizeOptionalNumber(layout?.minHeight, 40, 2400),
      contentWidth: this.normalizeOptionalNumber(
        layout?.contentWidth,
        280,
        2560,
      ),
      alignment: this.optionalOneOf(
        layout?.alignment,
        ["left", "center", "right"] as const,
      ),
      paddingTop: this.normalizeOptionalNumber(layout?.paddingTop, 0, 400),
      paddingRight: this.normalizeOptionalNumber(layout?.paddingRight, 0, 400),
      paddingBottom: this.normalizeOptionalNumber(
        layout?.paddingBottom,
        0,
        400,
      ),
      paddingLeft: this.normalizeOptionalNumber(layout?.paddingLeft, 0, 400),
      gap: this.normalizeOptionalNumber(layout?.gap, 0, 240),
      backgroundColor: this.normalizeOptionalColor(layout?.backgroundColor),
      backgroundAssetId: this.normalizeOptionalText(layout?.backgroundAssetId),
      backgroundPosition: this.normalizeOptionalText(
        layout?.backgroundPosition,
      ),
      backgroundSize: this.optionalOneOf(
        layout?.backgroundSize,
        ["auto", "cover", "contain"] as const,
      ),
      overlayColor: this.normalizeOptionalColor(layout?.overlayColor),
      overlayOpacity: this.normalizeOptionalNumber(
        layout?.overlayOpacity,
        0,
        1,
      ),
    };
  }

  private static normalizeElements(
    input: ImageTemplateElement[] | undefined,
    sectionId: string,
  ): ImageTemplateElement[] {
    if (!Array.isArray(input)) return [];

    return input
      .filter((element) => element && typeof element === "object")
      .map((element, index) => ({
        id: this.normalizeId(
          element.id,
          `${sectionId}-element-${index + 1}`,
        ),
        type: this.oneOf(
          element.type,
          [
            "heading",
            "text",
            "button",
            "image",
            "product-grid",
            "service-grid",
            "divider",
            "spacer",
          ] as const,
          "text",
        ),
        content: this.normalizeOptionalText(element.content),
        assetId: this.normalizeOptionalText(element.assetId),
        button: element.button
          ? {
              id: this.normalizeId(
                element.button.id,
                `${sectionId}-button-${index + 1}`,
              ),
              label: this.normalizeText(element.button.label) || "Saiba mais",
              href: this.normalizeText(element.button.href) || "#",
              action: this.oneOf(
                element.button.action,
                [
                  "navigate",
                  "open-whatsapp",
                  "open-contact-modal",
                  "add-to-cart",
                ] as const,
                "navigate",
              ),
              variant: this.oneOf(
                element.button.variant,
                ["primary", "secondary", "text"] as const,
                "primary",
              ),
            }
          : undefined,
        style: this.normalizeElementStyle(element.style),
      }));
  }

  private static normalizeElementStyle(
    style?: ImageTemplateElementStyle,
  ): ImageTemplateElementStyle | undefined {
    if (!style || typeof style !== "object") return undefined;

    return {
      color: this.normalizeOptionalColor(style.color),
      backgroundColor: this.normalizeOptionalColor(style.backgroundColor),
      fontFamily: this.normalizeOptionalText(style.fontFamily),
      fontSize: this.normalizeOptionalNumber(style.fontSize, 6, 240),
      fontWeight: this.normalizeOptionalNumber(style.fontWeight, 100, 900),
      lineHeight: this.normalizeOptionalNumber(style.lineHeight, 0.7, 3),
      letterSpacing: this.normalizeOptionalNumber(
        style.letterSpacing,
        -10,
        30,
      ),
      textAlign: this.optionalOneOf(
        style.textAlign,
        ["left", "center", "right"] as const,
      ),
      width: this.normalizeOptionalText(style.width),
      maxWidth: this.normalizeOptionalText(style.maxWidth),
      borderRadius: this.normalizeOptionalNumber(style.borderRadius, 0, 200),
      shadow: this.normalizeOptionalText(style.shadow),
    };
  }

  private static normalizeId(value: unknown, fallback: string): string {
    return (
      String(value || fallback)
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, "-") || fallback
    );
  }

  private static normalizeText(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
  }

  private static normalizeOptionalText(value: unknown): string | undefined {
    return this.normalizeText(value) || undefined;
  }

  private static normalizeColor(value: unknown, fallback: string): string {
    return this.isValidColor(value) ? String(value) : fallback;
  }

  private static normalizeOptionalColor(value: unknown): string | undefined {
    return this.isValidColor(value) ? String(value) : undefined;
  }

  private static isValidColor(value: unknown): boolean {
    if (typeof value !== "string") return false;
    return (
      /^#[0-9a-fA-F]{3,8}$/.test(value) ||
      /^rgb(a)?\(/i.test(value) ||
      /^hsl(a)?\(/i.test(value) ||
      /^[a-zA-Z]+$/.test(value)
    );
  }

  private static clampNumber(
    value: unknown,
    minimum: number,
    maximum: number,
    fallback: number,
  ): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(maximum, Math.max(minimum, parsed));
  }

  private static normalizeOptionalNumber(
    value: unknown,
    minimum: number,
    maximum: number,
  ): number | undefined {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return undefined;
    return Math.min(maximum, Math.max(minimum, parsed));
  }

  private static oneOf<T extends string>(
    value: unknown,
    values: readonly T[],
    fallback: T,
  ): T {
    return values.includes(value as T) ? (value as T) : fallback;
  }

  private static optionalOneOf<T extends string>(
    value: unknown,
    values: readonly T[],
  ): T | undefined {
    return values.includes(value as T) ? (value as T) : undefined;
  }
}
