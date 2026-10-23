import type { RenderContext } from "../../renderTypes";
import {
  escapeHtml,
  familyVariant,
  getSectionVariant,
  renderAction,
  socialLinks,
} from "../SectionLibraryShared";

export function renderNewsletterByContext(context: RenderContext): string {
  const raw = context.request.raw || {};
  const explicitlyEnabled = Boolean(raw.newsletterEnabled || raw.newsletter_enabled);
  const email = socialLinks(context).email;

  if (!explicitlyEnabled && !email) return "";

  const fallback = familyVariant(context, {
    "luxury-editorial": "luxury",
    "marketplace-grid": "commerce",
    "conversion-sales": "conversion",
    "magazine-story": "editorial",
    "minimal-premium": "minimal",
  }, "minimal");
  const variant = getSectionVariant(context, "newsletter", fallback);

  return `<section class="gc-newsletter gc-newsletter--${variant}" id="newsletter">
    <div class="gc-container gc-newsletter__inner">
      <div><span>Novidades</span><h2>Fique por dentro de ${escapeHtml(context.request.businessName)}</h2>
      <p>Receba novidades e acompanhe lançamentos pelo atendimento da marca.</p></div>
      <div>${renderAction("open-chat", "Quero receber novidades", true)}</div>
    </div>
  </section>`;
}
