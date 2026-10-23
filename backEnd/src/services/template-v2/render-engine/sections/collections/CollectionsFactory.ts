import type { RenderContext } from "../../renderTypes";
import {
  escapeAttr,
  escapeHtml,
  familyVariant,
  getSectionVariant,
  mediaUrls,
  sectionHeading,
} from "../SectionLibraryShared";

export function renderCollectionsByContext(context: RenderContext): string {
  if (context.request.pageKind !== "loja") return "";

  const names = Array.from(
    new Set(
      context.request.products
        .map((product) => String(product.categoryName || "").trim())
        .filter(Boolean),
    ),
  );

  if (names.length < 2) return "";

  const fallback = familyVariant(context, {
    "luxury-editorial": "editorial",
    "marketplace-grid": "grid",
    "conversion-sales": "cards",
    "magazine-story": "magazine",
    "minimal-premium": "minimal",
  }, "grid");
  const variant = getSectionVariant(context, "collections", fallback);
  const images = mediaUrls(context);

  return `<section class="gc-collections gc-collections--${variant}" id="collections">
    <div class="gc-container">
      ${sectionHeading("Coleções", "Escolha por universo", "Explore diferentes linhas e encontre a que combina com você.")}
      <div class="gc-collections-grid">
        ${names.slice(0, 6).map((name, index) => {
          const image = images[(index + 1) % Math.max(images.length, 1)] || "";
          return `<button type="button" class="gc-collection-card" data-gc-action="open-products">
            ${image ? `<img src="${escapeAttr(image)}" alt="${escapeAttr(name)}" loading="lazy" />` : ""}
            <span>${escapeHtml(name)}</span>
          </button>`;
        }).join("")}
      </div>
    </div>
  </section>`;
}
