import type { RenderContext } from "../../renderTypes";
import {
  escapeHtml,
  familyVariant,
  getSectionVariant,
  primaryAction,
  primaryLabel,
  renderAction,
  secondaryAction,
  secondaryLabel,
} from "../SectionLibraryShared";

export function renderContactByContext(context: RenderContext): string {
  const fallback = familyVariant(context, {
    "luxury-editorial": "card",
    "marketplace-grid": "banner",
    "conversion-sales": "conversion",
    "magazine-story": "editorial",
    "minimal-premium": "minimal",
  }, "banner");
  const variant = getSectionVariant(context, "contact", fallback);
  const strategy = context.commercialStrategy || context.request.commercialStrategy;
  const title = strategy?.primaryLabel || (context.request.pageKind === "servico" ? "Vamos conversar sobre o que você precisa?" : "Quer falar com a marca?");
  const text = strategy?.differentiator || "Converse pelo chat ou WhatsApp e encontre o melhor próximo passo.";

  return `<section class="gc-contact gc-contact--${variant}" id="contact">
    <div class="gc-container gc-contact__inner">
      <div class="gc-contact__copy">
        <span>Contato</span>
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(text)}</p>
      </div>
      <div class="gc-actions">
        ${renderAction(primaryAction(context), primaryLabel(context), true)}
        ${renderAction(secondaryAction(context), secondaryLabel(context), false)}
      </div>
    </div>
  </section>`;
}
