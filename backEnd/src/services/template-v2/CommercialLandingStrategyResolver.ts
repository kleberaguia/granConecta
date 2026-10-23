import type {
  CommercialConversionType,
  CommercialObjective,
  CtaAction,
  LandingCommercialStrategy,
  NormalizedTemplateRequest,
  TemplateSectionKey,
} from "./TemplateTypes";

/**
 * Converte os dados simples informados pelo cliente em uma estratégia comercial
 * que pode ser reutilizada por Hero, serviços, contato e demais seções.
 *
 * Nesta primeira versão:
 * - não cria regras por profissão/nicho;
 * - não adiciona novas CtaAction;
 * - mantém compatibilidade com o renderer atual;
 * - usa answers quando existirem e aplica fallbacks seguros.
 */
export class CommercialLandingStrategyResolver {
  static resolve(
    request: NormalizedTemplateRequest,
  ): LandingCommercialStrategy {
    const answers = asObject(request.answers);

    const rawObjective = firstText(
      answers.acaoPrincipal,
      answers.acao_principal,
      answers.objetivo,
      answers.objective,
      request.raw?.acaoPrincipal,
      request.raw?.acao_principal,
      request.raw?.objetivo,
      request.raw?.objective,
    );

    const audience = firstText(
      answers.publico,
      answers.publicoAlvo,
      answers.publico_alvo,
      answers.audience,
      request.raw?.publico,
      request.raw?.publicoAlvo,
      request.raw?.publico_alvo,
      request.raw?.audience,
    );

    const offer = firstText(
      answers.oferta,
      answers.offer,
      answers.destaque,
      request.raw?.oferta,
      request.raw?.offer,
      request.raw?.destaque,
      request.services?.[0]?.title,
      request.products?.[0]?.name,
    );

    const differentiator = firstText(
      answers.diferencial,
      answers.differentiator,
      answers.beneficio,
      answers.benefício,
      request.raw?.diferencial,
      request.raw?.differentiator,
      request.raw?.beneficio,
      request.raw?.benefício,
    );

    const objective = resolveObjective(request, rawObjective);
    const conversionType = resolveConversionType(objective);

    const primaryAction = resolvePrimaryAction(request, objective);
    const secondaryAction = resolveSecondaryAction(request, primaryAction);

    const primaryLabel =
      resolveCustomPrimaryLabel(request) ||
      defaultPrimaryLabel(objective, request.pageKind, request);

    const secondaryLabel =
      resolveCustomSecondaryLabel(request) ||
      defaultSecondaryLabel(secondaryAction);

    // A copy pública deve nascer primeiro da estratégia comercial real.
    // copy/selectedVariation/aiVariation continuam úteis como fallback,
    // mas não podem substituir o contexto do negócio por frases genéricas.
    const strategicHeroTitle = buildHeroTitle({
      request,
      objective,
      offer,
      audience,
    });

    const strategicHeroSubtitle = buildHeroSubtitle({
      request,
      objective,
      offer,
      audience,
      differentiator,
    });

    const heroTitle =
      strategicHeroTitle ||
      firstText(
        request.copy?.heroTitle,
        request.selectedVariation?.heroTitle,
        request.aiVariation?.heroTitle,
      );

    const heroSubtitle =
      strategicHeroSubtitle ||
      firstText(
        request.copy?.heroSubtitle,
        request.selectedVariation?.heroSubtitle,
        request.aiVariation?.heroSubtitle,
      );

    return {
      objective,
      conversionType,
      audience: audience || undefined,
      offer: offer || undefined,
      differentiator: differentiator || undefined,

      primaryAction,
      primaryLabel,

      secondaryAction,
      secondaryLabel,

      heroTitle,
      heroSubtitle,

      trustItems: buildTrustItems(request, differentiator),
      recommendedSections: buildRecommendedSections(request, objective),
    };
  }
}

function resolveObjective(
  request: NormalizedTemplateRequest,
  rawObjective: string,
): CommercialObjective {
  const value = normalize(rawObjective);

  if (request.pageKind === "loja") {
    if (containsAny(value, [
      "catalogo",
      "catálogo",
      "mostrar catalogo",
      "ver catalogo",
      "ver produtos",
      "mostrar produtos",
    ])) {
      return "show-catalog";
    }

    if (containsAny(value, [
      "orcamento",
      "orçamento",
      "pedir orçamento",
      "gerar orçamento",
    ])) {
      return "request-quote";
    }

    if (containsAny(value, [
      "conversar",
      "falar comigo",
      "falar no chat",
      "whatsapp",
      "contato",
    ])) {
      return "start-conversation";
    }

    if (containsAny(value, [
      "interesse",
      "desejo",
      "lista de desejo",
      "lista de desejos",
      "lead",
    ])) {
      return "generate-interest";
    }

    return "sell-products";
  }

  if (containsAny(value, [
    "agendar",
    "agendamento",
    "agenda",
    "marcar",
    "reservar",
    "consulta",
    "avaliacao",
    "avaliação",
  ])) {
    return "schedule";
  }

  if (containsAny(value, [
    "pacote",
    "comprar pacote",
    "vender pacote",
    "acompanhamento",
  ])) {
    return "sell-package";
  }

  if (containsAny(value, [
    "comprar servico",
    "comprar serviço",
    "contratar",
    "contratacao",
    "contratação",
  ])) {
    return "sell-service";
  }

  if (containsAny(value, [
    "conversar",
    "falar comigo",
    "falar no chat",
    "whatsapp",
    "contato",
  ])) {
    return "start-conversation";
  }

  if (containsAny(value, [
    "conhecer",
    "mostrar servicos",
    "mostrar serviços",
    "ver servicos",
    "ver serviços",
    "apresentar",
  ])) {
    return "present-business";
  }

  /**
   * Quando o cliente não escolheu explicitamente um objetivo, evitamos
   * transformar todo prestador em "pedido de orçamento".
   *
   * Profissões baseadas em sessão, consulta, avaliação ou acompanhamento
   * convertem melhor para agendamento/conversa. Orçamento continua sendo o
   * fallback correto para obra, reparo, instalação e serviços técnicos.
   */
  if (isAppointmentLedService(request)) {
    return "schedule";
  }

  if (isQuoteLedService(request)) {
    return "request-quote";
  }

  return "start-conversation";
}

function resolveConversionType(
  objective: CommercialObjective,
): CommercialConversionType {
  switch (objective) {
    case "schedule":
      return "schedule";

    case "request-quote":
      return "quote";

    case "start-conversation":
      return "chat";

    case "sell-products":
    case "sell-service":
    case "sell-package":
      return "commerce";

    case "show-catalog":
    case "present-business":
      return "catalog";

    case "generate-interest":
    default:
      return "lead";
  }
}

function resolvePrimaryAction(
  request: NormalizedTemplateRequest,
  objective: CommercialObjective,
): CtaAction {
  if (request.pageKind === "loja") {
    switch (objective) {
      case "show-catalog":
      case "present-business":
        return "open-products";

      case "request-quote":
        return "open-chat";

      case "start-conversation":
        return "open-chat";

      case "generate-interest":
        return "add-to-wishlist";

      case "sell-products":
      default:
        return request.products.length === 1
          ? "open-product"
          : "open-products";
    }
  }

  switch (objective) {
    case "schedule":
      return "schedule-service";

    case "start-conversation":
      return "open-chat";

    case "present-business":
      return "open-service";

    case "sell-service":
    case "sell-package":
      return "hire-service";

    case "request-quote":
      return "request-quote";

    default:
      return "request-service";
  }
}

function resolveSecondaryAction(
  request: NormalizedTemplateRequest,
  primaryAction: CtaAction,
): CtaAction | undefined {
  if (primaryAction !== "open-chat") {
    return "open-chat";
  }

  if (request.pageKind === "servico") {
    return isAppointmentLedService(request)
      ? "open-whatsapp"
      : "request-quote";
  }

  return "open-whatsapp";
}

function resolveCustomPrimaryLabel(
  request: NormalizedTemplateRequest,
): string {
  return firstText(
    request.raw?.primaryCta,
    request.raw?.primaryCTA,
    request.raw?.primaryLabel,
    request.answers?.primaryCta,
    request.answers?.primaryCTA,
    request.answers?.primaryLabel,
  );
}

function resolveCustomSecondaryLabel(
  request: NormalizedTemplateRequest,
): string {
  return firstText(
    request.raw?.secondaryCta,
    request.raw?.secondaryCTA,
    request.raw?.secondaryLabel,
    request.answers?.secondaryCta,
    request.answers?.secondaryCTA,
    request.answers?.secondaryLabel,
  );
}

function defaultPrimaryLabel(
  objective: CommercialObjective,
  pageKind: NormalizedTemplateRequest["pageKind"],
  request?: NormalizedTemplateRequest,
): string {
  switch (objective) {
    case "schedule":
      return request
        ? resolveSchedulePrimaryLabel(request)
        : "Agendar atendimento";

    case "request-quote":
      return "Quero pedir um orçamento";

    case "start-conversation":
      return "Quero conversar";

    case "show-catalog":
      return pageKind === "loja"
        ? "Ver produtos"
        : "Conhecer os serviços";

    case "sell-products":
      return "Ver produtos";

    case "sell-service":
      return "Quero contratar";

    case "sell-package":
      return "Conhecer o pacote";

    case "generate-interest":
      return "Tenho interesse";

    case "present-business":
    default:
      return pageKind === "loja"
        ? "Conhecer a loja"
        : "Conhecer os serviços";
  }
}

function defaultSecondaryLabel(action?: CtaAction): string | undefined {
  switch (action) {
    case "open-chat":
      return "Falar no chat";

    case "open-whatsapp":
      return "Falar sobre o atendimento";

    case "request-quote":
      return "Solicitar orçamento";

    case "request-service":
      return "Solicitar atendimento";

    case "schedule-service":
      return "Agendar atendimento";

    case "hire-service":
      return "Quero contratar";

    case "open-service":
      return "Ver serviço";

    case "open-products":
      return "Ver produtos";

    default:
      return undefined;
  }
}

function buildHeroTitle(input: {
  request: NormalizedTemplateRequest;
  objective: CommercialObjective;
  offer: string;
  audience: string;
}): string {
  const { request, objective, offer } = input;
  const businessName = request.businessName || "Seu negócio";
  const segment = cleanSegment(request.businessSegment);

  if (request.pageKind === "loja") {
    if (objective === "show-catalog") {
      return offer
        ? `${offer}: conheça nossas opções`
        : `${businessName}: encontre o que combina com você`;
    }

    if (objective === "generate-interest") {
      return offer
        ? `${offer}: salve o que mais gostou`
        : `${businessName}: descubra seus próximos favoritos`;
    }

    return offer
      ? `${offer} para escolher e comprar com praticidade`
      : `${businessName}: produtos para escolher com confiança`;
  }

  switch (objective) {
    case "schedule":
      if (isAppointmentLedService(request)) {
        return buildAppointmentHeroTitle(request, offer, businessName);
      }

      return offer
        ? `${offer}: dê o próximo passo`
        : `${businessName}: atendimento para o que você precisa`;

    case "start-conversation":
      return offer
        ? `Vamos conversar sobre ${lowerFirst(offer)}`
        : `Converse com ${businessName} sobre o que você precisa`;

    case "sell-package":
      return offer
        ? `${offer}: acompanhamento com começo, meio e continuidade`
        : `${businessName}: acompanhamento pensado para você`;

    case "sell-service":
      return offer
        ? `${offer}: atendimento com clareza e confiança`
        : `${businessName}: encontre o atendimento que você procura`;

    case "present-business":
      return segment
        ? `Conheça soluções em ${segment}`
        : `Conheça os serviços de ${businessName}`;

    case "request-quote":
    default:
      return offer
        ? `${offer}: solicite seu atendimento`
        : `${businessName}: solução profissional para sua necessidade`;
  }
}

function buildHeroSubtitle(input: {
  request: NormalizedTemplateRequest;
  objective: CommercialObjective;
  offer: string;
  audience: string;
  differentiator: string;
}): string {
  const {
    request,
    objective,
    offer,
    audience,
    differentiator,
  } = input;

  const segment = cleanSegment(request.businessSegment);
  const audienceText = audience
    ? ` para ${lowerFirst(audience)}`
    : "";

  const differentiatorText = differentiator
    ? ` ${ensureSentence(differentiator)}`
    : "";

  if (request.pageKind === "loja") {
    if (objective === "show-catalog") {
      return `Explore produtos e opções${segment ? ` de ${segment}` : ""} em uma página simples de navegar.${differentiatorText}`.trim();
    }

    if (objective === "generate-interest") {
      return `Veja as opções, descubra o que combina com você e registre seu interesse com facilidade.${differentiatorText}`.trim();
    }

    return `Conheça produtos selecionados, veja detalhes e escolha com praticidade.${differentiatorText}`.trim();
  }

  if (objective === "schedule") {
    if (isAppointmentLedService(request)) {
      return buildAppointmentHeroSubtitle(
        request,
        offer,
        audienceText,
        differentiatorText,
      );
    }

    return `Conheça ${offer ? lowerFirst(offer) : segment || "o atendimento"}${audienceText} e avance para o próximo passo de forma simples.${differentiatorText}`.trim();
  }

  if (objective === "request-quote") {
    return `Explique o que você precisa e receba um atendimento mais direcionado${segment ? ` em ${segment}` : ""}.${differentiatorText}`.trim();
  }

  if (objective === "start-conversation") {
    return `Tire suas dúvidas, explique sua necessidade e converse diretamente sobre o melhor caminho para você.${differentiatorText}`.trim();
  }

  if (objective === "sell-package") {
    return `Conheça uma opção de acompanhamento pensada para dar continuidade ao atendimento com mais clareza.${differentiatorText}`.trim();
  }

  if (objective === "sell-service") {
    return `Veja como funciona o atendimento, entenda a proposta e escolha com mais segurança.${differentiatorText}`.trim();
  }

  return `Conheça os serviços, entenda como funciona o atendimento e escolha o próximo passo com confiança.${differentiatorText}`.trim();
}

function buildTrustItems(
  request: NormalizedTemplateRequest,
  differentiator: string,
): string[] {
  const explicit = normalizeStringArray(
    request.answers?.trustItems ||
      request.answers?.confianca ||
      request.answers?.confiança ||
      request.raw?.trustItems ||
      request.raw?.confianca ||
      request.raw?.confiança,
  );

  if (explicit.length) {
    return explicit.slice(0, 3);
  }

  const items: string[] = [];

  if (differentiator) {
    items.push(trimToLength(differentiator, 52));
  }

  if (request.pageKind === "servico") {
    if (isAppointmentLedService(request)) {
      items.push("Atendimento personalizado");
      items.push("Agendamento facilitado");
    } else {
      items.push("Atendimento direto");
      items.push("Contato facilitado");
    }
  } else {
    items.push("Compra prática");
    items.push("Atendimento próximo");
  }

  return unique(items).slice(0, 3);
}

function buildRecommendedSections(
  request: NormalizedTemplateRequest,
  objective: CommercialObjective,
): TemplateSectionKey[] {
  if (request.pageKind === "loja") {
    if (objective === "show-catalog") {
      return unique([
        "header",
        "hero",
        "categories",
        "products",
        "benefits",
        "about",
        "contact",
        "footer",
      ]);
    }

    return unique([
      "header",
      "hero",
      "featured",
      "products",
      "benefits",
      "about",
      "contact",
      "footer",
    ]);
  }

  if (objective === "schedule") {
    return unique([
      "header",
      "hero",
      "services",
      "benefits",
      "about",
      "faq",
      "contact",
      "footer",
    ]);
  }

  if (objective === "request-quote") {
    return unique([
      "header",
      "hero",
      "services",
      "benefits",
      "about",
      "faq",
      "contact",
      "footer",
    ]);
  }

  return unique([
    "header",
    "hero",
    "services",
    "about",
    "benefits",
    "faq",
    "contact",
    "footer",
  ]);
}

function buildServiceSemanticText(
  request: NormalizedTemplateRequest,
): string {
  return normalize(
    [
      request.businessSegment,
      request.businessName,
      request.descricao,
      request.services?.map((service) => `${service.title} ${service.description}`).join(" "),
      request.answers?.destaque,
      request.answers?.oferta,
      request.answers?.objetivo,
      request.raw?.categoriaNome,
      request.raw?.categoryName,
      request.raw?.categoria,
      request.raw?.category,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function isAppointmentLedService(
  request: NormalizedTemplateRequest,
): boolean {
  if (request.pageKind !== "servico") return false;

  const text = buildServiceSemanticText(request);

  return containsAny(text, [
    "psicopedagog",
    "psicolog",
    "terapia",
    "terapeuta",
    "fonoaudiolog",
    "nutricion",
    "fisioterap",
    "consulta",
    "consultorio",
    "consultório",
    "sessao",
    "sessão",
    "avaliacao",
    "avaliação",
    "acompanhamento",
    "atendimento clinico",
    "atendimento clínico",
    "orientacao",
    "orientação",
    "mentoria",
    "aula",
    "reforco escolar",
    "reforço escolar",
  ]);
}

function isQuoteLedService(
  request: NormalizedTemplateRequest,
): boolean {
  if (request.pageKind !== "servico") return false;

  const text = buildServiceSemanticText(request);

  return containsAny(text, [
    "pedreiro",
    "eletricista",
    "encanador",
    "marceneiro",
    "pintor",
    "reforma",
    "obra",
    "instalacao",
    "instalação",
    "manutencao",
    "manutenção",
    "conserto",
    "reparo",
    "montagem",
    "limpeza pos obra",
    "limpeza pós obra",
  ]);
}

function resolveSchedulePrimaryLabel(
  request: NormalizedTemplateRequest,
): string {
  const text = buildServiceSemanticText(request);
  const offer = firstText(
    request.answers?.oferta,
    request.answers?.destaque,
    request.services?.[0]?.title,
  );

  if (containsAny(normalize(offer), ["avaliacao", "avaliação"])) {
    return "Agendar uma avaliação";
  }

  if (containsAny(text, ["sessao", "sessão", "terapia", "psicolog"])) {
    return "Agendar uma sessão";
  }

  if (containsAny(text, ["consulta", "consultorio", "consultório"])) {
    return "Agendar uma consulta";
  }

  return "Agendar atendimento";
}

function buildAppointmentHeroTitle(
  request: NormalizedTemplateRequest,
  offer: string,
  businessName: string,
): string {
  const text = buildServiceSemanticText(request);

  if (containsAny(text, ["psicopedagog"])) {
    return offer
      ? `${offer}: um caminho para desenvolver potenciais`
      : "Desenvolvendo potenciais, transformando histórias";
  }

  if (containsAny(text, ["psicolog", "terapia", "terapeuta"])) {
    return offer
      ? `${offer}: acolhimento para o seu próximo passo`
      : `${businessName}: cuidado e acompanhamento para cada fase`;
  }

  if (containsAny(text, ["mentoria", "consultoria"])) {
    return offer
      ? `${offer}: clareza para avançar`
      : `${businessName}: acompanhamento para transformar objetivos em ação`;
  }

  return offer
    ? `${offer}: atendimento pensado para você`
    : `${businessName}: atendimento personalizado para o seu momento`;
}

function buildAppointmentHeroSubtitle(
  request: NormalizedTemplateRequest,
  offer: string,
  audienceText: string,
  differentiatorText: string,
): string {
  const text = buildServiceSemanticText(request);

  if (containsAny(text, ["psicopedagog"])) {
    return `Atendimento psicopedagógico personalizado${audienceText}, com avaliação, orientação e acompanhamento para fortalecer a aprendizagem, a autonomia e a confiança.${differentiatorText}`.trim();
  }

  if (containsAny(text, ["psicolog", "terapia", "terapeuta"])) {
    return `Conheça ${offer ? lowerFirst(offer) : "o atendimento"}${audienceText} e encontre um espaço de escuta, orientação e acompanhamento com mais clareza.${differentiatorText}`.trim();
  }

  return `Conheça ${offer ? lowerFirst(offer) : "o atendimento"}${audienceText} e agende o próximo passo de forma simples e segura.${differentiatorText}`.trim();
}

function cleanSegment(value: string): string {
  const text = String(value || "").trim();

  if (!text || normalize(text) === "geral") {
    return "";
  }

  return text;
}

function asObject(value: any): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function firstText(...values: any[]): string {
  for (const value of values) {
    const text = String(value ?? "").trim();

    if (text && text !== "[object Object]") {
      return text;
    }
  }

  return "";
}

function normalize(value: any): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function containsAny(value: string, terms: string[]): boolean {
  if (!value) return false;

  const normalizedValue = normalize(value);

  return terms.some((term) =>
    normalizedValue.includes(normalize(term)),
  );
}

function normalizeStringArray(value: any): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item ?? "").trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[|,\n;]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function ensureSentence(value: string): string {
  const text = String(value || "").trim();

  if (!text) return "";

  const normalized = text.charAt(0).toUpperCase() + text.slice(1);

  return /[.!?]$/.test(normalized)
    ? normalized
    : `${normalized}.`;
}

function lowerFirst(value: string): string {
  const text = String(value || "").trim();

  if (!text) return "";

  return text.charAt(0).toLowerCase() + text.slice(1);
}

function trimToLength(value: string, max: number): string {
  const text = String(value || "").trim();

  if (text.length <= max) {
    return text;
  }

  return `${text.slice(0, Math.max(0, max - 1)).trim()}…`;
}

function unique<T>(items: readonly T[]): T[] {
  return [...new Set(items)];
}