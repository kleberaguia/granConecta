export type PageKind = "loja" | "servico";

export type TemplateRendererVersion = "json-original" | "renderer-v2";

export type TemplateGenerationMode =
  | "base-original"
  | "variation-generated"
  | "layout-base-ai";

export type LayoutFamily =
  | "luxury-editorial"
  | "marketplace-grid"
  | "conversion-sales"
  | "magazine-story"
  | "minimal-premium";

export type CtaAction =
  | "add-to-cart"
  | "open-cart"
  | "add-to-wishlist"
  | "open-product"
  | "open-products"
  | "open-offers"
  | "open-combos"
  | "open-chat"
  | "open-whatsapp"
  | "contact"
  | "open-service"
  | "request-quote"
  | "request-service"
  | "schedule-service"
  | "hire-service"
  | "open-provider";

/**
 * Objetivo comercial da landing page.
 *
 * Nesta primeira etapa os objetivos ficam separados das ações técnicas (CtaAction).
 * Isso permite que, futuramente, o mesmo objetivo use CTAs diferentes sem acoplar
 * a estratégia comercial ao comportamento do botão.
 */
export type CommercialObjective =
  | "schedule"
  | "request-quote"
  | "start-conversation"
  | "sell-products"
  | "show-catalog"
  | "sell-service"
  | "sell-package"
  | "generate-interest"
  | "present-business";

/**
 * Tipo principal de conversão esperado pela página.
 */
export type CommercialConversionType =
  | "chat"
  | "quote"
  | "schedule"
  | "commerce"
  | "lead"
  | "catalog";

/**
 * Estratégia comercial central da landing page.
 *
 * Ela será resolvida antes da renderização e consumida pelos componentes
 * (Hero, serviços, contato etc.) sem espalhar regras de negócio por nicho.
 *
 * IMPORTANTE:
 * - primaryAction/secondaryAction continuam usando o CtaAction já existente.
 * - Novas ações técnicas serão adicionadas em etapas posteriores para manter
 *   compatibilidade e permitir compilação incremental.
 */
export type LandingCommercialStrategy = {
  objective: CommercialObjective;
  conversionType: CommercialConversionType;

  audience?: string;
  offer?: string;
  differentiator?: string;

  primaryAction: CtaAction;
  primaryLabel: string;

  secondaryAction?: CtaAction;
  secondaryLabel?: string;

  heroTitle?: string;
  heroSubtitle?: string;

  trustItems?: string[];

  recommendedSections?: TemplateSectionKey[];
};


/**
 * Arquétipo criativo da página.
 *
 * Não representa nicho/profissão. Representa a direção artística e narrativa
 * escolhida para transformar a estratégia comercial em composição visual.
 */
export type CreativeArchetype =
  | "authority-editorial"
  | "conversion-impact"
  | "human-story"
  | "minimal-elegant"
  | "commerce-luxury"
  | "commerce-catalog"
  | "commerce-campaign";

/**
 * Variantes estruturais. Elas permitem que duas páginas com as mesmas seções
 * tenham composições realmente diferentes, sem espalhar regras pelo renderer.
 */
export type HeroVariant =
  | "authority-split"
  | "conversion-fullbleed"
  | "portrait-editorial"
  | "minimal-stage"
  | "product-stage"
  | "catalog-showcase"
  | "campaign-cinematic"
  | "immersive-cover";

export type ServicesVariant =
  | "icon-grid"
  | "problem-grid"
  | "editorial-list"
  | "bento"
  | "process-led";

export type BenefitsVariant =
  | "trust-strip"
  | "icon-grid"
  | "bento"
  | "editorial"
  | "numbers";

export type AboutVariant =
  | "portrait-story"
  | "editorial-split"
  | "founder-note"
  | "minimal"
  | "brand-manifesto";

export type TrustVariant =
  | "credentials"
  | "proof-strip"
  | "real-testimonials"
  | "numbers"
  | "none";

export type FaqVariant =
  | "accordion"
  | "split-accordion"
  | "minimal";

export type ContactVariant =
  | "conversion-band"
  | "editorial-card"
  | "minimal"
  | "commerce-banner";

export type ProductsVariant =
  | "luxury-grid"
  | "catalog-grid"
  | "editorial"
  | "featured-carousel"
  | "bento";

export type SectionRhythm =
  | "alternating"
  | "editorial"
  | "immersive"
  | "compact"
  | "airy";

export type DecorationStyle =
  | "none"
  | "geometric"
  | "organic"
  | "editorial-lines"
  | "soft-luxury"
  | "bold-blocks";

export type ImageStyle =
  | "human-warm"
  | "professional-clean"
  | "editorial"
  | "product-luxury"
  | "product-clean"
  | "cinematic";

export type ContentDensity =
  | "compact"
  | "balanced"
  | "airy";

/**
 * Direção criativa resolvida depois da estratégia comercial e antes do render.
 *
 * CommercialLandingStrategy responde:
 *   "o que esta página precisa vender/converter?"
 *
 * LandingCreativeDirection responde:
 *   "como essa estratégia deve ganhar forma visual e narrativa?"
 */
export type LandingCreativeDirection = {
  archetype: CreativeArchetype;

  heroVariant: HeroVariant;
  servicesVariant?: ServicesVariant;
  productsVariant?: ProductsVariant;
  benefitsVariant: BenefitsVariant;
  aboutVariant: AboutVariant;
  trustVariant: TrustVariant;
  faqVariant: FaqVariant;
  contactVariant: ContactVariant;

  sectionRhythm: SectionRhythm;
  decorationStyle: DecorationStyle;
  imageStyle: ImageStyle;
  density: ContentDensity;

  /**
   * Ordem recomendada pela direção criativa.
   * O resolver poderá combiná-la com regras obrigatórias do GranConecta.
   */
  sectionOrder?: TemplateSectionKey[];

  /**
   * Blocos que devem ser omitidos quando não houver conteúdo real.
   * Ex.: testimonials sem depoimentos fornecidos pelo cliente.
   */
  suppressSections?: TemplateSectionKey[];

  /**
   * Elementos de confiança que podem substituir depoimentos fictícios.
   */
  trustItems?: string[];
};

/**
 * Material real fornecido pelo negócio para personalizar a Landing Page.
 *
 * Estes tipos representam a função semântica do arquivo, não o formato físico.
 * A CreativeDirection/VisualContext poderá escolher onde cada material entra.
 */
export type BusinessMaterialType =
  | "HERO"
  | "PROFESSIONAL"
  | "WORKSPACE"
  | "SERVICE"
  | "PRODUCT"
  | "LOGO"
  | "PUBLICITY"
  | "VIDEO";

export type BusinessMaterial = {
  id: string;
  type: BusinessMaterialType;
  url: string;

  path?: string;
  filename?: string;
  originalName?: string;
  mimetype?: string;
  size?: number;

  /**
   * Metadados visuais opcionais enviados pelo Gerador.
   * Mantidos opcionais para preservar compatibilidade com materiais antigos.
   */
  placement?: string;
  section?: string;
  destination?: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  orientation?: TemplateMediaOrientation;
};

export type TemplateV2Product = {
  id: string;
  name: string;
  description?: string;
  price?: number;
  originalPrice?: number;
  imageUrl?: string;
  categoryName?: string;
};

/**
 * Tipo comercial do item de serviço vindo do BusinessCatalog.
 *
 * Mantemos estes valores no contrato do Template V2 sem importar diretamente
 * os enums do backend. Assim o renderer continua desacoplado do TypeORM/model.
 */
export type TemplateV2ServiceCatalogType =
  | "SERVICO"
  | "PACOTE"
  | "PROMOCAO";

/**
 * Modalidade comercial/operacional do atendimento.
 */
export type TemplateV2ServiceModality =
  | "PRESENCIAL"
  | "ONLINE"
  | "AMBOS"
  | "NAO_APLICA";

/**
 * Política de agendamento normalizada para uso visual/comercial da landing.
 * O campo continua opcional para preservar compatibilidade com gerações antigas.
 */
export type TemplateV2ServiceSchedulingPolicy = string;

export type TemplateV2Service = {
  id: string;
  title: string;
  description?: string;

  /**
   * Dados comerciais reais do BusinessCatalog.
   */
  catalogType?: TemplateV2ServiceCatalogType;
  categoryId?: number;

  price?: number;
  promotionalPrice?: number;

  durationMinutes?: number;
  totalSessions?: number;

  modality?: TemplateV2ServiceModality;
  schedulingPolicy?: TemplateV2ServiceSchedulingPolicy;

  allowStandalonePurchase?: boolean;
  highlighted?: boolean;

  /**
   * Recursos visuais opcionais.
   */
  imageUrl?: string;
  icon?: string;
  badge?: string;

  /**
   * Metadados adicionais do catálogo, mantidos opcionais para permitir
   * evolução sem quebrar o contrato do renderer.
   */
  metadata?: Record<string, unknown> | null;
};

export type TemplateMediaOrientation =
  | "landscape"
  | "portrait"
  | "square"
  | "unknown";

export type TemplateMediaAsset = {
  url: string;
  type?: string;
  placement?: string;

  width?: number;
  height?: number;
  aspectRatio?: number;
  orientation: TemplateMediaOrientation;
};

export type TemplateMediaPlan = {
  /**
   * Biblioteca de mídia disponível para cada papel visual da landing.
   *
   * Um mesmo material pode aparecer em mais de um grupo quando fizer sentido;
   * quem escolhe a composição final é a família/CreativeDirection.
   */
  hero: TemplateMediaAsset[];
  about: TemplateMediaAsset[];
  workspace: TemplateMediaAsset[];
  services: TemplateMediaAsset[];
  products: TemplateMediaAsset[];
  brand: TemplateMediaAsset[];
  videos: TemplateMediaAsset[];
};

export type TemplateVisualContext = {
  categoryName?: string;
  categoryImage?: string;
  businessSegment: string;
  themeName: string;

  /**
   * Campos legados mantidos durante a migração.
   * Componentes existentes continuam funcionando enquanto os novos passam
   * a consumir media.
   */
  heroImage?: string;
  heroImages?: string[];
  heroMedia?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
    gallery: string[];
  };
  defaultProductImage?: string;
  defaultServiceImage?: string;

  /**
   * Biblioteca visual rica da geração atual.
   */
  media?: TemplateMediaPlan;
};

export type TemplateVariationV2 = {
  variationIndex: number;
  family: LayoutFamily;
  name: string;
  description: string;

  heroStyle:
    | "split"
    | "center"
    | "catalog"
    | "dark"
    | "magazine"
    | "minimal";

  productStyle:
    | "boutique"
    | "catalog"
    | "bold"
    | "magazine"
    | "minimal";

  sectionOrder: TemplateSectionKey[];

  colors?: Partial<TemplatePalette>;

  primaryAction: CtaAction;
  secondaryAction: CtaAction;
};

export type TemplateSectionKey =
  | "topbar"
  | "header"
  | "hero"
  | "categories"
  | "featured"
  | "collections"
  | "offers"
  | "products"
  | "services"
  | "how-it-works"
  | "gallery"
  | "video"
  | "benefits"
  | "about"
  | "testimonials"
  | "faq"
  | "social"
  | "location"
  | "newsletter"
  | "contact"
  | "final-cta"
  | "footer";


/**
 * Arquitetura macro da landing.
 *
 * Diferente de CreativeDirection, que define o estilo de cada seção,
 * LandingCompositionPlan define como as seções se relacionam entre si:
 * agrupamentos, continuidade visual, sobreposições e ritmo da página inteira.
 */
export type LandingCompositionArchetype =
  | "authority-premium"
  | "human-authority"
  | "conversion-flow"
  | "editorial-signature"
  | "commerce-showcase"
  | "catalog-flow";

export type LandingCompositionGroupKind =
  | "navigation"
  | "hero-stage"
  | "story"
  | "offer"
  | "trust"
  | "conversion"
  | "closing";

export type LandingCompositionSurface =
  | "page"
  | "surface"
  | "soft"
  | "brand"
  | "contrast"
  | "transparent";

export type LandingCompositionGroup = {
  id: string;
  kind: LandingCompositionGroupKind;
  sections: TemplateSectionKey[];
  surface: LandingCompositionSurface;

  /**
   * Faz o grupo encostar visualmente no anterior, permitindo cards ou
   * conteúdos em transição entre dois blocos.
   */
  overlapPrevious?: boolean;

  /**
   * Mantém as seções do grupo dentro de uma mesma "cena" visual.
   */
  continuous?: boolean;

  /**
   * Identificador CSS semântico para a Entrega 3.
   */
  className?: string;
};

export type LandingCompositionPlan = {
  archetype: LandingCompositionArchetype;
  groups: LandingCompositionGroup[];

  /**
   * Ordem final e deduplicada. Serve para telemetria/landingData e fallback.
   */
  sectionOrder: TemplateSectionKey[];

  /**
   * Classes macro que permitem ao CSS trabalhar a página como composição,
   * não apenas como uma sequência de seções isoladas.
   */
  bodyClass: string;

  /**
   * Permite omitir blocos sem conteúdo real.
   */
  suppressSections?: TemplateSectionKey[];
};

export type TemplatePalette = {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  mutedText: string;
};

export type BrandPaletteMode = "AI" | "CUSTOM";

export type TemplateBrandColors = Partial<TemplatePalette>;

export type ResolvedBrandPalette = {
  mode: BrandPaletteMode;
  source:
    | "CUSTOM"
    | "HERO"
    | "BRAND"
    | "BUSINESS_MATERIAL"
    | "VARIATION"
    | "FALLBACK";
  palette: TemplatePalette;
  sourceImages?: string[];
};

export type NormalizedTemplateRequest = {
  templateName: string;
  layoutEstruturaId: string;

  descricao: string;
  businessName: string;
  businessSegment: string;

  pageKind: PageKind;
  variationIndex: number;
  generationMode: TemplateGenerationMode;

  selectedVariation?: any;
  aiVariation?: any;

  /**
   * Arquitetura-base escolhida pela IA para páginas de serviço.
   * Campos opcionais para preservar lojas e gerações anteriores.
   */
  layoutBaseId?: string;
  layoutBaseName?: string;
  segmentFamily?: string;
  layoutBase?: any;
  composition?: any;
  typography?: any;
  visualStyle?: any;
  hero?: any;
  mobile?: any;

  preset?: string;

  /** Compatibilidade com payloads/variações anteriores. */
  colors?: Partial<TemplatePalette>;

  /** Estratégia de identidade visual escolhida no Gerador. */
  brandPaletteMode?: BrandPaletteMode;

  /** Cores informadas explicitamente pelo usuário no modo CUSTOM. */
  brandColors?: TemplateBrandColors;

  /** Paleta final resolvida no backend antes da renderização. */
  resolvedBrandPalette?: ResolvedBrandPalette;

  sections?: string[];
  copy?: any;
  answers?: any;

  /**
   * Campo opcional durante a migração.
   * Nas próximas etapas será preenchido pelo CommercialLandingStrategyResolver.
   */
  commercialStrategy?: LandingCommercialStrategy;

  /**
   * Direção artística/narrativa da landing.
   * Opcional durante a migração para preservar compatibilidade.
   */
  creativeDirection?: LandingCreativeDirection;

  /**
   * Plano macro de composição da página inteira.
   * Resolvido depois de CommercialStrategy + CreativeDirection.
   */
  compositionPlan?: LandingCompositionPlan;

  /**
   * Materiais reais enviados pelo cliente no Gerador.
   * O array já chega normalizado pelo TemplateRequestNormalizer.
   */
  businessMaterials?: BusinessMaterial[];

  products: TemplateV2Product[];
  services: TemplateV2Service[];

  usuarioId?: string;
  storeId?: string;
  raw: any;
};

export type TemplateGenerationV2Result = {
  success: boolean;
  html: string;
  landingData: {
    templateName: string;
    layoutEstruturaId: string;
    renderer: TemplateRendererVersion;
    generationMode: TemplateGenerationMode;
    pageKind: PageKind;
    businessName: string;
    businessSegment: string;
    variationIndex: number;
    family?: LayoutFamily;
    visualContext?: TemplateVisualContext;
    resolvedBrandPalette?: ResolvedBrandPalette;
    sections?: TemplateSectionKey[];
    actions?: CtaAction[];

    /**
     * Materiais reais disponíveis durante a geração.
     * Opcional para manter compatibilidade com gerações antigas.
     */
    businessMaterials?: BusinessMaterial[];

    /**
     * Estratégia comercial usada para gerar a página.
     * Opcional nesta etapa para manter compatibilidade com respostas já existentes.
     */
    commercialStrategy?: LandingCommercialStrategy;

    /**
     * Direção criativa efetivamente usada na geração.
     */
    creativeDirection?: LandingCreativeDirection;

    /**
     * Composição macro efetivamente usada na geração.
     */
    compositionPlan?: LandingCompositionPlan;
  };
};

export type TemplateRendererV2Input = {
  request: NormalizedTemplateRequest;
  variation: TemplateVariationV2;
  visualContext: TemplateVisualContext;

  /**
   * Pode ser passado explicitamente pelo orchestrator/render engine.
   * Durante a migração também poderá ser lido de request.commercialStrategy.
   */
  commercialStrategy?: LandingCommercialStrategy;

  /**
   * Pode ser passado pelo orchestrator ou lido de request.creativeDirection.
   */
  creativeDirection?: LandingCreativeDirection;

  /**
   * Plano macro da landing completa.
   */
  compositionPlan?: LandingCompositionPlan;
};

export type OriginalJsonRendererInput = {
  request: NormalizedTemplateRequest;
  templateJson: any;
};

export const DEFAULT_TEMPLATE_PALETTE: TemplatePalette = {
  background: "#f8fafc",
  surface: "#ffffff",
  primary: "#0f172a",
  secondary: "#334155",
  accent: "#2563eb",
  text: "#0f172a",
  mutedText: "#64748b",
};

export const DEFAULT_ACTIONS: Record<PageKind, CtaAction[]> = {
  loja: [
    "open-products",
    "open-offers",
    "add-to-cart",
    "add-to-wishlist",
    "open-chat",
    "open-whatsapp",
  ],
  servico: [
    "open-service",
    "request-quote",
    "request-service",
    "schedule-service",
    "hire-service",
    "open-chat",
    "open-whatsapp",
    "contact",
  ],
};