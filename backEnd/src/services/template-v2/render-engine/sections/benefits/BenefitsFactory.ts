import type { RenderContext } from "../../renderTypes";
import {
  escapeHtml,
  familyVariant,
  getSectionVariant,
  sectionHeading,
} from "../SectionLibraryShared";

export function renderBenefitsByContext(context: RenderContext): string {
  const fallback = familyVariant(context, {
    "luxury-editorial": "editorial",
    "marketplace-grid": "cards",
    "conversion-sales": "numbers",
    "magazine-story": "bento",
    "minimal-premium": "strip",
  }, "cards");
  const variant = getSectionVariant(context, "benefits", fallback);
  const items = resolveBenefits(context);

  if (!items.length) return "";

  if (variant === "numbers") {
    return `<section class="gc-benefits gc-benefits--numbers" id="benefits">
      <div class="gc-container gc-benefits-numbers">
        ${items.map(([title, text], index) => `<article><strong>${String(index + 1).padStart(2, "0")}</strong><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></article>`).join("")}
      </div>
    </section>`;
  }

  if (variant === "strip") {
    return `<section class="gc-benefits gc-benefits--strip" id="benefits">
      <div class="gc-container gc-benefits-strip">
        ${items.map(([title, text]) => `<article><strong>${escapeHtml(title)}</strong><span>${escapeHtml(text)}</span></article>`).join("")}
      </div>
    </section>`;
  }

  if (variant === "editorial") {
    const [first, ...rest] = items;
    return `<section class="gc-benefits gc-benefits--editorial" id="benefits">
      <div class="gc-container gc-benefits-editorial">
        <div class="gc-benefits-editorial__lead">
          <span>Por que escolher</span>
          <h2>${escapeHtml(first?.[0] || "Uma experiência pensada para você")}</h2>
          <p>${escapeHtml(first?.[1] || "")}</p>
        </div>
        <div class="gc-benefits-editorial__list">
          ${rest.map(([title, text], index) => `<article><span>${String(index + 2).padStart(2, "0")}</span><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></div></article>`).join("")}
        </div>
      </div>
    </section>`;
  }

  return `<section class="gc-benefits gc-benefits--${variant}" id="benefits">
    <div class="gc-container">
      ${sectionHeading("Diferenciais", "Uma experiência feita para facilitar sua escolha")}
      <div class="gc-benefits-grid gc-benefits-grid--${variant}">
        ${items.map(([title, text], index) => `<article class="gc-benefit-card gc-benefit-card--${index + 1}"><span>${String(index + 1).padStart(2, "0")}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></article>`).join("")}
      </div>
    </div>
  </section>`;
}

function resolveBenefits(context: RenderContext): [string, string][] {
  const trust = context.commercialStrategy?.trustItems?.filter(Boolean).slice(0, 4) ||
    context.request.commercialStrategy?.trustItems?.filter(Boolean).slice(0, 4) || [];

  if (trust.length) {
    return trust.map((item, index) => [`Diferencial ${index + 1}`, item]);
  }

  if (context.request.pageKind === "servico") {
    return [];
  }

  return [
    ["Curadoria", "Produtos apresentados de forma clara e atraente."],
    ["Compra prática", "Descubra e escolha sem complicação."],
    ["Contato próximo", "Fale com a marca quando precisar."],
    ["Experiência", "Uma vitrine pensada para gerar desejo e confiança."],
  ];
}
