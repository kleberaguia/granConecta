import type { RenderContext } from "../../renderTypes";
import {
  escapeAttr,
  escapeHtml,
  familyVariant,
  getSectionVariant,
  mediaUrls,
  primaryAction,
  primaryLabel,
  renderAction,
} from "../SectionLibraryShared";

export function renderFeaturedByContext(context: RenderContext): string {
  const fallback = familyVariant(context, {
    "luxury-editorial": "split",
    "marketplace-grid": "banner",
    "conversion-sales": "impact",
    "magazine-story": "editorial",
    "minimal-premium": "minimal",
  }, "split");
  const variant = getSectionVariant(context, "featured", fallback);
  const strategy = context.commercialStrategy || context.request.commercialStrategy;
  const isService = context.request.pageKind === "servico";
  const images = mediaUrls(context);
  const image = images[1] || images[0] || "";
  const title = strategy?.offer || (isService ? "Um atendimento pensado para avançar" : "Uma seleção especial da marca");
  const text = strategy?.differentiator || (isService ? "Entenda sua necessidade e encontre o melhor próximo passo." : "Descubra produtos, novidades e escolhas que merecem destaque.");

  if (variant === "minimal") {
    return `<section class="gc-featured gc-featured--minimal" id="featured">
      <div class="gc-container gc-featured-minimal__inner">
        <span>Em destaque</span>
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(text)}</p>
        ${renderAction(primaryAction(context), primaryLabel(context), false)}
      </div>
    </section>`;
  }

  if (variant === "impact") {
    return `<section class="gc-featured gc-featured--impact" id="featured">
      ${image ? `<img class="gc-featured-impact__bg" src="${escapeAttr(image)}" alt="" />` : ""}
      <div class="gc-featured-impact__overlay"></div>
      <div class="gc-container gc-featured-impact__inner">
        <span>Próximo passo</span>
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(text)}</p>
        ${renderAction(primaryAction(context), primaryLabel(context), true)}
      </div>
    </section>`;
  }

  return `<section class="gc-featured gc-featured--${escapeAttr(variant)}" id="featured">
    <div class="gc-container gc-featured-split__inner">
      <div class="gc-featured-split__copy">
        <span>${isService ? "Atendimento em destaque" : "Seleção especial"}</span>
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(text)}</p>
        ${renderAction(primaryAction(context), primaryLabel(context), true)}
      </div>
      ${image ? `<div class="gc-featured-split__media"><img src="${escapeAttr(image)}" alt="${escapeAttr(title)}" /></div>` : ""}
    </div>
  </section>`;
}
