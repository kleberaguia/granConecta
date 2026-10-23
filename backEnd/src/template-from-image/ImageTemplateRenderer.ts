import type {
  ImageTemplateAsset,
  ImageTemplateElement,
  ImageTemplateSection,
  ImageTemplateSpec,
} from "./ImageTemplateTypes";

export class ImageTemplateRenderer {
  static renderDocument(spec: ImageTemplateSpec): string {
    const bodyHtml = this.render(spec);
    const css = this.renderCSS(spec);

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(spec.name)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${this.buildGoogleFontsUrl(spec)}" rel="stylesheet">
  <style>${css}</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
  }

  static render(spec: ImageTemplateSpec): string {
    return spec.sections
      .filter((section) => !section.hidden)
      .map((section) => this.renderSection(section, spec))
      .join("\n");
  }

  static renderCSS(spec: ImageTemplateSpec): string {
    const theme = spec.theme;

    return `
      :root {
        --template-primary: ${theme.primaryColor};
        --template-secondary: ${theme.secondaryColor};
        --template-background: ${theme.backgroundColor};
        --template-surface: ${theme.surfaceColor};
        --template-text: ${theme.textColor};
        --template-muted: ${theme.mutedTextColor};
        --template-radius: ${theme.borderRadius}px;
        --template-heading-font: "${this.escapeCSS(theme.headingFont)}", serif;
        --template-body-font: "${this.escapeCSS(theme.bodyFont)}", sans-serif;
      }

      * { box-sizing: border-box; }

      html { scroll-behavior: smooth; }

      body {
        margin: 0;
        overflow-x: hidden;
        background: var(--template-background);
        color: var(--template-text);
        font-family: var(--template-body-font);
      }

      img, video, iframe {
        display: block;
        max-width: 100%;
      }

      a { color: inherit; }

      .image-template-section {
        position: relative;
        width: 100%;
        padding-top: var(--section-padding-top, 72px);
        padding-right: var(--section-padding-right, 24px);
        padding-bottom: var(--section-padding-bottom, 72px);
        padding-left: var(--section-padding-left, 24px);
        background-color: var(--section-background, transparent);
        background-image: var(--section-background-image, none);
        background-repeat: no-repeat;
        background-position: var(--section-background-position, center);
        background-size: var(--section-background-size, cover);
      }

      .image-template-section::before {
        position: absolute;
        inset: 0;
        z-index: 0;
        background: var(--section-overlay-color, transparent);
        content: "";
        opacity: var(--section-overlay-opacity, 0);
        pointer-events: none;
      }

      .image-template-section__inner {
        position: relative;
        z-index: 1;
        display: grid;
        grid-template-columns: repeat(var(--section-columns, 1), minmax(0, 1fr));
        align-items: center;
        gap: var(--section-gap, 32px);
        width: min(var(--section-content-width, 1180px), 100%);
        min-height: var(--section-min-height, auto);
        margin: 0 auto;
      }

      .image-template-section__content {
        display: flex;
        min-width: 0;
        flex-direction: column;
        align-items: var(--section-align-items, flex-start);
        text-align: var(--section-text-align, left);
      }

      .image-template-section__media {
        display: grid;
        grid-template-columns: repeat(var(--media-columns, 1), minmax(0, 1fr));
        align-items: center;
        gap: var(--section-gap, 24px);
        min-width: 0;
      }

      .image-template-section__wide {
        grid-column: 1 / -1;
        min-width: 0;
        width: 100%;
      }

      .image-template-section--header {
        padding-top: 16px;
        padding-bottom: 16px;
      }

      .image-template-section--header .image-template-section__content {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        width: 100%;
      }

      .image-template-element { min-width: 0; }

      .image-template-heading {
        width: var(--element-width, auto);
        max-width: var(--element-max-width, none);
        margin: 0 0 18px;
        color: var(--element-color, inherit);
        font-family: var(--element-font-family, var(--template-heading-font));
        font-size: var(--element-font-size, clamp(30px, 5vw, 64px));
        font-weight: var(--element-font-weight, 600);
        line-height: var(--element-line-height, 1.08);
        letter-spacing: var(--element-letter-spacing, 0px);
        text-align: var(--element-text-align, inherit);
        white-space: pre-line;
      }

      .image-template-text {
        width: var(--element-width, auto);
        max-width: var(--element-max-width, 680px);
        margin: 0 0 20px;
        color: var(--element-color, var(--template-muted));
        font-family: var(--element-font-family, var(--template-body-font));
        font-size: var(--element-font-size, 16px);
        font-weight: var(--element-font-weight, 400);
        line-height: var(--element-line-height, 1.7);
        letter-spacing: var(--element-letter-spacing, 0px);
        text-align: var(--element-text-align, inherit);
        white-space: pre-line;
      }

      .image-template-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 42px;
        border: 1px solid transparent;
        border-radius: var(--element-border-radius, var(--template-radius));
        padding: 10px 22px;
        background: var(--element-background, var(--template-primary));
        color: var(--element-color, #ffffff);
        font-weight: 700;
        text-decoration: none;
        box-shadow: var(--element-shadow, none);
      }

      .image-template-button--secondary {
        border-color: currentColor;
        background: transparent;
        color: var(--element-color, var(--template-primary));
      }

      .image-template-button--text {
        min-height: auto;
        padding-left: 0;
        padding-right: 0;
        background: transparent;
        color: var(--element-color, var(--template-primary));
      }

      .image-template-image {
        width: var(--element-width, 100%);
        max-width: var(--element-max-width, 100%);
        height: auto;
        border-radius: var(--element-border-radius, var(--template-radius));
        object-fit: cover;
        box-shadow: var(--element-shadow, none);
      }

      .image-template-divider {
        width: 100%;
        height: 1px;
        margin: 12px 0 22px;
        background: var(--element-background, var(--template-secondary));
      }

      .image-template-spacer { min-height: 32px; }

      .image-template-product-grid,
      .image-template-service-grid {
        display: grid;
        grid-template-columns: repeat(var(--grid-columns, 3), minmax(0, 1fr));
        gap: var(--grid-gap, 28px);
        width: 100%;
      }

      .image-template-card {
        overflow: hidden;
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: var(--template-radius);
        background: var(--template-surface);
        box-shadow: 0 18px 50px rgba(0, 0, 0, 0.06);
      }

      .image-template-card__image {
        width: 100%;
        aspect-ratio: 4 / 3;
        object-fit: cover;
      }

      .image-template-card__body {
        padding: 18px;
      }

      .image-template-card__title {
        margin: 0 0 10px;
        color: var(--template-text);
        font-family: var(--template-heading-font);
        font-size: 20px;
        line-height: 1.15;
      }

      .image-template-card__text {
        margin: 0 0 14px;
        color: var(--template-muted);
        font-size: 14px;
        line-height: 1.55;
      }

      .image-template-card__button {
        display: inline-flex;
        border-radius: 999px;
        padding: 9px 18px;
        background: var(--template-primary);
        color: #fff;
        font-size: 13px;
        font-weight: 700;
        text-decoration: none;
      }

      @media (max-width: 900px) {
        .image-template-section {
          padding-top: 52px;
          padding-right: 20px;
          padding-bottom: 52px;
          padding-left: 20px;
        }

        .image-template-section__inner {
          grid-template-columns: 1fr;
        }

        .image-template-product-grid,
        .image-template-service-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 560px) {
        .image-template-product-grid,
        .image-template-service-grid,
        .image-template-section__media {
          grid-template-columns: 1fr;
        }
      }
    `;
  }

  private static renderSection(
    section: ImageTemplateSection,
    spec: ImageTemplateSpec,
  ): string {
    const backgroundAsset = this.findAsset(
      section.layout.backgroundAssetId,
      spec.assets,
    );

    const isActualBackground = Boolean(
      backgroundAsset &&
      !backgroundAsset.url.startsWith("asset://") &&
      (backgroundAsset.role === "background" ||
        section.type === "hero" ||
        section.layout.backgroundAssetId),
    );

    const textElements = section.elements.filter(
      (element) =>
        element.type !== "image" &&
        element.type !== "product-grid" &&
        element.type !== "service-grid",
    );

    const imageElements = section.elements.filter(
      (element) => element.type === "image",
    );

    const wideElements = this.normalizeWideElements(
      section.elements.filter(
        (element) =>
          element.type === "product-grid" ||
          element.type === "service-grid",
      ),
    );

    const isSplitLayout =
      section.layout.columns > 1 &&
      textElements.length > 0 &&
      imageElements.length === 1 &&
      wideElements.length === 0;

    const innerColumns = isSplitLayout ? 2 : 1;
    const mediaColumns = isSplitLayout
      ? 1
      : Math.max(
        1,
        Math.min(
          section.layout.columns || imageElements.length || 1,
          4,
        ),
      );

    const sectionStyles = [
      `--section-columns:${innerColumns}`,
      `--section-align-items:${this.alignItems(section.layout.alignment)}`,
      `--section-text-align:${section.layout.alignment || "left"}`,
      this.cssVarPx("--section-padding-top", section.layout.paddingTop),
      this.cssVarPx("--section-padding-right", section.layout.paddingRight),
      this.cssVarPx("--section-padding-bottom", section.layout.paddingBottom),
      this.cssVarPx("--section-padding-left", section.layout.paddingLeft),
      this.cssVarPx("--section-gap", section.layout.gap),
      this.cssVarPx("--section-min-height", section.layout.minHeight),
      this.cssVarPx("--section-content-width", section.layout.contentWidth),
      section.layout.backgroundColor
        ? `--section-background:${this.escapeAttribute(section.layout.backgroundColor)}`
        : "",
      section.layout.backgroundPosition
        ? `--section-background-position:${this.escapeAttribute(section.layout.backgroundPosition)}`
        : "",
      section.layout.backgroundSize
        ? `--section-background-size:${this.escapeAttribute(section.layout.backgroundSize)}`
        : "",
      isActualBackground && section.layout.overlayColor
        ? `--section-overlay-color:${this.escapeAttribute(section.layout.overlayColor)}`
        : "",
      isActualBackground &&
        section.layout.overlayOpacity !== undefined
        ? `--section-overlay-opacity:${section.layout.overlayOpacity}`
        : "",
      isActualBackground && backgroundAsset
        ? `--section-background-image:url('${this.escapeAttribute(this.resolveAssetUrl(backgroundAsset))}')`
        : "",
    ]
      .filter(Boolean)
      .join(";");

    const renderedText = textElements
      .map((element) => this.renderElement(element, section, spec))
      .join("\n");

    const renderedImages = imageElements
      .map((element) => this.renderElement(element, section, spec))
      .join("\n");

    const renderedWide = wideElements
      .map((element) => this.renderElement(element, section, spec))
      .join("\n");

    return `
<section class="image-template-section image-template-section--${this.escapeAttribute(
      section.type,
    )}" id="${this.escapeAttribute(section.id)}" data-template-section="${this.escapeAttribute(
      section.type,
    )}" style="${sectionStyles}">
  <div class="image-template-section__inner">
    ${renderedText ? `<div class="image-template-section__content">${renderedText}</div>` : ""}
    ${renderedImages ? `<div class="image-template-section__media" style="--media-columns:${mediaColumns}">${renderedImages}</div>` : ""}
    ${renderedWide ? `<div class="image-template-section__wide">${renderedWide}</div>` : ""}
  </div>
</section>`;
  }

  private static renderElement(
    element: ImageTemplateElement,
    section: ImageTemplateSection,
    spec: ImageTemplateSpec,
  ): string {
    const style = this.renderElementStyle(element);

    switch (element.type) {
      case "heading":
        return `<h2 class="image-template-element image-template-heading" data-template-element-id="${this.escapeAttribute(element.id)}" style="${style}">${this.escapeHtml(element.content || "")}</h2>`;

      case "text":
        return `<p class="image-template-element image-template-text" data-template-element-id="${this.escapeAttribute(element.id)}" style="${style}">${this.escapeHtml(element.content || "")}</p>`;

      case "button":
        return this.renderButton(element, style);

      case "image":
        return this.renderImage(element, spec, style);

      case "product-grid":
        return this.renderProductGrid(section, spec);

      case "service-grid":
        return this.renderServiceGrid(section, spec);

      case "divider":
        return `<div class="image-template-element image-template-divider" data-template-element-id="${this.escapeAttribute(element.id)}" style="${style}"></div>`;

      case "spacer":
        return `<div class="image-template-element image-template-spacer" data-template-element-id="${this.escapeAttribute(element.id)}" style="${style}"></div>`;

      default:
        return "";
    }
  }

  private static renderButton(
    element: ImageTemplateElement,
    style: string,
  ): string {
    const button = element.button || {
      id: `${element.id}-button`,
      label: element.content || "Saiba mais",
      href: "#",
      action: "navigate" as const,
      variant: "primary" as const,
    };

    return `<a class="image-template-element image-template-button image-template-button--${this.escapeAttribute(
      button.variant || "primary",
    )}" href="${this.escapeAttribute(button.href || "#")}" data-template-element-id="${this.escapeAttribute(
      element.id,
    )}" data-action="${this.escapeAttribute(button.action || "navigate")}" style="${style}">${this.escapeHtml(button.label)}</a>`;
  }

  private static renderImage(
    element: ImageTemplateElement,
    spec: ImageTemplateSpec,
    style: string,
  ): string {
    const asset = this.findAsset(element.assetId, spec.assets);

    if (!asset || asset.url.startsWith("asset://")) {
      return "";
    }

    return `<img class="image-template-element image-template-image" src="${this.escapeAttribute(
      this.resolveAssetUrl(asset),
    )}" alt="${this.escapeAttribute(asset.alt || "")}" data-template-element-id="${this.escapeAttribute(
      element.id,
    )}" loading="lazy" style="${style}">`;
  }

  private static renderProductGrid(
    section: ImageTemplateSection,
    spec: ImageTemplateSpec,
  ): string {
    const columns =
      section.commerce?.columns || section.layout.columns || 3;

    const products = this.findSectionAssets(section, spec, "product");

    return `<div class="image-template-element image-template-product-grid" style="--grid-columns:${columns}">
      ${products.length
        ? products.map((asset, index) => this.renderCard(asset, index, "Ver mais")).join("\n")
        : this.renderPlaceholderCards(columns, "Produto")
      }
    </div>`;
  }

  private static renderServiceGrid(
    section: ImageTemplateSection,
    spec: ImageTemplateSpec,
  ): string {
    const columns = section.layout.columns || 3;
    const assets = this.findSectionAssets(section, spec, "content");

    return `<div class="image-template-element image-template-service-grid" style="--grid-columns:${columns}">
      ${assets.length
        ? assets.map((asset, index) => this.renderCard(asset, index, "Saiba mais")).join("\n")
        : this.renderPlaceholderCards(columns, "Servico")
      }
    </div>`;
  }

  private static renderCard(
    asset: ImageTemplateAsset,
    index: number,
    buttonText: string,
  ): string {
    const title = this.shortText(
      asset.alt || `Item ${index + 1}`,
      46,
    );

    return `<article class="image-template-card">
      <img class="image-template-card__image" src="${this.escapeAttribute(
      this.resolveAssetUrl(asset),
    )}" alt="${this.escapeAttribute(asset.alt || title)}" loading="lazy">
      <div class="image-template-card__body">
        <h3 class="image-template-card__title">${this.escapeHtml(title)}</h3>
        <p class="image-template-card__text">Conteudo editavel</p>
        <a class="image-template-card__button" href="#">${this.escapeHtml(buttonText)}</a>
      </div>
    </article>`;
  }

  private static renderPlaceholderCards(
    count: number,
    label: string,
  ): string {
    return Array.from(
      { length: Math.min(count, 6) },
      (_, index) => `<article class="image-template-card">
        <div class="image-template-card__image"></div>
        <div class="image-template-card__body">
          <h3 class="image-template-card__title">${this.escapeHtml(label)} ${index + 1}</h3>
          <p class="image-template-card__text">Conteudo editavel</p>
        </div>
      </article>`,
    ).join("\n");
  }

  private static findSectionAssets(
    section: ImageTemplateSection,
    spec: ImageTemplateSpec,
    preferredRole: ImageTemplateAsset["role"],
  ): ImageTemplateAsset[] {
    const ids = new Set(
      section.elements
        .map((element) => element.assetId)
        .filter(Boolean) as string[],
    );

    const explicitAssets = spec.assets.filter(
      (asset) =>
        ids.has(asset.id) &&
        !asset.url.startsWith("asset://"),
    );

    if (explicitAssets.length) {
      return explicitAssets;
    }

    const sectionKey = `${section.id} ${section.title || ""} ${section.type}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const usableAssets = spec.assets.filter(
      (asset) =>
        !asset.url.startsWith("asset://") &&
        asset.role === preferredRole,
    );

    if (
      section.type === "products" ||
      sectionKey.includes("best") ||
      sectionKey.includes("seller") ||
      sectionKey.includes("produto")
    ) {
      const bestSellerAssets = usableAssets.filter((asset) => {
        const assetKey = asset.id.toLowerCase();

        return (
          assetKey.includes("best") ||
          assetKey.includes("seller") ||
          assetKey.includes("produto") ||
          assetKey.includes("product")
        );
      });

      if (bestSellerAssets.length) {
        return bestSellerAssets.slice(0, section.commerce?.limit || section.layout.columns || 3);
      }
    }

    if (
      section.type === "gallery" ||
      sectionKey.includes("novidade") ||
      sectionKey.includes("galeria") ||
      sectionKey.includes("gallery")
    ) {
      const galleryAssets = usableAssets.filter((asset) => {
        const assetKey = asset.id.toLowerCase();

        return (
          assetKey.includes("novidade") ||
          assetKey.includes("new") ||
          assetKey.includes("gallery") ||
          assetKey.includes("galeria")
        );
      });

      if (galleryAssets.length) {
        return galleryAssets.slice(0, section.commerce?.limit || section.layout.columns || 4);
      }
    }

    return usableAssets.slice(0, section.commerce?.limit || section.layout.columns || 3);
  }

  private static renderElementStyle(
    element: ImageTemplateElement,
  ): string {
    const style = element.style;
    if (!style) return "";

    return [
      style.color ? `--element-color:${this.escapeAttribute(style.color)}` : "",
      style.backgroundColor ? `--element-background:${this.escapeAttribute(style.backgroundColor)}` : "",
      style.fontSize ? `--element-font-size:${style.fontSize}px` : "",
      style.fontWeight ? `--element-font-weight:${style.fontWeight}` : "",
      style.fontFamily ? `--element-font-family:"${this.escapeCSS(style.fontFamily)}"` : "",
      style.lineHeight ? `--element-line-height:${style.lineHeight}` : "",
      style.letterSpacing !== undefined ? `--element-letter-spacing:${style.letterSpacing}px` : "",
      style.textAlign ? `--element-text-align:${style.textAlign}` : "",
      style.width ? `--element-width:${this.escapeAttribute(style.width)}` : "",
      style.maxWidth ? `--element-max-width:${this.escapeAttribute(style.maxWidth)}` : "",
      style.borderRadius !== undefined ? `--element-border-radius:${style.borderRadius}px` : "",
      style.shadow ? `--element-shadow:${this.escapeCSS(style.shadow)}` : "",
    ]
      .filter(Boolean)
      .join(";");
  }

  private static cssVarPx(name: string, value?: number): string {
    return value !== undefined ? `${name}:${value}px` : "";
  }

  private static alignItems(
    alignment?: "left" | "center" | "right",
  ): string {
    if (alignment === "center") return "center";
    if (alignment === "right") return "flex-end";
    return "flex-start";
  }

  private static findAsset(
    assetId: string | undefined,
    assets: ImageTemplateAsset[],
  ): ImageTemplateAsset | undefined {
    if (!assetId) return undefined;
    return assets.find((asset) => asset.id === assetId);
  }

  private static resolveAssetUrl(asset: ImageTemplateAsset): string {
    if (/^https?:\/\//i.test(asset.url)) return asset.url;

    const publicApiUrl = this.getPublicApiUrl();

    if (asset.url.startsWith("/") && publicApiUrl) {
      return `${publicApiUrl}${asset.url}`;
    }

    return asset.url;
  }

  private static getPublicApiUrl(): string {
    return String(
      process.env.API_PUBLIC_URL ||
      process.env.BACKEND_PUBLIC_URL ||
      "",
    ).replace(/\/+$/, "");
  }

  private static buildGoogleFontsUrl(spec: ImageTemplateSpec): string {
    const fonts = Array.from(
      new Set([spec.theme.headingFont, spec.theme.bodyFont].filter(Boolean)),
    )
      .map((font) => `family=${font.trim().replace(/\s+/g, "+")}:wght@300;400;500;600;700;800`)
      .join("&");

    return `https://fonts.googleapis.com/css2?${fonts}&display=swap`;
  }

  private static shortText(value: string, max: number): string {
    const normalized = String(value || "").replace(/\s+/g, " ").trim();
    if (normalized.length <= max) return normalized;
    return `${normalized.slice(0, max - 3).trim()}...`;
  }

  private static escapeHtml(value: string): string {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  private static escapeAttribute(value: string): string {
    return this.escapeHtml(value);
  }

  private static escapeCSS(value: string): string {
    return String(value).replace(/["'\\\n\r]/g, "");
  }

  private static normalizeWideElements(
    elements: ImageTemplateElement[],
  ): ImageTemplateElement[] {
    const hasProductGrid = elements.some(
      (element) => element.type === "product-grid",
    );

    if (hasProductGrid) {
      const firstProductGrid = elements.find(
        (element) => element.type === "product-grid",
      );

      return firstProductGrid ? [firstProductGrid] : [];
    }

    const hasServiceGrid = elements.some(
      (element) => element.type === "service-grid",
    );

    if (hasServiceGrid) {
      const firstServiceGrid = elements.find(
        (element) => element.type === "service-grid",
      );

      return firstServiceGrid ? [firstServiceGrid] : [];
    }

    return [];
  }
}
