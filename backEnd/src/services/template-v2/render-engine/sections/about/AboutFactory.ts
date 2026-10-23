import type { RenderContext } from "../../renderTypes";
import {
  escapeAttr,
  escapeHtml,
  mediaUrls,
  primaryAction,
  primaryLabel,
  renderAction,
} from "../SectionLibraryShared";
import { SectionVariantEngine } from "../../../SectionVariantEngine";


type ServiceLayoutVariant = "premium-warm" | "premium-cinematic" | "premium-magazine" | "premium-minimal" | "premium-conversion";

function resolveServiceLayoutVariant(context: RenderContext): ServiceLayoutVariant {
  const raw = (context.request as any)?.raw || {};
  const brief = (context.request as any)?.serviceDesignBrief || raw?.serviceDesignBrief ||
    raw?.selectedVariation?.serviceDesignBrief || raw?.aiVariation?.serviceDesignBrief;
  const id = String(brief?.id || (context.request as any)?.serviceDesignBriefId ||
    raw?.serviceDesignBriefId || raw?.selectedVariation?.serviceDesignBriefId ||
    raw?.aiVariation?.serviceDesignBriefId || "").toUpperCase();

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

export function renderAboutByContext(context: RenderContext): string {
  const variant = SectionVariantEngine.resolve(context).about;
  const images = mediaUrls(context);
  const image =
    context.visualContext.media?.about?.[0]?.url ||
    images[2] ||
    images[0] ||
    "";
  const secondaryImage =
    context.visualContext.media?.about?.[1]?.url ||
    images.find((url) => url && url !== image) ||
    "";
  const title =
    context.request.copy?.aboutTitle ||
    `Sobre ${context.request.businessName}`;
  const text = resolveText(context);

  if (context.request.pageKind === "servico") {
    return renderPremiumServiceAbout(context, title, text, image, secondaryImage);
  }

  switch (variant) {
    case "cinematic-story":
      return `<section class="gc-about gc-about--cinematic-story" id="about"${image ? ` style="--gc-about-bg:url('${escapeCssUrl(image)}')"` : ""}>
        <div class="gc-about-cinematic__shade"></div>
        <div class="gc-container gc-about-cinematic__inner">
          <div class="gc-about-cinematic__copy">
            <span>Nossa história</span>
            <h2>${escapeHtml(title)}</h2>
            <p>${escapeHtml(text)}</p>
            ${renderAction(primaryAction(context), primaryLabel(context), true)}
          </div>
        </div>
      </section>`;

    case "boutique-brand":
      return `<section class="gc-about gc-about--boutique-brand" id="about">
        <div class="gc-container gc-about-boutique__inner">
          <div class="gc-about-boutique__copy">
            <span>Conheça a marca</span>
            <h2>${escapeHtml(title)}</h2>
            <p>${escapeHtml(text)}</p>
            ${renderAction("open-chat", "Falar com a marca", false)}
          </div>
          ${image ? `<figure class="gc-about-boutique__media"><img src="${escapeAttr(image)}" alt="${escapeAttr(title)}" /></figure>` : ""}
        </div>
      </section>`;

    case "magazine-numbered":
      return `<section class="gc-about gc-about--magazine-numbered" id="about">
        <div class="gc-container gc-about-magazine__inner">
          <div class="gc-about-magazine__number" aria-hidden="true">02</div>
          <div class="gc-about-magazine__copy">
            <span>Perfil</span>
            <h2>${escapeHtml(title)}</h2>
            <p>${escapeHtml(text)}</p>
            ${renderAction("open-chat", "Conhecer mais", false)}
          </div>
          ${image ? `<figure class="gc-about-magazine__primary"><img src="${escapeAttr(image)}" alt="${escapeAttr(title)}" /></figure>` : ""}
          ${secondaryImage ? `<figure class="gc-about-magazine__secondary"><img src="${escapeAttr(secondaryImage)}" alt="" /></figure>` : ""}
        </div>
      </section>`;

    case "minimal-centered":
      return `<section class="gc-about gc-about--minimal-centered" id="about">
        <div class="gc-container gc-about-minimal-centered__inner">
          <span>Sobre</span>
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(text)}</p>
          ${image ? `<figure><img src="${escapeAttr(image)}" alt="${escapeAttr(title)}" /></figure>` : ""}
        </div>
      </section>`;

    case "conversion-proof":
      return `<section class="gc-about gc-about--conversion-proof" id="about">
        <div class="gc-container gc-about-conversion__inner">
          ${image ? `<div class="gc-about-conversion__media"><img src="${escapeAttr(image)}" alt="${escapeAttr(title)}" /></div>` : ""}
          <div class="gc-about-conversion__copy">
            <span>Por que escolher</span>
            <h2>${escapeHtml(title)}</h2>
            <p>${escapeHtml(text)}</p>
            ${context.commercialStrategy?.differentiator ? `<strong>${escapeHtml(context.commercialStrategy.differentiator)}</strong>` : ""}
            ${renderAction(primaryAction(context), primaryLabel(context), true)}
          </div>
        </div>
      </section>`;

    case "editorial-overlap":
    default:
      return `<section class="gc-about gc-about--editorial-overlap" id="about">
        <div class="gc-container gc-about-editorial__inner">
          <div class="gc-about-editorial__copy">
            <span>Conheça a marca</span>
            <h2>${escapeHtml(title)}</h2>
            <p>${escapeHtml(text)}</p>
            ${renderAction("open-chat", "Falar com a marca", false)}
          </div>
          ${image ? `<figure class="gc-about-editorial__primary"><img src="${escapeAttr(image)}" alt="${escapeAttr(title)}" /></figure>` : ""}
          ${secondaryImage ? `<figure class="gc-about-editorial__secondary"><img src="${escapeAttr(secondaryImage)}" alt="" /></figure>` : ""}
        </div>
      </section>`;
  }
}


function renderPremiumServiceAbout(
  context: RenderContext, title: string, text: string, image: string, secondaryImage: string,
): string {
  const differentiator = context.commercialStrategy?.differentiator ||
    context.request.commercialStrategy?.differentiator || "";
  const layout = resolveServiceLayoutVariant(context);

  if (layout === "premium-cinematic") return `<section class="gc-about gc-about--service-cinematic" id="about"${image ? ` style="--gc-service-about-bg:url('${escapeCssUrl(image)}')"` : ""}>
    <div class="gc-about-service-cinematic__shade"></div><div class="gc-container gc-about-service-cinematic__inner">
    <div class="gc-about-service-cinematic__copy"><span>CONHEÇA O ATENDIMENTO</span><h2>${escapeHtml(title)}</h2>
    <p>${escapeHtml(text)}</p>${differentiator ? `<strong>${escapeHtml(differentiator)}</strong>` : ""}
    ${renderAction(primaryAction(context), primaryLabel(context), true)}</div></div></section>`;

  if (layout === "premium-magazine") return `<section class="gc-about gc-about--service-magazine" id="about">
    <div class="gc-container gc-about-service-magazine__inner"><div class="gc-about-service-magazine__number" aria-hidden="true">02</div>
    <div class="gc-about-service-magazine__copy"><span>PERFIL PROFISSIONAL</span><h2>${escapeHtml(title)}</h2><p>${escapeHtml(text)}</p>
    ${differentiator ? `<blockquote>${escapeHtml(differentiator)}</blockquote>` : ""}${renderAction("open-chat", "Conversar sobre o atendimento", false)}</div>
    ${image ? `<figure class="gc-about-service-magazine__primary"><img src="${escapeAttr(image)}" alt="${escapeAttr(title)}" loading="lazy" /></figure>` : ""}
    ${secondaryImage ? `<figure class="gc-about-service-magazine__secondary"><img src="${escapeAttr(secondaryImage)}" alt="" loading="lazy" /></figure>` : ""}
    </div></section>`;

  if (layout === "premium-minimal") return `<section class="gc-about gc-about--service-minimal" id="about"><div class="gc-container gc-about-service-minimal__inner">
    ${image ? `<figure><img src="${escapeAttr(image)}" alt="${escapeAttr(title)}" loading="lazy" /></figure>` : ""}
    <div><span>SOBRE</span><h2>${escapeHtml(title)}</h2><p>${escapeHtml(text)}</p>
    ${differentiator ? `<p class="gc-about-service-minimal__proof">${escapeHtml(differentiator)}</p>` : ""}</div></div></section>`;

  if (layout === "premium-conversion") return `<section class="gc-about gc-about--service-conversion" id="about"><div class="gc-container gc-about-service-conversion__inner">
    ${image ? `<figure><img src="${escapeAttr(image)}" alt="${escapeAttr(title)}" loading="lazy" /></figure>` : ""}
    <div class="gc-about-service-conversion__copy"><span>POR QUE ESCOLHER ESTE ATENDIMENTO</span><h2>${escapeHtml(title)}</h2><p>${escapeHtml(text)}</p>
    ${differentiator ? `<div class="gc-about-service-conversion__proof">${escapeHtml(differentiator)}</div>` : ""}
    ${renderAction(primaryAction(context), primaryLabel(context), true)}${renderAction("open-chat", "Tirar dúvidas", false)}</div></div></section>`;

  return `<section class="gc-about gc-about--service-premium-warm" id="about"><div class="gc-container gc-about-service-premium__inner">
    <div class="gc-about-service-premium__copy"><span class="gc-about-service-premium__eyebrow">SOBRE</span><h2>${escapeHtml(title)}</h2><p>${escapeHtml(text)}</p>
    ${renderAction(primaryAction(context), primaryLabel(context), true)}</div>
    ${image ? `<figure class="gc-about-service-premium__media"><img src="${escapeAttr(image)}" alt="${escapeAttr(title)}" loading="lazy" /></figure>` : ""}
    ${differentiator ? `<aside class="gc-about-service-premium__proof"><span>UM JEITO PRÓXIMO DE ATENDER</span><p>${escapeHtml(differentiator)}</p>${renderAction("open-chat", "Tirar dúvidas", false)}</aside>` : ""}
    </div></section>`;
}

function resolveText(context: RenderContext): string {
  const explicit = String(context.request.copy?.aboutText || "").trim();
  if (explicit) return explicit;

  const description = String(context.request.descricao || "").trim();
  const lower = description.toLowerCase();
  const looksInternal =
    lower.includes("estilo desejado:") ||
    lower.includes("objetivo principal:") ||
    lower.includes("sensação desejada:") ||
    lower.includes("preferência de imagens:");

  if (description && !looksInternal) return description;

  return (
    context.commercialStrategy?.differentiator ||
    context.request.commercialStrategy?.differentiator ||
    `${context.request.businessName} apresenta uma experiência pensada para aproximar pessoas, produtos e serviços de forma clara e especial.`
  );
}

function escapeCssUrl(value: string): string {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'");
}
