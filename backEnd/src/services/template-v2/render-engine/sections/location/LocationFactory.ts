import type { RenderContext } from "../../renderTypes";
import {
  escapeAttr,
  escapeHtml,
  familyVariant,
  getSectionVariant,
  locationData,
  sectionHeading,
} from "../SectionLibraryShared";

export function renderLocationByContext(context: RenderContext): string {
  const data = locationData(context);
  if (!data.address && !data.city && !data.mapsUrl) return "";

  const fallback = familyVariant(context, {
    "luxury-editorial": "editorial",
    "marketplace-grid": "card",
    "conversion-sales": "contrast",
    "magazine-story": "story",
    "minimal-premium": "minimal",
  }, "card");
  const variant = getSectionVariant(context, "location", fallback);
  const place = [data.address, data.city, data.state].filter(Boolean).join(" · ");

  return `<section class="gc-location gc-location--${variant}" id="location">
    <div class="gc-container gc-location__inner">
      <div>${sectionHeading("Localização", data.label || "Onde estamos", place)}</div>
      ${data.mapsUrl ? `<a class="gc-location-link" href="${escapeAttr(data.mapsUrl)}" target="_blank" rel="noopener noreferrer">Abrir no mapa</a>` : ""}
    </div>
  </section>`;
}
