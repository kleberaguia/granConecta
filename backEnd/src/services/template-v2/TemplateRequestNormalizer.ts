import {
  NormalizedTemplateRequest,
  PageKind,
  TemplateGenerationMode,
  TemplateV2Product,
  TemplateV2Service,
} from "./TemplateTypes";

export class TemplateRequestNormalizer {
  static normalize(body: any): NormalizedTemplateRequest {
    const selectedVariation = body?.selectedVariation || null;
    const aiVariation = body?.aiVariation || null;
    const variation = selectedVariation || aiVariation || null;

    const templateName =
      firstText([
        body?.templateName,
        body?.layoutEstruturaId,
        variation?.templateName,
        aiVariation?.templateName,
        selectedVariation?.templateName,
      ]) || "Layout-Geral";

    const descricao =
      firstText([
        body?.descricaoDoCliente,
        body?.businessDescription,
        body?.descricao,
        body?.description,
        body?.answers?.descricao,
        body?.answers?.businessDescription,
      ]) || "";

    const businessName =
      firstText([
        body?.businessName,
        body?.storeName,
        body?.name,
        body?.nome,
        variation?.businessName,
        variation?.storeName,
        extractBusinessName(descricao),
      ]) || fallbackBusinessName(descricao);

    const pageKind = resolvePageKind(body);

    const businessSegment =
      firstText([
        body?.businessSegment,
        body?.segment,
        body?.categoriaNome,
        body?.categoryName,
        body?.categoria,
        body?.category,
        inferBusinessSegment(descricao),
      ]) || "geral";

    const variationIndex = resolveVariationIndex(body, variation);

    const requestedGenerationMode = firstText([
      body?.generationMode,
      variation?.generationMode,
      aiVariation?.generationMode,
      selectedVariation?.generationMode,
    ]);

    const layoutBaseId = firstText([
      body?.layoutBaseId,
      variation?.layoutBaseId,
      aiVariation?.layoutBaseId,
      selectedVariation?.layoutBaseId,
      body?.layoutBase?.id,
      variation?.layoutBase?.id,
    ]);

    const isLayoutBaseAi =
      pageKind === "servico" &&
      (requestedGenerationMode === "layout-base-ai" || Boolean(layoutBaseId));

    const generationMode: TemplateGenerationMode = isLayoutBaseAi
      ? "layout-base-ai"
      : variationIndex <= 0
        ? "base-original"
        : "variation-generated";

    const layoutBase =
      pageKind === "servico"
        ? body?.layoutBase ||
          variation?.layoutBase ||
          aiVariation?.layoutBase ||
          selectedVariation?.layoutBase ||
          undefined
        : undefined;

    return {
      templateName,
      layoutEstruturaId: templateName,

      descricao,
      businessName,
      businessSegment,

      pageKind,
      variationIndex,
      generationMode,

      selectedVariation,
      aiVariation,

      ...(pageKind === "servico" && isLayoutBaseAi
        ? {
            layoutBaseId: layoutBaseId || undefined,
            layoutBaseName:
              firstText([
                body?.layoutBaseName,
                variation?.layoutBaseName,
                aiVariation?.layoutBaseName,
                selectedVariation?.layoutBaseName,
                layoutBase?.name,
              ]) || undefined,
            segmentFamily:
              firstText([
                body?.segmentFamily,
                variation?.segmentFamily,
                aiVariation?.segmentFamily,
                selectedVariation?.segmentFamily,
                layoutBase?.segmentFamily,
              ]) || undefined,
            layoutBase,
            composition:
              body?.composition ??
              variation?.composition ??
              aiVariation?.composition ??
              selectedVariation?.composition,
            typography:
              body?.typography ??
              variation?.typography ??
              aiVariation?.typography ??
              selectedVariation?.typography,
            visualStyle:
              body?.visualStyle ??
              variation?.visualStyle ??
              aiVariation?.visualStyle ??
              selectedVariation?.visualStyle,
            hero:
              body?.hero ??
              variation?.hero ??
              aiVariation?.hero ??
              selectedVariation?.hero,
            mobile:
              body?.mobile ??
              variation?.mobile ??
              aiVariation?.mobile ??
              selectedVariation?.mobile,
          }
        : {}),

      preset: variation?.preset || body?.preset,
      colors: normalizePalette(variation?.colors || body?.colors),
      brandPaletteMode: normalizeBrandPaletteMode(body?.brandPaletteMode),
      brandColors: normalizePalette(body?.brandColors),
      sections: normalizeSections(variation?.sections || body?.sections),
      copy: variation?.copy || body?.copy,
      answers: body?.answers,

      products: normalizeProducts(body?.products || body?.produtos || []),
      services: normalizeServices(body?.services || body?.servicos || []),

      businessMaterials: normalizeBusinessMaterials(
        body?.businessMaterials || body?.landingMaterials || [],
      ),

      usuarioId: firstText([body?.usuarioId, body?.userId, body?.ownerId]),
      storeId: firstText([body?.storeId, body?.lojaId]),

      raw: body || {},
    };
  }
}

function resolvePageKind(body: any): PageKind {
  const explicitValues = [
    body?.pageKind,
    body?.businessType,
    body?.tipoStore,
    body?.storeType,
    body?.categoriaTipo,
    body?.categoryType,
  ]
    .map((value) => normalize(String(value || "")))
    .filter(Boolean);

  if (
    explicitValues.some((value) =>
      ["loja", "store", "ecommerce", "e-commerce"].includes(value),
    )
  ) {
    return "loja";
  }

  if (
    explicitValues.some((value) =>
      ["servico", "service"].includes(value),
    )
  ) {
    return "servico";
  }

  const role = normalize(String(body?.tipo || ""));
  if (role.includes("prestador")) return "servico";
  if (role.includes("empreendedor")) return "loja";

  return "loja";
}

function resolveVariationIndex(body: any, variation: any): number {
  const raw =
    body?.variationIndex ??
    body?.selectedVariationIndex ??
    body?.variationPreset ??
    variation?.variationIndex ??
    variation?.index ??
    variation?.seed ??
    0;

  const value = Number(raw);

  if (!Number.isFinite(value)) return 0;

  return Math.max(0, Math.floor(value));
}

function normalizeProducts(products: any[]): TemplateV2Product[] {
  if (!Array.isArray(products)) return [];

  return products
    .map((product, index) => {
      const id = firstText([
        product?.id,
        product?.productId,
        product?.produtoId,
        product?.produto_id,
      ]) || `product-${index + 1}`;

      const name =
        firstText([
          product?.name,
          product?.nome,
          product?.title,
          product?.titulo,
          product?.displayName,
        ]) || `Produto ${index + 1}`;

      const description =
        firstText([
          product?.description,
          product?.descricao,
          product?.descricao_curta,
          product?.short_description,
          product?.displayDescription,
        ]) || "";

      const price = firstNumber([
        product?.price,
        product?.preco,
        product?.valor,
        product?.preco_venda,
        product?.valor_venda,
        product?.displayPrice,
      ]);

      const originalPrice = firstNumber([
        product?.original_price,
        product?.preco_original,
        product?.old_price,
        product?.valor_original,
      ]);

      const imageUrl = firstText([
        product?.imageUrl,
        product?.image_url,
        product?.image,
        product?.imagem_url,
        product?.imagem,
        product?.foto_url,
        product?.foto,
        product?.capa_url,
        product?.thumbnail_url,
      ]);

      return {
        id,
        name,
        description,
        price,
        originalPrice,
        imageUrl,
        categoryName: firstText([
          product?.categoryName,
          product?.categoriaNome,
          product?.categoria,
          product?.category,
        ]),
      };
    })
    .filter((product) => Boolean(product.id && product.name));
}

function normalizeServices(services: any[]): TemplateV2Service[] {
  if (!Array.isArray(services)) return [];

  return services
    .map((service, index) => {
      const id =
        firstText([
          service?.id,
          service?.serviceId,
          service?.servicoId,
          service?.servico_id,
          service?.catalogItemId,
          service?.catalog_item_id,
        ]) || `service-${index + 1}`;

      const title =
        firstText([
          service?.title,
          service?.titulo,
          service?.name,
          service?.nome,
        ]) || "";

      // Não fabricamos "Serviço 1", "Serviço 2"...:
      // sem nome real, o item não deve virar card público.
      if (!title) return null;

      const description =
        firstText([
          service?.description,
          service?.descricao,
          service?.detalhes,
          service?.resumo,
        ]) || "";

      const catalogType = normalizeServiceCatalogType(
        firstText([
          service?.catalogType,
          service?.catalog_type,
          service?.tipo,
          service?.type,
        ]),
      );

      const modality = normalizeServiceModality(
        firstText([
          service?.modality,
          service?.modalidade,
        ]),
      );

      const price = firstNumber([
        service?.price,
        service?.preco,
        service?.valor,
        service?.precoBase,
        service?.preco_base,
      ]);

      const promotionalPrice = firstNumber([
        service?.promotionalPrice,
        service?.promotional_price,
        service?.precoPromocional,
        service?.preco_promocional,
      ]);

      const categoryId = firstOptionalNumber([
        service?.categoryId,
        service?.category_id,
        service?.categoriaId,
        service?.categoria_id,
      ]);

      const durationMinutes = firstOptionalNumber([
        service?.durationMinutes,
        service?.duration_minutes,
        service?.duracaoMinutos,
        service?.duracao_minutos,
      ]);

      const totalSessions = firstOptionalNumber([
        service?.totalSessions,
        service?.total_sessions,
        service?.totalSessoes,
        service?.total_sessoes,
      ]);

      const imageUrl = firstText([
        service?.imageUrl,
        service?.image_url,
        service?.imagemUrl,
        service?.imagem_url,
        service?.image,
        service?.imagem,
        service?.foto_url,
        service?.capa_url,
        service?.metadata?.imageUrl,
        service?.metadata?.image_url,
        service?.metadata?.imagem_url,
      ]);

      const schedulingPolicy =
        firstText([
          service?.schedulingPolicy,
          service?.scheduling_policy,
          service?.politicaAgendamento,
          service?.politica_agendamento,
        ]) || undefined;

      const allowStandalonePurchase = firstOptionalBoolean([
        service?.allowStandalonePurchase,
        service?.allow_standalone_purchase,
      ]);

      const highlighted = firstOptionalBoolean([
        service?.highlighted,
        service?.destaque,
        service?.featured,
      ]);

      return {
        id,
        title,
        description,

        catalogType,
        categoryId,

        price,
        promotionalPrice,

        durationMinutes,
        totalSessions,

        modality,
        schedulingPolicy,

        allowStandalonePurchase,
        highlighted,

        imageUrl,
        icon: firstText([service?.icon, service?.icone]) || undefined,
        badge: firstText([service?.badge, service?.selo, service?.tag]) || undefined,

        metadata:
          service?.metadata && typeof service.metadata === "object"
            ? service.metadata
            : undefined,
      };
    })
    .filter((service): service is NonNullable<typeof service> => service !== null);
}

function normalizeServiceCatalogType(
  value: string,
): TemplateV2Service["catalogType"] | undefined {
  const key = String(value || "").trim().toUpperCase();

  if (key === "SERVICO" || key === "SERVIÇO" || key === "SERVICE") {
    return "SERVICO";
  }

  if (key === "PACOTE" || key === "PACKAGE") {
    return "PACOTE";
  }

  if (key === "PROMOCAO" || key === "PROMOÇÃO" || key === "PROMOTION") {
    return "PROMOCAO";
  }

  return undefined;
}

function normalizeServiceModality(
  value: string,
): TemplateV2Service["modality"] | undefined {
  const key = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[ÁÀÂÃ]/g, "A")
    .replace(/[ÉÊ]/g, "E")
    .replace(/[Í]/g, "I")
    .replace(/[ÓÔÕ]/g, "O")
    .replace(/[Ú]/g, "U")
    .replace(/[\s-]+/g, "_");

  if (key === "PRESENCIAL") return "PRESENCIAL";
  if (key === "ONLINE") return "ONLINE";
  if (key === "AMBOS") return "AMBOS";
  if (key === "NAO_APLICA" || key === "NAOAPLICA") return "NAO_APLICA";

  return undefined;
}

function firstOptionalNumber(values: any[]): number | undefined {
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;

    const parsed =
      typeof value === "number"
        ? value
        : Number(String(value).trim().replace(",", "."));

    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }

  return undefined;
}

function firstOptionalBoolean(values: any[]): boolean | undefined {
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;

    const key = String(value).trim().toLowerCase();

    if (["true", "1", "sim", "yes"].includes(key)) return true;
    if (["false", "0", "nao", "não", "no"].includes(key)) return false;
  }

  return undefined;
}

function normalizeBusinessMaterials(materials: any[]): any[] {
  if (!Array.isArray(materials)) return [];

  const allowedTypes = new Set([
    "HERO",
    "PROFESSIONAL",
    "WORKSPACE",
    "SERVICE",
    "PRODUCT",
    "LOGO",
    "PUBLICITY",
    "VIDEO",
  ]);

  return materials
    .map((material, index) => {
      const rawType = firstText([
        material?.type,
        material?.kind,
        material?.materialType,
      ]).toUpperCase();

      const type = allowedTypes.has(rawType)
        ? rawType
        : inferBusinessMaterialType(material);

      const url = normalizeMaterialPath(
        firstText([
          material?.url,
          material?.path,
          material?.imageUrl,
          material?.image_url,
          material?.videoUrl,
          material?.video_url,
        ]),
      );

      if (!url) return null;

      return {
        id:
          firstText([material?.id, material?.materialId]) ||
          `material-${index + 1}`,
        type,
        url,
        path: normalizeMaterialPath(firstText([material?.path, material?.url])),
        filename: firstText([material?.filename, material?.fileName]),
        originalName: firstText([
          material?.originalName,
          material?.originalname,
          material?.name,
        ]),
        mimetype: firstText([
          material?.mimetype,
          material?.mimeType,
          material?.typeMime,
        ]),
        size: normalizePositiveNumber(material?.size),
        placement: firstText([material?.placement, material?.slot]).toUpperCase() || undefined,
        section: firstText([material?.section]).toUpperCase() || undefined,
        destination: firstText([material?.destination]).toUpperCase() || undefined,
        width: normalizePositiveNumber(material?.width),
        height: normalizePositiveNumber(material?.height),
        aspectRatio:
          normalizePositiveNumber(material?.aspectRatio) ||
          (
            normalizePositiveNumber(material?.width) &&
            normalizePositiveNumber(material?.height)
              ? normalizePositiveNumber(material?.width)! /
                normalizePositiveNumber(material?.height)!
              : undefined
          ),
        orientation: normalizeMaterialOrientation(
          material?.orientation,
          material?.width,
          material?.height,
          material?.aspectRatio,
        ),
      };
    })
    .filter(Boolean);
}

function inferBusinessMaterialType(material: any): string {
  const mime = firstText([
    material?.mimetype,
    material?.mimeType,
  ]).toLowerCase();

  const name = firstText([
    material?.originalName,
    material?.originalname,
    material?.filename,
    material?.url,
    material?.path,
  ]).toLowerCase();

  if (mime.startsWith("video/") || /\.(mp4|mov|webm|m4v)$/i.test(name)) {
    return "VIDEO";
  }

  if (/(^|[\s_-])(hero|capa|cover)([\s_.-]|$)/i.test(name)) return "HERO";

  if (/logo|logotipo|marca/.test(name)) return "LOGO";

  if (
    /consultorio|consultório|escritorio|escritório|loja|sala|ambiente|espaco|espaço/.test(
      name,
    )
  ) {
    return "WORKSPACE";
  }

  if (/perfil|profissional|equipe|time|team|retrato|portrait/.test(name)) {
    return "PROFESSIONAL";
  }

  if (
    /folder|banner|anuncio|anúncio|publicidade|divulgacao|divulgação|campanha/.test(
      name,
    )
  ) {
    return "PUBLICITY";
  }

  return "SERVICE";
}

function normalizeMaterialOrientation(
  value: any,
  widthValue?: any,
  heightValue?: any,
  aspectRatioValue?: any,
): "landscape" | "portrait" | "square" | "unknown" {
  const explicit = firstText([value]).toLowerCase();
  if (["landscape", "portrait", "square", "unknown"].includes(explicit)) {
    return explicit as "landscape" | "portrait" | "square" | "unknown";
  }

  const width = normalizePositiveNumber(widthValue);
  const height = normalizePositiveNumber(heightValue);
  const ratio =
    normalizePositiveNumber(aspectRatioValue) ||
    (width && height ? width / height : undefined);

  if (!ratio) return "unknown";
  if (ratio >= 1.12) return "landscape";
  if (ratio <= 0.88) return "portrait";
  return "square";
}

function normalizeMaterialPath(value: string): string {
  let path = String(value || "").trim();

  if (!path || path === "undefined" || path === "null") return "";

  // Compatibilidade com respostas antigas que eventualmente montem //uploads/...
  if (path.startsWith("//uploads/")) {
    path = path.slice(1);
  }

  return path;
}

function normalizePositiveNumber(value: any): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}


function normalizeBrandPaletteMode(value: any): "AI" | "CUSTOM" {
  return String(value || "AI").trim().toUpperCase() === "CUSTOM"
    ? "CUSTOM"
    : "AI";
}

function normalizePalette(value: any): any | undefined {
  if (!value || typeof value !== "object") return undefined;

  const keys = [
    "background",
    "surface",
    "primary",
    "secondary",
    "accent",
    "text",
    "mutedText",
  ];

  const result: Record<string, string> = {};

  for (const key of keys) {
    const color = String(value?.[key] || "").trim();
    if (/^#[0-9a-f]{6}$/i.test(color)) result[key] = color.toLowerCase();
  }

  return Object.keys(result).length ? result : undefined;
}

function normalizeSections(value: any): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => normalize(String(item || "")))
    .filter(Boolean);
}

function fallbackBusinessName(descricao: string): string {
  const explicit = extractBusinessName(descricao);
  if (explicit) return explicit;

  // Nunca exponha "Sua marca" como conteúdo público.
  // Quando o nome não foi informado, usamos uma identificação neutra.
  return "Atendimento profissional";
}

function inferBusinessSegment(descricao: string): string | undefined {
  const text = String(descricao || "").toLowerCase();

  const candidates: Array<[string[], string]> = [
    [["psicopedagog"], "Psicopedagogia"],
    [["psicolog", "terapia", "terapeuta"], "Psicologia e Terapia"],
    [["advog", "advocacia"], "Advocacia"],
    [["contabil", "contador", "contadora"], "Contabilidade"],
    [["eletric"], "Eletricista"],
    [["pedreiro", "reforma", "construcao", "construção"], "Construção e Reformas"],
    [["limpeza", "diarista", "faxina"], "Limpeza"],
    [["marcen"], "Marcenaria"],
    [["joia", "jóia", "semijoia", "semijóia"], "Joias"],
    [["hamburg", "burger"], "Hamburgueria"],
    [["pizza"], "Pizzaria"],
  ];

  for (const [needles, label] of candidates) {
    if (needles.some((needle) => text.includes(needle))) return label;
  }

  return undefined;
}


function firstText(values: any[]): string {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text && text !== "undefined" && text !== "null") return text;
  }

  return "";
}

function firstNumber(values: any[]): number | undefined {
  for (const value of values) {
    const parsed = parseMoney(value);
    if (parsed > 0) return parsed;
  }

  return undefined;
}

function parseMoney(value: any): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const raw = String(value ?? "")
    .replace(/R\$/gi, "")
    .replace(/\s/g, "")
    .trim();

  if (!raw) return 0;

  const normalized = raw.includes(",")
    ? raw.replace(/\./g, "").replace(",", ".")
    : raw;

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

function extractBusinessName(text: string): string {
  const value = String(text || "").trim();

  if (!value) return "";

  const patterns = [
    /(?:nome|marca|empresa|loja|negócio|negocio)\s*[:\-]\s*([^\n,.]+)/i,
    /(?:chamada|chamado)\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ][^\n,.]{2,50})/i,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) return match[1].trim();
  }

  return "";
}

function normalize(value: string): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/_/g, "-");
}