import type {
  ManualImageTemplate,
  ManualTemplateCard,
  ManualTemplateSection,
} from "./ImageTemplateManualTypes";

type HeaderNavItem = {
  label: string;
  href: string;
};

type HeaderContentExtras = {
  logo?: string;
  logoUrl?: string;
  nav?: HeaderNavItem[];
};

export class ImageTemplateManualRenderer {
  static renderDocument(template: ManualImageTemplate): string {
    const html = this.render(template);
    const css = this.renderCSS(template);

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${this.escapeHtml(template.name)}</title>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${this.googleFontsUrl(template)}" rel="stylesheet">

<style>
${css}
</style>
</head>
<body>
${html}
</body>
</html>`;
  }

  static render(template: ManualImageTemplate): string {
    return template.sections
      .map((section) => this.renderSection(section, template))
      .join("\n");
  }

  static renderCSS(template: ManualImageTemplate): string {
    const theme = template.theme;

    return `
:root {
  --gc-primary: ${theme.primaryColor};
  --gc-secondary: ${theme.secondaryColor};
  --gc-bg: ${theme.backgroundColor};
  --gc-surface: ${theme.surfaceColor};
  --gc-text: ${theme.textColor};
  --gc-muted: ${theme.mutedTextColor};
  --gc-radius: ${theme.borderRadius}px;
  --gc-heading-font: "${this.escapeCSS(theme.headingFont)}", serif;
  --gc-body-font: "${this.escapeCSS(theme.bodyFont)}", sans-serif;
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
  background: var(--gc-bg);
  color: var(--gc-text);
  font-family: var(--gc-body-font);
}

img {
  display: block;
  max-width: 100%;
}

a {
  color: inherit;
}

.manual-template-section {
  position: relative;
  width: 100%;
  padding: var(--section-padding-top, 72px) 24px var(--section-padding-bottom, 72px);
  background-color: var(--section-bg, transparent);
  background-image: var(--section-bg-image, none);
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
}

.manual-template-inner {
  display: grid;
  grid-template-columns: var(--section-grid, 1fr);
  align-items: center;
  gap: var(--section-gap, 32px);
  width: min(var(--section-width, 1120px), 100%);
  min-height: var(--section-min-height, auto);
  margin: 0 auto;
}

.manual-header {
  position: sticky;
  top: 0;
  z-index: 20;
  padding-top: 16px;
  padding-bottom: 16px;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.05);
}

.manual-header .manual-template-inner {
  display: flex;
  justify-content: space-between;
  min-height: 0;
}

.manual-logo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--gc-text);
  font-family: var(--gc-heading-font);
  font-size: 38px;
  font-weight: 500;
  font-style: italic;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
}

.manual-logo img {
  display: block;
  width: auto;
  max-width: 180px;
  max-height: 54px;
  object-fit: contain;
}

.manual-nav {
  display: flex;
  align-items: center;
  gap: 42px;
  color: var(--gc-muted);
  font-size: 14px;
}

.manual-nav a {
  color: inherit;
  font-weight: 500;
  text-decoration: none;
}

.manual-nav a:hover {
  color: var(--gc-text);
}

.manual-hero-content,
.manual-section-content {
  text-align: var(--section-text-align, left);
}

.manual-hero-title {
  max-width: 520px;
  margin: 0 0 24px;
  color: var(--gc-text);
  font-family: var(--gc-heading-font);
  font-size: clamp(46px, 6vw, 74px);
  font-weight: 500;
  line-height: 0.96;
  white-space: pre-line;
}

.manual-section-title {
  margin: 0 0 34px;
  color: var(--gc-text);
  font-family: var(--gc-heading-font);
  font-size: clamp(32px, 4vw, 44px);
  font-weight: 600;
  line-height: 1.1;
  text-align: center;
}

.manual-subtitle,
.manual-description {
  max-width: 620px;
  margin: 0 0 28px;
  color: var(--gc-muted);
  font-size: 16px;
  line-height: 1.7;
}

.manual-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 168px;
  min-height: 44px;
  border-radius: 999px;
  padding: 11px 28px;
  background: var(--gc-primary);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
}

.manual-products,
.manual-gallery {
  display: grid;
  grid-template-columns: repeat(var(--section-columns, 3), minmax(0, 1fr));
  gap: var(--section-gap, 28px);
}

.manual-card {
  overflow: hidden;
  border: 1px solid rgba(111, 70, 56, 0.12);
  border-radius: var(--gc-radius);
  background: var(--gc-surface);
}

.manual-card-image {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
}

.manual-card-body {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 14px;
  padding: 20px 18px 18px;
}

.manual-card-title {
  grid-column: 1 / -1;
  margin: 0;
  color: var(--gc-muted);
  font-size: 14px;
  font-weight: 400;
}

.manual-card-price {
  margin: 0;
  color: var(--gc-text);
  font-size: 15px;
  font-weight: 700;
}

.manual-card-button {
  border-radius: 999px;
  padding: 9px 20px;
  background: color-mix(in srgb, var(--gc-primary) 65%, white);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}

.manual-about-media img {
  width: 100%;
  border-radius: var(--gc-radius);
  object-fit: cover;
}

.manual-template-section--about .manual-template-inner {
  grid-template-columns: 0.9fr 1.1fr;
}

.manual-template-section--about .manual-section-title {
  text-align: left;
}

.manual-template-section--about .manual-section-content {
  order: 1;
}

.manual-template-section--about .manual-about-media {
  order: 2;
}

@media (max-width: 900px) {
  .manual-template-inner,
  .manual-template-section--about .manual-template-inner {
    grid-template-columns: 1fr;
  }

  .manual-header .manual-template-inner {
    align-items: center;
  }

  .manual-nav {
    display: none;
  }

  .manual-products,
  .manual-gallery {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .manual-hero-title {
    font-size: 44px;
  }
}

@media (max-width: 560px) {
  .manual-products,
  .manual-gallery {
    grid-template-columns: 1fr;
  }

  .manual-template-section {
    padding-left: 16px;
    padding-right: 16px;
  }
}
`;
  }

  private static renderSection(
    section: ManualTemplateSection,
    template: ManualImageTemplate,
  ): string {
    switch (section.type) {
      case "header":
        return this.renderHeader(section, template);

      case "hero":
        return this.renderHero(section);

      case "products":
        return this.renderProducts(section);

      case "about":
        return this.renderAbout(section);

      case "gallery":
        return this.renderGallery(section);

      default:
        return "";
    }
  }

  private static renderHeader(
    section: ManualTemplateSection,
    template: ManualImageTemplate,
  ): string {
    const content = section.content as
      | (typeof section.content & HeaderContentExtras)
      | undefined;

    const nav =
      content?.nav && content.nav.length
        ? content.nav
        : [
          { label: "Inicio", href: "#hero" },
          { label: "Colecoes", href: "#best-sellers" },
          { label: "Sobre", href: "#about" },
          { label: "Novidades", href: "#novidades" },
        ];

    const logoText =
      content?.logo ||
      content?.title ||
      template.name ||
      "Logo";

    return `
<header
  class="manual-template-section manual-header"
  style="${this.sectionStyle(section)}"
>
  <div class="manual-template-inner">
    <a
      class="manual-logo"
      href="#hero"
      aria-label="${this.escapeAttribute(logoText)}"
    >
      ${content?.logoUrl
        ? `<img src="${this.escapeAttribute(content.logoUrl)}" alt="${this.escapeAttribute(logoText)}">`
        : `<span>${this.escapeHtml(logoText)}</span>`
      }
    </a>

    <nav class="manual-nav" aria-label="Menu principal">
      ${nav
        .map(
          (item) =>
            `<a href="${this.escapeAttribute(item.href)}">${this.escapeHtml(item.label)}</a>`,
        )
        .join("\n")}
    </nav>
  </div>
</header>`;
  }

  private static renderHero(section: ManualTemplateSection): string {
    return `
<section
  id="${this.escapeAttribute(section.id)}"
  class="manual-template-section manual-template-section--hero"
  style="${this.sectionStyle(section)}"
>
  <div class="manual-template-inner">
    <div class="manual-hero-content">
      <h1 class="manual-hero-title">
        ${this.escapeHtml(section.content?.title || "")}
      </h1>
      ${section.content?.subtitle
        ? `<p class="manual-subtitle">${this.escapeHtml(section.content.subtitle)}</p>`
        : ""
      }
      ${this.renderButton(section.content?.buttonText, section.content?.buttonUrl)}
    </div>
  </div>
</section>`;
  }

  private static renderProducts(section: ManualTemplateSection): string {
    return `
<section
  id="${this.escapeAttribute(section.id)}"
  class="manual-template-section manual-template-section--products"
  style="${this.sectionStyle(section)}"
>
  <div class="manual-template-inner">
    <div>
      <h2 class="manual-section-title">
        ${this.escapeHtml(section.content?.title || "")}
      </h2>
      <div class="manual-products">
        ${(section.cards || []).map((card) => this.renderCard(card)).join("\n")}
      </div>
    </div>
  </div>
</section>`;
  }

  private static renderAbout(section: ManualTemplateSection): string {
    const imageCard = section.cards?.find((card) => card.image);

    return `
<section
  id="${this.escapeAttribute(section.id)}"
  class="manual-template-section manual-template-section--about"
  style="${this.sectionStyle(section)}"
>
  <div class="manual-template-inner">
    <div class="manual-section-content">
      <h2 class="manual-section-title">
        ${this.escapeHtml(section.content?.title || "")}
      </h2>
      ${section.content?.description
        ? `<p class="manual-description">${this.escapeHtml(section.content.description)}</p>`
        : ""
      }
      ${this.renderButton(section.content?.buttonText, section.content?.buttonUrl)}
    </div>

    ${imageCard?.image
        ? `<div class="manual-about-media">
            <img src="${this.escapeAttribute(imageCard.image)}" alt="${this.escapeAttribute(imageCard.title || "")}">
          </div>`
        : ""
      }
  </div>
</section>`;
  }

  private static renderGallery(section: ManualTemplateSection): string {
    return `
<section
  id="${this.escapeAttribute(section.id)}"
  class="manual-template-section manual-template-section--gallery"
  style="${this.sectionStyle(section)}"
>
  <div class="manual-template-inner">
    <div>
      <h2 class="manual-section-title">
        ${this.escapeHtml(section.content?.title || "")}
      </h2>
      <div class="manual-gallery">
        ${(section.cards || []).map((card) => this.renderCard(card)).join("\n")}
      </div>
    </div>
  </div>
</section>`;
  }

  private static renderCard(card: ManualTemplateCard): string {
    return `
<article class="manual-card">
  ${card.image
        ? `<img class="manual-card-image" src="${this.escapeAttribute(card.image)}" alt="${this.escapeAttribute(card.title || "")}">`
        : ""
      }
  <div class="manual-card-body">
    <h3 class="manual-card-title">
      ${this.escapeHtml(card.title || "")}
    </h3>
    ${card.price
        ? `<p class="manual-card-price">${this.escapeHtml(card.price)}</p>`
        : "<span></span>"
      }
    ${card.buttonText
        ? `<a class="manual-card-button" href="${this.escapeAttribute(card.buttonUrl || "#")}">${this.escapeHtml(card.buttonText)}</a>`
        : ""
      }
  </div>
</article>`;
  }

  private static renderButton(
    label?: string,
    href?: string,
  ): string {
    if (!label) return "";

    return `
<a class="manual-button" href="${this.escapeAttribute(href || "#")}">
  ${this.escapeHtml(label)}
</a>`;
  }

  private static sectionStyle(section: ManualTemplateSection): string {
  const styles = [
    section.backgroundColor
      ? `--section-bg:${this.escapeAttribute(section.backgroundColor)}`
      : "",

    section.type !== "header" && section.backgroundImage
      ? `--section-bg-image:url('${this.escapeAttribute(section.backgroundImage)}')`
      : "",

    section.layout.contentWidth
      ? `--section-width:${section.layout.contentWidth}px`
      : "",

    section.layout.minHeight
      ? `--section-min-height:${section.layout.minHeight}px`
      : "",

    section.layout.paddingTop
      ? `--section-padding-top:${section.layout.paddingTop}px`
      : "",

    section.layout.paddingBottom
      ? `--section-padding-bottom:${section.layout.paddingBottom}px`
      : "",

    section.layout.gap
      ? `--section-gap:${section.layout.gap}px`
      : "",

    section.layout.columns
      ? `--section-columns:${section.layout.columns}`
      : "",

    section.layout.direction === "row"
      ? `--section-grid:repeat(${section.layout.columns || 2}, minmax(0, 1fr))`
      : "--section-grid:1fr",
  ];

  return styles.filter(Boolean).join(";");
}

  private static googleFontsUrl(template: ManualImageTemplate): string {
    const fonts = Array.from(
      new Set([
        template.theme.headingFont,
        template.theme.bodyFont,
      ]),
    )
      .map((font) => `family=${font.replace(/\s+/g, "+")}:wght@300;400;500;600;700;800`)
      .join("&");

    return `https://fonts.googleapis.com/css2?${fonts}&display=swap`;
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
}
