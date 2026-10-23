import type { RenderContext } from "../../renderTypes";
import {
  escapeAttr,
  escapeHtml,
  familyVariant,
  getSectionVariant,
  mediaUrls,
  sectionHeading,
  socialLinks,
} from "../SectionLibraryShared";

export function renderSocialByContext(context: RenderContext): string {
  const links = socialLinks(context);
  const entries = [
    ["Instagram", links.instagram],
    ["Facebook", links.facebook],
    ["TikTok", links.tiktok],
    ["YouTube", links.youtube],
    ["LinkedIn", links.linkedin],
    ["Site", links.site],
    ["WhatsApp", links.whatsapp],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  if (!entries.length) return "";

  const fallback = familyVariant(context, {
    "luxury-editorial": "gallery",
    "marketplace-grid": "bar",
    "conversion-sales": "conversion",
    "magazine-story": "editorial",
    "minimal-premium": "minimal",
  }, "bar");
  const variant = getSectionVariant(context, "social", fallback);
  const images = mediaUrls(context).slice(0, 4);

  if (variant === "gallery" && images.length >= 3) {
    return `<section class="gc-social gc-social--gallery" id="social">
      <div class="gc-container">
        ${sectionHeading("Acompanhe", `Siga ${context.request.businessName}`, "Novidades, bastidores e inspirações da marca.")}
        <div class="gc-social-gallery">${images.map((src) => `<img src="${escapeAttr(src)}" alt="Conteúdo social" loading="lazy" />`).join("")}</div>
        <div class="gc-social-links">${entries.map(([label, href]) => `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`).join("")}</div>
      </div>
    </section>`;
  }

  return `<section class="gc-social gc-social--${variant}" id="social">
    <div class="gc-container gc-social__inner">
      <div><span>Redes sociais</span><h2>Acompanhe ${escapeHtml(context.request.businessName)}</h2></div>
      <div class="gc-social-links">${entries.map(([label, href]) => `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`).join("")}</div>
    </div>
  </section>`;
}
