import type { RenderContext } from "../../renderTypes";
import {
  escapeHtml,
  familyVariant,
  getSectionVariant,
  socialLinks,
} from "../SectionLibraryShared";

export function renderTopbarByContext(context: RenderContext): string {
  const fallback = familyVariant(context, {
    "luxury-editorial": "luxury",
    "marketplace-grid": "commerce",
    "conversion-sales": "conversion",
    "magazine-story": "editorial",
    "minimal-premium": "minimal",
  }, "minimal");

  const variant = getSectionVariant(context, "topbar", fallback);
  const links = socialLinks(context);
  const isService = context.request.pageKind === "servico";
  const trust = context.commercialStrategy?.trustItems?.filter(Boolean).slice(0, 3) || [];

  if (variant === "minimal") {
    return `<div class="gc-topbar gc-topbar--minimal">
      <div class="gc-container gc-topbar__inner">
        <span>${escapeHtml(trust[0] || (isService ? "Atendimento profissional" : "Compra prática e segura"))}</span>
      </div>
    </div>`;
  }

  if (variant === "luxury") {
    return `<div class="gc-topbar gc-topbar--luxury">
      <div class="gc-container gc-topbar__inner">
        <span>${escapeHtml(trust[0] || "Uma experiência especial para você")}</span>
        <span>${links.instagram ? "Instagram" : "GranConecta"}</span>
      </div>
    </div>`;
  }

  if (variant === "conversion") {
    return `<div class="gc-topbar gc-topbar--conversion">
      <div class="gc-container gc-topbar__inner">
        ${(trust.length ? trust : ["Atendimento rápido", "Contato direto", "Próximo passo simples"])
          .map((item) => `<strong>✓ ${escapeHtml(item)}</strong>`)
          .join("")}
      </div>
    </div>`;
  }

  if (variant === "commerce") {
    return `<div class="gc-topbar gc-topbar--commerce">
      <div class="gc-container gc-topbar__inner">
        <span>Novidades</span><span>Atendimento próximo</span><span>Ofertas</span><span>GranConecta</span>
      </div>
    </div>`;
  }

  return `<div class="gc-topbar gc-topbar--editorial">
    <div class="gc-container gc-topbar__inner">
      <span>${escapeHtml(context.request.businessName)}</span>
      <span>${escapeHtml(trust[0] || "Conheça nossa história")}</span>
    </div>
  </div>`;
}
