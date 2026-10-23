import type { RenderContext } from "../../renderTypes";
import {
  escapeAttr,
  escapeHtml,
  heroActions,
  heroKicker,
  heroSupportingCopy,
  heroTitle,
  heroTrust,
  resolveHeroData,
} from "./HeroShared";
import { renderHeroHealthLayoutBase } from "./HeroHealthLayoutBase";

export function renderHeroService(context: RenderContext): string {
  const data = resolveHeroData(context);

  const layoutBaseId = String(
    (context.request as any)?.layoutBaseId ||
    (context.request as any)?.raw?.layoutBaseId ||
    (context.request as any)?.selectedVariation?.layoutBaseId ||
    (context.request as any)?.aiVariation?.layoutBaseId ||
    (context.request as any)?.raw?.selectedVariation?.layoutBaseId ||
    (context.request as any)?.raw?.aiVariation?.layoutBaseId ||
    "",
  ).trim();

  if (
    context.request.pageKind === "servico" &&
    String((context.request as any)?.generationMode || "").trim() ===
    "layout-base-ai" &&
    layoutBaseId === "SERVICE_HEALTH_01"
  ) {
    return renderHeroHealthLayoutBase(context);
  }

  if (isLayoutBaseAiService(context)) {
    return renderLayoutBaseAiServiceHero(context, data);
  }

  const variant = resolveServiceHeroVariant(context);

  switch (variant) {
    case "premium-cinematic":
      return renderCinematicServiceHero(context, data);
    case "premium-magazine":
      return renderMagazineServiceHero(context, data);
    case "premium-minimal":
      return renderMinimalServiceHero(context, data);
    case "premium-conversion":
      return renderConversionServiceHero(context, data);
    case "premium-warm":
    default:
      return renderWarmServiceHero(context, data);
  }
}


type LayoutBaseAiHeroContext = {
  layoutBaseId: string;
  segmentFamily: string;
  hero: Record<string, any>;
  composition: Record<string, any>;
  typography: Record<string, any>;
  visualStyle: Record<string, any>;
};

function isLayoutBaseAiService(context: RenderContext): boolean {
  return (
    context.request.pageKind === "servico" &&
    String((context.request as any)?.generationMode || "").trim() === "layout-base-ai" &&
    Boolean(resolveLayoutBaseAiHeroContext(context).layoutBaseId)
  );
}

function resolveLayoutBaseAiHeroContext(
  context: RenderContext,
): LayoutBaseAiHeroContext {
  const request = context.request as any;
  const raw = request?.raw || {};
  const selectedVariation =
    request?.selectedVariation ||
    raw?.selectedVariation ||
    {};
  const aiVariation =
    request?.aiVariation ||
    raw?.aiVariation ||
    {};

  const layoutBase =
    request?.layoutBase ||
    selectedVariation?.layoutBase ||
    aiVariation?.layoutBase ||
    raw?.layoutBase ||
    {};

  return {
    layoutBaseId: String(
      request?.layoutBaseId ||
      selectedVariation?.layoutBaseId ||
      aiVariation?.layoutBaseId ||
      raw?.layoutBaseId ||
      layoutBase?.id ||
      "",
    ).trim(),
    segmentFamily: String(
      request?.segmentFamily ||
      selectedVariation?.segmentFamily ||
      aiVariation?.segmentFamily ||
      raw?.segmentFamily ||
      layoutBase?.segmentFamily ||
      "",
    ).trim(),
    hero:
      request?.hero ||
      selectedVariation?.hero ||
      aiVariation?.hero ||
      raw?.hero ||
      {},
    composition:
      request?.composition ||
      selectedVariation?.composition ||
      aiVariation?.composition ||
      raw?.composition ||
      {},
    typography:
      request?.typography ||
      selectedVariation?.typography ||
      aiVariation?.typography ||
      raw?.typography ||
      {},
    visualStyle:
      request?.visualStyle ||
      selectedVariation?.visualStyle ||
      aiVariation?.visualStyle ||
      raw?.visualStyle ||
      {},
  };
}

function renderLayoutBaseAiServiceHero(
  context: RenderContext,
  data: ReturnType<typeof resolveHeroData>,
): string {
  const ai = resolveLayoutBaseAiHeroContext(context);
  const image = mainImage(data);
  const secondary = secondaryImage(data);

  const requestedComposition = String(
    ai.hero?.composition ||
    ai.hero?.layout ||
    ai.composition?.heroLayout ||
    ai.composition?.heroComposition ||
    "",
  ).toLowerCase();

  const composition =
    requestedComposition.includes("cinematic") ||
      requestedComposition.includes("cover") ||
      requestedComposition.includes("full")
      ? "cinematic"
      : requestedComposition.includes("editorial") ||
        requestedComposition.includes("magazine") ||
        requestedComposition.includes("overlap")
        ? "editorial"
        : requestedComposition.includes("center") ||
          requestedComposition.includes("minimal")
          ? "minimal"
          : "split";

  const classes = [
    "gc-hero",
    "gc-hero-service",
    "gc-hero-service--layout-base-ai",
    `gc-hero-service--layout-base-${slugToken(ai.layoutBaseId)}`,
    ai.segmentFamily
      ? `gc-hero-service--segment-${slugToken(ai.segmentFamily)}`
      : "",
    `gc-hero-service--ai-${composition}`,
  ]
    .filter(Boolean)
    .join(" ");

  const attrs = [
    `data-hero-composition="layout-base-ai-${escapeAttr(composition)}"`,
    `data-layout-base-id="${escapeAttr(ai.layoutBaseId)}"`,
    ai.segmentFamily
      ? `data-segment-family="${escapeAttr(ai.segmentFamily)}"`
      : "",
    ai.hero?.imagePosition
      ? `data-ai-image-position="${escapeAttr(ai.hero.imagePosition)}"`
      : "",
    ai.typography?.headingStyle
      ? `data-ai-heading-style="${escapeAttr(ai.typography.headingStyle)}"`
      : "",
    ai.visualStyle?.mood
      ? `data-ai-visual-mood="${escapeAttr(ai.visualStyle.mood)}"`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (composition === "cinematic" && image) {
    return `<section class="${classes}" ${attrs} id="hero">
      <div class="gc-hero-service__ai-cinematic-bg">
        ${imageTag(image, data.title)}
      </div>
      <div class="gc-hero-service__ai-cinematic-shade" aria-hidden="true"></div>
      <div class="gc-container gc-hero-service__ai-cinematic-inner">
        <div class="gc-hero-service__ai-copy">
          ${heroKicker(data.kicker)}
          ${heroTitle(data, context)}
          ${heroSupportingCopy(data)}
          ${heroActions(data)}
          <div class="gc-hero-service__ai-trust">${heroTrust(data)}</div>
        </div>
      </div>
    </section>`;
  }

  if (composition === "editorial") {
    return `<section class="${classes}" ${attrs} id="hero">
      <div class="gc-container gc-hero-service__ai-editorial-inner">
        <div class="gc-hero-service__ai-copy">
          ${heroKicker(data.kicker)}
          ${heroTitle(data, context)}
          ${heroSupportingCopy(data)}
          ${heroActions(data)}
        </div>
        <div class="gc-hero-service__ai-editorial-media">
          ${image ? `<figure class="gc-hero-service__ai-primary">${imageTag(image, data.title)}</figure>` : `<div class="gc-section-image-placeholder gc-hero-service__ai-placeholder"></div>`}
          ${secondary ? `<figure class="gc-hero-service__ai-secondary">${imageTag(secondary, data.title, false)}</figure>` : ""}
        </div>
        <div class="gc-hero-service__ai-trust">${heroTrust(data)}</div>
      </div>
    </section>`;
  }

  if (composition === "minimal") {
    return `<section class="${classes}" ${attrs} id="hero">
      <div class="gc-container gc-hero-service__ai-minimal-inner">
        <div class="gc-hero-service__ai-copy">
          ${heroKicker(data.kicker)}
          ${heroTitle(data, context)}
          ${heroSupportingCopy(data)}
          ${heroActions(data)}
          <div class="gc-hero-service__ai-trust">${heroTrust(data)}</div>
        </div>
        ${image ? `<figure class="gc-hero-service__ai-minimal-media">${imageTag(image, data.title)}</figure>` : ""}
      </div>
    </section>`;
  }

  return `<section class="${classes}" ${attrs} id="hero">
    <div class="gc-container gc-hero-service__ai-split-inner">
      <div class="gc-hero-service__ai-copy">
        ${heroKicker(data.kicker)}
        ${heroTitle(data, context)}
        ${heroSupportingCopy(data)}
        ${heroActions(data)}
        <div class="gc-hero-service__ai-trust">${heroTrust(data)}</div>
      </div>
      <div class="gc-hero-service__ai-split-media">
        ${image ? `<figure class="gc-hero-service__ai-primary">${imageTag(image, data.title)}</figure>` : `<div class="gc-section-image-placeholder gc-hero-service__ai-placeholder"></div>`}
        ${secondary ? `<figure class="gc-hero-service__ai-secondary">${imageTag(secondary, data.title, false)}</figure>` : ""}
        <span class="gc-hero-service__ai-accent" aria-hidden="true"></span>
      </div>
    </div>
  </section>`;
}

function slugToken(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveServiceHeroVariant(context: RenderContext): string {
  const raw = (context.request as any)?.raw || {};
  const brief =
    (context.request as any)?.serviceDesignBrief ||
    raw?.serviceDesignBrief ||
    raw?.selectedVariation?.serviceDesignBrief ||
    raw?.aiVariation?.serviceDesignBrief;

  const id = String(
    brief?.id ||
    (context.request as any)?.serviceDesignBriefId ||
    raw?.serviceDesignBriefId ||
    raw?.selectedVariation?.serviceDesignBriefId ||
    raw?.aiVariation?.serviceDesignBriefId ||
    "",
  ).toUpperCase();

  if (id === "SERVICE_CINEMATIC") return "premium-cinematic";
  if (id === "SERVICE_MAGAZINE") return "premium-magazine";
  if (id === "SERVICE_MINIMAL") return "premium-minimal";
  if (id === "SERVICE_CONVERSION") return "premium-conversion";
  if (id === "SERVICE_WARM_EDITORIAL") return "premium-warm";

  switch (context.pageArchetype?.archetype) {
    case "CINEMATIC_STORY": return "premium-cinematic";
    case "MAGAZINE_STORY": return "premium-magazine";
    case "MINIMAL_PREMIUM": return "premium-minimal";
    case "MODERN_CONVERSION":
    case "BOUTIQUE_COMMERCE": return "premium-conversion";
    default: return "premium-warm";
  }
}

function mainImage(data: ReturnType<typeof resolveHeroData>): string {
  return String(data.image || data.images?.[0] || "").trim();
}

function secondaryImage(data: ReturnType<typeof resolveHeroData>): string {
  const main = mainImage(data);
  return String(data.images?.find((item) => item && item !== main) || "").trim();
}

function imageTag(url: string, title: string, eager = true): string {
  if (!url) return "";
  return `<img src="${escapeAttr(url)}" alt="${escapeAttr(title)}" ${eager ? 'loading="eager"' : 'loading="lazy"'} decoding="async" />`;
}

function renderWarmServiceHero(
  context: RenderContext,
  data: ReturnType<typeof resolveHeroData>,
): string {
  const image = mainImage(data);

  return `<section class="gc-hero gc-hero-service gc-hero-service--premium-warm gc-hero--dna" ${heroDnaAttrs(context)} id="hero" data-hero-composition="service-premium-warm">
    <div class="gc-hero-service__orb gc-hero-service__orb--one" aria-hidden="true"></div>
    <div class="gc-hero-service__orb gc-hero-service__orb--two" aria-hidden="true"></div>
    <div class="gc-container gc-hero-service__premium-inner">
      <div class="gc-hero-service__premium-copy">
        ${heroKicker(data.kicker)}
        ${heroTitle(data, context)}
        ${heroSupportingCopy(data)}
        ${heroActions(data)}
        <div class="gc-hero-service__premium-trust">${heroTrust(data)}</div>
      </div>
      <div class="gc-hero-service__premium-media">
        ${image ? `<figure class="gc-hero-service__premium-figure">${imageTag(image, data.title)}</figure>` : `<div class="gc-section-image-placeholder gc-hero-service__premium-placeholder"></div>`}
        <div class="gc-hero-service__media-accent" aria-hidden="true"></div>
      </div>
    </div>
  </section>`;
}

function renderCinematicServiceHero(
  context: RenderContext,
  data: ReturnType<typeof resolveHeroData>,
): string {
  const image = mainImage(data);

  return `<section class="gc-hero gc-hero-service gc-hero-service--premium-cinematic gc-hero--dna" ${heroDnaAttrs(context)} id="hero" data-hero-composition="service-premium-cinematic">
    ${image ? `<div class="gc-hero-service__cinematic-bg">${imageTag(image, data.title)}</div>` : ""}
    <div class="gc-hero-service__cinematic-shade"></div>
    <div class="gc-container gc-hero-service__cinematic-inner">
      <div class="gc-hero-service__cinematic-copy">
        <div class="gc-hero-service__cinematic-index">01</div>
        ${heroKicker(data.kicker)}
        ${heroTitle(data, context)}
        ${heroSupportingCopy(data)}
        ${heroActions(data)}
        ${heroTrust(data)}
      </div>
    </div>
  </section>`;
}

function renderMagazineServiceHero(
  context: RenderContext,
  data: ReturnType<typeof resolveHeroData>,
): string {
  const image = mainImage(data);
  const secondary = secondaryImage(data);

  return `<section class="gc-hero gc-hero-service gc-hero-service--premium-magazine gc-hero--dna" ${heroDnaAttrs(context)} id="hero" data-hero-composition="service-premium-magazine">
    <div class="gc-container gc-hero-service__magazine-inner">
      <div class="gc-hero-service__magazine-number" aria-hidden="true">01</div>
      <div class="gc-hero-service__magazine-copy">
        <div class="gc-hero-service__magazine-rule"></div>
        ${heroKicker(data.kicker)}
        ${heroTitle(data, context)}
        ${heroSupportingCopy(data)}
        ${heroActions(data)}
      </div>
      ${image ? `<figure class="gc-hero-service__magazine-primary">${imageTag(image, data.title)}</figure>` : ""}
      ${secondary ? `<figure class="gc-hero-service__magazine-secondary">${imageTag(secondary, data.title, false)}</figure>` : ""}
      <div class="gc-hero-service__magazine-trust">${heroTrust(data)}</div>
    </div>
  </section>`;
}

function renderMinimalServiceHero(
  context: RenderContext,
  data: ReturnType<typeof resolveHeroData>,
): string {
  const image = mainImage(data);

  return `<section class="gc-hero gc-hero-service gc-hero-service--premium-minimal gc-hero--dna" ${heroDnaAttrs(context)} id="hero" data-hero-composition="service-premium-minimal">
    <div class="gc-container gc-hero-service__minimal-inner">
      <div class="gc-hero-service__minimal-copy">
        <div class="gc-hero-service__minimal-label">SERVIÇO PROFISSIONAL</div>
        ${heroKicker(data.kicker)}
        ${heroTitle(data, context)}
        ${heroSupportingCopy(data)}
        ${heroActions(data)}
      </div>
      ${image ? `<figure class="gc-hero-service__minimal-media">${imageTag(image, data.title)}</figure>` : ""}
      <div class="gc-hero-service__minimal-trust">${heroTrust(data)}</div>
    </div>
  </section>`;
}

function renderConversionServiceHero(
  context: RenderContext,
  data: ReturnType<typeof resolveHeroData>,
): string {
  const image = mainImage(data);

  return `<section class="gc-hero gc-hero-service gc-hero-service--premium-conversion gc-hero--dna" ${heroDnaAttrs(context)} id="hero" data-hero-composition="service-premium-conversion">
    <div class="gc-container gc-hero-service__conversion-premium-inner">
      <div class="gc-hero-service__conversion-premium-copy">
        <span class="gc-hero-service__conversion-badge">ATENDIMENTO PROFISSIONAL</span>
        ${heroKicker(data.kicker)}
        ${heroTitle(data, context)}
        ${heroSupportingCopy(data)}
        ${heroActions(data)}
        ${heroTrust(data)}
      </div>
      <div class="gc-hero-service__conversion-premium-side">
        ${image ? `<figure>${imageTag(image, data.title)}</figure>` : ""}
        <div class="gc-hero-service__conversion-premium-panel">
          <span>ATENDIMENTO</span>
          <strong>${escapeHtml(data.primaryLabel || "Comece por aqui")}</strong>
          <p>Escolha uma opção de atendimento ou converse para tirar suas dúvidas.</p>
        </div>
      </div>
    </div>
  </section>`;
}

function heroDnaAttrs(context: RenderContext): string {
  const dna = context.visualDNA;
  if (!dna) return "";

  return [
    `data-dna-hero="${escapeAttr(dna.heroComposition)}"`,
    `data-dna-image="${escapeAttr(dna.imageTreatment)}"`,
    `data-dna-content="${escapeAttr(dna.contentPosition)}"`,
    `data-dna-headline="${escapeAttr(dna.headlineTreatment)}"`,
    `data-dna-decoration="${escapeAttr(dna.decoration)}"`,
  ].join(" ");
}
