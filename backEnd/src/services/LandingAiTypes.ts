export type PageBusinessKind = "loja" | "servico";

export type StoreCategoryKey =
  | "hamburgueria"
  | "moda"
  | "joias"
  | "religiosos"
  | "artesanato"
  | "calcados"
  | "autopecas"
  | "gastronomia"
  | "loja";

export type LandingAiAnswers = {
  estilo?: string;
  objetivo?: string;
  destaque?: string;
  sensacao?: string;
  imagemPreferencia?: string;
};

export type LandingAiColors = {
  background?: string;
  primary?: string;
  secondary?: string;
  accent?: string;
  surface?: string;
  text?: string;
  mutedText?: string;
};

export type LandingAiVariation = {
  id: string;
  name: string;
  description: string;
  templateName?: string;
  html?: string;

  category?: StoreCategoryKey;

  preset:
    | "JOIAS_LUXO"
    | "ARTESANAL_AFETIVO"
    | "GASTRONOMIA_DELIVERY"
    | "MODA_EDITORIAL"
    | "UNIVERSAL_PREMIUM"
    | "SERVICO_PROFISSIONAL";

  layoutMode?:
    | "editorial-split"
    | "catalog-first"
    | "boutique-story"
    | "conversion-focus"
    | "minimal-premium"
    | "bold-launch";

  designSystem?: LandingAiDesignSystem;
  wowFactor?: string;
  visualDirection?: string;
  differentiator?: string;
  heroTitle: string;
  heroSubtitle: string;
  primaryCta: string;
  secondaryCta: string;
  sections: string[];
  colors: LandingAiColors;

  copy: {
    topbar?: string[];
    benefits?: Array<{ title: string; description: string }>;
    aboutTitle?: string;
    aboutText?: string;
    faq?: Array<{ question: string; answer: string }>;
  };

  highlightProductId?: string;
  highlightProductName?: string;
  score?: number;
};

export type LandingAiDesignSystem = {
  fontHeading?:
    | "Marcellus"
    | "Playfair Display"
    | "Montserrat"
    | "Poppins"
    | "Inter"
    | "DM Serif Display";

  fontBody?:
    | "Montserrat"
    | "Poppins"
    | "Inter"
    | "Open Sans"
    | "Lato";

  spacingScale?: "compact" | "comfortable" | "luxury";

  cardStyle?: "flat" | "glass" | "bordered" | "shadow" | "editorial";

  heroLayout?:
    | "split-left"
    | "split-right"
    | "centered"
    | "product-focus"
    | "catalog-first";

  backgroundStyle?: "solid" | "gradient" | "soft-pattern" | "editorial-blocks";

  sectionShape?: "straight" | "rounded" | "overlap" | "magazine";
};

export type GenerateLandingVariationsInput = {
  usuarioId?: string;
  userId?: string;
  storeId?: string;
  lojaId?: string;
  tipo?: "PRESTADOR" | "EMPREENDEDOR" | "MORADOR" | string;
  pageKind?: PageBusinessKind;
  tipoStore?: PageBusinessKind;
  businessType?: PageBusinessKind;
  templateType?: "ecommerce" | "servico" | string;
  templateName?: string;
  layoutEstruturaId?: string;
  answers?: LandingAiAnswers;
  descricao?: string;
  descricaoDoCliente?: string;
  businessDescription?: string;
  limit?: number;
  plan?: string;
  condominioId?: string;
};

export type LandingAiStoreContext = {
  id?: string;
  name?: string;
  slug?: string;
  descricao_loja?: string;
  telefoneWhatsapp?: string;
  telefone_whatsapp?: string;
  categoria?: string;
  tipo?: string;
  usuarioId?: string;
};

export type LandingAiProductContext = {
  id?: string;
  name?: string;
  description?: string;
  price?: number;
  image_url?: string;
  stock?: number;
  original_price?: number;
  old_price?: number;
  discount_price?: number;
  promotional_price?: number;
  discount_percent?: number;
  discount_label?: string;
};