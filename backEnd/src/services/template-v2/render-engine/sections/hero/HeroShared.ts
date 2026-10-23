import { CtaAction } from "../../../TemplateTypes";
import type { RenderContext } from "../../renderTypes";
import { CopyHierarchyEngine } from "../../../design-system/CopyHierarchyEngine";
import { HeadlineCompositionEngine } from "../../../design-system/HeadlineCompositionEngine";

export type HeroData = {
  title: string;
  subtitle: string;
  image: string;
  images: string[];
  kicker: string;
  primaryAction: CtaAction;
  secondaryAction?: CtaAction;
  primaryLabel: string;
  secondaryLabel?: string;
  trustItems: string[];
  isService: boolean;
};

export function resolveHeroData(context: RenderContext): HeroData {
  const isService = context.request.pageKind === "servico";
  const strategy =
    context.commercialStrategy ||
    context.request.commercialStrategy;

  /**
   * A estratégia comercial tem prioridade sobre os fallbacks genéricos.
   *
   * A copy explicitamente fornecida pela requisição ainda tem prioridade máxima,
   * permitindo edição/manual override sem perder compatibilidade.
   */
  const title =
    firstPublicCopy(
      context.request.copy?.heroTitle,
      strategy?.heroTitle,
      context.request.selectedVariation?.heroTitle,
      context.request.aiVariation?.heroTitle,
    ) ||
    defaultHeroTitle(
      context.request.businessName,
      context.visualContext.categoryName || context.request.businessSegment,
      isService,
    );

  const subtitle =
    firstPublicCopy(
      context.request.copy?.heroSubtitle,
      strategy?.heroSubtitle,
      context.request.selectedVariation?.heroSubtitle,
      context.request.aiVariation?.heroSubtitle,
    ) ||
    defaultHeroSubtitle(
      context.visualContext.categoryName || context.request.businessSegment,
      isService,
    );

  const primaryAction =
    strategy?.primaryAction ||
    context.variation.primaryAction;

  const secondaryAction =
    strategy?.secondaryAction ||
    context.variation.secondaryAction;

  const primaryLabel =
    firstPublicCopy(
      context.request.copy?.primaryCta,
      strategy?.primaryLabel,
    ) ||
    labelForAction(primaryAction, isService);

  const secondaryLabel =
    firstPublicCopy(
      context.request.copy?.secondaryCta,
      strategy?.secondaryLabel,
    ) ||
    (secondaryAction
      ? labelForAction(secondaryAction, isService)
      : undefined);

  const trustItems =
    strategy?.trustItems?.filter(Boolean).slice(0, 3) || [];

  return {
    title,
    subtitle,
    image: resolveHeroImages(context)[0] || "",
    images: resolveHeroImages(context),
    kicker: safePublicKicker(
      context.visualContext.categoryName,
      context.request.businessSegment,
      context.request.descricao,
    ),
    primaryAction,
    secondaryAction,
    primaryLabel,
    secondaryLabel,
    trustItems,
    isService,
  };
}

export function resolveHeroImages(context: RenderContext): string[] {
  const planned = Array.isArray(context.visualContext.media?.hero)
    ? context.visualContext.media!.hero
        .map((asset) => String(asset?.url || "").trim())
        .filter(Boolean)
    : [];

  const legacy = [
    context.visualContext.heroImage,
    context.visualContext.categoryImage,
    context.visualContext.defaultProductImage,
    context.visualContext.defaultServiceImage,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  return Array.from(new Set([...planned, ...legacy]));
}


export function heroTitle(data: HeroData, context: RenderContext): string {
  if (context.visualDNA) {
    return HeadlineCompositionEngine.render(data.title, context.visualDNA);
  }

  const treatment = context.designSystem?.typography.titleTreatment || "display-serif";
  const parts = CopyHierarchyEngine.splitTitle(data.title);

  if (!parts.accent) {
    return `<h1 class="gc-hero-title gc-title-treatment--${escapeAttr(treatment)}"><span class="gc-hero-title__leading">${escapeHtml(parts.leading)}</span></h1>`;
  }

  return `<h1 class="gc-hero-title gc-title-treatment--${escapeAttr(treatment)}"><span class="gc-hero-title__leading">${escapeHtml(parts.leading)} </span><span class="gc-hero-title__accent">${escapeHtml(parts.accent)}</span></h1>`;
}

/**
 * Headline V3.
 *
 * Quando o Visual DNA estiver disponível, utiliza a composição tipográfica
 * determinada para este negócio/variação. Caso contrário, mantém exatamente
 * o tratamento V2.1 já existente.
 */
export function heroHeadline(
  context: RenderContext,
  title: string,
): string {
  if (context.visualDNA) {
    return HeadlineCompositionEngine.render(title, context.visualDNA);
  }

  const fallbackData = {
    title,
  } as HeroData;

  return heroTitle(fallbackData, context);
}

export function heroSupportingCopy(data: HeroData): string {
  const role = CopyHierarchyEngine.classifySupportingCopy(data.subtitle);
  return `<p class="gc-hero-supporting gc-copy-role--${escapeAttr(role)}">${escapeHtml(data.subtitle)}</p>`;
}

export function heroKicker(value: string): string {
  if (!String(value || "").trim()) {
    return "";
  }

  return `<span class="gc-kicker">${escapeHtml(value)}</span>`;
}

export function heroActions(data: HeroData): string {
  const primary = actionButton(
    data.primaryAction,
    data.primaryLabel,
    true,
  );

  const secondary =
    data.secondaryAction && data.secondaryLabel
      ? actionButton(
          data.secondaryAction,
          data.secondaryLabel,
          false,
        )
      : "";

  return `<div class="gc-actions">
    ${primary}
    ${secondary}
  </div>`;
}

/**
 * Renderiza os sinais de confiança definidos pela estratégia comercial.
 * Os Heroes podem escolher onde posicionar esse bloco.
 */
export function heroTrust(data: HeroData): string {
  if (!data.trustItems.length) {
    return "";
  }

  return `<div class="gc-hero-trust">
    ${data.trustItems
      .map(
        (item) =>
          `<span class="gc-hero-trust__item">✓ ${escapeHtml(item)}</span>`,
      )
      .join("")}
  </div>`;
}

export function actionButton(
  action: CtaAction,
  label: string,
  primary: boolean,
): string {
  return `<button
    type="button"
    class="gc-btn ${primary ? "gc-btn--primary" : "gc-btn--secondary"}"
    data-action="${escapeAttr(action)}"
    data-gc-action="${escapeAttr(action)}"
  >
    ${escapeHtml(label)}
  </button>`;
}

export function labelForAction(
  action: CtaAction,
  isService: boolean,
): string {
  const labels: Record<CtaAction, string> = {
    "add-to-cart": "Adicionar ao carrinho",
    "open-cart": "Abrir carrinho",
    "add-to-wishlist": "Lista de desejo",
    "open-product": "Ver detalhes",
    "open-products": isService ? "Ver serviços" : "Ver produtos",
    "open-offers": "Ver ofertas",
    "open-combos": "Ver combos",
    "open-chat": "Falar no chat",
    "open-whatsapp": "WhatsApp",
    contact: "Fale conosco",
    "open-service": "Ver serviço",
    "request-quote": "Solicitar orçamento",
    "request-service": "Solicitar atendimento",
    "schedule-service": "Agendar atendimento",
    "hire-service": "Quero contratar",
    "open-provider": "Ver profissional",
  };

  return labels[action] || "Saiba mais";
}

function defaultHeroTitle(
  businessName: string,
  categoryName: string,
  isService: boolean,
): string {
  const safeBusinessName = safePublicBusinessName(businessName);

  if (!safeBusinessName) {
    return isService
      ? "Atendimento profissional pensado para você"
      : "Escolhas especiais para o seu dia a dia";
  }

  return isService
    ? `${safeBusinessName}: atendimento profissional para você`
    : `${safeBusinessName}: produtos escolhidos para encantar`;
}

function defaultHeroSubtitle(
  categoryName: string,
  isService: boolean,
): string {
  const safeCategory =
    String(categoryName || "").trim() ||
    (isService ? "serviços" : "produtos");

  return isService
    ? `Conheça soluções de ${safeCategory} com atendimento direto e um próximo passo simples.`
    : `Conheça opções de ${safeCategory}, veja destaques e escolha com praticidade.`;
}



function safePublicBusinessName(value: string): string {
  const text = String(value || "").trim();
  if (!text) return "";

  const normalized = normalizeForBriefingCheck(text);
  if (normalized === "sua marca") return "";
  if (normalized === "geral") return "";
  return text;
}

function safePublicKicker(
  categoryName?: string,
  businessSegment?: string,
  descricao?: string,
): string {
  const candidates = [categoryName, businessSegment];

  for (const candidate of candidates) {
    const text = String(candidate || "").trim();
    if (!text) continue;

    const normalized = normalizeForBriefingCheck(text);
    if (["sua marca", "geral", "joias", "joia"].includes(normalized)) {
      // "Joias" só pode aparecer se o próprio briefing realmente for desse nicho.
      const descriptionKey = normalizeForBriefingCheck(descricao || "");
      if (
        (normalized === "joias" || normalized === "joia") &&
        (descriptionKey.includes("joia") || descriptionKey.includes("semijoia"))
      ) {
        return text;
      }
      continue;
    }

    return text;
  }

  return "";
}

/**
 * Copy pública nunca deve expor o briefing interno usado pelo gerador.
 *
 * Mantemos overrides manuais e variações compatíveis, mas qualquer valor que
 * pareça instrução/configuração do builder é descartado antes de chegar ao Hero.
 */
function firstPublicCopy(...values: unknown[]): string {
  for (const value of values) {
    const text = String(value ?? "").trim();

    if (!text) continue;
    if (looksLikeInternalBriefing(text)) continue;

    return text;
  }

  return "";
}

function looksLikeInternalBriefing(value: string): boolean {
  const normalized = normalizeForBriefingCheck(value);

  const briefingMarkers = [
    "estilo desejado:",
    "objetivo principal:",
    "produto/servico de destaque:",
    "servico/produto de destaque:",
    "sensacao desejada:",
    "preferencia de imagens:",
    "descricao complementar:",
    "publico desejado:",
    "publico alvo:",
    "acao principal:",
    "diferencial:",
  ];

  return briefingMarkers.some((marker) => normalized.includes(marker));
}

function normalizeForBriefingCheck(value: string): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function escapeHtml(value: any): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function escapeAttr(value: any): string {
  return escapeHtml(value)
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}