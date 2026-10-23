export type ImagePresetProduct = {
  id?: string;
  title: string;
  price?: string;
  imageUrl: string;
  imageAlt?: string;
  buttonText?: string;
  buttonUrl?: string;
};

export type ImagePresetTheme = {
  background?: string;
  surface?: string;
  text?: string;
  muted?: string;
  accent?: string;
  accentSoft?: string;
  headingFont?: string;
  bodyFont?: string;
  logoFont?: string;
};

export type EditorialCommerceTemplate = {
  preset: "editorial-commerce";
  brand: string;
  nav?: Array<{
    label: string;
    href: string;
  }>;
  theme?: ImagePresetTheme;
  hero: {
    title: string;
    subtitle?: string;
    buttonText?: string;
    buttonUrl?: string;
    backgroundImageUrl: string;
  };
  bestSellers: {
    title: string;
    products: ImagePresetProduct[];
  };
  about: {
    title: string;
    description?: string;
    buttonText?: string;
    buttonUrl?: string;
    imageUrl: string;
    imageAlt?: string;
  };
  gallery: {
    title: string;
    products: ImagePresetProduct[];
  };
};

export class ImagePresetTemplateRenderer {
  static renderDocument(template: EditorialCommerceTemplate): string {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(template.brand)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${this.buildFontsUrl(template)}" rel="stylesheet">
  <style>${this.renderCSS(template)}</style>
</head>
<body>
  ${this.render(template)}
</body>
</html>`;
  }

  static render(template: EditorialCommerceTemplate): string {
    return `
${this.renderHeader(template)}
${this.renderHero(template)}
${this.renderProducts(template.bestSellers, "colecoes", false)}
${this.renderAbout(template)}
${this.renderProducts(template.gallery, "pecas", true)}
`;
  }

  private static renderHeader(template: EditorialCommerceTemplate): string {
    const nav = template.nav?.length
      ? template.nav
      : [
          { label: "Coleções", href: "#colecoes" },
          { label: "Peças Únicas", href: "#pecas" },
          { label: "Sobre", href: "#sobre" },
          { label: "Contato", href: "#contato" },
        ];

    return `
<header class="preset-header">
  <a class="preset-brand" href="#inicio">${this.escapeHtml(template.brand)}</a>
  <nav class="preset-nav" aria-label="Navegação principal">
    ${nav
      .map(
        (item) =>
          `<a href="${this.escapeAttribute(item.href)}">${this.escapeHtml(item.label)}</a>`,
      )
      .join("")}
    <span>|</span>
    <a href="#buscar" aria-label="Buscar">⌕</a>
  </nav>
</header>`;
  }

  private static renderHero(template: EditorialCommerceTemplate): string {
    return `
<section
  class="preset-hero"
  id="inicio"
  style="--hero-image:url('${this.escapeAttribute(template.hero.backgroundImageUrl)}')"
>
  <div class="preset-hero__inner">
    <h1>${this.escapeHtml(template.hero.title)}</h1>
    ${template.hero.subtitle ? `<p>${this.escapeHtml(template.hero.subtitle)}</p>` : ""}
    ${
      template.hero.buttonText
        ? `<a class="preset-button" href="${this.escapeAttribute(
            template.hero.buttonUrl || "#colecoes",
          )}">${this.escapeHtml(template.hero.buttonText)}</a>`
        : ""
    }
  </div>
</section>`;
  }

  private static renderProducts(
    section: EditorialCommerceTemplate["bestSellers"],
    id: string,
    compact: boolean,
  ): string {
    return `
<section class="preset-products" id="${this.escapeAttribute(id)}">
  <div class="preset-section-title">
    <span>←</span>
    <h2>${this.escapeHtml(section.title)}</h2>
    <span>→</span>
  </div>
  <div class="preset-product-grid ${compact ? "preset-product-grid--four" : ""}">
    ${section.products.map((product) => this.renderProductCard(product, compact)).join("")}
  </div>
</section>`;
  }

  private static renderProductCard(
    product: ImagePresetProduct,
    compact: boolean,
  ): string {
    return `
<article
  class="preset-product-card"
  data-product-id="${this.escapeAttribute(product.id || "")}"
>
  <img
    src="${this.escapeAttribute(product.imageUrl)}"
    alt="${this.escapeAttribute(product.imageAlt || product.title)}"
    loading="lazy"
  >
  ${
    compact
      ? ""
      : `<div class="preset-product-body">
          <h3>${this.escapeHtml(product.title)}</h3>
          ${product.price ? `<strong>${this.escapeHtml(product.price)}</strong>` : ""}
          <a class="preset-small-button" href="${this.escapeAttribute(
            product.buttonUrl || "#",
          )}">${this.escapeHtml(product.buttonText || "Ver mais")}</a>
        </div>`
  }
</article>`;
  }

  private static renderAbout(template: EditorialCommerceTemplate): string {
    return `
<section class="preset-about" id="sobre">
  <div class="preset-about__inner">
    <div class="preset-about__copy">
      <h2>${this.escapeHtml(template.about.title)}</h2>
      ${template.about.description ? `<p>${this.escapeHtml(template.about.description)}</p>` : ""}
      ${
        template.about.buttonText
          ? `<a class="preset-button" href="${this.escapeAttribute(
              template.about.buttonUrl || "#",
            )}">${this.escapeHtml(template.about.buttonText)}</a>`
          : ""
      }
    </div>
    <figure class="preset-about__media">
      <img
        src="${this.escapeAttribute(template.about.imageUrl)}"
        alt="${this.escapeAttribute(template.about.imageAlt || template.about.title)}"
        loading="lazy"
      >
    </figure>
  </div>
</section>`;
  }

  static renderCSS(template: EditorialCommerceTemplate): string {
    const theme = {
      background: "#fbf5ea",
      surface: "#fff8ee",
      text: "#704538",
      muted: "#9d7a6e",
      accent: "#bd856f",
      accentSoft: "#dec3aa",
      headingFont: "Playfair Display",
      bodyFont: "Poppins",
      logoFont: "Great Vibes",
      ...template.theme,
    };

    return `
:root {
  --preset-bg: ${theme.background};
  --preset-surface: ${theme.surface};
  --preset-text: ${theme.text};
  --preset-muted: ${theme.muted};
  --preset-accent: ${theme.accent};
  --preset-accent-soft: ${theme.accentSoft};
  --preset-heading-font: "${this.escapeCSS(theme.headingFont)}", serif;
  --preset-body-font: "${this.escapeCSS(theme.bodyFont)}", sans-serif;
  --preset-logo-font: "${this.escapeCSS(theme.logoFont)}", cursive;
  --preset-line: rgba(112, 69, 56, 0.12);
  --preset-shadow: 0 18px 45px rgba(112, 69, 56, 0.12);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--preset-bg);
  color: var(--preset-text);
  font-family: var(--preset-body-font);
}

img {
  display: block;
  max-width: 100%;
}

a {
  color: inherit;
  text-decoration: none;
}

.preset-header {
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: min(1180px, calc(100% - 40px));
  margin: 0 auto;
  background: rgba(251, 245, 234, 0.92);
}

.preset-brand {
  font-family: var(--preset-logo-font);
  font-size: 44px;
  line-height: 1;
  color: #9d6a56;
  white-space: nowrap;
}

.preset-nav {
  display: flex;
  align-items: center;
  gap: 38px;
  color: #9b6e60;
  font-size: 14px;
}

.preset-hero {
  min-height: 520px;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(90deg, rgba(251, 245, 234, 0.98) 0%, rgba(251, 245, 234, 0.78) 42%, rgba(251, 245, 234, 0.08) 72%),
    var(--hero-image);
  background-position: center;
  background-size: cover;
}

.preset-hero::before,
.preset-products::before,
.preset-about::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 0% 20%, rgba(222, 195, 170, 0.28), transparent 28%),
    radial-gradient(circle at 100% 78%, rgba(222, 195, 170, 0.22), transparent 26%);
}

.preset-hero__inner {
  position: relative;
  width: min(1180px, calc(100% - 40px));
  margin: 0 auto;
  padding: 80px 0;
}

.preset-hero h1 {
  max-width: 560px;
  margin: 0 0 24px;
  font-family: var(--preset-heading-font);
  font-size: clamp(46px, 6vw, 72px);
  line-height: 1.08;
  font-weight: 500;
  color: var(--preset-text);
}

.preset-hero p {
  max-width: 520px;
  margin: 0 0 34px;
  color: var(--preset-muted);
  font-size: 17px;
}

.preset-button,
.preset-small-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--preset-accent);
  color: white;
  font-weight: 500;
}

.preset-button {
  min-width: 190px;
  height: 46px;
  font-size: 14px;
  box-shadow: 0 10px 20px rgba(189, 133, 111, 0.25);
}

.preset-products,
.preset-about {
  position: relative;
  overflow: hidden;
  background: var(--preset-surface);
}

.preset-products {
  padding: 76px 0 88px;
}

.preset-section-title {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 48px;
  margin-bottom: 42px;
  text-align: center;
}

.preset-section-title span {
  color: #c7a08d;
  font-size: 22px;
}

.preset-section-title h2 {
  margin: 0;
  font-family: var(--preset-heading-font);
  font-size: clamp(30px, 4vw, 42px);
  font-weight: 600;
  color: var(--preset-text);
}

.preset-product-grid {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 34px;
  width: min(1040px, calc(100% - 40px));
  margin: 0 auto;
}

.preset-product-grid--four {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  width: min(1120px, calc(100% - 40px));
  gap: 30px;
}

.preset-product-card {
  overflow: hidden;
  border: 1px solid var(--preset-line);
  border-radius: 6px;
  background: #fff7ed;
  box-shadow: 0 8px 20px rgba(112, 69, 56, 0.06);
}

.preset-product-card img {
  width: 100%;
  aspect-ratio: 1.18 / 1;
  object-fit: cover;
}

.preset-product-body {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: end;
  padding: 20px 22px 18px;
  min-height: 96px;
}

.preset-product-body h3 {
  grid-column: 1 / -1;
  margin: 0;
  color: var(--preset-muted);
  font-size: 13px;
  font-weight: 400;
}

.preset-product-body strong {
  color: var(--preset-text);
  font-size: 15px;
}

.preset-small-button {
  padding: 8px 20px;
  background: #d8b89d;
  font-size: 12px;
}

.preset-about {
  padding: 80px 0;
  background:
    linear-gradient(90deg, rgba(251, 245, 234, 0.96), rgba(251, 245, 234, 0.86)),
    radial-gradient(circle at 0% 100%, rgba(222, 195, 170, 0.35), transparent 28%);
}

.preset-about__inner {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  align-items: center;
  gap: 80px;
  width: min(1120px, calc(100% - 40px));
  margin: 0 auto;
}

.preset-about__copy h2 {
  margin: 0 0 24px;
  font-family: var(--preset-heading-font);
  font-size: clamp(34px, 4vw, 46px);
  font-weight: 500;
  color: var(--preset-text);
}

.preset-about__copy p {
  max-width: 520px;
  margin: 0 0 34px;
  color: var(--preset-muted);
  font-size: 15px;
  line-height: 1.8;
}

.preset-about__media {
  margin: 0;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: var(--preset-shadow);
}

.preset-about__media img {
  width: 100%;
  aspect-ratio: 1.58 / 1;
  object-fit: cover;
}

@media (max-width: 900px) {
  .preset-header {
    height: auto;
    flex-direction: column;
    gap: 18px;
    padding: 18px 0;
  }

  .preset-nav {
    flex-wrap: wrap;
    justify-content: center;
    gap: 18px;
  }

  .preset-hero {
    min-height: 480px;
    background:
      linear-gradient(180deg, rgba(251, 245, 234, 0.98), rgba(251, 245, 234, 0.78)),
      var(--hero-image);
    background-position: center;
    background-size: cover;
  }

  .preset-product-grid,
  .preset-product-grid--four,
  .preset-about__inner {
    grid-template-columns: 1fr;
  }

  .preset-about__inner {
    gap: 38px;
  }
}

@media (max-width: 560px) {
  .preset-brand {
    font-size: 38px;
  }

  .preset-hero__inner {
    padding: 56px 0;
  }

  .preset-products,
  .preset-about {
    padding: 56px 0;
  }
}
`;
  }

  private static buildFontsUrl(template: EditorialCommerceTemplate): string {
    const theme = template.theme || {};
    const fonts = [
      theme.logoFont || "Great Vibes",
      theme.headingFont || "Playfair Display",
      theme.bodyFont || "Poppins",
    ];

    const families = Array.from(new Set(fonts))
      .map((font) => `family=${font.trim().replace(/\s+/g, "+")}:wght@300;400;500;600;700`)
      .join("&");

    return `https://fonts.googleapis.com/css2?${families}&display=swap`;
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
