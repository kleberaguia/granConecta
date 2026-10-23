import type { CtaAction, TemplateV2Service } from "../../TemplateTypes";
import type { RenderContext } from "../renderTypes";

export function renderServices(context: RenderContext): string {
  if (context.request.pageKind !== "servico") return "";

  const services = ensureServices(context);
  if (!services.length) return "";

  const family = context.variation.family;
  const strategy = context.commercialStrategy || context.request.commercialStrategy;

  const title =
    strategy?.offer ||
    (family === "magazine-story"
      ? "Um atendimento pensado para cada necessidade"
      : family === "conversion-sales"
        ? "Escolha seu próximo passo"
        : "Como podemos ajudar");

  const subtitle =
    strategy?.differentiator ||
    "Conheça as opções disponíveis e escolha a melhor forma de iniciar.";

  const modifier = resolvePremiumServiceModifier(context);

  return renderServiceShell({
    context,
    modifier,
    title,
    subtitle,
    content: renderServiceCards(context, services, modifier),
  });
}


function resolvePremiumServiceModifier(context: RenderContext): string {
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

function renderServiceCards(
  context: RenderContext,
  services: TemplateV2Service[],
  modifier: string,
): string {
  if (modifier === "premium-cinematic") {
    return `<div class="gc-services-cinematic-list">
      ${services.map((service, index) => renderCinematicServiceCard(context, service, index)).join("")}
    </div>`;
  }

  if (modifier === "premium-magazine") {
    const [first, ...rest] = services;
    return `<div class="gc-services-story">
      ${first ? renderMagazineFeaturedService(context, first, 0) : ""}
      <div class="gc-services-story__list">
        ${rest.map((service, index) => renderMagazineServiceCard(context, service, index + 1)).join("")}
      </div>
    </div>`;
  }

  if (modifier === "premium-minimal") {
    return `<div class="gc-services-minimal-list">
      ${services.map((service, index) => renderServiceRow(context, service, index)).join("")}
    </div>`;
  }

  if (modifier === "premium-conversion") {
    return `<div class="gc-services-conversion-grid">
      ${services.map((service, index) => renderConversionServiceCard(context, service, index)).join("")}
    </div>`;
  }

  return `<div class="gc-services-grid gc-services-grid--premium-warm">
    ${services.map((service, index) => renderWarmServiceCard(context, service, index)).join("")}
  </div>`;
}

function renderServiceShell(input: {
  context: RenderContext;
  modifier: string;
  title: string;
  subtitle: string;
  content: string;
}): string {
  return `<section class="gc-services gc-services--${escapeAttr(input.modifier)}" id="services">
  <div class="gc-container">
    <div class="gc-section-heading">
      <span>${escapeHtml(serviceEyebrow(input.context))}</span>
      <h2>${escapeHtml(input.title)}</h2>
      <p>${escapeHtml(input.subtitle)}</p>
    </div>
    ${input.content}
  </div>
</section>`;
}


function renderWarmServiceCard(context: RenderContext, service: TemplateV2Service, index: number): string {
  const strategy = context.commercialStrategy || context.request.commercialStrategy;
  const action: CtaAction = strategy?.primaryAction || "open-chat";
  const label = resolveServiceActionLabel(service, action, strategy?.primaryLabel);
  const image = serviceImage(context, service, index);
  return `<article class="gc-service-card gc-service-card--warm" data-gc-service-card="true" data-service-id="${escapeAttr(service.id)}">
    ${image ? `<div class="gc-service-card__media"><img src="${escapeAttr(image)}" alt="${escapeAttr(service.title)}" loading="lazy" /></div>` : ""}
    <div class="gc-service-card__body">
      <div class="gc-service-card__topline"><span>${String(index + 1).padStart(2, "0")}</span>${service.badge ? `<em>${escapeHtml(service.badge)}</em>` : ""}</div>
      <h3>${escapeHtml(service.title)}</h3>
      ${service.description ? `<p>${escapeHtml(service.description)}</p>` : ""}
      ${renderServiceMeta(service)}${renderServicePrice(service)}
      <div class="gc-card-actions gc-service-actions">
        <button type="button" data-action="${escapeAttr(action)}" data-gc-action="${escapeAttr(action)}" data-service-id="${escapeAttr(service.id)}">${escapeHtml(label)}</button>
        <button type="button" data-action="open-chat" data-gc-action="open-chat">Tirar dúvidas</button>
      </div>
    </div>
  </article>`;
}

function renderCinematicServiceCard(context: RenderContext, service: TemplateV2Service, index: number): string {
  const strategy = context.commercialStrategy || context.request.commercialStrategy;
  const action: CtaAction = strategy?.primaryAction || "open-chat";
  const label = resolveServiceActionLabel(service, action, strategy?.primaryLabel);
  const image = serviceImage(context, service, index);
  return `<article class="gc-service-card gc-service-card--cinematic" data-gc-service-card="true" data-service-id="${escapeAttr(service.id)}">
    <div class="gc-service-card-cinematic__number">${String(index + 1).padStart(2, "0")}</div>
    ${image ? `<div class="gc-service-card-cinematic__media"><img src="${escapeAttr(image)}" alt="${escapeAttr(service.title)}" loading="lazy" /></div>` : ""}
    <div class="gc-service-card-cinematic__content">
      <div><span>ATENDIMENTO</span><h3>${escapeHtml(service.title)}</h3></div>
      ${service.description ? `<p>${escapeHtml(service.description)}</p>` : ""}
      <div class="gc-service-card-cinematic__bottom">${renderServiceMeta(service)}${renderServicePrice(service)}
        <button type="button" data-action="${escapeAttr(action)}" data-gc-action="${escapeAttr(action)}" data-service-id="${escapeAttr(service.id)}">${escapeHtml(label)} →</button>
      </div>
    </div>
  </article>`;
}

function renderMagazineFeaturedService(context: RenderContext, service: TemplateV2Service, index: number): string {
  const strategy = context.commercialStrategy || context.request.commercialStrategy;
  const action: CtaAction = strategy?.primaryAction || "open-chat";
  const label = resolveServiceActionLabel(service, action, strategy?.primaryLabel);
  const image = serviceImage(context, service, index);
  return `<article class="gc-service-featured gc-service-featured--magazine" data-gc-service-card="true" data-service-id="${escapeAttr(service.id)}">
    ${image ? `<figure><img src="${escapeAttr(image)}" alt="${escapeAttr(service.title)}" loading="lazy" /></figure>` : ""}
    <div class="gc-service-featured-magazine__copy">
      <span>EM DESTAQUE</span><h3>${escapeHtml(service.title)}</h3>
      ${service.description ? `<p>${escapeHtml(service.description)}</p>` : ""}
      ${renderServiceMeta(service)}${renderServicePrice(service)}
      <button type="button" data-action="${escapeAttr(action)}" data-gc-action="${escapeAttr(action)}" data-service-id="${escapeAttr(service.id)}">${escapeHtml(label)}</button>
    </div>
  </article>`;
}

function renderMagazineServiceCard(context: RenderContext, service: TemplateV2Service, index: number): string {
  const strategy = context.commercialStrategy || context.request.commercialStrategy;
  const action: CtaAction = strategy?.primaryAction || "open-chat";
  const label = resolveServiceActionLabel(service, action, strategy?.primaryLabel);
  return `<article class="gc-service-card gc-service-card--magazine" data-gc-service-card="true" data-service-id="${escapeAttr(service.id)}">
    <span class="gc-service-card-magazine__number">${String(index + 1).padStart(2, "0")}</span>
    <div><h3>${escapeHtml(service.title)}</h3>${service.description ? `<p>${escapeHtml(service.description)}</p>` : ""}</div>
    <div>${renderServiceMeta(service)}${renderServicePrice(service)}
      <button type="button" data-action="${escapeAttr(action)}" data-gc-action="${escapeAttr(action)}" data-service-id="${escapeAttr(service.id)}">${escapeHtml(label)} →</button>
    </div>
  </article>`;
}

function renderConversionServiceCard(context: RenderContext, service: TemplateV2Service, index: number): string {
  const strategy = context.commercialStrategy || context.request.commercialStrategy;
  const action: CtaAction = strategy?.primaryAction || "open-chat";
  const label = resolveServiceActionLabel(service, action, strategy?.primaryLabel);
  const image = serviceImage(context, service, index);
  return `<article class="gc-service-card gc-service-card--conversion" data-gc-service-card="true" data-service-id="${escapeAttr(service.id)}">
    ${image ? `<div class="gc-service-card-conversion__media"><img src="${escapeAttr(image)}" alt="${escapeAttr(service.title)}" loading="lazy" /></div>` : ""}
    <div class="gc-service-card-conversion__body">
      ${service.badge ? `<span class="gc-service-badge">${escapeHtml(service.badge)}</span>` : ""}
      <h3>${escapeHtml(service.title)}</h3>${service.description ? `<p>${escapeHtml(service.description)}</p>` : ""}
      <div class="gc-service-card-conversion__meta">${renderServiceMeta(service)}${renderServicePrice(service)}</div>
      <button type="button" data-action="${escapeAttr(action)}" data-gc-action="${escapeAttr(action)}" data-service-id="${escapeAttr(service.id)}">${escapeHtml(label)}</button>
      <button type="button" data-action="open-chat" data-gc-action="open-chat">Falar antes de decidir</button>
    </div>
  </article>`;
}

function renderServiceCard(
  context: RenderContext,
  service: TemplateV2Service,
  index: number,
  featured = false,
): string {
  const strategy = context.commercialStrategy || context.request.commercialStrategy;
  const action: CtaAction = strategy?.primaryAction || "open-chat";
  const label = resolveServiceActionLabel(service, action, strategy?.primaryLabel);
  const image = serviceImage(context, service, index);

  const meta = renderServiceMeta(service);
  const price = renderServicePrice(service);

  return `<article class="${featured ? "gc-service-featured" : "gc-service-card"} gc-service-card--professional"
    data-gc-service-card="true" data-service-id="${escapeAttr(service.id)}">
    ${image ? `<div class="gc-service-card__media"><img src="${escapeAttr(image)}" alt="${escapeAttr(service.title)}" loading="lazy" /></div>` : ""}
    <div class="gc-service-card__body">
      ${service.badge ? `<span class="gc-service-badge">${escapeHtml(service.badge)}</span>` : ""}
      <h3>${escapeHtml(service.title)}</h3>
      ${service.description ? `<p>${escapeHtml(service.description)}</p>` : ""}
      ${meta}
      ${price}
      <div class="gc-card-actions gc-service-actions">
        <button type="button"
          data-action="${escapeAttr(action)}"
          data-gc-action="${escapeAttr(action)}"
          data-service-id="${escapeAttr(service.id)}">${escapeHtml(label)}</button>
        <button type="button" data-action="open-chat" data-gc-action="open-chat">Tirar dúvidas</button>
      </div>
    </div>
  </article>`;
}

function renderServiceRow(
  context: RenderContext,
  service: TemplateV2Service,
  index: number,
): string {
  const strategy = context.commercialStrategy || context.request.commercialStrategy;
  const action: CtaAction = strategy?.primaryAction || "open-chat";
  const label = resolveServiceActionLabel(service, action, strategy?.primaryLabel);
  const price = renderServicePrice(service);
  const meta = renderServiceMeta(service);

  return `<article class="gc-service-row" data-gc-service-card="true" data-service-id="${escapeAttr(service.id)}">
    <div>
      ${service.badge ? `<span class="gc-service-badge">${escapeHtml(service.badge)}</span>` : ""}
      <h3>${escapeHtml(service.title)}</h3>
      ${service.description ? `<p>${escapeHtml(service.description)}</p>` : ""}
      ${meta}
      ${price}
    </div>
    <div class="gc-service-row__actions">
      <button type="button"
        data-action="${escapeAttr(action)}"
        data-gc-action="${escapeAttr(action)}"
        data-service-id="${escapeAttr(service.id)}">${escapeHtml(label)}</button>
      <button type="button" data-action="open-whatsapp" data-gc-action="open-whatsapp">WhatsApp</button>
    </div>
  </article>`;
}

function serviceImage(
  context: RenderContext,
  service: TemplateV2Service,
  index: number,
): string {
  const ownImage = String(service.imageUrl || "").trim();
  if (ownImage) return ownImage;

  const pool = context.visualContext.media?.services || [];
  if (pool.length) return pool[index % pool.length]?.url || "";

  return context.visualContext.defaultServiceImage || "";
}

function serviceEyebrow(context: RenderContext): string {
  const category = String(context.visualContext.categoryName || "").trim();
  if (category && !looksGenericOrContaminated(category)) return category;
  return "Atendimentos";
}

function looksGenericOrContaminated(value: string): boolean {
  const key = value.toLowerCase();
  return ["joias", "jóias", "loja online", "sua marca"].includes(key);
}

function defaultActionLabel(action: CtaAction): string {
  if (action === "request-quote") return "Solicitar orçamento";
  if (action === "open-whatsapp") return "Falar no WhatsApp";
  if (action === "open-service") return "Ver atendimento";
  if (action === "contact") return "Entrar em contato";
  return "Iniciar atendimento";
}

function ensureServices(context: RenderContext): TemplateV2Service[] {
  const services = context.request.services || [];

  if (!services.length) {
    return [];
  }

  return services
    .filter((service) => Boolean(String(service?.title || "").trim()))
    .slice(0, 6)
    .map((service, index) => ({
      ...service,
      id: service.id || `service-${index + 1}`,
      title: String(service.title || "").trim(),
      description: String(service.description || "").trim() || undefined,
      icon: service.icon || undefined,
      badge: service.badge || defaultServiceBadge(service),
    }));
}

function defaultServiceBadge(service: TemplateV2Service): string | undefined {
  if (service.catalogType === "PACOTE") return "Pacote";
  if (service.catalogType === "PROMOCAO") return "Oferta";
  if (service.highlighted) return "Destaque";
  return undefined;
}

function renderServiceMeta(service: TemplateV2Service): string {
  const items: string[] = [];

  if (service.durationMinutes && service.durationMinutes > 0) {
    items.push(`${Math.round(service.durationMinutes)} min`);
  }

  if (service.totalSessions && service.totalSessions > 1) {
    items.push(`${Math.round(service.totalSessions)} sessões`);
  }

  const modality = formatModality(service.modality);
  if (modality) items.push(modality);

  if (!items.length) return "";

  return `<div class="gc-service-meta">${items
    .map((item) => `<span>${escapeHtml(item)}</span>`)
    .join("")}</div>`;
}

function renderServicePrice(service: TemplateV2Service): string {
  const promotional =
    typeof service.promotionalPrice === "number" && service.promotionalPrice >= 0
      ? service.promotionalPrice
      : undefined;

  const price =
    typeof service.price === "number" && service.price >= 0
      ? service.price
      : undefined;

  if (promotional !== undefined) {
    return `<div class="gc-service-price">
      ${price !== undefined && price !== promotional
        ? `<span class="gc-service-price__old">${escapeHtml(formatCurrency(price))}</span>`
        : ""}
      <strong>${escapeHtml(formatCurrency(promotional))}</strong>
    </div>`;
  }

  if (price !== undefined) {
    return `<div class="gc-service-price"><strong>${escapeHtml(formatCurrency(price))}</strong></div>`;
  }

  return "";
}

function formatCurrency(value: number): string {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  } catch {
    return `R$ ${Number(value || 0).toFixed(2).replace(".", ",")}`;
  }
}

function formatModality(
  modality: TemplateV2Service["modality"],
): string | undefined {
  if (modality === "PRESENCIAL") return "Presencial";
  if (modality === "ONLINE") return "Online";
  if (modality === "AMBOS") return "Presencial ou Online";
  return undefined;
}

function resolveServiceActionLabel(
  service: TemplateV2Service,
  action: CtaAction,
  strategyLabel?: string,
): string {
  const explicit = String(strategyLabel || "").trim();

  if (service.catalogType === "PACOTE") {
    if (action === "request-quote") return "Solicitar informações";
    if (action === "schedule-service") return "Agendar pacote";
    if (action === "hire-service") return "Contratar pacote";
    return explicit || "Conhecer pacote";
  }

  if (service.catalogType === "PROMOCAO") {
    return explicit || "Quero esta oferta";
  }

  if (explicit) return explicit;

  if (action === "schedule-service") return "Agendar atendimento";
  if (action === "hire-service") return "Quero contratar";
  if (action === "request-service") return "Solicitar atendimento";

  return defaultActionLabel(action);
}

function escapeHtml(value: any): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(value: any): string {
  return escapeHtml(value)
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}