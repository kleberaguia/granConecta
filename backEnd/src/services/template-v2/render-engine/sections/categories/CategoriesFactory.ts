import type { RenderContext } from "../../renderTypes";
import {
  escapeAttr,
  escapeHtml,
  familyVariant,
  getSectionVariant,
  mediaUrls,
  sectionHeading,
} from "../SectionLibraryShared";

export function renderCategoriesByContext(context: RenderContext): string {
  if (context.request.pageKind !== "loja") return "";

  const fallback = familyVariant(context, {
    "luxury-editorial": "editorial",
    "marketplace-grid": "cards",
    "conversion-sales": "chips",
    "magazine-story": "magazine",
    "minimal-premium": "minimal",
  }, "cards");
  const variant = getSectionVariant(context, "categories", fallback);

  const categories = Array.from(
    new Set(
      context.request.products
        .map((product) => String(product.categoryName || "").trim())
        .filter(Boolean),
    ),
  );

  const resolved = categories.length
    ? categories.slice(0, 6)
    : [context.visualContext.categoryName || context.request.businessSegment, "Destaques", "Novidades", "Presentes"].filter(Boolean);

  const images = mediaUrls(context);

  if (variant === "chips") {
    return `<section class="gc-categories gc-categories--chips" id="categories">
      <div class="gc-container">
        ${sectionHeading("Explore", "Escolha por categoria")}
        <div class="gc-category-chips">
          ${resolved.map((label) => `<button type="button" data-gc-action="open-products">${escapeHtml(label)}</button>`).join("")}
        </div>
      </div>
    </section>`;
  }

  if (variant === "minimal") {
    return `<section class="gc-categories gc-categories--minimal" id="categories">
      <div class="gc-container">
        <div class="gc-category-minimal-list">
          ${resolved.map((label, index) => `<button type="button" data-gc-action="open-products"><span>${String(index + 1).padStart(2, "0")}</span>${escapeHtml(label)}</button>`).join("")}
        </div>
      </div>
    </section>`;
  }

  return `<section class="gc-categories gc-categories--${escapeAttr(variant)}" id="categories">
    <div class="gc-container">
      ${sectionHeading("Coleções", variant === "magazine" ? "Universos para descobrir" : "Encontre o que combina com você", "Navegue pelos destaques e categorias da marca.")}
      <div class="gc-category-grid gc-category-grid--${escapeAttr(variant)}">
        ${resolved.map((label, index) => {
          const image = images[index % Math.max(images.length, 1)] || "";
          return `<button type="button" class="gc-category-card" data-gc-action="open-products">
            ${image ? `<img src="${escapeAttr(image)}" alt="${escapeAttr(label)}" />` : ""}
            <span>${escapeHtml(label)}</span>
          </button>`;
        }).join("")}
      </div>
    </div>
  </section>`;
}
