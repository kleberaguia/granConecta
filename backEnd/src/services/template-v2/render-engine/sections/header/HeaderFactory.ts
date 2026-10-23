import type { RenderContext } from "../../renderTypes";
import {
  brandLogo,
  escapeAttr,
  escapeHtml,
  familyVariant,
  getSectionVariant,
  initials,
  primaryAction,
  primaryLabel,
  renderAction,
  socialLinks,
} from "../SectionLibraryShared";
import { renderHeaderHealthLayoutBase } from "./HeaderHealthLayoutBase";

export function renderHeaderByContext(context: RenderContext): string {
  const request = context.request as any;
  const raw = request?.raw || {};

  const layoutBaseId = String(
    request?.layoutBaseId ||
      request?.selectedVariation?.layoutBaseId ||
      request?.aiVariation?.layoutBaseId ||
      raw?.layoutBaseId ||
      raw?.selectedVariation?.layoutBaseId ||
      raw?.aiVariation?.layoutBaseId ||
      request?.layoutBase?.id ||
      raw?.layoutBase?.id ||
      "",
  ).trim();

  const generationMode = String(
    request?.generationMode ||
      raw?.generationMode ||
      "",
  ).trim();

  if (
    context.request.pageKind === "servico" &&
    generationMode === "layout-base-ai" &&
    layoutBaseId === "SERVICE_HEALTH_01"
  ) {
    return renderHeaderHealthLayoutBase(context);
  }

  const fallback = familyVariant(context, {
    "luxury-editorial": "luxury-centered",
    "marketplace-grid": "marketplace",
    "conversion-sales": "overlay",
    "magazine-story": "editorial",
    "minimal-premium": "minimal",
  }, "minimal");

  const variant = getSectionVariant(context, "header", fallback);
  const isService = context.request.pageKind === "servico";
  const mainHref = isService ? "#services" : "#products";
  const mainLabel = isService ? "Atendimentos" : "Produtos";
  const logo = brandLogo(context);
  const links = socialLinks(context);
  const brand = logo
    ? `<img class="gc-header-logo" src="${escapeAttr(logo)}" alt="${escapeAttr(context.request.businessName)}" />`
    : `<span class="gc-brand-monogram">${escapeHtml(initials(context.request.businessName))}</span>`;

  const nav = `<nav class="gc-nav" aria-label="Navegação principal">
    <a href="#inicio">Início</a>
    <a href="${mainHref}">${mainLabel}</a>
    <a href="#about">Sobre</a>
    ${context.request.pageKind === "loja" ? `<a href="#collections">Coleções</a>` : ""}
    <a href="#contact">Contato</a>
  </nav>`;

  if (variant === "luxury-centered") {
    return `<header class="gc-header gc-header--luxury" id="inicio">
      <div class="gc-container gc-header-luxury__inner">
        <a class="gc-brand gc-brand--luxury" href="#inicio">${brand}<strong>${escapeHtml(context.request.businessName)}</strong></a>
        ${nav}
        <div class="gc-header-tools">
          ${links.instagram ? `<a href="${escapeAttr(links.instagram)}" target="_blank" rel="noopener noreferrer">Instagram</a>` : ""}
          ${renderAction(primaryAction(context), primaryLabel(context), false)}
        </div>
      </div>
    </header>`;
  }

  if (variant === "marketplace") {
    return `<header class="gc-header gc-header--marketplace" id="inicio">
      <div class="gc-container gc-header-marketplace__inner">
        <a class="gc-brand" href="#inicio">${brand}<strong>${escapeHtml(context.request.businessName)}</strong></a>
        <a class="gc-header-category-link" href="${mainHref}">${mainLabel}</a>
        ${nav}
        <div class="gc-header-tools">
          ${renderAction("open-chat", "Atendimento", false)}
          ${context.request.pageKind === "loja" ? renderAction("open-cart", "Carrinho", true) : renderAction(primaryAction(context), primaryLabel(context), true)}
        </div>
      </div>
    </header>`;
  }

  if (variant === "overlay") {
    return `<header class="gc-header gc-header--overlay" id="inicio">
      <div class="gc-container gc-header-overlay__inner">
        <a class="gc-brand" href="#inicio">${brand}<strong>${escapeHtml(context.request.businessName)}</strong></a>
        ${nav}
        ${renderAction(primaryAction(context), primaryLabel(context), true)}
      </div>
    </header>`;
  }

  if (variant === "editorial") {
    return `<header class="gc-header gc-header--editorial" id="inicio">
      <div class="gc-container gc-header-editorial__inner">
        <div class="gc-header-editorial__brand">
          ${brand}<strong>${escapeHtml(context.request.businessName)}</strong>
        </div>
        ${nav}
        <span class="gc-header-editorial__tag">${escapeHtml(context.visualContext.categoryName || context.request.businessSegment)}</span>
      </div>
    </header>`;
  }

  return `<header class="gc-header gc-header--minimal" id="inicio">
    <div class="gc-container gc-header-minimal__inner">
      <a class="gc-brand" href="#inicio">${brand}<strong>${escapeHtml(context.request.businessName)}</strong></a>
      ${nav}
      ${renderAction(primaryAction(context), primaryLabel(context), false)}
    </div>
  </header>`;
}