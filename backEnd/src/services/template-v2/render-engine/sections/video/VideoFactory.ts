import type { RenderContext } from "../../renderTypes";
import {
  escapeAttr,
  escapeHtml,
  familyVariant,
  getSectionVariant,
  sectionHeading,
} from "../SectionLibraryShared";

export function renderVideoByContext(context: RenderContext): string {
  const videos = context.visualContext.media?.videos || [];
  const first = videos[0];
  const url = String(first?.url || "").trim();
  if (!url) return "";

  const fallback = familyVariant(context, {
    "luxury-editorial": "editorial",
    "marketplace-grid": "card",
    "conversion-sales": "cinematic",
    "magazine-story": "story",
    "minimal-premium": "minimal",
  }, "card");
  const variant = getSectionVariant(context, "video", fallback);

  return `<section class="gc-video gc-video--${variant}" id="video">
    <div class="gc-container">
      ${sectionHeading("Em vídeo", `Conheça ${context.request.businessName} em movimento`, "Uma forma mais próxima de apresentar a experiência da marca.")}
      <div class="gc-video-frame">
        <video controls preload="metadata" playsinline>
          <source src="${escapeAttr(url)}" />
          Seu navegador não suporta vídeo.
        </video>
      </div>
    </div>
  </section>`;
}
