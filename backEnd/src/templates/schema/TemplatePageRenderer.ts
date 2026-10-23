import type {
  TemplateAction,
  TemplateButton,
  TemplateMedia,
  TemplatePage,
  TemplateSection,
} from "./TemplatePageSchema";

export class TemplatePageRenderer {
  static renderDocument(page: TemplatePage): string {
    const traceId = `tpl-${Date.now()}`;
    const html = this.render(page);
    const css = this.renderCSS(page);

    console.log(`[${traceId}] TemplatePageRenderer.renderDocument`);

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${this.escapeHtml(page.name)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${this.googleFontsUrl(page)}" rel="stylesheet">
<style>
${css}
</style>
</head>
<body>
${html}
</body>
</html>`;
  }

  static render(page: TemplatePage): string {
    return (page.sections || [])
      .filter((section) => !section.hidden)
      .map((section) => this.renderSection(section, page))
      .join("\n");
  }

  static renderCSS(page: TemplatePage): string {
    const theme = page.theme;

    return `
:root {
  --page-primary: ${theme.primaryColor || "#b8856d"};
  --page-secondary: ${theme.secondaryColor || theme.primaryColor || "#d9c0a8"};
  --page-bg: ${theme.backgroundColor || "#fbf6ed"};
  --page-surface: ${theme.surfaceColor || "#ffffff"};
  --page-text: ${theme.textColor || "#34231f"};
  --page-muted: ${theme.mutedTextColor || theme.textColor || "#75625a"};
  --page-heading-font: "${this.escapeCSS(theme.headingFont || "Georgia")}", serif;
  --page-body-font: "${this.escapeCSS(theme.bodyFont || "Montserrat")}", sans-serif;
  --page-radius-md: ${theme.borderRadius ?? 12}px;
  --page-radius-pill: 999px;
  --page-section-y: ${theme.spacing === "compact" ? 48 : theme.spacing === "spacious" ? 96 : 72}px;
  --page-container-x: 24px;
  --page-gap: 32px;
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  overflow-x: hidden;
  background: var(--page-bg);
  color: var(--page-text);
  font-family: var(--page-body-font);
}

img,
video,
iframe {
  display: block;
  max-width: 100%;
}

a {
  color: inherit;
}

.page-section {
  position: relative;
  width: 100%;
  padding:
    var(--section-padding-top, var(--page-section-y))
    var(--section-padding-right, var(--page-container-x))
    var(--section-padding-bottom, var(--page-section-y))
    var(--section-padding-left, var(--page-container-x));
  background-color: var(--section-bg, transparent);
  background-image: var(--section-bg-image, none);
  background-repeat: no-repeat;
  background-position: var(--section-bg-position, center center);
  background-size: var(--section-bg-size, cover);
}

.page-section::before {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: var(--section-overlay-color, transparent);
  content: "";
  opacity: var(--section-overlay-opacity, 0);
  pointer-events: none;
}

.page-section__inner {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: var(--section-grid, 1fr);
  align-items: center;
  justify-items: var(--section-justify, stretch);
  gap: var(--section-gap, var(--page-gap));
  width: min(var(--section-width, 1120px), 100%);
  min-height: var(--section-min-height, auto);
  margin: 0 auto;
}

.page-navbar {
  padding-top: 18px;
  padding-bottom: 18px;
}

.page-navbar .page-section__inner {
  display: flex;
  justify-content: space-between;
  min-height: 0;
}

.page-logo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-family: var(--page-heading-font);
  font-size: 30px;
  font-weight: 700;
  text-decoration: none;
}

.page-logo img {
  max-height: 48px;
  width: auto;
}

.page-nav-links {
  display: flex;
  align-items: center;
  gap: 28px;
}

.page-nav-links a {
  color: var(--page-muted);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
}

.page-heading {
  margin: 0 0 18px;
  color: var(--page-text);
  font-family: var(--page-heading-font);
  font-size: clamp(34px, 5vw, 72px);
  font-weight: 650;
  line-height: 1.04;
  white-space: pre-line;
}

.page-kicker,
.page-subtitle,
.page-text {
  max-width: 680px;
  margin: 0 0 22px;
  color: var(--page-muted);
  font-size: 16px;
  line-height: 1.7;
}

.page-kicker {
  color: var(--page-primary);
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.page-button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.page-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  border: 1px solid transparent;
  border-radius: var(--page-radius-pill);
  padding: 11px 24px;
  background: var(--page-primary);
  color: #fff;
  font-size: 14px;
  font-weight: 800;
  text-decoration: none;
}

.page-button--secondary {
  border-color: currentColor;
  background: transparent;
  color: var(--page-primary);
}

.page-button--text {
  min-height: auto;
  padding-left: 0;
  padding-right: 0;
  background: transparent;
  color: var(--page-primary);
}

.page-media img,
.page-about-media img {
  width: 100%;
  border-radius: var(--page-radius-md);
  object-fit: cover;
}

.page-products-grid,
.page-services-grid,
.page-gallery-grid {
  display: grid;
  grid-template-columns: repeat(var(--section-columns, 3), minmax(0, 1fr));
  gap: var(--section-gap, var(--page-gap));
}

.page-card {
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: var(--page-radius-md);
  background: var(--page-surface);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.06);
}

.page-card__image {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
}

.page-card__body {
  padding: 18px;
}

.page-card__title {
  margin: 0 0 8px;
  color: var(--page-text);
  font-family: var(--page-heading-font);
  font-size: 20px;
  line-height: 1.15;
}

.page-card__description {
  margin: 0 0 14px;
  color: var(--page-muted);
  font-size: 14px;
  line-height: 1.55;
}

.page-card__price {
  margin: 0 0 14px;
  color: var(--page-primary);
  font-size: 16px;
  font-weight: 900;
}

.page-gallery-grid img {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: var(--page-radius-md);
  object-fit: cover;
}

.page-faq-list {
  display: grid;
  gap: 12px;
}

.page-faq-item {
  border-radius: var(--page-radius-md);
  padding: 18px;
  background: var(--page-surface);
}

.page-faq-item h3 {
  margin: 0 0 8px;
  font-size: 18px;
}

.page-faq-item p {
  margin: 0;
  color: var(--page-muted);
  line-height: 1.6;
}

.page-footer {
  color: var(--page-muted);
}

.page-footer .page-section__inner {
  align-items: start;
}

.page-footer-links {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.page-footer a {
  text-decoration: none;
}

@media (max-width: 900px) {
  .page-section__inner {
    grid-template-columns: 1fr;
  }

  .page-nav-links {
    display: none;
  }

  .page-products-grid,
  .page-services-grid,
  .page-gallery-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .page-products-grid,
  .page-services-grid,
  .page-gallery-grid {
    grid-template-columns: 1fr;
  }

  .page-heading {
    font-size: 38px;
  }
}
`;
  }

  private static renderSection(
    section: TemplateSection,
    page: TemplatePage,
  ): string {
    switch (section.type) {
      case "navbar":
        return this.renderNavbar(section, page);

      case "hero":
        return this.renderHero(section, page);

      case "products":
        return this.renderProducts(section, page);

      case "services":
        return this.renderServices(section, page);

      case "about":
        return this.renderAbout(section, page);

      case "gallery":
        return this.renderGallery(section, page);

      case "video":
        return this.renderVideo(section, page);

      case "cta":
        return this.renderCTA(section, page);

      case "faq":
        return this.renderFAQ(section, page);

      case "footer":
        return this.renderFooter(section, page);

      case "custom":
        return (section.content as any)?.html || "";

      default:
        return "";
    }
  }

  private static renderNavbar(
    section: TemplateSection,
    page: TemplatePage,
  ): string {
    const content = this.content(section);
    const logo = this.findMedia(content.logoMediaId, page.media);
    const links = Array.isArray(content.links) ? content.links : [];

    return `
<nav class="page-section page-navbar" style="${this.sectionStyle(section, page)}">
  <div class="page-section__inner">
    <a class="page-logo" href="#">
      ${logo ? `<img src="${this.escapeAttribute(logo.url)}" alt="${this.escapeAttribute(logo.alt || content.logoText || page.name)}">` : ""}
      <span>${this.escapeHtml(content.logoText || content.brand || page.name)}</span>
    </a>

    <div class="page-nav-links">
      ${links.map((link: any) => this.renderActionLink(link.label, link.action, link.href)).join("\n")}
    </div>
  </div>
</nav>`;
  }

  private static renderHero(
    section: TemplateSection,
    page: TemplatePage,
  ): string {
    const content = this.content(section);
    const media = this.findMedia(content.mediaId, page.media);

    return `
<section id="${this.escapeAttribute(section.id)}" class="page-section page-hero" style="${this.sectionStyle(section, page)}">
  <div class="page-section__inner">
    <div>
      ${content.eyebrow ? `<p class="page-kicker">${this.escapeHtml(content.eyebrow)}</p>` : ""}
      <h1 class="page-heading">${this.escapeHtml(content.title || page.name)}</h1>
      ${content.subtitle ? `<p class="page-subtitle">${this.escapeHtml(content.subtitle)}</p>` : ""}
      ${content.description ? `<p class="page-text">${this.escapeHtml(content.description)}</p>` : ""}
      ${this.renderButtons(this.getButtons(content))}
    </div>

    ${media ? `<div class="page-media"><img src="${this.escapeAttribute(media.url)}" alt="${this.escapeAttribute(media.alt || content.title || page.name)}"></div>` : ""}
  </div>
</section>`;
  }

  private static renderProducts(
    section: TemplateSection,
    page: TemplatePage,
  ): string {
    const content = this.content(section);
    const cards = Array.isArray(content.cards) ? content.cards : [];

    return `
<section id="${this.escapeAttribute(section.id)}" class="page-section page-products" style="${this.sectionStyle(section, page)}">
  <div class="page-section__inner">
    <div>
      ${content.title ? `<h2 class="page-heading">${this.escapeHtml(content.title)}</h2>` : ""}
      ${content.subtitle ? `<p class="page-subtitle">${this.escapeHtml(content.subtitle)}</p>` : ""}

      <div class="page-products-grid" style="--section-columns:${section.layout.columns || 3}">
        ${cards.map((card: any) => {
          const image = this.findMedia(card.imageMediaId, page.media);

          return `
<article class="page-card" data-product-id="${this.escapeAttribute(card.productId || card.id || "")}">
  ${image ? `<img class="page-card__image" src="${this.escapeAttribute(image.url)}" alt="${this.escapeAttribute(image.alt || card.title || "")}">` : ""}
  <div class="page-card__body">
    <h3 class="page-card__title">${this.escapeHtml(card.title || "Produto")}</h3>
    ${card.description ? `<p class="page-card__description">${this.escapeHtml(card.description)}</p>` : ""}
    ${card.oldPriceText ? `<p class="page-card__description">${this.escapeHtml(card.oldPriceText)}</p>` : ""}
    ${card.priceText ? `<p class="page-card__price">${this.escapeHtml(card.priceText)}</p>` : ""}
    ${card.button ? this.renderButton(card.button) : ""}
  </div>
</article>`;
        }).join("\n")}
      </div>
    </div>
  </div>
</section>`;
  }

  private static renderServices(
    section: TemplateSection,
    page: TemplatePage,
  ): string {
    const content = this.content(section);
    const cards = Array.isArray(content.cards) ? content.cards : [];

    return `
<section id="${this.escapeAttribute(section.id)}" class="page-section page-services" style="${this.sectionStyle(section, page)}">
  <div class="page-section__inner">
    <div>
      ${content.title ? `<h2 class="page-heading">${this.escapeHtml(content.title)}</h2>` : ""}
      ${content.subtitle ? `<p class="page-subtitle">${this.escapeHtml(content.subtitle)}</p>` : ""}

      <div class="page-services-grid" style="--section-columns:${section.layout.columns || 3}">
        ${cards.map((card: any) => {
          const image = this.findMedia(card.imageMediaId || card.iconMediaId, page.media);

          return `
<article class="page-card">
  ${image ? `<img class="page-card__image" src="${this.escapeAttribute(image.url)}" alt="${this.escapeAttribute(image.alt || card.title || "")}">` : ""}
  <div class="page-card__body">
    <h3 class="page-card__title">${this.escapeHtml(card.title || "Servico")}</h3>
    ${card.description ? `<p class="page-card__description">${this.escapeHtml(card.description)}</p>` : ""}
    ${card.button ? this.renderButton(card.button) : ""}
  </div>
</article>`;
        }).join("\n")}
      </div>
    </div>
  </div>
</section>`;
  }

  private static renderAbout(
    section: TemplateSection,
    page: TemplatePage,
  ): string {
    const content = this.content(section);
    const media = this.findMedia(content.mediaId, page.media);

    return `
<section id="${this.escapeAttribute(section.id)}" class="page-section page-about" style="${this.sectionStyle(section, page)}">
  <div class="page-section__inner">
    <div>
      <h2 class="page-heading">${this.escapeHtml(content.title || "Sobre")}</h2>
      ${content.description ? `<p class="page-text">${this.escapeHtml(content.description)}</p>` : ""}
      ${content.button ? this.renderButton(content.button) : ""}
    </div>

    ${media ? `<div class="page-about-media"><img src="${this.escapeAttribute(media.url)}" alt="${this.escapeAttribute(media.alt || content.title || "")}"></div>` : ""}
  </div>
</section>`;
  }

  private static renderGallery(
    section: TemplateSection,
    page: TemplatePage,
  ): string {
    const content = this.content(section);
    const mediaIds = Array.isArray(content.mediaIds) ? content.mediaIds : [];

    return `
<section id="${this.escapeAttribute(section.id)}" class="page-section page-gallery" style="${this.sectionStyle(section, page)}">
  <div class="page-section__inner">
    <div>
      ${content.title ? `<h2 class="page-heading">${this.escapeHtml(content.title)}</h2>` : ""}
      ${content.subtitle ? `<p class="page-subtitle">${this.escapeHtml(content.subtitle)}</p>` : ""}
      <div class="page-gallery-grid" style="--section-columns:${section.layout.columns || 4}">
        ${mediaIds.map((mediaId: string) => {
          const media = this.findMedia(mediaId, page.media);
          if (!media) return "";

          return `<img src="${this.escapeAttribute(media.url)}" alt="${this.escapeAttribute(media.alt || "")}">`;
        }).join("\n")}
      </div>
    </div>
  </div>
</section>`;
  }

  private static renderVideo(
    section: TemplateSection,
    page: TemplatePage,
  ): string {
    const content = this.content(section);
    const video = this.findMedia(content.videoMediaId, page.media);
    const poster = this.findMedia(content.posterMediaId, page.media);
    const videoUrl = video?.url || content.videoUrl;

    return `
<section id="${this.escapeAttribute(section.id)}" class="page-section page-video" style="${this.sectionStyle(section, page)}">
  <div class="page-section__inner">
    <div>
      ${content.title ? `<h2 class="page-heading">${this.escapeHtml(content.title)}</h2>` : ""}
      ${content.description ? `<p class="page-text">${this.escapeHtml(content.description)}</p>` : ""}
      ${
        videoUrl
          ? `<video controls ${poster ? `poster="${this.escapeAttribute(poster.url)}"` : ""}>
              <source src="${this.escapeAttribute(videoUrl)}">
            </video>`
          : ""
      }
    </div>
  </div>
</section>`;
  }

  private static renderCTA(
    section: TemplateSection,
    page: TemplatePage,
  ): string {
    const content = this.content(section);

    return `
<section id="${this.escapeAttribute(section.id)}" class="page-section page-cta" style="${this.sectionStyle(section, page)}">
  <div class="page-section__inner">
    <div>
      <h2 class="page-heading">${this.escapeHtml(content.title || "Fale conosco")}</h2>
      ${content.description ? `<p class="page-text">${this.escapeHtml(content.description)}</p>` : ""}
      ${this.renderButtons(this.getButtons(content))}
    </div>
  </div>
</section>`;
  }

  private static renderFAQ(
    section: TemplateSection,
    page: TemplatePage,
  ): string {
    const content = this.content(section);
    const items = Array.isArray(content.items) ? content.items : [];

    return `
<section id="${this.escapeAttribute(section.id)}" class="page-section page-faq" style="${this.sectionStyle(section, page)}">
  <div class="page-section__inner">
    <div>
      ${content.title ? `<h2 class="page-heading">${this.escapeHtml(content.title)}</h2>` : ""}
      <div class="page-faq-list">
        ${items.map((item: any) => `
          <article class="page-faq-item">
            <h3>${this.escapeHtml(item.question || "")}</h3>
            <p>${this.escapeHtml(item.answer || "")}</p>
          </article>
        `).join("\n")}
      </div>
    </div>
  </div>
</section>`;
  }

  private static renderFooter(
    section: TemplateSection,
    page: TemplatePage,
  ): string {
    const content = this.content(section);
    const links = Array.isArray(content.links) ? content.links : [];
    const logo = this.findMedia(content.logoMediaId, page.media);

    return `
<footer id="${this.escapeAttribute(section.id)}" class="page-section page-footer" style="${this.sectionStyle(section, page)}">
  <div class="page-section__inner">
    <div>
      ${logo ? `<img src="${this.escapeAttribute(logo.url)}" alt="${this.escapeAttribute(logo.alt || content.brand || page.name)}" style="max-height:48px;width:auto;margin-bottom:12px">` : ""}
      <strong>${this.escapeHtml(content.brand || page.name)}</strong>
      ${content.description ? `<p class="page-text">${this.escapeHtml(content.description)}</p>` : ""}
    </div>

    ${
      links.length
        ? `<div class="page-footer-links">${links.map((link: any) => this.renderActionLink(link.label, link.action, link.href)).join("\n")}</div>`
        : ""
    }
  </div>
</footer>`;
  }

  private static sectionStyle(
    section: TemplateSection,
    page: TemplatePage,
  ): string {
    const layout = section.layout || ({ direction: "column" } as any);
    const bgMedia = this.findMedia(layout.backgroundMediaId, page.media);
    const justify =
      layout.contentPosition === "left"
        ? "start"
        : layout.contentPosition === "right"
          ? "end"
          : "center";

    const styles = [
      layout.backgroundColor
        ? `--section-bg:${this.escapeAttribute(layout.backgroundColor)}`
        : "",
      bgMedia
        ? `--section-bg-image:url('${this.escapeAttribute(bgMedia.url)}')`
        : "",
      layout.backgroundPosition
        ? `--section-bg-position:${this.escapeAttribute(layout.backgroundPosition)}`
        : "",
      layout.backgroundSize
        ? `--section-bg-size:${this.escapeAttribute(layout.backgroundSize)}`
        : "",
      layout.overlayColor
        ? `--section-overlay-color:${this.escapeAttribute(layout.overlayColor)}`
        : "",
      layout.overlayOpacity !== undefined
        ? `--section-overlay-opacity:${layout.overlayOpacity}`
        : "",
      layout.contentWidth
        ? `--section-width:${layout.contentWidth}px`
        : "",
      layout.minHeight
        ? `--section-min-height:${layout.minHeight}px`
        : "",
      layout.paddingTop
        ? `--section-padding-top:${layout.paddingTop}px`
        : "",
      layout.paddingRight
        ? `--section-padding-right:${layout.paddingRight}px`
        : "",
      layout.paddingBottom
        ? `--section-padding-bottom:${layout.paddingBottom}px`
        : "",
      layout.paddingLeft
        ? `--section-padding-left:${layout.paddingLeft}px`
        : "",
      layout.gap
        ? `--section-gap:${layout.gap}px`
        : "",
      layout.columns
        ? `--section-columns:${layout.columns}`
        : "",
      `--section-justify:${justify}`,
      layout.direction === "row"
        ? `--section-grid:repeat(${layout.columns || 2}, minmax(0, 1fr))`
        : "--section-grid:1fr",
    ];

    return styles.filter(Boolean).join(";");
  }

  private static getButtons(content: any): TemplateButton[] {
    if (Array.isArray(content.buttons)) {
      return content.buttons;
    }

    if (content.button) {
      return [content.button];
    }

    return [];
  }

  private static renderButtons(
    buttons?: TemplateButton[],
  ): string {
    if (!buttons?.length) return "";

    return `
<div class="page-button-row">
  ${buttons.map((button) => this.renderButton(button)).join("\n")}
</div>`;
  }

  private static renderButton(button: TemplateButton): string {
    return `
<a
  class="page-button page-button--${this.escapeAttribute(button.variant || "primary")}"
  href="${this.escapeAttribute(this.actionHref(button.action))}"
  data-action="${this.escapeAttribute(button.action.type)}"
  ${button.action.productId ? `data-product-id="${this.escapeAttribute(button.action.productId)}"` : ""}
>
  ${this.escapeHtml(button.label)}
</a>`;
  }

  private static renderActionLink(
    label: string,
    action?: TemplateAction,
    href?: string,
  ): string {
    const finalAction = action || {
      type: "navigate",
      href: href || "#",
    } as TemplateAction;

    return `
<a
  href="${this.escapeAttribute(this.actionHref(finalAction))}"
  data-action="${this.escapeAttribute(finalAction.type)}"
  ${finalAction.productId ? `data-product-id="${this.escapeAttribute(finalAction.productId)}"` : ""}
>
  ${this.escapeHtml(label)}
</a>`;
  }

  private static actionHref(action: TemplateAction): string {
    if (action.href) return action.href;
    if (action.target) return action.target;
    return "#";
  }

  private static content(section: TemplateSection): any {
    return (section as any).content || {};
  }

  private static findMedia(
    mediaId: string | undefined,
    media: TemplateMedia[],
  ): TemplateMedia | undefined {
    if (!mediaId) return undefined;

    return media.find((item) => item.id === mediaId);
  }

  private static googleFontsUrl(page: TemplatePage): string {
    const fonts = Array.from(
      new Set([
        page.theme.headingFont || "Montserrat",
        page.theme.bodyFont || "Montserrat",
      ]),
    )
      .map((font) => `family=${font.replace(/\s+/g, "+")}:wght@300;400;500;600;700;800`)
      .join("&");

    return `https://fonts.googleapis.com/css2?${fonts}&display=swap`;
  }

  private static escapeHtml(value: unknown): string {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  private static escapeAttribute(value: unknown): string {
    return this.escapeHtml(value);
  }

  private static escapeCSS(value: unknown): string {
    return String(value ?? "").replace(/["'\\\n\r]/g, "");
  }
}
