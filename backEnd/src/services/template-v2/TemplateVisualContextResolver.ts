import type {
  NormalizedTemplateRequest,
  TemplateMediaAsset,
  TemplateMediaPlan,
  TemplateVisualContext,
} from "./TemplateTypes";

type VisualProfile = {
  id: string;
  themeName: string;
  keywords: string[];
  categoryName: string;
  categoryImage: string;
  heroImage: string;
  defaultProductImage: string;
  defaultServiceImage: string;
};

const DEFAULT_STORE_IMAGE =
  "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200&auto=format&fit=crop";

const DEFAULT_SERVICE_IMAGE =
  "https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=1200&auto=format&fit=crop";

const VISUAL_PROFILES: VisualProfile[] = [
  {
    id: "hamburgueria",
    themeName: "food-bold",
    keywords: ["hamburgueria", "hamburger", "hambúrguer", "burger", "lanche", "lanchonete"],
    categoryName: "Hamburgueria",
    categoryImage: "/uploads/cat/hamburguer.webp",
    heroImage:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1400&auto=format&fit=crop",
    defaultProductImage:
      "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1200&auto=format&fit=crop",
    defaultServiceImage: DEFAULT_SERVICE_IMAGE,
  },
  {
    id: "pizza",
    themeName: "food-warm",
    keywords: ["pizza", "pizzaria"],
    categoryName: "Pizza",
    categoryImage: "/uploads/cat/pizza.webp",
    heroImage:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1400&auto=format&fit=crop",
    defaultProductImage:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1200&auto=format&fit=crop",
    defaultServiceImage: DEFAULT_SERVICE_IMAGE,
  },
  {
    id: "acai",
    themeName: "fresh-purple",
    keywords: ["açai", "acai", "açaí"],
    categoryName: "Açaí",
    categoryImage: "/uploads/cat/acai.webp",
    heroImage:
      "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?q=80&w=1400&auto=format&fit=crop",
    defaultProductImage:
      "https://images.unsplash.com/photo-1505252585461-04db1eb84625?q=80&w=1200&auto=format&fit=crop",
    defaultServiceImage: DEFAULT_SERVICE_IMAGE,
  },
  {
    id: "doces",
    themeName: "sweet-pastel",
    keywords: ["doces", "doce", "bolo", "bolos", "torta", "tortas", "confeitaria", "bomboniere", "bombonieri"],
    categoryName: "Doces",
    categoryImage: "/uploads/cat/doces.webp",
    heroImage:
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=1400&auto=format&fit=crop",
    defaultProductImage:
      "https://images.unsplash.com/photo-1551024506-0bccd828d307?q=80&w=1200&auto=format&fit=crop",
    defaultServiceImage: DEFAULT_SERVICE_IMAGE,
  },
  {
    id: "bebidas",
    themeName: "drink-premium",
    keywords: ["vinho", "vinhos", "bebidas", "bebida", "drinks", "drink", "cerveja", "adega"],
    categoryName: "Bebidas",
    categoryImage: "/uploads/cat/bebidas.webp",
    heroImage:
      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1400&auto=format&fit=crop",
    defaultProductImage:
      "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=1200&auto=format&fit=crop",
    defaultServiceImage: DEFAULT_SERVICE_IMAGE,
  },
  {
    id: "moda",
    themeName: "fashion-clean",
    keywords: ["moda", "roupa", "roupas", "vestuario", "vestuário", "fashion", "boutique", "moda feminina", "moda masculina", "moda infantil"],
    categoryName: "Moda",
    categoryImage: "/uploads/cat/lojas.webp",
    heroImage:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1400&auto=format&fit=crop",
    defaultProductImage:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1200&auto=format&fit=crop",
    defaultServiceImage: DEFAULT_SERVICE_IMAGE,
  },
  {
    id: "calcados",
    themeName: "sneaker-commerce",
    keywords: ["calçados", "calcados", "calçado", "calcado", "sapato", "sapatos", "tenis", "tênis", "sneaker"],
    categoryName: "Calçados",
    categoryImage: "/uploads/cat/lojas.webp",
    heroImage:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1400&auto=format&fit=crop",
    defaultProductImage:
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1200&auto=format&fit=crop",
    defaultServiceImage: DEFAULT_SERVICE_IMAGE,
  },
  {
    id: "joias",
    themeName: "luxury-gold",
    keywords: ["joia", "joias", "semijoia", "semijoias", "bijuteria", "aneis", "anéis", "colar", "pulseira"],
    categoryName: "Joias",
    categoryImage: "/uploads/cat/lojas.webp",
    heroImage:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1400&auto=format&fit=crop",
    defaultProductImage:
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=1200&auto=format&fit=crop",
    defaultServiceImage: DEFAULT_SERVICE_IMAGE,
  },
  {
    id: "auto-pecas",
    themeName: "auto-strong",
    keywords: ["auto peças", "auto pecas", "autopeças", "peças automotivas", "pecas automotivas", "acessorios automotivos", "acessórios automotivos", "som automotivo"],
    categoryName: "Peças Automotivas",
    categoryImage: "/uploads/cat/pecasAutomotivas.webp",
    heroImage:
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=1400&auto=format&fit=crop",
    defaultProductImage:
      "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?q=80&w=1200&auto=format&fit=crop",
    defaultServiceImage: DEFAULT_SERVICE_IMAGE,
  },
  {
    id: "pet-shop",
    themeName: "pet-friendly",
    keywords: ["pet", "pet shop", "cachorro", "gato", "ração", "racao", "banho e tosa"],
    categoryName: "Pet Shop",
    categoryImage: "/uploads/cat/petshop.webp",
    heroImage:
      "https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?q=80&w=1400&auto=format&fit=crop",
    defaultProductImage:
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=1200&auto=format&fit=crop",
    defaultServiceImage:
      "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "psicopedagogia",
    themeName: "human-learning",
    keywords: [
      "psicopedagogia",
      "psicopedagogo",
      "psicopedagoga",
      "psicopedagogico",
      "psicopedagogica",
      "psicopedagógico",
      "psicopedagógica",
      "avaliacao psicopedagogica",
      "avaliação psicopedagógica",
      "acompanhamento psicopedagogico",
      "acompanhamento psicopedagógico",
      "dificuldade de aprendizagem",
      "dificuldades de aprendizagem",
      "aprendizagem infantil",
    ],
    categoryName: "Psicopedagogia",
    categoryImage:
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1200&auto=format&fit=crop",
    heroImage:
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1400&auto=format&fit=crop",
    defaultProductImage: DEFAULT_STORE_IMAGE,
    defaultServiceImage:
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "psicologia-terapia",
    themeName: "human-wellbeing",
    keywords: [
      "psicologia",
      "psicologo",
      "psicóloga",
      "psicólogo",
      "terapia",
      "terapeuta",
      "saude mental",
      "saúde mental",
      "acolhimento emocional",
    ],
    categoryName: "Psicologia e Terapia",
    categoryImage:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1200&auto=format&fit=crop",
    heroImage:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1400&auto=format&fit=crop",
    defaultProductImage: DEFAULT_STORE_IMAGE,
    defaultServiceImage:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "educacao",
    themeName: "education-warm",
    keywords: [
      "educacao",
      "educação",
      "professor",
      "professora",
      "aula particular",
      "reforco escolar",
      "reforço escolar",
      "alfabetizacao",
      "alfabetização",
      "ensino",
      "aprendizagem",
    ],
    categoryName: "Educação",
    categoryImage:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200&auto=format&fit=crop",
    heroImage:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1400&auto=format&fit=crop",
    defaultProductImage: DEFAULT_STORE_IMAGE,
    defaultServiceImage:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "consultoria-profissional",
    themeName: "professional-advisory",
    keywords: [
      "consultoria",
      "consultor",
      "consultora",
      "mentoria",
      "mentor",
      "mentora",
      "advogado",
      "advogada",
      "advocacia",
      "contador",
      "contadora",
      "contabilidade",
    ],
    categoryName: "Serviço Profissional",
    categoryImage:
      "https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=1200&auto=format&fit=crop",
    heroImage:
      "https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=1400&auto=format&fit=crop",
    defaultProductImage: DEFAULT_STORE_IMAGE,
    defaultServiceImage:
      "https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "eletricista",
    themeName: "technical-blue",
    keywords: ["eletricista", "elétrica", "eletrica", "instalação elétrica", "instalacao eletrica"],
    categoryName: "Eletricista",
    categoryImage: "/uploads/cat/eletricista.webp",
    heroImage:
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=1400&auto=format&fit=crop",
    defaultProductImage: DEFAULT_STORE_IMAGE,
    defaultServiceImage:
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "pedreiro",
    themeName: "construction-orange",
    keywords: ["pedreiro", "obra", "reforma", "construção", "construcao", "manutenção geral", "manutencao geral"],
    categoryName: "Pedreiro",
    categoryImage: "/uploads/cat/pedreiro.webp",
    heroImage:
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1400&auto=format&fit=crop",
    defaultProductImage: DEFAULT_STORE_IMAGE,
    defaultServiceImage:
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "limpeza",
    themeName: "clean-service",
    keywords: ["limpeza", "diarista", "faxina", "limpeza residencial", "limpeza de sofa", "limpeza de sofá", "higienização", "higienizacao"],
    categoryName: "Limpeza",
    categoryImage: "/uploads/cat/limpeza-residencial.webp",
    heroImage:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1400&auto=format&fit=crop",
    defaultProductImage: DEFAULT_STORE_IMAGE,
    defaultServiceImage:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "marceneiro",
    themeName: "wood-craft",
    keywords: ["marceneiro", "marcenaria", "moveis planejados", "móveis planejados", "madeira"],
    categoryName: "Marceneiro",
    categoryImage: "/uploads/cat/lojas.webp",
    heroImage:
      "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=1400&auto=format&fit=crop",
    defaultProductImage: DEFAULT_STORE_IMAGE,
    defaultServiceImage:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop",
  },
];

export class TemplateVisualContextResolver {
  static resolve(request: NormalizedTemplateRequest): TemplateVisualContext {
    const profile = findProfile(request);
    const realMaterials = resolveRealBusinessMaterials(request);
    const variationKey = resolveVariationKey(request);

    const heroImage =
      pickHeroImage(request, realMaterials, variationKey) ||
      resolveCatalogImage(request) ||
      profile.heroImage;

    const serviceImage =
      pickSectionImage(
        firstNonEmptyMaterialPool(
          realMaterials.serviceImages,
          realMaterials.workspaceImages,
          realMaterials.professionalImages,
        ),
        variationKey + 1,
        heroImage,
      ) ||
      profile.defaultServiceImage;

    const productImage =
      pickSectionImage(
        firstNonEmptyMaterialPool(
          realMaterials.productImages,
          realMaterials.publicityImages,
        ),
        variationKey + 2,
        heroImage,
      ) ||
      resolveFirstProductImage(request) ||
      profile.defaultProductImage;

    const categoryImage =
      pickSectionImage(
        request.pageKind === "servico"
          ? firstNonEmptyMaterialPool(
              realMaterials.workspaceImages,
              realMaterials.serviceImages,
              realMaterials.professionalImages,
            )
          : firstNonEmptyMaterialPool(
              realMaterials.publicityImages,
              realMaterials.workspaceImages,
              realMaterials.productImages,
            ),
        variationKey + 3,
        heroImage,
      ) ||
      profile.categoryImage;

    /**
     * A partir daqui não reduzimos mais o material do cliente a uma única
     * imagem por página. O MediaPlan transporta a biblioteca visual inteira
     * para os componentes, já ordenada de acordo com a variação atual.
     *
     * Os campos legados acima continuam existindo durante a migração.
     */
    const media = buildMediaPlan(
      request,
      realMaterials,
      profile,
      variationKey,
      {
        heroImage,
        serviceImage,
        productImage,
        categoryImage,
      },
    );

    const heroGallery = (media.hero || [])
      .map((item) => String(item?.url || "").trim())
      .filter(Boolean);

    return {
      categoryName: profile.categoryName,
      categoryImage,
      businessSegment: request.businessSegment || profile.categoryName,
      themeName: profile.themeName,
      heroImage: heroGallery[0] || heroImage,
      heroImages: heroGallery,
      heroMedia: {
        primary: heroGallery[0] || heroImage,
        secondary: heroGallery[1],
        tertiary: heroGallery[2],
        gallery: heroGallery,
      },
      defaultProductImage: productImage,
      defaultServiceImage: serviceImage,
      media,
    };
  }
}

type MaterialOrientation = "landscape" | "portrait" | "square" | "unknown";

type ResolvedMaterial = {
  url: string;
  type: string;
  placement?: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  orientation: MaterialOrientation;
};

type ResolvedBusinessMaterials = {
  heroImages: ResolvedMaterial[];
  professionalImages: ResolvedMaterial[];
  workspaceImages: ResolvedMaterial[];
  serviceImages: ResolvedMaterial[];
  productImages: ResolvedMaterial[];
  publicityImages: ResolvedMaterial[];
  logoImages: ResolvedMaterial[];
  videoUrls: string[];
};

type LegacyResolvedImages = {
  heroImage?: string;
  serviceImage?: string;
  productImage?: string;
  categoryImage?: string;
};

function buildMediaPlan(
  request: NormalizedTemplateRequest,
  materials: ResolvedBusinessMaterials,
  profile: VisualProfile,
  variationKey: number,
  legacy: LegacyResolvedImages,
): TemplateMediaPlan {
  const creativeKey = normalize(
    [
      request.creativeDirection?.archetype,
      request.creativeDirection?.heroVariant,
      request.selectedVariation?.layoutMode,
      request.aiVariation?.layoutMode,
      request.selectedVariation?.family,
      request.selectedVariation?.heroStyle,
    ]
      .filter(Boolean)
      .join(" "),
  );

  /**
   * REGRA DE POSICIONAMENTO ESTRITO
   * --------------------------------
   * Se o usuário enviou material para uma seção específica, esse material
   * permanece naquela seção. Só usamos outra categoria como fallback quando
   * a categoria principal está completamente vazia.
   *
   * Ex.: havendo 4 imagens HERO, o Hero trabalha exclusivamente com essas 4.
   * SERVICE/WORKSPACE/PROFESSIONAL não entram no Hero.
   */
  const explicitHeroByPlacement = uniqueMaterials([
    ...materials.heroImages,
    ...materials.professionalImages,
    ...materials.serviceImages,
    ...materials.workspaceImages,
    ...materials.publicityImages,
    ...materials.productImages,
  ]).filter((item) => isHeroPlacement(item.placement));

  const rawHero = resolveRawHeroCandidates(request);

  const heroPrimaryPool = uniqueMaterials(materials.heroImages);

  const heroFallbackPool =
    request.pageKind === "servico"
      ? firstNonEmptyMaterialPool(
          explicitHeroByPlacement,
          rawHero,
          materials.professionalImages,
          materials.serviceImages,
          materials.workspaceImages,
          materials.publicityImages,
        )
      : firstNonEmptyMaterialPool(
          explicitHeroByPlacement,
          rawHero,
          materials.publicityImages,
          materials.productImages,
          materials.workspaceImages,
          materials.professionalImages,
        );

  const heroBase = heroPrimaryPool.length
    ? heroPrimaryPool
    : heroFallbackPool;

  const hero = buildHeroMediaPool(
    heroBase,
    request,
    creativeKey,
    variationKey,
    legacy.heroImage || profile.heroImage,
  );

  const aboutPool = firstNonEmptyMaterialPool(
    materials.professionalImages,
    materials.workspaceImages,
    materials.serviceImages,
  );

  const about = buildSectionMediaPool(
    aboutPool,
    variationKey + 1,
    hero[0]?.url,
    profile.defaultServiceImage,
    ["portrait", "square", "landscape", "unknown"],
  );

  const workspacePool = firstNonEmptyMaterialPool(
    materials.workspaceImages,
    materials.professionalImages,
    materials.serviceImages,
  );

  const workspace = buildSectionMediaPool(
    workspacePool,
    variationKey + 2,
    hero[0]?.url,
    legacy.categoryImage || profile.categoryImage,
    ["landscape", "square", "portrait", "unknown"],
  );

  const servicesPool = firstNonEmptyMaterialPool(
    materials.serviceImages,
    materials.workspaceImages,
    materials.professionalImages,
  );

  const services = buildSectionMediaPool(
    servicesPool,
    variationKey + 3,
    hero[0]?.url,
    legacy.serviceImage || profile.defaultServiceImage,
    serviceOrientationPreference(creativeKey),
  );

  const productsPool = firstNonEmptyMaterialPool(
    materials.productImages,
    materials.publicityImages,
  );

  const products = buildSectionMediaPool(
    productsPool,
    variationKey + 4,
    hero[0]?.url,
    legacy.productImage || profile.defaultProductImage,
    ["square", "portrait", "landscape", "unknown"],
  );

  /**
   * LOGO é o material principal de marca. PUBLICITY só entra como fallback
   * quando não houver logo, evitando banner publicitário misturado à identidade.
   */
  const brand = firstNonEmptyMaterialPool(
    materials.logoImages,
    materials.publicityImages,
  ).map(toTemplateMediaAsset);

  const videos: TemplateMediaAsset[] = materials.videoUrls.map((url) => ({
    url,
    type: "VIDEO",
    orientation: "unknown",
  }));

  return {
    hero,
    about,
    workspace,
    services,
    products,
    brand,
    videos,
  };
}

function buildHeroMediaPool(
  materials: ResolvedMaterial[],
  request: NormalizedTemplateRequest,
  creativeKey: string,
  variationKey: number,
  fallbackUrl?: string,
): TemplateMediaAsset[] {
  const ranked = rankHeroMaterials(
    uniqueMaterials(materials),
    request,
    creativeKey,
  );

  /**
   * A família visual muda o ponto inicial do conjunto, mas nunca descarta as
   * demais imagens. Assim Authority, Magazine, Conversion e Minimal podem
   * explorar materiais diferentes do mesmo cliente.
   */
  const rotated = rotateMaterials(ranked, variationKey);

  const withFallback = ensureFallbackMaterial(
    rotated,
    fallbackUrl,
    "FALLBACK_HERO",
  );

  return withFallback.map(toTemplateMediaAsset);
}

function buildSectionMediaPool(
  materials: ResolvedMaterial[],
  seed: number,
  avoidUrl: string | undefined,
  fallbackUrl: string | undefined,
  preferredOrientations: MaterialOrientation[],
): TemplateMediaAsset[] {
  const deduped = uniqueMaterials(materials);
  const alternatives = avoidUrl
    ? deduped.filter((item) => item.url !== avoidUrl)
    : deduped;

  const pool = alternatives.length ? alternatives : deduped;
  const ordered = orderByOrientation(pool, preferredOrientations);
  const rotated = rotateMaterials(ordered, seed);

  return ensureFallbackMaterial(
    rotated,
    fallbackUrl,
    "FALLBACK_SECTION",
  ).map(toTemplateMediaAsset);
}

function serviceOrientationPreference(
  creativeKey: string,
): MaterialOrientation[] {
  if (
    creativeKey.includes("magazine") ||
    creativeKey.includes("editorial")
  ) {
    return ["portrait", "square", "landscape", "unknown"];
  }

  if (
    creativeKey.includes("conversion") ||
    creativeKey.includes("fullbleed")
  ) {
    return ["landscape", "square", "portrait", "unknown"];
  }

  return ["landscape", "square", "portrait", "unknown"];
}

function rotateMaterials(
  materials: ResolvedMaterial[],
  seed: number,
): ResolvedMaterial[] {
  if (materials.length <= 1) return materials;

  const offset = Math.abs(seed) % materials.length;

  return [
    ...materials.slice(offset),
    ...materials.slice(0, offset),
  ];
}

function ensureFallbackMaterial(
  materials: ResolvedMaterial[],
  fallbackUrl: string | undefined,
  type: string,
): ResolvedMaterial[] {
  const result = [...materials];
  const fallback = String(fallbackUrl || "").trim();

  if (
    fallback &&
    !result.some((item) => String(item.url || "").trim() === fallback)
  ) {
    result.push({
      url: fallback,
      type,
      orientation: "landscape",
    });
  }

  return result;
}

function toTemplateMediaAsset(
  material: ResolvedMaterial,
): TemplateMediaAsset {
  return {
    url: material.url,
    type: material.type || undefined,
    placement: material.placement || undefined,
    width: material.width,
    height: material.height,
    aspectRatio: material.aspectRatio,
    orientation: material.orientation,
  };
}

function isHeroPlacement(value?: string): boolean {
  return [
    "HERO",
    "COVER",
    "CAPA",
    "HERO_IMAGE",
    "HERO-LANDSCAPE",
  ].includes(String(value || "").trim().toUpperCase());
}

function resolveRealBusinessMaterials(
  request: NormalizedTemplateRequest,
): ResolvedBusinessMaterials {
  /**
   * O Gerador já envia width/height/aspectRatio/orientation.
   * O normalizer atual ainda pode não preservar esses campos tipados,
   * então combinamos o array normalizado com o payload bruto.
   *
   * Assim esta etapa já consegue usar proporção sem quebrar compatibilidade.
   */
  const normalizedMaterials = Array.isArray(request.businessMaterials)
    ? request.businessMaterials
    : [];

  const rawMaterials = Array.isArray(request.raw?.businessMaterials)
    ? request.raw.businessMaterials
    : Array.isArray(request.raw?.landingMaterials)
      ? request.raw.landingMaterials
      : [];

  const byId = new Map<string, any>();
  const byUrl = new Map<string, any>();

  for (const raw of rawMaterials) {
    const id = String(raw?.id || "").trim();
    const url = String(raw?.url || raw?.path || "").trim();

    if (id) byId.set(id, raw);
    if (url) byUrl.set(url, raw);
  }

  const materials: ResolvedMaterial[] = normalizedMaterials
    .filter((material) => Boolean(material?.url))
    .map((material) => {
      const raw =
        byId.get(String(material.id || "").trim()) ||
        byUrl.get(String(material.url || "").trim()) ||
        {};

      const width =
        toPositiveNumber((material as any)?.width) ||
        toPositiveNumber(raw?.width);
      const height =
        toPositiveNumber((material as any)?.height) ||
        toPositiveNumber(raw?.height);
      const aspectRatio =
        toPositiveNumber((material as any)?.aspectRatio) ||
        toPositiveNumber(raw?.aspectRatio) ||
        (width && height ? width / height : undefined);

      const orientation = resolveOrientation(
        (material as any)?.orientation || raw?.orientation,
        aspectRatio,
        width,
        height,
      );

      return {
        url: String(material.url || "").trim(),
        type: String(material.type || "").trim().toUpperCase(),
        placement: String(
          raw?.placement ||
          raw?.section ||
          raw?.destination ||
          (material as any)?.placement ||
          (material as any)?.section ||
          (material as any)?.destination ||
          "",
        ).trim().toUpperCase(),
        width,
        height,
        aspectRatio,
        orientation,
      };
    });

  return {
    heroImages: uniqueMaterials(
      materials.filter((item) => item.type === "HERO"),
    ),
    professionalImages: uniqueMaterials(
      materials.filter((item) => item.type === "PROFESSIONAL"),
    ),
    workspaceImages: uniqueMaterials(
      materials.filter((item) => item.type === "WORKSPACE"),
    ),
    serviceImages: uniqueMaterials(
      materials.filter((item) => item.type === "SERVICE"),
    ),
    productImages: uniqueMaterials(
      materials.filter((item) => item.type === "PRODUCT"),
    ),
    publicityImages: uniqueMaterials(
      materials.filter((item) => item.type === "PUBLICITY"),
    ),
    logoImages: uniqueMaterials(
      materials.filter((item) => item.type === "LOGO"),
    ),
    videoUrls: Array.from(
      new Set(
        materials
          .filter((item) => item.type === "VIDEO")
          .map((item) => item.url)
          .filter(Boolean),
      ),
    ),
  };
}

function pickHeroImage(
  request: NormalizedTemplateRequest,
  materials: ResolvedBusinessMaterials,
  variationKey: number,
): string | undefined {
  const creative = String(
    request.creativeDirection?.heroVariant ||
      request.creativeDirection?.archetype ||
      request.selectedVariation?.layoutMode ||
      request.aiVariation?.layoutMode ||
      "",
  ).toLowerCase();

  let preferredOrientations: MaterialOrientation[] = [
    "landscape",
    "square",
    "portrait",
    "unknown",
  ];

  if (
    creative.includes("portrait") ||
    creative.includes("editorial") ||
    creative.includes("authority-split")
  ) {
    preferredOrientations = ["portrait", "square", "landscape", "unknown"];
  }

  if (
    creative.includes("fullbleed") ||
    creative.includes("cinematic") ||
    creative.includes("conversion")
  ) {
    preferredOrientations = ["landscape", "square", "unknown", "portrait"];
  }

  /**
   * 1. HERO explícito sempre é exclusivo.
   * Se existem imagens HERO, nenhuma SERVICE/PRODUCT/WORKSPACE pode competir.
   */
  const directHero = uniqueMaterials(materials.heroImages);
  if (directHero.length) {
    const ranked = rankHeroMaterials(directHero, request, creative);
    const rotated = rotateMaterials(ranked, variationKey);
    return rotated[0]?.url;
  }

  /**
   * 2. Compatibilidade com payloads antigos que marcavam Hero por
   * placement/section/destination em vez de type=HERO.
   */
  const rawHeroCandidates = resolveRawHeroCandidates(request);
  if (rawHeroCandidates.length) {
    const ranked = rankHeroMaterials(rawHeroCandidates, request, creative);
    const rotated = rotateMaterials(ranked, variationKey);
    return rotated[0]?.url;
  }

  /**
   * 3. Somente quando NÃO existe Hero real usamos fallback de outra seção.
   * A prioridade é semântica e muda conforme loja/serviço.
   */
  const fallbackSource =
    request.pageKind === "servico"
      ? firstNonEmptyMaterialPool(
          materials.professionalImages,
          materials.serviceImages,
          materials.workspaceImages,
          materials.publicityImages,
        )
      : firstNonEmptyMaterialPool(
          materials.publicityImages,
          materials.productImages,
          materials.workspaceImages,
          materials.professionalImages,
        );

  const ordered = orderByOrientation(
    uniqueMaterials(fallbackSource),
    preferredOrientations,
  );

  return pickRotatingMaterial(ordered, variationKey)?.url;
}

function resolveRawHeroCandidates(
  request: NormalizedTemplateRequest,
): ResolvedMaterial[] {
  const rawMaterials = Array.isArray(request.raw?.businessMaterials)
    ? request.raw.businessMaterials
    : Array.isArray(request.raw?.landingMaterials)
      ? request.raw.landingMaterials
      : [];

  return uniqueMaterials(
    rawMaterials
      .filter((item: any) => {
        const placement = String(
          item?.placement ||
          item?.section ||
          item?.destination ||
          item?.slot ||
          "",
        ).toUpperCase();

        const type = String(item?.type || "").toUpperCase();

        return (
          placement === "HERO" ||
          placement === "COVER" ||
          placement === "CAPA" ||
          type === "HERO" ||
          type === "COVER"
        );
      })
      .map((item: any) => {
        const width = toPositiveNumber(item?.width);
        const height = toPositiveNumber(item?.height);
        const aspectRatio =
          toPositiveNumber(item?.aspectRatio) ||
          (width && height ? width / height : undefined);

        return {
          url: String(item?.url || item?.path || "").trim(),
          type: String(item?.type || "").trim().toUpperCase(),
          placement: String(
            item?.placement ||
            item?.section ||
            item?.destination ||
            item?.slot ||
            "HERO",
          ).trim().toUpperCase(),
          width,
          height,
          aspectRatio,
          orientation: resolveOrientation(
            item?.orientation,
            aspectRatio,
            width,
            height,
          ),
        };
      })
      .filter((item: ResolvedMaterial) => Boolean(item.url)),
  );
}

function rankHeroMaterials(
  materials: ResolvedMaterial[],
  request: NormalizedTemplateRequest,
  creative: string,
): ResolvedMaterial[] {
  const servicePage = request.pageKind === "servico";

  return [...uniqueMaterials(materials)].sort((a, b) => {
    return heroMaterialScore(b, servicePage, creative) -
      heroMaterialScore(a, servicePage, creative);
  });
}

function heroMaterialScore(
  material: ResolvedMaterial,
  servicePage: boolean,
  creative: string,
): number {
  let score = 0;

  if (material.orientation === "landscape") score += 100;
  if (material.orientation === "square") score += 35;
  if (material.orientation === "portrait") score -= 20;

  const ratio = material.aspectRatio || 0;
  if (ratio >= 1.65) score += 90;
  else if (ratio >= 1.4) score += 60;
  else if (ratio >= 1.2) score += 30;

  if (material.placement === "HERO") score += 160;

  if (servicePage && material.type === "PROFESSIONAL") score += 55;
  if (servicePage && material.type === "WORKSPACE") score += 20;
  if (material.type === "PUBLICITY") score -= 15;

  if (
    creative.includes("fullbleed") ||
    creative.includes("conversion") ||
    creative.includes("cinematic")
  ) {
    if (material.orientation === "landscape") score += 35;
    if (ratio >= 1.6) score += 35;
  }

  return score;
}

/**
 * Retorna somente o primeiro pool que possuir material.
 *
 * Esta função é a base da política de posicionamento estrito:
 * pools posteriores são fallback, não fontes para mistura.
 */
function firstNonEmptyMaterialPool(
  ...pools: ResolvedMaterial[][]
): ResolvedMaterial[] {
  for (const pool of pools) {
    const resolved = uniqueMaterials(Array.isArray(pool) ? pool : []);
    if (resolved.length) return resolved;
  }

  return [];
}

function pickSectionImage(
  materials: ResolvedMaterial[],
  seed: number,
  avoidUrl?: string,
): string | undefined {
  const deduped = uniqueMaterials(materials);
  if (!deduped.length) return undefined;

  const alternatives = avoidUrl
    ? deduped.filter((item) => item.url !== avoidUrl)
    : deduped;

  const pool = alternatives.length ? alternatives : deduped;
  return pickRotatingMaterial(pool, seed)?.url;
}

function orderByOrientation(
  materials: ResolvedMaterial[],
  preferred: MaterialOrientation[],
): ResolvedMaterial[] {
  const unique = uniqueMaterials(materials);

  return [...unique].sort((a, b) => {
    const ai = preferred.indexOf(a.orientation);
    const bi = preferred.indexOf(b.orientation);

    const safeAi = ai === -1 ? preferred.length : ai;
    const safeBi = bi === -1 ? preferred.length : bi;

    return safeAi - safeBi;
  });
}

function pickRotatingMaterial(
  materials: ResolvedMaterial[],
  seed: number,
): ResolvedMaterial | undefined {
  if (!materials.length) return undefined;

  const index = Math.abs(seed) % materials.length;
  return materials[index];
}

function uniqueMaterials(materials: ResolvedMaterial[]): ResolvedMaterial[] {
  const seen = new Set<string>();

  return materials.filter((item) => {
    const url = String(item.url || "").trim();
    if (!url || seen.has(url)) return false;

    seen.add(url);
    return true;
  });
}

function resolveVariationKey(request: NormalizedTemplateRequest): number {
  const candidates = [
    request.variationIndex,
    request.selectedVariation?.variationIndex,
    request.selectedVariation?.selectedVariationIndex,
    request.selectedVariation?.index,
    request.aiVariation?.variationIndex,
    request.aiVariation?.selectedVariationIndex,
    request.aiVariation?.index,
  ];

  for (const candidate of candidates) {
    const number = Number(candidate);
    if (Number.isFinite(number)) {
      return Math.max(Math.trunc(number), 0);
    }
  }

  const archetype = String(request.creativeDirection?.archetype || "");
  return hashText(archetype);
}

function resolveOrientation(
  value: any,
  aspectRatio?: number,
  width?: number,
  height?: number,
): MaterialOrientation {
  const normalized = String(value || "").toLowerCase().trim();

  if (
    normalized === "landscape" ||
    normalized === "portrait" ||
    normalized === "square"
  ) {
    return normalized;
  }

  const ratio =
    aspectRatio ||
    (width && height ? width / height : undefined);

  if (!ratio || !Number.isFinite(ratio)) return "unknown";
  if (ratio > 1.12) return "landscape";
  if (ratio < 0.88) return "portrait";
  return "square";
}

function toPositiveNumber(value: any): number | undefined {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : undefined;
}

function hashText(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function resolveCatalogImage(
  request: NormalizedTemplateRequest,
): string | undefined {
  if (request.pageKind === "loja") {
    return resolveFirstProductImage(request);
  }

  // Os serviços normalizados ainda não possuem imageUrl oficialmente.
  // Mantemos compatibilidade com dados brutos caso já exista mídia cadastrada.
  const rawServices = Array.isArray(request.raw?.services)
    ? request.raw.services
    : Array.isArray(request.raw?.servicos)
      ? request.raw.servicos
      : [];

  for (const service of rawServices) {
    const image = firstText([
      service?.imageUrl,
      service?.image_url,
      service?.imagem_url,
      service?.imagem,
      service?.foto_url,
      service?.foto,
      service?.capa_url,
      service?.thumbnail_url,
    ]);

    if (image) return image;
  }

  return undefined;
}

function resolveFirstProductImage(
  request: NormalizedTemplateRequest,
): string | undefined {
  return request.products.find((product) => Boolean(product.imageUrl))?.imageUrl;
}

function firstText(values: Array<string | undefined | null>): string | undefined {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text && text !== "undefined" && text !== "null") {
      return text;
    }
  }

  return undefined;
}

function findProfile(request: NormalizedTemplateRequest): VisualProfile {
  const text = normalize(
    [
      request.businessSegment,
      request.businessName,
      request.descricao,
      request.commercialStrategy?.offer,
      request.commercialStrategy?.audience,
      request.commercialStrategy?.differentiator,
      request.answers?.destaque,
      request.answers?.oferta,
      request.raw?.destaque,
      request.raw?.oferta,
      request.products.map((item) => item.categoryName || item.name).join(" "),
      request.services.map((item) => item.title).join(" "),
    ].join(" "),
  );

  const matched = VISUAL_PROFILES.find((profile) =>
    profile.keywords.some((keyword) => text.includes(normalize(keyword))),
  );

  if (matched) return matched;

  if (request.pageKind === "servico") {
    return {
      id: "servico-default",
      themeName: "professional-clean",
      keywords: [],
      categoryName: request.businessSegment || "Serviço",
      categoryImage: DEFAULT_SERVICE_IMAGE,
      heroImage: DEFAULT_SERVICE_IMAGE,
      defaultProductImage: DEFAULT_STORE_IMAGE,
      defaultServiceImage: DEFAULT_SERVICE_IMAGE,
    };
  }

  return {
    id: "loja-default",
    themeName: "commerce-clean",
    keywords: [],
    categoryName: request.businessSegment || "Loja",
    categoryImage: DEFAULT_STORE_IMAGE,
    heroImage: DEFAULT_STORE_IMAGE,
    defaultProductImage: DEFAULT_STORE_IMAGE,
    defaultServiceImage: DEFAULT_SERVICE_IMAGE,
  };
}

function normalize(value: string): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}