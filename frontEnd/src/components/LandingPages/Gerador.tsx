import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useResult } from "./ResultContext";
import "./Gerador.css";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/api";
import generatorApi, { GENERATOR_API_URL } from "../../api/generatorApi";
import ModalCadastroProduto from "../ModalCadastroProduto/ModalNovoProduto";
import { useTheme, useMediaQuery } from "@mui/material";
import { API_URL } from "../../utils/config";

type GeradorProps = {
  tipo?: "PRESTADOR" | "EMPREENDEDOR" | "MORADOR";
};

type PageBusinessKind = "loja" | "servico";

type BrandPaletteMode = "AI" | "CUSTOM";

type BrandColors = {
  primary: string;
  secondary: string;
  accent: string;
};

type LandingAnswers = {
  estilo: string;
  objetivo: string;
  destaque: string;
  sensacao: string;
  imagemPreferencia: string;
};

type HeroCopyOverrides = {
  heroTitle: string;
  heroSubtitle: string;
  primaryCta: string;
  secondaryCta: string;
};

type ServiceDesignBriefId =
  | "SERVICE_WARM_EDITORIAL"
  | "SERVICE_CINEMATIC"
  | "SERVICE_MAGAZINE"
  | "SERVICE_MINIMAL"
  | "SERVICE_CONVERSION";

type ServiceDesignBrief = {
  id: ServiceDesignBriefId;
  label: string;
  description: string;
  layoutFamily: "PREMIUM_WARM" | "CINEMATIC" | "MAGAZINE" | "MINIMAL" | "CONVERSION";
  qualityTarget: "HIGH_END";
  pageRhythm: "balanced" | "dramatic" | "editorial" | "airy" | "conversion";
  hero: {
    composition: "split-right-photo" | "full-bleed-cover" | "editorial-overlap" | "clean-split" | "split-conversion-card";
    contentWidth: string;
    mediaWidth: string;
    trustPlacement: "hero-bottom" | "below-copy" | "separate-row";
    imageTreatment: "warm-portrait" | "cinematic-cover" | "editorial-layered" | "clean-portrait" | "conversion-media";
  };
  services: {
    layout: "four-soft-cards" | "two-column-media" | "featured-plus-list" | "minimal-rows" | "three-conversion-cards";
    cardStyle: "soft-rounded" | "cinematic-panel" | "editorial" | "minimal" | "conversion";
    maxColumns: number;
  };
  about: { layout: "media-story-proof" | "cinematic-story" | "editorial-columns" | "minimal-story" | "proof-layout"; };
  testimonials: { layout: "three-cards" | "featured-quote" | "magazine-quotes" | "two-quotes" | "social-proof-grid"; };
  finalCta: { layout: "brand-band" | "cinematic-band" | "editorial-band" | "minimal-band" | "conversion-band"; };
  footer: { layout: "brand-nav-social" | "cinematic-footer" | "editorial-footer" | "minimal-footer" | "conversion-footer"; };
};

const SERVICE_DESIGN_BRIEFS: ServiceDesignBrief[] = [
  {
    id: "SERVICE_WARM_EDITORIAL",
    label: "Acolhedor editorial",
    description: "Layout premium acolhedor, com Hero dividido, fotografia forte, serviços em cards suaves e narrativa elegante.",
    layoutFamily: "PREMIUM_WARM", qualityTarget: "HIGH_END", pageRhythm: "balanced",
    hero: { composition: "split-right-photo", contentWidth: "42%", mediaWidth: "58%", trustPlacement: "hero-bottom", imageTreatment: "warm-portrait" },
    services: { layout: "four-soft-cards", cardStyle: "soft-rounded", maxColumns: 4 },
    about: { layout: "media-story-proof" }, testimonials: { layout: "three-cards" }, finalCta: { layout: "brand-band" }, footer: { layout: "brand-nav-social" },
  },
  {
    id: "SERVICE_CINEMATIC", label: "Cinemático",
    description: "Hero de alto impacto com imagem em tela ampla, narrativa visual e serviços em blocos com mídia.",
    layoutFamily: "CINEMATIC", qualityTarget: "HIGH_END", pageRhythm: "dramatic",
    hero: { composition: "full-bleed-cover", contentWidth: "58%", mediaWidth: "100%", trustPlacement: "below-copy", imageTreatment: "cinematic-cover" },
    services: { layout: "two-column-media", cardStyle: "cinematic-panel", maxColumns: 2 },
    about: { layout: "cinematic-story" }, testimonials: { layout: "featured-quote" }, finalCta: { layout: "cinematic-band" }, footer: { layout: "cinematic-footer" },
  },
  {
    id: "SERVICE_MAGAZINE", label: "Magazine editorial",
    description: "Composição editorial assimétrica, tipografia forte, sobreposição de imagens e leitura de revista premium.",
    layoutFamily: "MAGAZINE", qualityTarget: "HIGH_END", pageRhythm: "editorial",
    hero: { composition: "editorial-overlap", contentWidth: "52%", mediaWidth: "62%", trustPlacement: "separate-row", imageTreatment: "editorial-layered" },
    services: { layout: "featured-plus-list", cardStyle: "editorial", maxColumns: 2 },
    about: { layout: "editorial-columns" }, testimonials: { layout: "magazine-quotes" }, finalCta: { layout: "editorial-band" }, footer: { layout: "editorial-footer" },
  },
  {
    id: "SERVICE_MINIMAL", label: "Minimal premium",
    description: "Muito espaço em branco, poucas formas, hierarquia tipográfica precisa e serviços organizados em linhas.",
    layoutFamily: "MINIMAL", qualityTarget: "HIGH_END", pageRhythm: "airy",
    hero: { composition: "clean-split", contentWidth: "60%", mediaWidth: "40%", trustPlacement: "separate-row", imageTreatment: "clean-portrait" },
    services: { layout: "minimal-rows", cardStyle: "minimal", maxColumns: 1 },
    about: { layout: "minimal-story" }, testimonials: { layout: "two-quotes" }, finalCta: { layout: "minimal-band" }, footer: { layout: "minimal-footer" },
  },
  {
    id: "SERVICE_CONVERSION", label: "Conversão premium",
    description: "Estrutura comercial clara, Hero com painel de ação, serviços orientados à decisão e CTA forte.",
    layoutFamily: "CONVERSION", qualityTarget: "HIGH_END", pageRhythm: "conversion",
    hero: { composition: "split-conversion-card", contentWidth: "52%", mediaWidth: "48%", trustPlacement: "below-copy", imageTreatment: "conversion-media" },
    services: { layout: "three-conversion-cards", cardStyle: "conversion", maxColumns: 3 },
    about: { layout: "proof-layout" }, testimonials: { layout: "social-proof-grid" }, finalCta: { layout: "conversion-band" }, footer: { layout: "conversion-footer" },
  },
];

function getServiceDesignBrief(index: number): ServiceDesignBrief {
  return SERVICE_DESIGN_BRIEFS[index % SERVICE_DESIGN_BRIEFS.length];
}

type BusinessMaterialType =
  | "HERO"
  | "PROFESSIONAL"
  | "WORKSPACE"
  | "SERVICE"
  | "PRODUCT"
  | "LOGO"
  | "PUBLICITY"
  | "VIDEO";

type BusinessMaterial = {
  id: string;
  type: BusinessMaterialType;
  url: string;
  path?: string;
  filename?: string;
  originalName?: string;
  mimetype?: string;
  size?: number;

  /**
   * Metadados visuais usados pelo backend para escolher a imagem certa
   * para cada composição, sem obrigar uma foto vertical a virar Hero horizontal.
   */
  width?: number;
  height?: number;
  aspectRatio?: number;
  orientation?: "landscape" | "portrait" | "square" | "unknown";
};

type UploadedMaterialResponse = {
  originalname?: string;
  filename?: string;
  mimetype?: string;
  size?: number;
  path?: string;
  url?: string;
};

type GeneratorAssetKind =
  | "HERO"
  | "PERSON"
  | "SPACE"
  | "WORK"
  | "PRODUCT"
  | "LOGO"
  | "PROMO"
  | "VIDEO";

type GeneratorUploadedAsset = {
  id?: string;
  kind?: GeneratorAssetKind | string;
  url?: string;
  label?: string;
  alt?: string;
  originalName?: string;
  mimeType?: string;
  localPath?: string;
};

type LandingAiVariation = {
  id?: string;
  name?: string;
  nome?: string;
  title?: string;
  preset?: string;
  description?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  primaryCta?: string;
  secondaryCta?: string;
  sections?: string[];
  colors?: {
    background?: string;
    primary?: string;
    secondary?: string;
    accent?: string;
    surface?: string;
    text?: string;
    mutedText?: string;
  };
  copy?: any;
  previewImage?: string;
  score?: number;
  html?: string;
  serviceDesignBrief?: ServiceDesignBrief;
  serviceDesignBriefId?: ServiceDesignBriefId;
  [key: string]: any;
};

interface ITemplateProfissional {
  id: string;
  name?: string;
  nome: string;
  imagemUrl: string | null;
  url?: string;
  categoria?: string;
  previewImage?: string;
  templateKind?: "LOJA" | "SERVICO" | string;
  businessType?: "loja" | "servico" | string;
  updatedAt?: number | string;
}

const DEFAULT_ANSWERS: LandingAnswers = {
  estilo: "",
  objetivo: "",
  destaque: "",
  sensacao: "",
  imagemPreferencia: "",
};

const DEFAULT_BRAND_COLORS: BrandColors = {
  primary: "#7c3aed",
  secondary: "#334155",
  accent: "#f59e0b",
};

const DEFAULT_HERO_COPY: HeroCopyOverrides = {
  heroTitle: "",
  heroSubtitle: "",
  primaryCta: "",
  secondaryCta: "",
};

function buildHeroCopyPayload(copy: HeroCopyOverrides) {
  return Object.fromEntries(
    Object.entries(copy)
      .map(([key, value]) => [key, String(value || "").trim()])
      .filter(([, value]) => Boolean(value)),
  );
}

const ESTILO_OPTIONS = [
  "Elegante e premium",
  "Moderno e limpo",
  "Artesanal e acolhedor",
  "Divertido e chamativo",
  "Minimalista editorial",
];

const SERVICE_OBJECTIVE_OPTIONS = [
  "Agendar um atendimento",
  "Pedir um orçamento",
  "Conversar comigo",
  "Conhecer meus serviços",
  "Comprar um pacote de atendimentos",
];

const STORE_OBJECTIVE_OPTIONS = [
  "Comprar meus produtos",
  "Ver meu catálogo",
  "Fazer um pedido",
  "Pedir orçamento",
  "Falar comigo",
];


const SENSACAO_OPTIONS = [
  "Confiança",
  "Profissionalismo",
  "Rapidez",
  "Exclusividade",
  "Proximidade",
  "Autoridade",
];

const IMAGEM_OPTIONS = [
  "Usar fotos reais da loja",
  "Usar imagens sugeridas",
  "Misturar fotos reais e imagens de apoio",
  "Visual mais limpo, com poucas imagens",
];

function resolveTemplateId(
  template: ITemplateProfissional,
  index: number,
): string {
  /**
   * IMPORTANTE:
   * `categoria` pode conter um preset visual (ex.: CLEAN_MINIMAL) e não
   * necessariamente o nome do JSON estrutural. Por isso ela não pode ser
   * a primeira fonte para selectedTemplate.
   */
  const id = String(template.id || "").trim();
  if (id) {
    const resolvedId = id.split("/")[0] || id;
    if (resolvedId && !looksLikeAiPreset(resolvedId)) {
      return resolvedId;
    }
  }

  const nome = String(template.nome || template.name || "").trim();
  if (
    nome &&
    !/\.(png|jpe?g|webp|gif)$/i.test(nome) &&
    !looksLikeAiPreset(nome)
  ) {
    return nome;
  }

  const categoria = String(template.categoria || "").trim();
  if (categoria && !looksLikeAiPreset(categoria)) {
    return categoria;
  }

  /**
   * Último fallback: preserva um identificador utilizável para o card,
   * mas evita devolver um preset visual como se fosse JSON pai.
   */
  return `template-${index}`;
}

function normalizeText(value: any) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function prestadorCategoryLooksLikeStore(perfil: any) {
  const candidates = [
    perfil?.categoriaTipo,
    perfil?.categoria_tipo,
    perfil?.business_type,
    perfil?.tipo_negocio,
    perfil?.tipoCategoria,
    perfil?.categoria_tag,
    perfil?.categoria,
    perfil?.ramo,
    perfil?.tipo,
  ]
    .map(normalizeText)
    .filter(Boolean);

  return candidates.some((value) =>
    [
      "loja",
      "ecommerce",
      "e-commerce",
      "produto",
      "produtos",
      "comercio",
      "comercio local",
      "empreendedor",
      "venda",
      "vendas",
    ].some((needle) => value.includes(needle)),
  );
}

function resolvePageKind(tipo?: string, perfil?: any): PageBusinessKind {
  if (tipo === "EMPREENDEDOR") return "loja";
  if (tipo === "PRESTADOR" && prestadorCategoryLooksLikeStore(perfil)) {
    return "loja";
  }
  return "servico";
}

function resolveStoreTipo(tipo?: string, perfil?: any) {
  return resolvePageKind(tipo, perfil);
}

function resolveBusinessType(tipo?: string, perfil?: any) {
  return resolvePageKind(tipo, perfil) === "loja" ? "loja" : "servico";
}

function parseLayoutConfig(layoutConfig: any) {
  if (!layoutConfig) return {};

  if (typeof layoutConfig === "string") {
    try {
      return JSON.parse(layoutConfig);
    } catch {
      return {};
    }
  }

  return layoutConfig;
}
function templateMatchesPageKind(
  template: ITemplateProfissional,
  pageKind: PageBusinessKind,
) {
  const explicitKind = String(template.templateKind || "").toUpperCase();
  const explicitBusinessType = normalizeText(template.businessType);

  // ✅ Metadado explícito sempre tem prioridade
  if (explicitKind === "LOJA") {
    return pageKind === "loja";
  }

  if (explicitKind === "SERVICO" || explicitKind === "SERVIÇO") {
    return pageKind === "servico";
  }

  if (
    explicitBusinessType === "loja" ||
    explicitBusinessType === "ecommerce"
  ) {
    return pageKind === "loja";
  }

  if (
    explicitBusinessType === "servico" ||
    explicitBusinessType === "serviço"
  ) {
    return pageKind === "servico";
  }

  const haystack = normalizeText(
    [
      template.id,
      template.name,
      template.nome,
      template.categoria,
      template.previewImage,
      (template as any).tipo,
      (template as any).tipoPagina,
      (template as any).tipo_pagina,
      (template as any).tipoStore,
      (template as any).templateType,
      (template as any).grupo,
      (template as any).tags,
    ]
      .filter(Boolean)
      .join(" "),
  );

  const ecommerceWords = [
    "loja",
    "ecommerce",
    "e-commerce",
    "produto",
    "produtos",
    "vitrine",
    "catalogo",
    "catálogo",
    "joia",
    "joias",
    "joalheria",
    "moda",
    "comercio",
    "comércio",
    "store",
  ];

  const serviceWords = [
    "servico",
    "serviço",
    "prestador",
    "prestacao",
    "prestação",
    "profissional",
    "agenda",
    "agendamento",
    "orcamento",
    "orçamento",
    "psicopedagogia",
    "psicopedagogo",
  ];

  const hasEcommerceSignal = ecommerceWords.some((word) =>
    haystack.includes(normalizeText(word)),
  );

  const hasServiceSignal = serviceWords.some((word) =>
    haystack.includes(normalizeText(word)),
  );

  // ✅ Exclusivamente ecommerce
  if (hasEcommerceSignal && !hasServiceSignal) {
    return pageKind === "loja";
  }

  // ✅ Exclusivamente serviço
  if (hasServiceSignal && !hasEcommerceSignal) {
    return pageKind === "servico";
  }

  // ✅ Ambos ou nenhum = template universal
  return true;
}

function filterTemplatesByPageKind(
  templates: ITemplateProfissional[],
  pageKind: PageBusinessKind,
) {
  return templates.filter((template) =>
    templateMatchesPageKind(template, pageKind),
  );
}

function storeKindMatchesPageKind(loja: any, pageKind: PageBusinessKind) {
  const tipoLoja = normalizeText(
    loja?.tipo || loja?.tipoStore || loja?.businessType || loja?.templateKind,
  );

  if (pageKind === "loja") {
    return ["loja", "empreendedor", "ecommerce", "e-commerce", "store"].some((value) =>
      tipoLoja.includes(value),
    );
  }

  return ["servico", "serviço", "prestador", "service"].some((value) =>
    tipoLoja.includes(value),
  );
}

function getStoreId(loja: any): string {
  return String(
    loja?.id ||
    loja?.storeId ||
    loja?.store_id ||
    loja?.lojaId ||
    loja?.loja_id ||
    loja?._id ||
    "",
  ).trim();
}

function getStoreHtml(loja: any): string {
  return String(
    loja?.pageHtmlDraft ||
    loja?.pageHtmlPublished ||
    loja?.page_html_draft ||
    loja?.page_html_published ||
    loja?.html ||
    loja?.pageHtml ||
    loja?.page_html ||
    loja?.landingHtml ||
    loja?.landing_html ||
    "",
  );
}

function getStoreCss(loja: any): string {
  return String(
    loja?.pageCssDraft ||
    loja?.pageCssPublished ||
    loja?.page_css_draft ||
    loja?.page_css_published ||
    loja?.css ||
    loja?.pageCss ||
    loja?.page_css ||
    loja?.landingCss ||
    loja?.landing_css ||
    "",
  );
}

function getStoreLayoutConfig(loja: any) {
  return loja?.layoutConfig || loja?.layout_config || loja?.layout || null;
}

function storeHasReusableLayout(loja: any) {
  const layout = parseLayoutConfig(getStoreLayoutConfig(loja));

  return Boolean(
    getStoreHtml(loja) ||
    loja?.pageSpecDraft ||
    loja?.pageSpecPublished ||
    loja?.page_spec_draft ||
    loja?.page_spec_published ||
    getStoreLayoutConfig(loja) ||
    loja?.templateId ||
    loja?.template_id ||
    layout?.templateName ||
    layout?.layoutEstruturaId ||
    layout?.selectedTemplate,
  );
}

function resolveSavedTemplateFromStore(loja: any) {
  const layout = parseLayoutConfig(getStoreLayoutConfig(loja));

  /**
   * Uma loja antiga pode ter salvo em templateId/layoutConfig um PRESET visual
   * (ex.: CLEAN_MINIMAL) em vez do nome real do JSON estrutural.
   *
   * Não podemos devolver esse preset como selectedTemplate, porque ele
   * sobrescreve o template correto carregado por /templates e depois é
   * rejeitado por resolveTemplatePaiFromVariation().
   */
  const candidates = [
    loja?.templateId,
    loja?.template_id,
    loja?.layoutEstruturaId,
    loja?.layout_estrutura_id,
    layout?.templateName,
    layout?.layoutEstruturaId,
    layout?.selectedTemplate,
    layout?.settings?.templateName,
    layout?.settings?.layoutEstruturaId,
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  return candidates.find((item) => !looksLikeAiPreset(item)) || "";
}

function looksLikeAiPreset(value: any) {
  const normalized = normalizeText(value).toUpperCase();

  if (!normalized) return false;

  const knownPresets = [
    "CLEAN_MINIMAL",
    "MODA_EDITORIAL",
    "UNIVERSAL_PREMIUM",
    "PREMIUM",
    "ARTESANAL_AFETIVO",
    "GASTRONOMIA_DELIVERY",
    "JOIAS_LUXO",
    "CATALOG_FIRST",
    "BOUTIQUE_STORY",
    "MINIMAL_PREMIUM",
    "BOLD_LAUNCH",
    "CONVERSION_FOCUS",
  ];

  return (
    knownPresets.includes(normalized) ||
    normalized.includes("PRESET") ||
    normalized.includes("MINIMAL") ||
    normalized.includes("EDITORIAL") ||
    normalized.includes("PREMIUM")
  );
}

function resolveTemplatePaiFromVariation(
  selectedVariation: LandingAiVariation | undefined,
  selectedTemplate: string,
) {
  const candidates = [
    selectedVariation?.templateName,
    selectedVariation?.baseTemplateName,
    selectedVariation?.parentTemplateName,
    selectedVariation?.layoutEstruturaId,
    selectedVariation?.templateId,
    selectedTemplate,
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  return candidates.find((item) => !looksLikeAiPreset(item)) || "";
}


function normalizeHexColor(value: string, fallback: string): string {
  const color = String(value || "").trim();

  if (/^#[0-9a-fA-F]{6}$/.test(color)) {
    return color.toLowerCase();
  }

  return fallback;
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = normalizeHexColor(hex, "#000000").slice(1);

  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ];
}

function rgbToHex(red: number, green: number, blue: number): string {
  const clamp = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value)))
      .toString(16)
      .padStart(2, "0");

  return `#${clamp(red)}${clamp(green)}${clamp(blue)}`;
}

function mixHexColors(
  from: string,
  to: string,
  toWeight: number,
): string {
  const [r1, g1, b1] = hexToRgb(from);
  const [r2, g2, b2] = hexToRgb(to);
  const weight = Math.max(0, Math.min(1, toWeight));

  return rgbToHex(
    r1 + (r2 - r1) * weight,
    g1 + (g2 - g1) * weight,
    b1 + (b2 - b1) * weight,
  );
}

function relativeLuminance(hex: string): number {
  const [red, green, blue] = hexToRgb(hex).map((value) => {
    const channel = value / 255;

    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function buildBrandPalette(
  mode: BrandPaletteMode,
  colors: BrandColors,
) {
  if (mode !== "CUSTOM") return undefined;

  const primary = normalizeHexColor(
    colors.primary,
    DEFAULT_BRAND_COLORS.primary,
  );
  const secondary = normalizeHexColor(
    colors.secondary,
    DEFAULT_BRAND_COLORS.secondary,
  );
  const accent = normalizeHexColor(
    colors.accent,
    DEFAULT_BRAND_COLORS.accent,
  );

  const background = mixHexColors(primary, "#ffffff", 0.94);
  const surface = mixHexColors(secondary, "#ffffff", 0.975);
  const primaryIsDark = relativeLuminance(primary) < 0.42;

  const text = primaryIsDark
    ? mixHexColors(primary, "#000000", 0.28)
    : "#111827";

  const mutedText = mixHexColors(text, background, 0.46);

  return {
    background,
    surface,
    primary,
    secondary,
    accent,
    text,
    mutedText,
  };
}

function normalizeMaterialUrl(value?: string) {
  let url = String(value || "").trim();
  if (!url) return "";

  // O controller atual pode devolver //uploads/... quando file.path já começa com /.
  if (url.startsWith("//uploads/")) {
    url = url.slice(1);
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return url.startsWith("/") ? url : `/${url}`;
}

function resolveMaterialPreviewUrl(value?: string) {
  const url = normalizeMaterialUrl(value);
  if (!url) return "";

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${String(API_URL || "").replace(/\/$/, "")}${url}`;
}

function resolveGeneratorMaterialPreviewUrl(value?: string) {
  const url = normalizeMaterialUrl(value);
  if (!url) return "";

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${String(GENERATOR_API_URL || "").replace(/\/$/, "")}${url}`;
}

function normalizeProductPrice(value: any): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const raw = String(value ?? "").trim();
  if (!raw) return 0;

  const normalized = raw
    .replace(/R\$/gi, "")
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeProductForGeneration(product: any, index: number) {
  const rawImage =
    product?.imageUrl ||
    product?.image_url ||
    product?.imagem_url ||
    product?.foto_url ||
    product?.foto ||
    product?.imagem ||
    product?.image ||
    product?.capa_url ||
    product?.thumbnail_url ||
    "";

  const price = normalizeProductPrice(
    product?.price ??
    product?.preco ??
    product?.valor ??
    product?.precoVenda ??
    product?.preco_venda,
  );

  const originalPrice = normalizeProductPrice(
    product?.originalPrice ??
    product?.precoOriginal ??
    product?.preco_original ??
    product?.valorOriginal ??
    product?.valor_original,
  );

  return {
    ...product,
    id:
      product?.id ||
      product?.produtoId ||
      product?.productId ||
      `produto-${index + 1}`,
    name:
      product?.name ||
      product?.nome ||
      product?.titulo ||
      `Produto ${index + 1}`,
    description:
      product?.description ||
      product?.descricao ||
      product?.detalhes ||
      "",
    price,
    originalPrice,
    imageUrl: rawImage ? resolveMaterialPreviewUrl(String(rawImage)) : "",
  };
}

function readImageDimensions(file: File): Promise<{
  width?: number;
  height?: number;
  aspectRatio?: number;
  orientation?: "landscape" | "portrait" | "square" | "unknown";
}> {
  if (!file.type.startsWith("image/")) {
    return Promise.resolve({});
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const width = Number(image.naturalWidth || image.width || 0);
      const height = Number(image.naturalHeight || image.height || 0);
      URL.revokeObjectURL(objectUrl);

      if (!width || !height) {
        resolve({});
        return;
      }

      const aspectRatio = width / height;
      const orientation =
        aspectRatio > 1.12
          ? "landscape"
          : aspectRatio < 0.88
            ? "portrait"
            : "square";

      resolve({ width, height, aspectRatio, orientation });
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({});
    };

    image.src = objectUrl;
  });
}

function toGeneratorAssetKind(type: BusinessMaterialType): GeneratorAssetKind {
  const map: Record<BusinessMaterialType, GeneratorAssetKind> = {
    HERO: "HERO",
    PROFESSIONAL: "PERSON",
    WORKSPACE: "SPACE",
    SERVICE: "WORK",
    PRODUCT: "PRODUCT",
    LOGO: "LOGO",
    PUBLICITY: "PROMO",
    VIDEO: "VIDEO",
  };

  return map[type];
}

function inferMaterialType(
  file: UploadedMaterialResponse,
  pageKind: PageBusinessKind,
): BusinessMaterialType {
  const mime = String(file.mimetype || "").toLowerCase();
  const name = String(
    file.originalname || file.filename || file.path || file.url || "",
  ).toLowerCase();

  if (mime.startsWith("video/")) return "VIDEO";
  if (/(^|[\s_-])(hero|capa|cover)([\s_.-]|$)/i.test(name)) return "HERO";
  if (/logo|marca|logotipo/.test(name)) return "LOGO";
  if (/consult[oó]rio|escrit[oó]rio|loja|sala|ambiente|espa[cç]o/.test(name)) {
    return "WORKSPACE";
  }
  if (/perfil|profissional|equipe|time|team|retrato|portrait/.test(name)) {
    return "PROFESSIONAL";
  }
  if (/folder|banner|an[uú]ncio|publicidade|divulga[cç][aã]o|campanha/.test(name)) {
    return "PUBLICITY";
  }

  return pageKind === "loja" ? "PRODUCT" : "SERVICE";
}

function buildDescricaoFromAnswers(
  answers: LandingAnswers,
  descricaoLivre: string,
) {
  const descricao = String(descricaoLivre || "").trim();

  const parts = [
    descricao,
    answers.destaque
      ? `Destaque principal do negócio: ${answers.destaque}.`
      : "",
    answers.objetivo
      ? `Objetivo comercial da página: ${answers.objetivo}.`
      : "",
    answers.estilo ? `Direção visual opcional: ${answers.estilo}.` : "",
    answers.sensacao
      ? `Percepção desejada da marca: ${answers.sensacao}.`
      : "",
    answers.imagemPreferencia
      ? `Preferência visual opcional: ${answers.imagemPreferencia}.`
      : "",
  ].filter(Boolean);

  return parts.join("\n");
}

function getVariationTitle(variation: LandingAiVariation, index: number) {
  return (
    variation.name ||
    variation.nome ||
    variation.title ||
    variation.preset ||
    `Variação ${index + 1}`
  );
}

function getVariationDescription(variation: LandingAiVariation) {
  return (
    variation.description ||
    variation.heroSubtitle ||
    variation.copy?.description ||
    "Variação gerada com base nas respostas e dados do negócio."
  );
}

function getVariationAccentLabel(variation: LandingAiVariation) {
  return (
    variation.layoutMode ||
    variation.preset ||
    variation.visualDirection ||
    "Proposta profissional"
  );
}

function getStoragePayload(input: {
  variations: LandingAiVariation[];
  selectedVariationIndex: number;
  answers: LandingAnswers;
  descricao: string;
  selectedTemplate: string;
  pageKind: PageBusinessKind;
  businessMaterials?: BusinessMaterial[];
  brandPaletteMode?: BrandPaletteMode;
  brandColors?: BrandColors;
  heroCopy?: HeroCopyOverrides;
}) {
  return {
    version: 3,
    variations: input.variations,
    selectedVariationIndex: input.selectedVariationIndex,
    answers: input.answers,
    descricao: input.descricao,
    selectedTemplate: input.selectedTemplate,
    pageKind: input.pageKind,
    businessMaterials: input.businessMaterials || [],
    brandPaletteMode: input.brandPaletteMode || "AI",
    brandColors: input.brandColors || DEFAULT_BRAND_COLORS,
    heroCopy: input.heroCopy || DEFAULT_HERO_COPY,
    savedAt: new Date().toISOString(),
  };
}

export default function Gerador({ tipo }: GeradorProps) {
  const { user } = useAuth();
  const { setResult } = useResult();
  const navigate = useNavigate();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const carouselTrackRef = useRef<HTMLDivElement>(null);
  const variationsTrackRef = useRef<HTMLDivElement>(null);
  const materialInputRefs = useRef<
    Partial<Record<BusinessMaterialType, HTMLInputElement | null>>
  >({});

  const [templates, setTemplates] = useState<ITemplateProfissional[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [descricao, setDescricao] = useState<string>("");
  const [answers, setAnswers] = useState<LandingAnswers>(DEFAULT_ANSWERS);
  const [businessMaterials, setBusinessMaterials] = useState<BusinessMaterial[]>([]);
  const [uploadingMaterials, setUploadingMaterials] = useState(false);
  const [brandPaletteMode, setBrandPaletteMode] =
    useState<BrandPaletteMode>("AI");
  const [brandColors, setBrandColors] =
    useState<BrandColors>(DEFAULT_BRAND_COLORS);
  const [heroCopy, setHeroCopy] =
    useState<HeroCopyOverrides>(DEFAULT_HERO_COPY);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const [loadingExistente, setLoadingExistente] = useState(true);
  const [perfil, setPerfil] = useState<any>(null);

  const [openModal, setOpenModal] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<any>(null);
  const [showProductCheck, setShowProductCheck] = useState(false);
  const [showNextStepChoice, setShowNextStepChoice] = useState(false);
  const [lojaAtivaId, setLojaAtivaId] = useState<string | null>(null);
  const [lojaAtual, setLojaAtual] = useState<any>(null);
  const [generatorProjectId, setGeneratorProjectId] = useState<string | null>(null);
  const [generatorProject, setGeneratorProject] = useState<any>(null);
  const [generatorReady, setGeneratorReady] = useState(false);
  const [generatorLoading, setGeneratorLoading] = useState(false);
  const [temloja, setTemloja] = useState<any[]>([]);
  const [_storeProducts, setStoreProducts] = useState<any[]>([]);
  const [pageKind, setPageKind] = useState<PageBusinessKind>(
    resolvePageKind(tipo),
  );

  const [aiVariations, setAiVariations] = useState<LandingAiVariation[]>([]);
  const [selectedVariationIndex, setSelectedVariationIndex] = useState(0);
  const [generatingVariations, setGeneratingVariations] = useState(false);
  const [variationStepReady, setVariationStepReady] = useState(false);
  const [hasGeneratedAiVariations, setHasGeneratedAiVariations] = useState(false);

  // Cada negócio precisa ter seu próprio cache. Sem o storeId na chave,
  // duas lojas do mesmo usuário podem reutilizar variações uma da outra.
  const storageBusinessId =
    lojaAtivaId ||
    getStoreId(lojaAtual) ||
    "sem-loja";

  const generatorProjectStorageKey =
    `gran_generator_project_${user?.id || "anon"}_${storageBusinessId}`;

  const generatedOnceStoragePrefix =
    `gran_landing_ai_once_${user?.id || "anon"}_${storageBusinessId}_${tipo || "tipo"}_${pageKind}_`;

  const generatedOnceStorageKey =
    `${generatedOnceStoragePrefix}${selectedTemplate || "sem-template"}`;

  const variationsStorageKey =
    `gran_landing_ai_variations_${user?.id || "anon"}_${storageBusinessId}_${tipo || "tipo"}_${pageKind}_${selectedTemplate || "sem-template"}`;

  const saveVariationsCache = (
    variations: LandingAiVariation[],
    selectedIndex = 0,
    nextAnswers = answers,
    nextDescricao = descricao,
    nextSelectedTemplate = selectedTemplate,
  ) => {
    try {
      localStorage.setItem(
        variationsStorageKey,
        JSON.stringify(
          getStoragePayload({
            variations,
            selectedVariationIndex: selectedIndex,
            answers: nextAnswers,
            descricao: nextDescricao,
            selectedTemplate: nextSelectedTemplate,
            pageKind,
            businessMaterials,
            brandPaletteMode,
            brandColors,
            heroCopy,
          }),
        ),
      );
    } catch (err) {
      console.warn("Erro ao salvar variações IA:", err);
    }
  };

  const saveGeneratedOnceCache = (
    variations: LandingAiVariation[],
    selectedIndex = 0,
    nextAnswers = answers,
    nextDescricao = descricao,
    nextSelectedTemplate = selectedTemplate,
  ) => {
    try {
      localStorage.setItem(
        generatedOnceStorageKey,
        JSON.stringify(
          getStoragePayload({
            variations,
            selectedVariationIndex: selectedIndex,
            answers: nextAnswers,
            descricao: nextDescricao,
            selectedTemplate: nextSelectedTemplate,
            pageKind,
            businessMaterials,
            brandPaletteMode,
            brandColors,
            heroCopy,
          }),
        ),
      );
    } catch (err) {
      console.warn("Erro ao salvar geração única IA:", err);
    }
  };

  const clearVariationsCache = () => {
    try {
      const prefixes = [
        // Cache novo: isolado pelo negócio atual.
        `gran_landing_ai_variations_${user?.id || "anon"}_${storageBusinessId}_${tipo || "tipo"}_${pageKind}_`,
        `gran_landing_ai_once_${user?.id || "anon"}_${storageBusinessId}_${tipo || "tipo"}_${pageKind}_`,

        // Limpa também a chave legada desta conta para impedir reaproveitamento
        // de variações antigas que não eram isoladas por loja.
        `gran_landing_ai_variations_${user?.id || "anon"}_${tipo || "tipo"}_${pageKind}_`,
        `gran_landing_ai_once_${user?.id || "anon"}_${tipo || "tipo"}_${pageKind}_`,
      ];

      Object.keys(localStorage).forEach((key) => {
        if (prefixes.some((prefix) => key.startsWith(prefix))) {
          localStorage.removeItem(key);
        }
      });
    } catch (err) {
      console.warn("Erro ao limpar variações IA:", err);
    }
  };

  const handleRegenerateVariations = () => {
    clearVariationsCache();
    setAiVariations([]);
    setSelectedVariationIndex(0);
    setVariationStepReady(false);
    setHasGeneratedAiVariations(false);
    toast.info("Você pode ajustar fotos, textos e cores antes de criar outra opção.");

    window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 60);
  };


  const [buildProgressOpen, setBuildProgressOpen] = useState(false);
  const [buildProgressStep, setBuildProgressStep] = useState(0);

  const buildSteps = [
    "Analisando seu negócio",
    "Escolhendo estratégia visual",
    "Criando Hero profissional",
    "Organizando seções",
    "Padronizando botões e ações",
    "Otimizando para mobile",
    "Finalizando landing page",
  ];

  useEffect(() => {
    if (loadingExistente || storageBusinessId === "sem-loja") {
      return;
    }

    let cancelled = false;

    const normalizeGeneratorProject = (payload: any) =>
      payload?.project || payload?.data?.project || payload?.data || payload;

    const getGeneratorProjectId = (project: any) =>
      String(project?.id || project?.projectId || "").trim();

    const projectMatchesCurrentStore = (project: any) => {
      const origin = String(project?.origin || "").trim().toUpperCase();
      const externalStoreId = String(project?.externalStoreId || "").trim();

      return (
        origin === "GRANCONECTA" &&
        externalStoreId === storageBusinessId
      );
    };

    const acceptGeneratorProject = (projectPayload: any, source: string) => {
      const project = normalizeGeneratorProject(projectPayload);
      const resolvedProjectId = getGeneratorProjectId(project);

      if (!resolvedProjectId) {
        throw new Error("Projeto do Generator sem ID.");
      }

      if (!projectMatchesCurrentStore(project)) {
        throw new Error(
          `Projeto do Generator não pertence à loja atual (${source}).`,
        );
      }

      if (cancelled) return;

      setGeneratorProjectId(resolvedProjectId);
      setGeneratorProject(project);
      setGeneratorReady(true);

      localStorage.setItem(
        generatorProjectStorageKey,
        resolvedProjectId,
      );

      console.log("GENERATOR - PROJETO PRONTO", {
        source,
        projectId: resolvedProjectId,
        storeId: storageBusinessId,
        projectType: project?.projectType,
      });
    };

    const buildCreateProjectPayload = () => {
      const store = lojaAtual || {};

      const businessName = String(
        store?.name ||
          store?.nome ||
          store?.storeName ||
          perfil?.nomeFantasia ||
          perfil?.nome_fantasia ||
          perfil?.nome ||
          user?.name ||
          "Negócio GranConecta",
      ).trim();

      const businessCategory = String(
        store?.categoria ||
          store?.category ||
          store?.categoriaNome ||
          store?.categoria_nome ||
          perfil?.categoria ||
          perfil?.categoriaNome ||
          perfil?.categoria_nome ||
          perfil?.ramo ||
          "",
      ).trim();

      const businessDescription = String(
        store?.description ||
          store?.descricao ||
          store?.sobre ||
          store?.bio ||
          perfil?.description ||
          perfil?.descricao ||
          perfil?.sobre ||
          perfil?.bio ||
          "",
      ).trim();

      return {
        origin: "GRANCONECTA",
        projectType: pageKind === "loja" ? "ECOMMERCE" : "LANDING",
        generationMode: "CREATIVE",
        externalStoreId: storageBusinessId,
        business: {
          name: businessName,
          category: businessCategory || undefined,
          businessType: pageKind === "loja" ? "loja" : "servico",
          description: businessDescription || undefined,
        },
      };
    };

    const ensureGeneratorProject = async () => {
      if (!cancelled) {
        setGeneratorLoading(true);
        setGeneratorReady(false);
      }

      const savedProjectId = String(
        localStorage.getItem(generatorProjectStorageKey) || "",
      ).trim();

      try {
        // ==================================================
        // 1) TENTA O PROJECT ID SALVO PARA ESTA LOJA
        // ==================================================
        if (savedProjectId) {
          try {
            console.log("GENERATOR - VALIDANDO PROJETO SALVO", {
              projectId: savedProjectId,
              storeId: storageBusinessId,
              baseURL: GENERATOR_API_URL,
            });

            const savedResponse = await generatorApi.get(
              `/api/projects/${savedProjectId}`,
            );

            const savedProject = normalizeGeneratorProject(savedResponse.data);

            if (projectMatchesCurrentStore(savedProject)) {
              acceptGeneratorProject(savedProject, "LOCAL_STORAGE");
              return;
            }

            console.warn("GENERATOR - PROJETO SALVO PERTENCE A OUTRA LOJA", {
              savedProjectId,
              currentStoreId: storageBusinessId,
              projectExternalStoreId: savedProject?.externalStoreId,
            });

            localStorage.removeItem(generatorProjectStorageKey);
          } catch (error: any) {
            console.warn("GENERATOR - PROJECT ID SALVO INVÁLIDO", {
              savedProjectId,
              storeId: storageBusinessId,
              status: error?.response?.status,
              data: error?.response?.data,
              message: error?.message,
            });

            localStorage.removeItem(generatorProjectStorageKey);

            // Se não foi 404, pode ser indisponibilidade temporária.
            // Ainda tentamos a busca por storeId, que é a fonte definitiva
            // de vínculo entre GranConecta e Generator.
          }
        }

        if (cancelled) return;

        // ==================================================
        // 2) PROCURA O PROJETO PELO externalStoreId
        // ==================================================
        try {
          console.log("GENERATOR - BUSCANDO PROJETO PELA STORE", {
            storeId: storageBusinessId,
            baseURL: GENERATOR_API_URL,
          });

          const lookupResponse = await generatorApi.get(
            `/api/projects/integration/granconecta/store/${encodeURIComponent(
              storageBusinessId,
            )}`,
          );

          acceptGeneratorProject(lookupResponse.data, "EXTERNAL_STORE_ID");
          return;
        } catch (error: any) {
          const status = Number(error?.response?.status || 0);

          if (status !== 404) {
            throw error;
          }

          console.log("GENERATOR - PROJETO AINDA NÃO EXISTE PARA A STORE", {
            storeId: storageBusinessId,
          });
        }

        if (cancelled) return;

        // ==================================================
        // 3) NÃO EXISTE: CRIA UMA ÚNICA VEZ
        // O backend também é idempotente por externalStoreId.
        // ==================================================
        const createPayload = buildCreateProjectPayload();

        console.log("GENERATOR - CRIANDO PROJETO PARA A STORE", {
          storeId: storageBusinessId,
          projectType: createPayload.projectType,
          businessName: createPayload.business.name,
        });

        const createResponse = await generatorApi.post(
          "/api/projects",
          createPayload,
        );

        acceptGeneratorProject(createResponse.data, "CREATED_OR_REUSED");
      } catch (error: any) {
        if (cancelled) return;

        console.error("GENERATOR - NÃO FOI POSSÍVEL PREPARAR O PROJETO", {
          storeId: storageBusinessId,
          status: error?.response?.status,
          data: error?.response?.data,
          message: error?.message,
        });

        setGeneratorProjectId(null);
        setGeneratorProject(null);
        setGeneratorReady(false);
      } finally {
        if (!cancelled) {
          setGeneratorLoading(false);
        }
      }
    };

    void ensureGeneratorProject();

    return () => {
      cancelled = true;
    };
  }, [
    generatorProjectStorageKey,
    loadingExistente,
    lojaAtual,
    pageKind,
    perfil,
    storageBusinessId,
    user?.name,
   
  ]);

  // Mantém o estado do novo Generator observável durante a Etapa 1.
  // Além de facilitar o teste, estes valores serão consumidos diretamente
  // pelas etapas de upload, geração, aprovação e publicação.
  useEffect(() => {
    if (storageBusinessId === "sem-loja") return;

    console.log("GENERATOR - ESTADO DA INTEGRAÇÃO", {
      storeId: storageBusinessId,
      projectId: generatorProjectId,
      ready: generatorReady,
      loading: generatorLoading,
      project: generatorProject,
    });
  }, [
    generatorLoading,
    generatorProject,
    generatorProjectId,
    generatorReady,
    storageBusinessId,
  ]);

  useEffect(() => {
    // Aguarda a loja correta ser resolvida antes de restaurar qualquer cache.
    // Isso impede que "sem-loja" ou dados de outro negócio contaminem a geração.
    if (loadingExistente || storageBusinessId === "sem-loja") return;

    try {
      const payloads = Object.keys(localStorage)
        .filter((key) => key.startsWith(generatedOnceStoragePrefix))
        .map((key) => {
          try {
            return JSON.parse(localStorage.getItem(key) || "null");
          } catch {
            return null;
          }
        })
        .filter((item) => Array.isArray(item?.variations) && item.variations.length > 0)
        .sort((a, b) =>
          String(b?.savedAt || "").localeCompare(String(a?.savedAt || "")),
        );

      const parsed = payloads[0];
      if (!parsed) return;

      const safeIndex = Math.min(
        Math.max(Number(parsed.selectedVariationIndex || 0), 0),
        parsed.variations.length - 1,
      );

      setAnswers({
        ...DEFAULT_ANSWERS,
        ...(parsed.answers || {}),
      });
      setDescricao(typeof parsed.descricao === "string" ? parsed.descricao : "");
      if (Array.isArray(parsed.businessMaterials)) {
        setBusinessMaterials(parsed.businessMaterials);
      }

      if (parsed?.brandPaletteMode === "CUSTOM" || parsed?.brandPaletteMode === "AI") {
        setBrandPaletteMode(parsed.brandPaletteMode);
      }

      if (parsed?.brandColors && typeof parsed.brandColors === "object") {
        setBrandColors({
          ...DEFAULT_BRAND_COLORS,
          ...parsed.brandColors,
        });
      }

      if (parsed?.heroCopy && typeof parsed.heroCopy === "object") {
        setHeroCopy({
          ...DEFAULT_HERO_COPY,
          ...parsed.heroCopy,
        });
      }

      const cachedTemplate = String(parsed.selectedTemplate || "").trim();

      if (cachedTemplate && !looksLikeAiPreset(cachedTemplate)) {
        setSelectedTemplate(cachedTemplate);
      }

      setAiVariations(parsed.variations);
      setSelectedVariationIndex(safeIndex);
      setVariationStepReady(true);
      setHasGeneratedAiVariations(true);
    } catch (err) {
      console.warn("Erro ao restaurar geração única IA:", err);
    }
  }, [generatedOnceStoragePrefix, loadingExistente, storageBusinessId]);

  useEffect(() => {
    if (loadingExistente || storageBusinessId === "sem-loja") return;

    try {
      const saved = localStorage.getItem(variationsStorageKey);
      if (!saved) return;

      const parsed = JSON.parse(saved);

      if (parsed?.answers) {
        setAnswers({
          ...DEFAULT_ANSWERS,
          ...parsed.answers,
        });
      }

      if (typeof parsed?.descricao === "string") {
        setDescricao(parsed.descricao);
      }

      if (Array.isArray(parsed?.businessMaterials)) {
        setBusinessMaterials(parsed.businessMaterials);
      }

      if (parsed?.brandPaletteMode === "CUSTOM" || parsed?.brandPaletteMode === "AI") {
        setBrandPaletteMode(parsed.brandPaletteMode);
      }

      if (parsed?.brandColors && typeof parsed.brandColors === "object") {
        setBrandColors({
          ...DEFAULT_BRAND_COLORS,
          ...parsed.brandColors,
        });
      }

      if (parsed?.heroCopy && typeof parsed.heroCopy === "object") {
        setHeroCopy({
          ...DEFAULT_HERO_COPY,
          ...parsed.heroCopy,
        });
      }

      if (
        typeof parsed?.selectedTemplate === "string" &&
        parsed.selectedTemplate &&
        !looksLikeAiPreset(parsed.selectedTemplate)
      ) {
        setSelectedTemplate(parsed.selectedTemplate);
      }

      if (Array.isArray(parsed?.variations) && parsed.variations.length > 0) {
        const safeIndex = Math.min(
          Math.max(Number(parsed.selectedVariationIndex || 0), 0),
          parsed.variations.length - 1,
        );

        setAiVariations(parsed.variations);
        setSelectedVariationIndex(safeIndex);
        setVariationStepReady(true);
      }
    } catch (err) {
      console.warn("Erro ao restaurar variações IA:", err);
    }
  }, [variationsStorageKey, loadingExistente, storageBusinessId]);

  useEffect(() => {
    const checkExistingStore = async () => {
      if (!user?.id) return;

      try {
        const resUser = await api.get(`/users/${user.id}`);
        const perfilData = resUser.data?.perfil;
        setPerfil(perfilData);

        const resolvedPageKind = resolvePageKind(tipo, perfilData);
        setPageKind(resolvedPageKind);

        const storeTipo = resolveStoreTipo(tipo, perfilData);

        const resStore = await api.get("/lojas/me");

        const lojasRaw = Array.isArray(resStore.data)
          ? resStore.data
          : Array.isArray(resStore.data?.stores)
            ? resStore.data.stores
            : Array.isArray(resStore.data?.lojas)
              ? resStore.data.lojas
              : resStore.data?.store
                ? [resStore.data.store]
                : resStore.data?.loja
                  ? [resStore.data.loja]
                  : resStore.data
                    ? [resStore.data]
                    : [];

        const lojasDoUsuario = lojasRaw.filter(Boolean);

        console.log("GERADOR - /lojas/me", {
          userId: user.id,
          resolvedPageKind,
          total: lojasDoUsuario.length,
          lojas: lojasDoUsuario.map((loja: any) => ({
            id: getStoreId(loja),
            tipo: loja?.tipo || loja?.tipoStore || loja?.businessType,
            temHtml: Boolean(getStoreHtml(loja)),
            temLayout: storeHasReusableLayout(loja),
            template: resolveSavedTemplateFromStore(loja),
          })),
        });

        setTemloja(
          lojasDoUsuario.filter((loja: any) =>
            storeKindMatchesPageKind(loja, "loja") || storeHasReusableLayout(loja),
          ),
        );

        const lojaExistente =
          lojasDoUsuario.find((loja: any) =>
            storeKindMatchesPageKind(loja, resolvedPageKind) && storeHasReusableLayout(loja),
          ) ||
          lojasDoUsuario.find((loja: any) => storeHasReusableLayout(loja)) ||
          lojasDoUsuario.find((loja: any) => storeKindMatchesPageKind(loja, resolvedPageKind)) ||
          lojasDoUsuario[0] ||
          null;

        if (!lojaExistente) {
          setLojaAtivaId(null);
          setLojaAtual(null);
        }

        if (lojaExistente) {
          const savedTemplate = resolveSavedTemplateFromStore(lojaExistente);

          const lojaExistenteId = getStoreId(lojaExistente);

          setLojaAtivaId(lojaExistenteId);
          setLojaAtual(lojaExistente);

          if (savedTemplate && !looksLikeAiPreset(savedTemplate)) {
            setSelectedTemplate((current) => {
              /**
               * Se o carousel já resolveu um JSON estrutural válido, não deixe
               * um valor legado da loja sobrescrevê-lo. Só usamos o salvo quando
               * o estado ainda está vazio ou também está inválido.
               */
              if (current && !looksLikeAiPreset(current)) {
                return current;
              }

              return savedTemplate;
            });
          }

          setResult({
            id: lojaExistenteId,
            storeId: lojaExistenteId,
            html: getStoreHtml(lojaExistente),
            css: getStoreCss(lojaExistente),
            estilo: parseLayoutConfig(getStoreLayoutConfig(lojaExistente)),
            store: lojaExistente,
            tipo,
            businessType: resolveBusinessType(tipo, perfilData),
            tipoStore: storeTipo,
            pageKind: resolvedPageKind,
            usuarioId: user.id,
            userId: user.id,
          });
        }
      } catch (err) {
        console.error("Erro ao verificar dados:", err);
      } finally {
        setLoadingExistente(false);
      }
    };

    checkExistingStore();
  }, [user?.id, tipo, setResult]);

  const loadStoreProducts = useCallback(async (): Promise<any[]> => {
    if (!lojaAtivaId || pageKind !== "loja") {
      setStoreProducts([]);
      return [];
    }

    try {
      // Mesma rota pública já utilizada pelo PageViewer/ModalProdutosLoja.
      const response = await api.get(
        `/produtos/lojas/publicos/${lojaAtivaId}`,
      );

      const rawProducts = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.produtos)
          ? response.data.produtos
          : Array.isArray(response.data?.products)
            ? response.data.products
            : [];

      const products = rawProducts
        .filter(
          (product: any) =>
            product?.ativo !== false &&
            product?.ativo !== 0,
        )
        .map((product: any, index: number) =>
          normalizeProductForGeneration(product, index),
        );

      console.log("GERADOR - PRODUTOS DA LOJA", {
        lojaAtivaId,
        quantidade: products.length,
        produtos: products.map((product: any) => ({
          id: product?.id,
          name: product?.name,
          price: product?.price,
          imageUrl: product?.imageUrl,
        })),
      });

      setStoreProducts(products);
      return products;
    } catch (error) {
      console.error("Erro ao carregar produtos da loja:", error);
      setStoreProducts([]);
      return [];
    }
  }, [lojaAtivaId, pageKind]);

  useEffect(() => {
    void loadStoreProducts();
  }, [loadStoreProducts]);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data } = await api.get("/templates", {
          params: {
            tipo,
            tipoPagina: pageKind,
            tipoStore: pageKind,
            businessType: pageKind === "loja" ? "loja" : "servico",
            templateType: pageKind === "loja" ? "ecommerce" : "servico",
          },
        });

        const rawList = data?.templates || [];
        const list = filterTemplatesByPageKind(rawList, pageKind);

        setTemplates(list);

        if (list.length > 0) {
          setSelectedTemplate((current) => {
            const currentExists = list.some(
              (template, index) => resolveTemplateId(template, index) === current,
            );

            return currentExists ? current : resolveTemplateId(list[0], 0);
          });
        } else {
          setSelectedTemplate("");
        }
      } catch (error) {
        console.error("Erro ao buscar templates:", error);
        setTemplates([]);
        setSelectedTemplate("");
      }
    };

    fetchTemplates();
  }, [tipo, pageKind]);

 const isEcommerce = pageKind === "loja";

  // Novo fluxo: cada ação cria UMA opção real por vez.
  // O limite total continua controlado pelo projeto do Generator.
  const variationLimit = 1;

  const generatedLayouts = Array.isArray(generatorProject?.layouts)
    ? [...generatorProject.layouts]
        .filter((layout: any) => layout?.id && layout?.html)
        .sort(
          (a: any, b: any) =>
            Number(b?.generationNumber || 0) - Number(a?.generationNumber || 0),
        )
    : [];

  const latestGeneratedLayout = generatedLayouts[0] || null;
  const includedGenerations = Number(generatorProject?.includedGenerations || 0);
  const usedGenerations = Number(generatorProject?.usedGenerations || 0);
  const generationLimitReached =
    includedGenerations > 0 && usedGenerations >= includedGenerations;

  const handleOpenGeneratedLayout = (layout = latestGeneratedLayout) => {
    if (!generatorProjectId || !layout?.id) {
      toast.error("Ainda não encontramos a página criada.");
      return;
    }

    const previewUrl = `${String(GENERATOR_API_URL || "").replace(/\/$/, "")}/api/projects/${encodeURIComponent(
      generatorProjectId,
    )}/layouts/${encodeURIComponent(String(layout.id))}/preview`;

    window.open(previewUrl, "_blank", "noopener,noreferrer");
  };
  const businessType = pageKind === "loja" ? "loja" : "servico";
  const objectiveOptions = isEcommerce
    ? STORE_OBJECTIVE_OPTIONS
    : SERVICE_OBJECTIVE_OPTIONS;
  const hasCurrentLayout = Boolean(
    (lojaAtivaId || (lojaAtual && getStoreId(lojaAtual))) &&
    (lojaAtual ? storeHasReusableLayout(lojaAtual) || Boolean(getStoreHtml(lojaAtual)) : true),
  );

  const scrollCarousel = (
    ref: React.RefObject<HTMLDivElement>,
    direction: "left" | "right",
  ) => {
    const track = ref.current;
    if (!track) return;

    const scrollAmount = isMobile ? 260 : 320;

    track.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const updateAnswer = (field: keyof LandingAnswers, value: string) => {
    if (hasGeneratedAiVariations) return;

    setAnswers((current) => ({
      ...current,
      [field]: value,
    }));

    setAiVariations([]);
    setSelectedVariationIndex(0);
    setVariationStepReady(false);
    clearVariationsCache();
  };



  const invalidateGeneratedVariations = () => {
    setAiVariations([]);
    setSelectedVariationIndex(0);
    setVariationStepReady(false);
    clearVariationsCache();
  };

  const handleMaterialFiles = async (
    event: React.ChangeEvent<HTMLInputElement>,
    requestedType?: BusinessMaterialType,
  ) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";

    if (!selectedFiles.length) return;

    const remainingSlots = Math.max(20 - businessMaterials.length, 0);
    if (remainingSlots <= 0) {
      toast.info("Você já adicionou o limite de 20 materiais.");
      return;
    }

    if (!generatorReady || !generatorProjectId) {
      toast.info(
        generatorLoading
          ? "O Generator ainda está preparando o projeto. Tente novamente em instantes."
          : "O projeto do Generator ainda não está disponível para esta loja.",
      );
      return;
    }

    const accepted = selectedFiles.slice(0, remainingSlots);
    const invalid = accepted.find((file) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");

      if (!isImage && !isVideo) return true;
      if (isImage && file.size > 15 * 1024 * 1024) return true;

      // O endpoint atual do Generator usa limite de 15 MB por arquivo.
      // Quando o backend elevar o limite específico de vídeo, podemos
      // voltar a permitir 100 MB aqui sem alterar o restante do fluxo.
      if (isVideo && file.size > 15 * 1024 * 1024) return true;

      return false;
    });

    if (invalid) {
      toast.error(
        "Use imagens e vídeos de até 15 MB. Nesta etapa o upload já é feito diretamente no Generator.",
      );
      return;
    }

    if (
      requestedType &&
      requestedType !== "VIDEO" &&
      accepted.some((file) => file.type.startsWith("video/"))
    ) {
      toast.error("Envie vídeos somente na área de vídeos.");
      return;
    }

    if (
      requestedType === "VIDEO" &&
      accepted.some((file) => !file.type.startsWith("video/"))
    ) {
      toast.error("Nesta área, selecione somente vídeos.");
      return;
    }

    const imageMetadata = await Promise.all(
      accepted.map((file) => readImageDimensions(file)),
    );

    const uploadGroups = new Map<
      BusinessMaterialType,
      Array<{ file: File; originalIndex: number }>
    >();

    accepted.forEach((file, originalIndex) => {
      const resolvedType =
        requestedType ||
        inferMaterialType(
          {
            originalname: file.name,
            mimetype: file.type,
            size: file.size,
          },
          pageKind,
        );

      const current = uploadGroups.get(resolvedType) || [];
      current.push({ file, originalIndex });
      uploadGroups.set(resolvedType, current);
    });

    const loadingToast = toast.loading("Enviando materiais para o Generator...");

    try {
      setUploadingMaterials(true);

      const mapped: BusinessMaterial[] = [];

      for (const [businessType, entries] of uploadGroups.entries()) {
        const formData = new FormData();
        const generatorKind = toGeneratorAssetKind(businessType);

        entries.forEach(({ file }) => {
          formData.append("files", file);
        });

        formData.append("kind", generatorKind);

        console.log("GENERATOR - ENVIANDO ASSETS", {
          projectId: generatorProjectId,
          storeId: storageBusinessId,
          businessType,
          generatorKind,
          quantidade: entries.length,
          arquivos: entries.map(({ file }) => file.name),
        });

        const response = await generatorApi.post(
          `/api/projects/${generatorProjectId}/assets`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );

        const uploaded: GeneratorUploadedAsset[] = Array.isArray(
          response.data?.added,
        )
          ? response.data.added
          : [];

        if (uploaded.length !== entries.length) {
          throw new Error(
            `O Generator recebeu ${entries.length} arquivo(s), mas devolveu ${uploaded.length} asset(s).`,
          );
        }

        uploaded.forEach((asset, index) => {
          const entry = entries[index];
          const originalFile = entry?.file;
          const originalIndex = entry?.originalIndex ?? index;
          const metadata = imageMetadata[originalIndex] || {};
          const url = String(asset?.url || "").trim();

          if (!url) {
            throw new Error("O Generator devolveu um asset sem URL pública.");
          }

          mapped.push({
            id:
              String(asset?.id || "").trim() ||
              `${Date.now()}-${originalIndex}-${originalFile?.name || "material"}`,
            type: businessType,
            url,
            path: url,
            filename: originalFile?.name,
            originalName: asset?.originalName || originalFile?.name,
            mimetype: asset?.mimeType || originalFile?.type,
            size: originalFile?.size,
            ...metadata,
          });
        });

        console.log("GENERATOR - ASSETS ENVIADOS", {
          projectId: generatorProjectId,
          generatorKind,
          adicionados: uploaded.length,
          totalAssets: response.data?.totalAssets,
        });
      }

      mapped.sort((a, b) => {
        const indexA = accepted.findIndex(
          (file) => file.name === a.originalName || file.name === a.filename,
        );
        const indexB = accepted.findIndex(
          (file) => file.name === b.originalName || file.name === b.filename,
        );

        return indexA - indexB;
      });

      setBusinessMaterials((current) => [...current, ...mapped].slice(0, 20));
      invalidateGeneratedVariations();

      // Atualiza também o snapshot local do projeto com os assets recém-enviados.
      // A fonte definitiva continua sendo o Generator.
      setGeneratorProject((current: any) => {
        if (!current) return current;

        const nextAssets = [
          ...(Array.isArray(current?.assets) ? current.assets : []),
          ...mapped.map((material) => ({
            id: material.id,
            kind: toGeneratorAssetKind(material.type),
            url: material.url,
            originalName: material.originalName,
            mimeType: material.mimetype,
          })),
        ];

        return {
          ...current,
          assets: nextAssets,
        };
      });

      toast.update(loadingToast, {
        render: `${mapped.length} material${mapped.length > 1 ? "is" : ""} enviado${mapped.length > 1 ? "s" : ""} ao Generator.`,
        type: "success",
        isLoading: false,
        autoClose: 1800,
      });
    } catch (error: any) {
      console.error("GENERATOR - ERRO AO ENVIAR ASSETS", {
        projectId: generatorProjectId,
        storeId: storageBusinessId,
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });

      toast.update(loadingToast, {
        render:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Não foi possível enviar os materiais para o Generator.",
        type: "error",
        isLoading: false,
        autoClose: 3600,
      });
    } finally {
      setUploadingMaterials(false);
    }
  };

  const openMaterialPicker = (type: BusinessMaterialType) => {
    materialInputRefs.current[type]?.click();
  };

  const resolvedBrandPalette = buildBrandPalette(
    brandPaletteMode,
    brandColors,
  );

  const updateBrandPaletteMode = (mode: BrandPaletteMode) => {
    if (hasGeneratedAiVariations) return;

    setBrandPaletteMode(mode);
    invalidateGeneratedVariations();
  };

  const updateBrandColor = (
    field: keyof BrandColors,
    value: string,
  ) => {
    if (hasGeneratedAiVariations) return;

    setBrandColors((current) => ({
      ...current,
      [field]: value,
    }));

    invalidateGeneratedVariations();
  };



  const updateHeroCopy = (
    field: keyof HeroCopyOverrides,
    value: string,
  ) => {
    if (hasGeneratedAiVariations) return;

    setHeroCopy((current) => ({
      ...current,
      [field]: value,
    }));

    invalidateGeneratedVariations();
  };

  const removeMaterial = async (materialId: string) => {
    const assetExistsInGenerator = Array.isArray(generatorProject?.assets)
      ? generatorProject.assets.some(
          (asset: any) => String(asset?.id || "").trim() === materialId,
        )
      : false;

    try {
      if (assetExistsInGenerator) {
        if (!generatorReady || !generatorProjectId) {
          toast.error("O projeto do Generator ainda não está disponível.");
          return;
        }

        console.log("GENERATOR - REMOVENDO ASSET", {
          projectId: generatorProjectId,
          storeId: storageBusinessId,
          assetId: materialId,
        });

        await generatorApi.delete(
          `/api/projects/${generatorProjectId}/assets/${encodeURIComponent(
            materialId,
          )}`,
        );

        setGeneratorProject((current: any) => {
          if (!current) return current;

          return {
            ...current,
            assets: Array.isArray(current?.assets)
              ? current.assets.filter(
                  (asset: any) =>
                    String(asset?.id || "").trim() !== materialId,
                )
              : [],
          };
        });
      }

      setBusinessMaterials((current) =>
        current.filter((item) => item.id !== materialId),
      );
      invalidateGeneratedVariations();
    } catch (error: any) {
      console.error("GENERATOR - ERRO AO REMOVER ASSET", {
        projectId: generatorProjectId,
        storeId: storageBusinessId,
        assetId: materialId,
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });

      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Não foi possível remover o material do Generator.",
      );
    }
  };

  const validateAnswers = () => {
    if (hasGeneratedAiVariations) return true;

    if (!selectedTemplate) {
      toast.error("Ainda não encontramos um modelo base para sua página.");
      return false;
    }

    if (!descricao.trim() && !answers.destaque.trim()) {
      toast.error(
        "Conte em poucas palavras o que seu negócio faz ou o que deseja divulgar.",
      );
      return false;
    }

    return true;
  };

  const handleStartProcess = () => {
    if (hasGeneratedAiVariations) {
      toast.info("As variações deste perfil já foram geradas. Escolha uma delas ou use o layout atual.");
      return;
    }

    if (!validateAnswers()) return;

    if (isEcommerce) {
      setShowProductCheck(true);
      return;
    }

    handleGenerateVariations();
  };

  const handleGenerateVariations = async () => {
    setShowProductCheck(false);

    if (hasGeneratedAiVariations) {
      toast.info("As variações deste perfil já foram geradas. Não é possível gerar novamente.");
      return;
    }

    if (!validateAnswers()) return;

    const loadingToast = toast.loading(
      `A IA está criando ${variationLimit} variação${variationLimit > 1 ? "ões" : ""} profissional${variationLimit > 1 ? "is" : ""}...`,
    );

    try {
      setGeneratingVariations(true);

      const descricaoFinal = buildDescricaoFromAnswers(answers, descricao);

      // Busca novamente no momento da geração para incluir inclusive produtos
      // que acabaram de ser cadastrados no modal.
      const productsForGeneration =
        pageKind === "loja"
          ? await loadStoreProducts()
          : [];

      const res = await api.post("/generate-variations", {
        usuarioId: user?.id,
        userId: user?.id,
        storeId: lojaAtivaId,
        lojaId: lojaAtivaId,

        tipo,
        pageKind,
        tipoStore: pageKind,
        businessType,

        // NOVO — ajuda o backend a escolher o JSON-base correto
        categoryName:
          perfil?.categoriaNome ||
          perfil?.categoria_nome ||
          perfil?.categoria?.nome ||
          perfil?.categoria ||
          perfil?.ramo ||
          "",

        businessSegment:
          perfil?.segmento ||
          perfil?.businessSegment ||
          perfil?.ramo ||
          perfil?.categoriaNome ||
          perfil?.categoria_nome ||
          perfil?.categoria?.nome ||
          perfil?.categoria ||
          "",

        templateType: pageKind === "loja" ? "ecommerce" : "servico",

        templateName: selectedTemplate,
        layoutEstruturaId: selectedTemplate,

        answers,

        products: productsForGeneration,
        produtos: productsForGeneration,

        businessMaterials,
        landingMaterials: businessMaterials,

        brandPaletteMode,
        brandColors:
          brandPaletteMode === "CUSTOM"
            ? brandColors
            : undefined,

        colors: resolvedBrandPalette,
        copy: buildHeroCopyPayload(heroCopy),

        serviceDesignBriefs:
          pageKind === "servico"
            ? SERVICE_DESIGN_BRIEFS.slice(
              0,
              Math.max(1, variationLimit),
            )
            : undefined,

        preferredServiceDesignBriefId:
          pageKind === "servico"
            ? SERVICE_DESIGN_BRIEFS[0].id
            : undefined,

        descricao: descricaoFinal,
        descricaoDoCliente: descricaoFinal,
        businessDescription: descricaoFinal,

        limit: variationLimit,
        plan: perfil?.plano || user?.plano || "BASICO",
        condominioId: (user as any)?.condominio_id,
      });

      const rawVariations = Array.isArray(res.data?.variations)
        ? res.data.variations
        : Array.isArray(res.data?.data?.variations)
          ? res.data.data.variations
          : [];

      const responseLayoutBase =
        res.data?.layoutBase ||
        res.data?.data?.layoutBase ||
        null;

      const responseGenerationMode =
        res.data?.generationMode ||
        res.data?.data?.generationMode ||
        "";

      /**
       * Toda variação precisa carregar a referência do JSON estrutural que a
       * originou. Isso evita perder o "template pai" quando o backend retorna
       * apenas preset/layoutMode da variação.
       */
      const structuralTemplate =
        selectedTemplate && !looksLikeAiPreset(selectedTemplate)
          ? selectedTemplate
          : "";

      const variations = rawVariations.map(
        (variation: LandingAiVariation, index: number) => {
          const variationTemplate = [
            variation?.templateName,
            variation?.baseTemplateName,
            variation?.parentTemplateName,
            variation?.layoutEstruturaId,
            variation?.templateId,
          ]
            .map((item) => String(item || "").trim())
            .find((item) => item && !looksLikeAiPreset(item));

          const parentTemplate = variationTemplate || structuralTemplate;

          const resolvedLayoutBaseId =
            variation?.layoutBaseId ||
            responseLayoutBase?.id ||
            "";

          const resolvedLayoutBaseName =
            variation?.layoutBaseName ||
            responseLayoutBase?.name ||
            "";

          const resolvedSegmentFamily =
            variation?.segmentFamily ||
            responseLayoutBase?.segmentFamily ||
            "";

          const resolvedGenerationMode =
            variation?.generationMode ||
            responseGenerationMode ||
            (resolvedLayoutBaseId
              ? "layout-base-ai"
              : "variation-generated");

          const isLayoutBaseAiVariation =
            pageKind === "servico" &&
            (
              resolvedGenerationMode === "layout-base-ai" ||
              Boolean(resolvedLayoutBaseId)
            );

          const serviceDesignBrief =
            pageKind === "servico" && !isLayoutBaseAiVariation
              ? (
                variation?.serviceDesignBrief ||
                SERVICE_DESIGN_BRIEFS.find(
                  (brief) => brief.id === variation?.serviceDesignBriefId,
                ) ||
                getServiceDesignBrief(index)
              )
              : undefined;

          return {
            ...variation,

            generationMode: resolvedGenerationMode,

            layoutBaseId:
              resolvedLayoutBaseId || undefined,

            layoutBaseName:
              resolvedLayoutBaseName || undefined,

            segmentFamily:
              resolvedSegmentFamily || undefined,

            layoutBase:
              variation?.layoutBase ||
              responseLayoutBase ||
              undefined,

            ...(serviceDesignBrief
              ? {
                  serviceDesignBrief,
                  serviceDesignBriefId: serviceDesignBrief.id,
                  layoutMode: serviceDesignBrief.id,
                  visualDirection:
                    variation?.visualDirection ||
                    serviceDesignBrief.description,
                }
              : {}),

            ...(parentTemplate
              ? {
                  templateName: parentTemplate,
                  baseTemplateName: parentTemplate,
                  parentTemplateName: parentTemplate,
                  layoutEstruturaId: parentTemplate,
                }
              : {}),
          };
        },
      );

      console.log("GERADOR - VARIAÇÕES RECEBIDAS", {
        quantidade: variations.length,
        variacoes: variations.map((variation: any, index: number) => ({
          index,
          id: variation?.id,
          nome: variation?.name || variation?.nome,
          layoutMode: variation?.layoutMode,
          preset: variation?.preset,
          serviceDesignBriefId: variation?.serviceDesignBriefId,
          templateName: variation?.templateName,
          baseTemplateName: variation?.baseTemplateName,
          temHtml: Boolean(variation?.html),
          tamanhoHtml: String(variation?.html || "").length,
          inicioHtml: String(variation?.html || "").slice(0, 250),
        })),
      });

      if (!variations.length) {
        throw new Error("Nenhuma variação foi gerada.");
      }

      const firstVariation = variations[0];

      setAiVariations([firstVariation]);
      setSelectedVariationIndex(0);
      setVariationStepReady(false);
      saveVariationsCache([firstVariation], 0, answers, descricao, selectedTemplate);
      saveGeneratedOnceCache([firstVariation], 0, answers, descricao, selectedTemplate);
      setHasGeneratedAiVariations(true);

      toast.update(loadingToast, {
        render: "Direção visual definida. Agora estamos montando sua página...",
        type: "info",
        isLoading: true,
        autoClose: false,
      });

      await handleGenerateFinal(firstVariation, 0);

      toast.dismiss(loadingToast);
    } catch (err: any) {
      console.error("Erro ao gerar variações:", err);

      toast.update(loadingToast, {
        render:
          err?.response?.data?.message ||
          err?.message ||
          "Erro ao gerar variações com IA.",
        type: "error",
        isLoading: false,
        autoClose: 3500,
      });
    } finally {
      setGeneratingVariations(false);
    }
  };

  const startBuildProgress = () => {
    setBuildProgressOpen(true);
    setBuildProgressStep(0);

    buildSteps.forEach((_, index) => {
      setTimeout(() => {
        setBuildProgressStep(index);
      }, index * 450);
    });
  };

  async function handleGenerateFinal(
    variationOverride?: LandingAiVariation,
    variationIndexOverride?: number,
  ) {
    const effectiveVariationIndex =
      typeof variationIndexOverride === "number"
        ? variationIndexOverride
        : selectedVariationIndex;

    const selectedVariation =
      variationOverride || aiVariations[effectiveVariationIndex];



    if (!selectedVariation) {
      toast.error("Gere e selecione uma variação antes de finalizar.");
      return;
    }

    if (!generatorReady || !generatorProjectId) {
      toast.error(
        "O projeto do Generator ainda não está pronto. Aguarde a sincronização da loja.",
      );

      console.error("GENERATOR - PROJETO NÃO DISPONÍVEL PARA GERAR", {
        storeId: storageBusinessId,
        projectId: generatorProjectId,
        ready: generatorReady,
      });

      return;
    }

    const backendVariationIndex = effectiveVariationIndex + 1;

    console.log("GERADOR - VARIAÇÃO ESCOLHIDA PARA FINALIZAR", {
      effectiveVariationIndex,
      backendVariationIndex,
      id: selectedVariation?.id,
      nome: selectedVariation?.name || selectedVariation?.nome,
      layoutMode: selectedVariation?.layoutMode,
      preset: selectedVariation?.preset,
      templateName: selectedVariation?.templateName,
      layoutEstruturaId: selectedVariation?.layoutEstruturaId,
      generationMode: selectedVariation?.generationMode,
      layoutBaseId: selectedVariation?.layoutBaseId,
      layoutBaseName: selectedVariation?.layoutBaseName,
      segmentFamily: selectedVariation?.segmentFamily,
      selectedTemplate,
      temHtmlAntigoIgnorado: Boolean(selectedVariation?.html),
      tamanhoHtmlAntigoIgnorado: String(selectedVariation?.html || "").length,
    });

    /**
     * Última barreira defensiva:
     * se selectedTemplate foi contaminado por dado legado, tenta recuperar
     * diretamente o JSON estrutural atualmente disponível no carousel.
     */
    const fallbackTemplateFromCarousel =
      templates
        .map((template, index) => resolveTemplateId(template, index))
        .find((templateId) => templateId && !looksLikeAiPreset(templateId)) ||
      "";

    const templatePai = resolveTemplatePaiFromVariation(
      selectedVariation,
      !looksLikeAiPreset(selectedTemplate)
        ? selectedTemplate
        : fallbackTemplateFromCarousel,
    );

    if (!templatePai) {
      toast.error(
        "Template pai não encontrado. A variação ficou sem o nome do JSON base.",
      );

      console.error("GERADOR - TEMPLATE PAI NÃO RESOLVIDO", {
        selectedTemplate,
        fallbackTemplateFromCarousel,
        templatesDisponiveis: templates.map((template, index) => ({
          index,
          id: template?.id,
          nome: template?.nome || template?.name,
          categoria: template?.categoria,
          resolvedTemplateId: resolveTemplateId(template, index),
        })),
        selectedVariation,
      });

      return;
    }

    const variationsForCache = variationOverride
      ? [variationOverride]
      : aiVariations;

    saveVariationsCache(
      variationsForCache,
      variationOverride ? 0 : effectiveVariationIndex,
      answers,
      descricao,
      templatePai,
    );

    const loadingToast = toast.loading(
      "Montando sua landing profissional com a variação escolhida...",
    );

    startBuildProgress();

    try {
      const storeTipo = pageKind;
      const descricaoFinal = buildDescricaoFromAnswers(answers, descricao);

      const productsForGeneration =
        pageKind === "loja"
          ? await loadStoreProducts()
          : [];

      const heroCopyPayload = buildHeroCopyPayload(heroCopy);

      const selectedGenerationMode =
        selectedVariation?.generationMode ||
        (selectedVariation?.layoutBaseId
          ? "layout-base-ai"
          : "variation-generated");

      const isLayoutBaseAiVariation =
        pageKind === "servico" &&
        (
          selectedGenerationMode === "layout-base-ai" ||
          Boolean(selectedVariation?.layoutBaseId)
        );

      const selectedServiceDesignBrief =
        pageKind === "servico" && !isLayoutBaseAiVariation
          ? (
            selectedVariation?.serviceDesignBrief ||
            SERVICE_DESIGN_BRIEFS.find(
              (brief) =>
                brief.id === selectedVariation?.serviceDesignBriefId
            ) ||
            getServiceDesignBrief(effectiveVariationIndex)
          )
          : undefined;

      console.log("GERADOR - DESIGN BRIEF FINAL", {
        pageKind,
        effectiveVariationIndex,
        generationMode: selectedGenerationMode,
        layoutBaseId: selectedVariation?.layoutBaseId,
        layoutBaseName: selectedVariation?.layoutBaseName,
        segmentFamily: selectedVariation?.segmentFamily,
        serviceDesignBriefId: selectedServiceDesignBrief?.id,
        layoutFamily: selectedServiceDesignBrief?.layoutFamily,
        hero: selectedServiceDesignBrief?.hero?.composition,
        services: selectedServiceDesignBrief?.services?.layout,
        about: selectedServiceDesignBrief?.about?.layout,
        testimonials: selectedServiceDesignBrief?.testimonials?.layout,
        finalCta: selectedServiceDesignBrief?.finalCta?.layout,
      });

      const selectedVariationPayload = {
        ...selectedVariation,

        copy: {
          ...(selectedVariation?.copy || {}),
          ...heroCopyPayload,
        },
        ...(heroCopy.heroTitle.trim()
          ? { heroTitle: heroCopy.heroTitle.trim() }
          : {}),
        ...(heroCopy.heroSubtitle.trim()
          ? { heroSubtitle: heroCopy.heroSubtitle.trim() }
          : {}),
        ...(heroCopy.primaryCta.trim()
          ? { primaryCta: heroCopy.primaryCta.trim() }
          : {}),
        ...(heroCopy.secondaryCta.trim()
          ? { secondaryCta: heroCopy.secondaryCta.trim() }
          : {}),

        colors:
          resolvedBrandPalette ||
          selectedVariation?.colors,

        templateName: templatePai,
        layoutEstruturaId: templatePai,
        baseTemplateName: templatePai,

        ...(selectedServiceDesignBrief
          ? {
            serviceDesignBrief: selectedServiceDesignBrief,
            serviceDesignBriefId: selectedServiceDesignBrief.id,
            layoutMode: selectedServiceDesignBrief.id,
          }
          : {}),

        effectiveVariationIndex,
        variationIndex: backendVariationIndex,
        index: backendVariationIndex,

        html: "",
        generatedHtml: "",
        htmlGerado: "",
        useAiRenderedHtml: false,
      };

      // ============================================================
      // ETAPA 3 — GERAÇÃO FINAL PELO NOVO SITE GENERATOR
      //
      // A escolha feita no GranConecta continua sendo respeitada.
      // Enviamos o briefing atual em generationContext, enquanto o
      // Generator mantém o projeto e os assets persistidos por storeId.
      // ============================================================

      const generatorBusinessName = String(
        lojaAtual?.name ||
          lojaAtual?.nome ||
          lojaAtual?.storeName ||
          generatorProject?.business?.name ||
          user?.name ||
          "Negócio GranConecta",
      ).trim();

      const generatorBusinessCategory = String(
        lojaAtual?.categoriaNome ||
          lojaAtual?.categoria_nome ||
          lojaAtual?.categoria?.nome ||
          lojaAtual?.categoria ||
          lojaAtual?.category ||
          perfil?.categoriaNome ||
          perfil?.categoria_nome ||
          perfil?.categoria?.nome ||
          perfil?.categoria ||
          perfil?.ramo ||
          generatorProject?.business?.category ||
          "",
      ).trim();

      const generatorProducts = productsForGeneration.map((product: any) => ({
        name: String(product?.name || product?.nome || product?.titulo || "").trim(),
        description: String(
          product?.description || product?.descricao || product?.subtitulo || "",
        ).trim() || undefined,
        price:
          product?.price ?? product?.preco ?? product?.valor ?? undefined,
        imageUrl:
          product?.imageUrl ||
          product?.imagem_url ||
          product?.imagemUrl ||
          product?.image_url ||
          undefined,
      })).filter((product: any) => product.name);

      const generationContext = {
        source: "GRANCONECTA_GERADOR",
        storeId: lojaAtivaId || storageBusinessId,
        userId: user?.id,
        pageKind,
        businessType,

        business: {
          name: generatorBusinessName,
          category: generatorBusinessCategory,
          businessType,
          objective:
            String(answers?.objetivo || "").trim() ||
            String(selectedVariation?.objective || "").trim() ||
            descricaoFinal,
          preferredStyle:
            String(
              selectedVariation?.name ||
                selectedVariation?.nome ||
                selectedVariation?.visualDirection ||
                selectedVariation?.preset ||
                "",
            ).trim() || undefined,
          description: descricaoFinal,
          products: generatorProducts,

          // A rota /generate incorpora generationContext.business ao DesignProject.
          // Por isso a paleta precisa viajar também dentro de business; deixar as
          // cores somente em generationContext.design não as tornava visíveis ao
          // AIPageDesignerService.
          brandPaletteMode,
          brandPalette: resolvedBrandPalette || undefined,
        },

        answers,

        design: {
          templateName: templatePai,
          layoutEstruturaId: templatePai,
          generationMode: selectedGenerationMode,
          layoutBaseId: selectedVariation?.layoutBaseId,
          layoutBaseName: selectedVariation?.layoutBaseName,
          segmentFamily: selectedVariation?.segmentFamily,
          effectiveVariationIndex,
          variationIndex: backendVariationIndex,
          preset: selectedVariation?.preset,
          selectedVariation: selectedVariationPayload,
          serviceDesignBrief: selectedServiceDesignBrief,
          serviceDesignBriefId: selectedServiceDesignBrief?.id,
          brandPaletteMode,
          brandColors:
            brandPaletteMode === "CUSTOM" ? brandColors : undefined,
          colors:
            resolvedBrandPalette || selectedVariation?.colors,
          copy: {
            ...(selectedVariation?.copy || {}),
            ...heroCopyPayload,
          },
        },
      };

      console.log("GENERATOR - SOLICITANDO GERAÇÃO FINAL", {
        projectId: generatorProjectId,
        storeId: lojaAtivaId || storageBusinessId,
        projectType: generatorProject?.projectType,
        effectiveVariationIndex,
        templatePai,
        businessName: generatorBusinessName,
        products: generatorProducts.length,
        brandPaletteMode,
        brandPalette: resolvedBrandPalette,
        assets: Array.isArray(generatorProject?.assets)
          ? generatorProject.assets.length
          : undefined,
      });

      // ============================================================
      // ETAPA 3B — RECUPERAÇÃO SEGURA APÓS TIMEOUT / ERRO DE REDE
      //
      // A geração pode terminar e ser persistida no Generator mesmo
      // que o navegador perca a resposta HTTP. Antes do POST guardamos
      // os layouts conhecidos. Se houver timeout/erro de rede, buscamos
      // o projeto novamente e reaproveitamos o layout recém-criado.
      // Isso evita que o usuário clique em Gerar novamente e consuma
      // uma geração duplicada.
      // ============================================================

      const knownLayoutsBeforeGeneration = Array.isArray(generatorProject?.layouts)
        ? generatorProject.layouts
        : [];

      const knownLayoutIdsBeforeGeneration = new Set(
        knownLayoutsBeforeGeneration
          .map((layout: any) => String(layout?.id || "").trim())
          .filter(Boolean),
      );

      const maxGenerationBeforeGeneration = knownLayoutsBeforeGeneration.reduce(
        (max: number, layout: any) => {
          const value = Number(layout?.generationNumber || 0);
          return Number.isFinite(value) ? Math.max(max, value) : max;
        },
        0,
      );

      let generationResponseData: any = null;

      try {
        const generationResponse = await generatorApi.post(
          `/api/projects/${generatorProjectId}/generate`,
          { generationContext },
        );

        generationResponseData = generationResponse.data;
      } catch (generationError: any) {
        const errorMessage = String(generationError?.message || "").toLowerCase();
        const errorCode = String(generationError?.code || "").toUpperCase();

        const isTimeout =
          errorCode === "ECONNABORTED" ||
          errorCode === "ETIMEDOUT" ||
          errorMessage.includes("timeout");

        const isNetworkError =
          !generationError?.response &&
          (errorCode === "ERR_NETWORK" ||
            errorMessage.includes("network error") ||
            errorMessage.includes("failed to fetch") ||
            errorMessage.includes("load failed"));

        if (!isTimeout && !isNetworkError) {
          throw generationError;
        }

        console.warn(
          "GENERATOR - RESPOSTA PERDIDA, TENTANDO RECUPERAR GERAÇÃO",
          {
            projectId: generatorProjectId,
            storeId: lojaAtivaId || storageBusinessId,
            code: generationError?.code,
            message: generationError?.message,
            maxGenerationBeforeGeneration,
          },
        );

        const recoveryResponse = await generatorApi.get(
          `/api/projects/${generatorProjectId}`,
        );

        const recoveredProject = recoveryResponse.data || null;
        const recoveredLayouts = Array.isArray(recoveredProject?.layouts)
          ? recoveredProject.layouts
          : [];

        const recoveredLayout = [...recoveredLayouts]
          .filter((layout: any) => {
            const layoutId = String(layout?.id || "").trim();
            const generationNumber = Number(layout?.generationNumber || 0);

            return (
              (layoutId && !knownLayoutIdsBeforeGeneration.has(layoutId)) ||
              generationNumber > maxGenerationBeforeGeneration
            );
          })
          .sort(
            (a: any, b: any) =>
              Number(b?.generationNumber || 0) -
              Number(a?.generationNumber || 0),
          )[0];

        if (!recoveredLayout?.id || !recoveredLayout?.html) {
          console.error(
            "GENERATOR - GERAÇÃO NÃO ENCONTRADA APÓS ERRO DE REDE",
            {
              projectId: generatorProjectId,
              layoutsAntes: knownLayoutsBeforeGeneration.length,
              layoutsDepois: recoveredLayouts.length,
              maxGenerationBeforeGeneration,
              usedGenerations: recoveredProject?.usedGenerations,
            },
          );

          throw generationError;
        }

        const includedGenerations = Number(
          recoveredProject?.includedGenerations || 0,
        );
        const usedGenerations = Number(recoveredProject?.usedGenerations || 0);

        generationResponseData = {
          projectId: recoveredProject?.id || generatorProjectId,
          layout: recoveredLayout,
          generations: {
            included: includedGenerations,
            used: usedGenerations,
            remaining: Math.max(0, includedGenerations - usedGenerations),
          },
          recoveredAfterNetworkError: true,
        };

        setGeneratorProject(recoveredProject);

        console.log(
          "GENERATOR - GERAÇÃO RECUPERADA APÓS ERRO DE REDE",
          {
            projectId: generatorProjectId,
            layoutId: recoveredLayout.id,
            generationNumber: recoveredLayout.generationNumber,
            usedGenerations,
            includedGenerations,
          },
        );
      }

      const generatorLayout = generationResponseData?.layout || null;

      if (!generatorLayout?.id) {
        throw new Error("O Generator não retornou o ID do layout.");
      }

      if (!generatorLayout?.html) {
        throw new Error("O Generator não retornou HTML para a landing.");
      }

      const resolvedStore = lojaAtual || null;

      const resolvedStoreId =
        lojaAtivaId ||
        storageBusinessId ||
        generatorProject?.externalStoreId ||
        null;

      const resolvedHtml = String(generatorLayout.html || "");
      const resolvedCss = String(generatorLayout.css || "");

      console.log("GENERATOR - LAYOUT FINAL RECEBIDO", {
        projectId: generatorProjectId,
        layoutId: generatorLayout.id,
        generationNumber: generatorLayout.generationNumber,
        effectiveVariationIndex,
        backendVariationIndex,
        templatePai,
        generations: generationResponseData?.generations,
        manifest: generatorLayout.manifest,
        tamanhoHtml: resolvedHtml.length,
        tamanhoCss: resolvedCss.length,
        inicioHtml: resolvedHtml.slice(0, 500),
      });

      setGeneratorProject((current: any) => {
        if (!current) return current;

        const currentLayouts = Array.isArray(current?.layouts)
          ? current.layouts
          : [];

        const hasLayout = currentLayouts.some(
          (layout: any) => String(layout?.id || "") === String(generatorLayout.id),
        );

        return {
          ...current,
          layouts: hasLayout
            ? currentLayouts
            : [...currentLayouts, generatorLayout],
          usedGenerations:
            generationResponseData?.generations?.used ?? current?.usedGenerations,
          includedGenerations:
            generationResponseData?.generations?.included ?? current?.includedGenerations,
          activeLayoutId: generatorLayout.id,
        };
      });

      const novoResultado = {
        ...generationResponseData,

        html: resolvedHtml,
        css: resolvedCss,
        pageHtmlDraft: resolvedHtml,
        pageCssDraft: resolvedCss,

        // O Generator devolve um novo layout ainda não publicado.
        // A publicação no GranConecta será tratada pela etapa de approve/publish-draft.
        generatorProjectId,
        generatorLayoutId: generatorLayout.id,
        generationNumber: generatorLayout.generationNumber,
        generations: generationResponseData?.generations,
        manifest: generatorLayout.manifest,
        source: "GENERATOR",

        id: resolvedStoreId,
        storeId: resolvedStoreId,
        store: resolvedStore,

        usuarioId: user?.id,
        userId: user?.id,
        tipo,
        tipoStore: storeTipo,
        businessType,

        templateName: templatePai,
        layoutEstruturaId: templatePai,

        businessDescription: descricaoFinal,
        descricao: descricaoFinal,
        descricaoDoCliente: descricaoFinal,
        answers,

        brandPaletteMode,
        brandColors:
          brandPaletteMode === "CUSTOM" ? brandColors : undefined,
        colors:
          resolvedBrandPalette ||
          selectedVariation?.colors,

        aiVariation: selectedVariationPayload,
        selectedVariation: selectedVariationPayload,
        serviceDesignBrief: selectedServiceDesignBrief,
        serviceDesignBriefId: selectedServiceDesignBrief?.id,

        effectiveVariationIndex,
        variationIndex: backendVariationIndex,

        generatedHtml: "",
        htmlGerado: "",

        variationPreset: selectedVariation?.preset,
        preset: selectedVariation?.preset,
        pageKind,
        templateType: pageKind === "loja" ? "ecommerce" : "servico",

        aiData: {
          ...(generationResponseData?.aiData || {}),
          ...(generationResponseData?.landingData || {}),

          storeId: resolvedStoreId,
          id: resolvedStoreId,
          store: resolvedStore,

          usuarioId: user?.id,
          userId: user?.id,
          tipo,
          tipoStore: storeTipo,
          businessType,

          templateName: templatePai,
          layoutEstruturaId: templatePai,

          businessDescription: descricaoFinal,
          descricao: descricaoFinal,
          descricaoDoCliente: descricaoFinal,
          answers,

          brandPaletteMode,
          brandColors:
            brandPaletteMode === "CUSTOM" ? brandColors : undefined,
          colors:
            resolvedBrandPalette ||
            selectedVariation?.colors,

          aiVariation: selectedVariationPayload,
          selectedVariation: selectedVariationPayload,
          serviceDesignBrief: selectedServiceDesignBrief,
          serviceDesignBriefId: selectedServiceDesignBrief?.id,

          effectiveVariationIndex,
          variationIndex: backendVariationIndex,

          generatedHtml: "",
          html: resolvedHtml,
          css: resolvedCss,

          generatorProjectId,
          generatorLayoutId: generatorLayout.id,
          generationNumber: generatorLayout.generationNumber,
          generations: generationResponseData?.generations,
          manifest: generatorLayout.manifest,
          source: "GENERATOR",

          variationPreset: selectedVariation?.preset,
          preset: selectedVariation?.preset,
          pageKind,
          templateType: pageKind === "loja" ? "ecommerce" : "servico",

          renderer: "SITE_GENERATOR",
          family: generatorLayout.manifest?.creativeDirection,
          visualContext: generatorLayout.manifest,
          sections: generatorLayout.manifest?.sectionNarrative,
          actions: undefined,

          store_name:
            generationResponseData?.aiData?.store_name ||
            resolvedStore?.name ||
            generationResponseData?.store_name ||
            user?.name,

          store_slug:
            generationResponseData?.aiData?.store_slug ||
            resolvedStore?.slug ||
            generationResponseData?.store_slug,

          store_whatsapp:
            generationResponseData?.aiData?.store_whatsapp ||
            resolvedStore?.telefone_whatsapp ||
            generationResponseData?.store_whatsapp,
        },
      };

      setSelectedTemplate(templatePai);
      setResult(novoResultado);

      toast.update(loadingToast, {
        render: "Layout criado pelo novo Generator e aberto em prévia!",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });

      navigate("/preview", {
        state: novoResultado,
      });
    } catch (err: any) {
      console.error("Erro na geração final:", err);

      toast.update(loadingToast, {
        render:
          err?.response?.data?.message ||
          err?.message ||
          "Erro ao gerar site. Verifique sua descrição.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setTimeout(() => {
        setBuildProgressOpen(false);
      }, 700);
    }
  };


  const renderSelectChips = (
    field: keyof LandingAnswers,
    options: string[],
  ) => {
    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          marginTop: "10px",
        }}
      >
        {options.map((option) => {
          const selected = answers[field] === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() => updateAnswer(field, option)}
              style={{
                border: selected ? "1px solid #60a5fa" : "1px solid #334155",
                background: selected ? "#1d4ed8" : "#0f172a",
                color: selected ? "#ffffff" : "#cbd5e1",
                borderRadius: "999px",
                padding: "10px 14px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 800,
                boxShadow: selected
                  ? "0 10px 24px rgba(37,99,235,.32)"
                  : "none",
                transition: "all .2s ease",
              }}
            >
              {option}
            </button>
          );
        })}
      </div>
    );
  }

  if (loadingExistente) {
    return (
      <div
        className="gerador-container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "80vh",
        }}
      >
        <div className="loader-simples"></div>
        <p style={{ color: "white", marginLeft: "10px" }}>
          Sincronizando dados...
        </p>
      </div>
    );
  }

  async function handleUseCurrentPublishedLayout() {
    const currentStoreId = lojaAtivaId || getStoreId(lojaAtual);

    if (!currentStoreId || !lojaAtual || !storeHasReusableLayout(lojaAtual)) {
      toast.error("Nenhum layout existente foi encontrado para esta loja.");
      return;
    }

    try {
      let storeData = lojaAtual;

      try {
        const response = await api.get(`/lojas/publica/id/${currentStoreId}`);
        storeData = response.data || lojaAtual;
      } catch (fetchErr) {
        console.warn("Não foi possível buscar a loja por ID. Usando dados já carregados.", fetchErr);
      }

      const htmlAtual = getStoreHtml(storeData);
      const cssAtual = getStoreCss(storeData);

      if (!htmlAtual) {
        toast.error("Essa loja tem registro salvo, mas ainda não possui HTML de layout para abrir no editor.");
        return;
      }

      navigate("/preview", {
        state: {
          html: htmlAtual,
          css: cssAtual,
          pageHtmlDraft: htmlAtual,
          pageCssDraft: cssAtual,
          aiData: storeData,
          store: storeData,
          id: currentStoreId,
          storeId: currentStoreId,
          usuarioId: user?.id,
          userId: user?.id,
          tipo,
          tipoStore: pageKind,
          businessType,
          pageKind,
          source: "CURRENT_LAYOUT",
        },
      });
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível abrir o layout atual.");
    }
  }

  const variationInfoBadgeStyle: React.CSSProperties = {
    minHeight: "34px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "12px",
    background: "rgba(30,41,59,.86)",
    border: "1px solid rgba(148,163,184,.18)",
    color: "#cbd5e1",
    fontSize: "11px",
    fontWeight: 850,
    textAlign: "center",
  };


  const previewActionPillStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "34px",
    padding: "0 12px",
    borderRadius: "999px",
    background: "rgba(255,255,255,.75)",
    border: "1px solid rgba(255,255,255,.85)",
    color: "#0f172a",
    fontSize: "11px",
    fontWeight: 950,
  };

  return (
    <div className="gerador-container">
      <section className="gerador-section">
        <header className="gerador-header">
          <h1>
            GranConecta <span className="ai-badge">AI</span>
          </h1>
          <p>
            {hasGeneratedAiVariations
              ? "Sua página já foi criada. Você pode abri-la ou voltar às configurações para criar outra opção."
              : "Conte um pouco sobre seu negócio, envie seus materiais e nós montamos sua página profissional para você."}
          </p>
        </header>

        <div className="gerador-form">
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "24px",
            }}
          >
            <button
              type="button"
              onClick={handleUseCurrentPublishedLayout}
              disabled={!hasCurrentLayout}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              style={{
                opacity: hasCurrentLayout ? 1 : 0.5,
                cursor: hasCurrentLayout ? "pointer" : "not-allowed",
              }}
            >
              Abrir minha página atual
            </button>
          </div>

          {!hasGeneratedAiVariations && (
            <div
              className="template-carousel-section"
              style={{ marginBottom: "35px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <label
                  className="section-label"
                  style={{
                    color: "#fff",
                    fontSize: "15px",
                    fontWeight: "bold",
                    margin: 0,
                  }}
                >
                  1. Escolha um estilo de página
                </label>

                {templates.length > 0 && (
                  <span
                    style={{
                      color: "#94a3b8",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    {templates.findIndex(
                      (t, index) =>
                        resolveTemplateId(t, index) === selectedTemplate,
                    ) + 1}{" "}
                    / {templates.length}
                  </span>
                )}
              </div>

              <div
                className="carousel-wrapper"
                style={{
                  position: "relative",
                  borderRadius: "16px",
                  overflow: "visible",
                }}
              >
                {templates.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Template anterior"
                      onClick={() => scrollCarousel(carouselTrackRef, "left")}
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "-18px",
                        transform: "translateY(-50%)",
                        zIndex: 20,
                        width: "38px",
                        height: "38px",
                        borderRadius: "999px",
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        color: "#0f172a",
                        cursor: "pointer",
                        fontSize: "26px",
                        fontWeight: 700,
                        lineHeight: "1",
                        boxShadow: "0 10px 24px rgba(0,0,0,0.22)",
                      }}
                    >
                      ‹
                    </button>

                    <button
                      type="button"
                      aria-label="Próximo template"
                      onClick={() => scrollCarousel(carouselTrackRef, "right")}
                      style={{
                        position: "absolute",
                        top: "50%",
                        right: "-18px",
                        transform: "translateY(-50%)",
                        zIndex: 20,
                        width: "38px",
                        height: "38px",
                        borderRadius: "999px",
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        color: "#0f172a",
                        cursor: "pointer",
                        fontSize: "26px",
                        fontWeight: 700,
                        lineHeight: "1",
                        boxShadow: "0 10px 24px rgba(0,0,0,0.22)",
                      }}
                    >
                      ›
                    </button>
                  </>
                )}

                {templates.length === 0 && (
                  <div
                    style={{
                      padding: "24px",
                      borderRadius: "16px",
                      background: "#0f172a",
                      border: "1px solid #1e293b",
                      color: "#cbd5e1",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    Nenhum template de {isEcommerce ? "ecommerce" : "serviço"} foi
                    encontrado para este perfil.
                  </div>
                )}

                <div
                  className="carousel-track"
                  ref={carouselTrackRef}
                  style={{
                    display: "flex",
                    gap: "20px",
                    overflowX: "auto",
                    scrollBehavior: "smooth",
                    whiteSpace: "nowrap",
                    WebkitOverflowScrolling: "touch",
                    padding: "4px 6px 18px",
                    scrollbarWidth: "none",
                  }}
                >
                  {templates.map((t, index) => {
                    const templateId = resolveTemplateId(t, index);
                    const isSelected = selectedTemplate === templateId;
                    const imageUrl = t.imagemUrl || t.url;
                    let finalImgUrl = "";

                    if (imageUrl) {
                      finalImgUrl =
                        imageUrl.startsWith("http://") ||
                          imageUrl.startsWith("https://")
                          ? imageUrl
                          : `${API_URL}${imageUrl}`;

                      if (t.updatedAt) {
                        finalImgUrl += `${finalImgUrl.includes("?") ? "&" : "?"
                          }v=${encodeURIComponent(t.updatedAt)}`;
                      }
                    }

                    return (
                      <div
                        key={templateId}
                        onClick={() => {
                          setSelectedTemplate(templateId);
                          setAiVariations([]);
                          setSelectedVariationIndex(0);
                          setVariationStepReady(false);
                          clearVariationsCache();
                        }}
                        className="template-card-carousel"
                        style={{
                          flex: isMobile ? "0 0 calc(100vw - 48px)" : "0 0 280px",
                          width: isMobile ? "calc(100vw - 48px)" : "280px",
                          border: isSelected
                            ? "3px solid #3b82f6"
                            : "1px solid #1e293b",
                          borderRadius: "16px",
                          overflow: "hidden",
                          background: "#0f172a",
                          cursor: "pointer",
                          display: "inline-block",
                          boxShadow: isSelected
                            ? "0 10px 25px -5px rgba(59, 130, 246, 0.4)"
                            : "0 8px 18px rgba(0,0,0,0.16)",
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                      >
                        <div
                          className="preview-container"
                          style={{
                            position: "relative",
                            height: isMobile ? "360px" : "220px",
                            overflow: "hidden",
                          }}
                        >
                          {finalImgUrl ? (
                            <img
                              src={finalImgUrl}
                              alt={t.nome || t.name || "Template"}
                              className="template-img-hover"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                              }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop";
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                height: "100%",
                                color: "#64748b",
                                fontSize: "11px",
                                fontWeight: "bold",
                              }}
                            >
                              SEM PRÉVIA VISUAL
                            </div>
                          )}

                          {isSelected && (
                            <div
                              className="selected-check"
                              style={{
                                position: "absolute",
                                top: "12px",
                                right: "12px",
                                background: "#3b82f6",
                                color: "#fff",
                                width: "24px",
                                height: "24px",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: "bold",
                                fontSize: "12px",
                              }}
                            >
                              ✓
                            </div>
                          )}
                        </div>

                        <div
                          className="template-info"
                          style={{
                            padding: "14px",
                            textAlign: "center",
                            borderTop: "1px solid #1e293b",
                            background: isSelected ? "#131f38" : "transparent",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: "700",
                              color: isSelected ? "#3b82f6" : "#94a3b8",
                              textTransform: "uppercase",
                              letterSpacing: "0.8px",
                              display: "block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {t.nome || t.name}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {!hasGeneratedAiVariations && (
            <>
              <div
                style={{
                  padding: isMobile ? "18px" : "26px",
                  borderRadius: "20px",
                  background: "#0f172a",
                  border: "1px solid #1e293b",
                  marginBottom: "22px",
                }}
              >
                <div style={{ marginBottom: "18px" }}>
                  <label
                    className="section-label"
                    style={{
                      color: "#fff",
                      fontSize: "17px",
                      fontWeight: 900,
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    2. Conte sobre seu negócio
                  </label>
                  <p
                    style={{
                      color: "#94a3b8",
                      margin: 0,
                      fontSize: "13px",
                      lineHeight: 1.6,
                    }}
                  >
                    Escreva do seu jeito. Não precisa usar termos técnicos nem pensar
                    como um designer. Diga o que você faz e o que gostaria de divulgar.
                  </p>
                </div>

                <textarea
                  placeholder={
                    isEcommerce
                      ? "Ex.: Tenho uma loja de artigos religiosos. Trabalho com terços, medalhas e presentes católicos. Quero destacar os produtos mais especiais e facilitar pedidos pelo GranConecta."
                      : "Ex.: Sou psicopedagoga e atendo crianças e adolescentes. Faço avaliação e acompanhamento. Quero apresentar meu trabalho, gerar confiança e facilitar o contato e o agendamento."
                  }
                  value={descricao}
                  onChange={(e) => {
                    setDescricao(e.target.value);
                    invalidateGeneratedVariations();
                  }}
                  style={{
                    width: "100%",
                    minHeight: "150px",
                    resize: "vertical",
                    borderRadius: "14px",
                    border: "1px solid #334155",
                    background: "#020617",
                    color: "#fff",
                    padding: "16px",
                    outline: "none",
                    fontSize: "14px",
                    lineHeight: 1.65,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div
                style={{
                  padding: isMobile ? "18px" : "26px",
                  borderRadius: "20px",
                  background: "#0f172a",
                  border: "1px solid #1e293b",
                  marginBottom: "22px",
                }}
              >
                <div style={{ marginBottom: "18px" }}>
                  <label
                    className="section-label"
                    style={{
                      color: "#fff",
                      fontSize: "17px",
                      fontWeight: 900,
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    3. Envie seus materiais
                  </label>
                  <p
                    style={{
                      color: "#94a3b8",
                      margin: 0,
                      fontSize: "13px",
                      lineHeight: 1.65,
                      maxWidth: "780px",
                    }}
                  >
                    Envie cada material na seção que melhor representa seu negócio.
                    Se você enviar material para uma seção, a página criada deverá
                    refletir essa seção. Se não enviar, não criaremos um bloco vazio.
                    Em “Imagens de destaque / Hero”, várias fotos podem ser alternadas
                    entre novas opções ou combinadas em uma composição.
                  </p>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile
                      ? "1fr"
                      : "repeat(2, minmax(0, 1fr))",
                    gap: "14px",
                  }}
                >
                  {(
                    [
                      {
                        type: "HERO" as BusinessMaterialType,
                        title: "Imagens de destaque / Hero",
                        description:
                          "Envie uma ou várias imagens para o topo. A IA poderá alternar a imagem principal ou combinar até 3 fotos nas diferentes variações. Horizontais funcionam melhor como capa; verticais e quadradas podem entrar como imagens secundárias.",
                        accept: "image/*",
                        multiple: true,
                      },
                      {
                        type: "PROFESSIONAL" as BusinessMaterialType,
                        title: "Você / equipe",
                        description:
                          "Retratos seus, da equipe ou do profissional. Podem aparecer no Hero, na apresentação ou em outras seções quando fizer sentido.",
                        accept: "image/*",
                        multiple: true,
                      },
                      {
                        type: "WORKSPACE" as BusinessMaterialType,
                        title: "Seu espaço",
                        description:
                          "Consultório, loja, escritório ou ambiente de atendimento.",
                        accept: "image/*",
                        multiple: true,
                      },
                      {
                        type: "SERVICE" as BusinessMaterialType,
                        title: "Uso / experiência",
                        description:
                          "Fotos mostrando seus produtos, atendimentos, atividades, processos ou a experiência do seu negócio.",
                        accept: "image/*",
                        multiple: true,
                      },
                      {
                        type: "PRODUCT" as BusinessMaterialType,
                        title: "Produtos",
                        description:
                          "Fotos dos produtos ou itens que merecem destaque na página.",
                        accept: "image/*",
                        multiple: true,
                      },
                      {
                        type: "LOGO" as BusinessMaterialType,
                        title: "Logo / sua marca",
                        description:
                          "Use o arquivo mais limpo da sua marca. Ele não será esticado como foto de capa.",
                        accept: "image/*",
                        multiple: false,
                      },
                      {
                        type: "PUBLICITY" as BusinessMaterialType,
                        title: "Material de divulgação",
                        description:
                          "Banners, artes, campanhas ou composições que já representam seu negócio.",
                        accept: "image/*",
                        multiple: true,
                      },
                      {
                        type: "VIDEO" as BusinessMaterialType,
                        title: "Vídeos",
                        description:
                          "Vídeos do espaço, apresentação, produtos ou trabalho. Se você enviar um vídeo, ele deverá aparecer na página criada.",
                        accept: "video/*",
                        multiple: true,
                      },
                    ]
                  ).map((slot) => {
                    const slotMaterials = businessMaterials.filter(
                      (material) => material.type === slot.type,
                    );

                    return (
                      <div
                        key={slot.type}
                        style={{
                          border: "1px solid #1e293b",
                          borderRadius: "16px",
                          background: "#020617",
                          padding: "14px",
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            gap: "12px",
                            marginBottom: "10px",
                          }}
                        >
                          <div>
                            <strong
                              style={{
                                color: "#e2e8f0",
                                fontSize: "13px",
                                display: "block",
                                marginBottom: "4px",
                              }}
                            >
                              {slot.title}
                            </strong>
                            <span
                              style={{
                                color: "#64748b",
                                fontSize: "11px",
                                lineHeight: 1.5,
                                display: "block",
                              }}
                            >
                              {slot.description}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => openMaterialPicker(slot.type)}
                            disabled={
                              uploadingMaterials ||
                              businessMaterials.length >= 20 ||
                              (!slot.multiple && slotMaterials.length >= 1)
                            }
                            style={{
                              flex: "0 0 auto",
                              border: "1px solid #3b82f6",
                              background: "#1d4ed8",
                              color: "#fff",
                              borderRadius: "10px",
                              padding: "8px 11px",
                              cursor: "pointer",
                              fontSize: "11px",
                              fontWeight: 900,
                              opacity:
                                uploadingMaterials ||
                                  businessMaterials.length >= 20 ||
                                  (!slot.multiple && slotMaterials.length >= 1)
                                  ? 0.55
                                  : 1,
                            }}
                          >
                            {slotMaterials.length ? "+ Adicionar" : "Enviar"}
                          </button>

                          <input
                            ref={(element) => {
                              materialInputRefs.current[slot.type] = element;
                            }}
                            type="file"
                            multiple={slot.multiple}
                            accept={slot.accept}
                            onChange={(event) =>
                              handleMaterialFiles(event, slot.type)
                            }
                            style={{ display: "none" }}
                          />
                        </div>

                        {!slotMaterials.length ? (
                          <button
                            type="button"
                            onClick={() => openMaterialPicker(slot.type)}
                            style={{
                              width: "100%",
                              minHeight: "74px",
                              border: "1px dashed #334155",
                              borderRadius: "12px",
                              background: "#0b1220",
                              color: "#64748b",
                              cursor: "pointer",
                              fontSize: "11px",
                              fontWeight: 800,
                            }}
                          >
                            Clique para adicionar
                          </button>
                        ) : (
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                slotMaterials.length === 1
                                  ? "1fr"
                                  : "repeat(2, minmax(0, 1fr))",
                              gap: "8px",
                            }}
                          >
                            {slotMaterials.map((material) => {
                              const previewUrl = resolveGeneratorMaterialPreviewUrl(
                                material.url,
                              );
                              const isVideo =
                                material.type === "VIDEO" ||
                                String(material.mimetype || "").startsWith(
                                  "video/",
                                );

                              return (
                                <div
                                  key={material.id}
                                  style={{
                                    position: "relative",
                                    minWidth: 0,
                                    borderRadius: "11px",
                                    overflow: "hidden",
                                    background: "#0b1220",
                                    border: "1px solid #1e293b",
                                  }}
                                >
                                  <div
                                    style={{
                                      height:
                                        material.orientation === "portrait"
                                          ? "170px"
                                          : "120px",
                                      background: "#0b1220",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      overflow: "hidden",
                                    }}
                                  >
                                    {isVideo ? (
                                      <video
                                        src={previewUrl}
                                        controls
                                        playsInline
                                        preload="metadata"
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                          objectFit: "contain",
                                        }}
                                      />
                                    ) : (
                                      <img
                                        src={previewUrl}
                                        alt={
                                          material.originalName ||
                                          "Material do negócio"
                                        }
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                          objectFit: "contain",
                                          display: "block",
                                        }}
                                      />
                                    )}
                                  </div>

                                  <div
                                    style={{
                                      padding: "8px",
                                      display: "flex",
                                      justifyContent: "space-between",
                                      gap: "8px",
                                      alignItems: "center",
                                    }}
                                  >
                                    <span
                                      title={material.originalName}
                                      style={{
                                        color: "#94a3b8",
                                        fontSize: "10px",
                                        fontWeight: 700,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {material.type === "HERO"
                                        ? `Hero ${slotMaterials.findIndex((item) => item.id === material.id) + 1} · `
                                        : ""}
                                      {material.orientation
                                        ? `${material.orientation} · `
                                        : ""}
                                      {material.originalName ||
                                        material.filename ||
                                        "Material"}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeMaterial(material.id)
                                      }
                                      style={{
                                        border: "none",
                                        background: "transparent",
                                        color: "#fca5a5",
                                        cursor: "pointer",
                                        fontSize: "10px",
                                        fontWeight: 900,
                                        padding: 0,
                                      }}
                                    >
                                      Remover
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div
                  style={{
                    marginTop: "14px",
                    padding: "11px 13px",
                    borderRadius: "12px",
                    background: "rgba(37,99,235,.08)",
                    border: "1px solid rgba(96,165,250,.18)",
                    color: "#94a3b8",
                    fontSize: "11px",
                    lineHeight: 1.55,
                  }}
                >
                  <strong style={{ color: "#bfdbfe" }}>
                    {businessMaterials.length} de 20 materiais enviados.
                  </strong>{" "}
                  Fotos verticais, quadradas e horizontais são identificadas
                  automaticamente. Materiais marcados como Hero têm prioridade
                  no topo; quando houver vários, as variações podem alternar a
                  imagem principal ou usar composição com imagens secundárias.
                </div>
              </div>

              <div
                style={{
                  padding: isMobile ? "18px" : "24px",
                  borderRadius: "20px",
                  background: "#0f172a",
                  border: "1px solid #1e293b",
                  marginBottom: "22px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "16px",
                    flexWrap: "wrap",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ maxWidth: "720px" }}>
                    <label
                      className="section-label"
                      style={{
                        color: "#fff",
                        fontSize: "17px",
                        fontWeight: 900,
                        display: "block",
                        marginBottom: "6px",
                      }}
                    >
                      4. Cores da sua marca
                    </label>
                    <p
                      style={{
                        color: "#94a3b8",
                        margin: 0,
                        fontSize: "13px",
                        lineHeight: 1.65,
                      }}
                    >
                      Opcional. Se você já possui identidade visual, informe até
                      três cores. Caso contrário, a IA escolhe uma combinação
                      adequada ao seu negócio.
                    </p>
                  </div>

                  <span
                    style={{
                      color: "#64748b",
                      fontSize: "11px",
                      fontWeight: 800,
                    }}
                  >
                    Não precisa entender de design
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile
                      ? "1fr"
                      : "repeat(2, minmax(0, 1fr))",
                    gap: "10px",
                    marginBottom: brandPaletteMode === "CUSTOM" ? "18px" : 0,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => updateBrandPaletteMode("AI")}
                    disabled={hasGeneratedAiVariations}
                    style={{
                      minHeight: "58px",
                      borderRadius: "14px",
                      border:
                        brandPaletteMode === "AI"
                          ? "1px solid #60a5fa"
                          : "1px solid #334155",
                      background:
                        brandPaletteMode === "AI"
                          ? "rgba(37,99,235,.18)"
                          : "#020617",
                      color: "#e2e8f0",
                      cursor: hasGeneratedAiVariations
                        ? "not-allowed"
                        : "pointer",
                      textAlign: "left",
                      padding: "12px 14px",
                    }}
                  >
                    <strong
                      style={{
                        display: "block",
                        color:
                          brandPaletteMode === "AI"
                            ? "#bfdbfe"
                            : "#e2e8f0",
                        fontSize: "13px",
                        marginBottom: "3px",
                      }}
                    >
                      ✨ Deixar a IA escolher
                    </strong>
                    <span
                      style={{
                        color: "#64748b",
                        fontSize: "11px",
                        lineHeight: 1.45,
                      }}
                    >
                      O sistema usa segmento, estilo e sensação desejada.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateBrandPaletteMode("CUSTOM")}
                    disabled={hasGeneratedAiVariations}
                    style={{
                      minHeight: "58px",
                      borderRadius: "14px",
                      border:
                        brandPaletteMode === "CUSTOM"
                          ? "1px solid #60a5fa"
                          : "1px solid #334155",
                      background:
                        brandPaletteMode === "CUSTOM"
                          ? "rgba(37,99,235,.18)"
                          : "#020617",
                      color: "#e2e8f0",
                      cursor: hasGeneratedAiVariations
                        ? "not-allowed"
                        : "pointer",
                      textAlign: "left",
                      padding: "12px 14px",
                    }}
                  >
                    <strong
                      style={{
                        display: "block",
                        color:
                          brandPaletteMode === "CUSTOM"
                            ? "#bfdbfe"
                            : "#e2e8f0",
                        fontSize: "13px",
                        marginBottom: "3px",
                      }}
                    >
                      🎨 Usar minhas cores
                    </strong>
                    <span
                      style={{
                        color: "#64748b",
                        fontSize: "11px",
                        lineHeight: 1.45,
                      }}
                    >
                      Mantém a identidade da marca nas diferentes variações.
                    </span>
                  </button>
                </div>

                {brandPaletteMode === "CUSTOM" && (
                  <>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile
                          ? "1fr"
                          : "repeat(3, minmax(0, 1fr))",
                        gap: "12px",
                      }}
                    >
                      {(
                        [
                          {
                            key: "primary" as keyof BrandColors,
                            label: "Cor principal",
                            hint: "A cor mais reconhecida da sua marca",
                          },
                          {
                            key: "secondary" as keyof BrandColors,
                            label: "Cor secundária",
                            hint: "Apoia fundos, detalhes e combinações",
                          },
                          {
                            key: "accent" as keyof BrandColors,
                            label: "Cor de destaque",
                            hint: "Botões, chamadas e pequenos destaques",
                          },
                        ]
                      ).map((item) => {
                        const value = normalizeHexColor(
                          brandColors[item.key],
                          DEFAULT_BRAND_COLORS[item.key],
                        );

                        return (
                          <div
                            key={item.key}
                            style={{
                              padding: "13px",
                              borderRadius: "14px",
                              border: "1px solid #1e293b",
                              background: "#020617",
                            }}
                          >
                            <label
                              style={{
                                color: "#cbd5e1",
                                fontSize: "12px",
                                fontWeight: 900,
                                display: "block",
                                marginBottom: "4px",
                              }}
                            >
                              {item.label}
                            </label>

                            <span
                              style={{
                                color: "#64748b",
                                fontSize: "10px",
                                lineHeight: 1.4,
                                display: "block",
                                minHeight: "28px",
                                marginBottom: "9px",
                              }}
                            >
                              {item.hint}
                            </span>

                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "48px 1fr",
                                gap: "9px",
                                alignItems: "center",
                              }}
                            >
                              <input
                                type="color"
                                value={value}
                                disabled={hasGeneratedAiVariations}
                                onChange={(event) =>
                                  updateBrandColor(
                                    item.key,
                                    event.target.value,
                                  )
                                }
                                style={{
                                  width: "48px",
                                  height: "42px",
                                  padding: "2px",
                                  border: "1px solid #334155",
                                  borderRadius: "10px",
                                  background: "#0f172a",
                                  cursor: hasGeneratedAiVariations
                                    ? "not-allowed"
                                    : "pointer",
                                }}
                              />

                              <input
                                type="text"
                                value={brandColors[item.key]}
                                disabled={hasGeneratedAiVariations}
                                maxLength={7}
                                onChange={(event) =>
                                  updateBrandColor(
                                    item.key,
                                    event.target.value,
                                  )
                                }
                                onBlur={(event) =>
                                  updateBrandColor(
                                    item.key,
                                    normalizeHexColor(
                                      event.target.value,
                                      DEFAULT_BRAND_COLORS[item.key],
                                    ),
                                  )
                                }
                                placeholder="#000000"
                                style={{
                                  minWidth: 0,
                                  width: "100%",
                                  minHeight: "42px",
                                  borderRadius: "10px",
                                  border: "1px solid #334155",
                                  background: "#0f172a",
                                  color: "#e2e8f0",
                                  padding: "0 10px",
                                  fontSize: "12px",
                                  fontWeight: 800,
                                  textTransform: "uppercase",
                                  outline: "none",
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {resolvedBrandPalette && (
                      <div
                        style={{
                          marginTop: "14px",
                          padding: "12px",
                          borderRadius: "14px",
                          border: "1px solid #1e293b",
                          background: "#020617",
                        }}
                      >
                        <span
                          style={{
                            color: "#94a3b8",
                            fontSize: "11px",
                            fontWeight: 800,
                            display: "block",
                            marginBottom: "9px",
                          }}
                        >
                          Prévia da identidade que será enviada ao gerador
                        </span>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(7, 1fr)",
                            height: "34px",
                            borderRadius: "10px",
                            overflow: "hidden",
                            border: "1px solid #334155",
                          }}
                        >
                          {[
                            resolvedBrandPalette.primary,
                            resolvedBrandPalette.secondary,
                            resolvedBrandPalette.accent,
                            resolvedBrandPalette.background,
                            resolvedBrandPalette.surface,
                            resolvedBrandPalette.text,
                            resolvedBrandPalette.mutedText,
                          ].map((color, index) => (
                            <div
                              key={`${color}-${index}`}
                              title={color}
                              style={{ background: color }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div
                style={{
                  padding: isMobile ? "18px" : "24px",
                  borderRadius: "20px",
                  background: "#0f172a",
                  border: "1px solid #1e293b",
                  marginBottom: "22px",
                }}
              >
                <div style={{ marginBottom: "18px" }}>
                  <label
                    className="section-label"
                    style={{
                      color: "#fff",
                      fontSize: "17px",
                      fontWeight: 900,
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    5. Texto da capa (opcional)
                  </label>
                  <p
                    style={{
                      color: "#94a3b8",
                      margin: 0,
                      fontSize: "13px",
                      lineHeight: 1.65,
                      maxWidth: "780px",
                    }}
                  >
                    Se quiser, escreva exatamente o que deve aparecer no Hero.
                    Se deixar em branco, a IA cria os textos automaticamente.
                  </p>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile
                      ? "1fr"
                      : "repeat(2, minmax(0, 1fr))",
                    gap: "14px",
                  }}
                >
                  <div style={{ gridColumn: isMobile ? "auto" : "1 / -1" }}>
                    <label style={{ color: "#cbd5e1", fontSize: "12px", fontWeight: 800 }}>
                      Título principal
                    </label>
                    <input
                      value={heroCopy.heroTitle}
                      disabled={hasGeneratedAiVariations}
                      onChange={(e) => updateHeroCopy("heroTitle", e.target.value)}
                      placeholder="Ex.: Desenvolvendo potenciais, transformando histórias"
                      style={{
                        width: "100%",
                        marginTop: "7px",
                        borderRadius: "12px",
                        border: "1px solid #334155",
                        background: "#020617",
                        color: "#fff",
                        padding: "14px",
                        outline: "none",
                        fontSize: "14px",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div style={{ gridColumn: isMobile ? "auto" : "1 / -1" }}>
                    <label style={{ color: "#cbd5e1", fontSize: "12px", fontWeight: 800 }}>
                      Subtítulo
                    </label>
                    <textarea
                      value={heroCopy.heroSubtitle}
                      disabled={hasGeneratedAiVariations}
                      onChange={(e) => updateHeroCopy("heroSubtitle", e.target.value)}
                      placeholder="Ex.: Atendimento psicopedagógico personalizado para crianças, adolescentes e famílias."
                      style={{
                        width: "100%",
                        minHeight: "86px",
                        resize: "vertical",
                        marginTop: "7px",
                        borderRadius: "12px",
                        border: "1px solid #334155",
                        background: "#020617",
                        color: "#fff",
                        padding: "14px",
                        outline: "none",
                        fontSize: "14px",
                        lineHeight: 1.55,
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ color: "#cbd5e1", fontSize: "12px", fontWeight: 800 }}>
                      Texto do botão principal
                    </label>
                    <input
                      value={heroCopy.primaryCta}
                      disabled={hasGeneratedAiVariations}
                      onChange={(e) => updateHeroCopy("primaryCta", e.target.value)}
                      placeholder={isEcommerce ? "Ex.: Ver coleção" : "Ex.: Agende sua sessão"}
                      style={{
                        width: "100%",
                        marginTop: "7px",
                        borderRadius: "12px",
                        border: "1px solid #334155",
                        background: "#020617",
                        color: "#fff",
                        padding: "14px",
                        outline: "none",
                        fontSize: "14px",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ color: "#cbd5e1", fontSize: "12px", fontWeight: 800 }}>
                      Texto do segundo botão
                    </label>
                    <input
                      value={heroCopy.secondaryCta}
                      disabled={hasGeneratedAiVariations}
                      onChange={(e) => updateHeroCopy("secondaryCta", e.target.value)}
                      placeholder={isEcommerce ? "Ex.: Falar comigo" : "Ex.: Conheça meu trabalho"}
                      style={{
                        width: "100%",
                        marginTop: "7px",
                        borderRadius: "12px",
                        border: "1px solid #334155",
                        background: "#020617",
                        color: "#fff",
                        padding: "14px",
                        outline: "none",
                        fontSize: "14px",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                {hasGeneratedAiVariations && (
                  <p
                    style={{
                      margin: "14px 0 0",
                      color: "#64748b",
                      fontSize: "12px",
                    }}
                  >
                    Para alterar estes textos, libere as variações e gere novamente.
                  </p>
                )}
              </div>

              <div
                style={{
                  padding: isMobile ? "16px" : "20px",
                  borderRadius: "18px",
                  background: "#0f172a",
                  border: "1px solid #1e293b",
                  marginBottom: "24px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowAdvancedOptions((current) => !current)}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    border: "none",
                    background: "transparent",
                    color: "#e2e8f0",
                    cursor: "pointer",
                    padding: 0,
                    fontWeight: 900,
                    fontSize: "14px",
                    textAlign: "left",
                  }}
                >
                  <span>6. Personalizar estilo (opcional)</span>
                  <span style={{ color: "#60a5fa" }}>
                    {showAdvancedOptions ? "−" : "+"}
                  </span>
                </button>

                {showAdvancedOptions && (
                  <div
                    style={{
                      display: "grid",
                      gap: "22px",
                      marginTop: "20px",
                      paddingTop: "20px",
                      borderTop: "1px solid #1e293b",
                    }}
                  >
                    <div>
                      <p style={{ color: "#cbd5e1", margin: 0, fontWeight: 700 }}>
                        Estilo visual
                      </p>
                      {renderSelectChips("estilo", ESTILO_OPTIONS)}
                    </div>

                    <div>
                      <p style={{ color: "#cbd5e1", margin: 0, fontWeight: 700 }}>
                        Objetivo principal
                      </p>
                      {renderSelectChips("objetivo", objectiveOptions)}
                    </div>

                    <div>
                      <p style={{ color: "#cbd5e1", margin: 0, fontWeight: 700 }}>
                        Produto, serviço ou diferencial para destacar
                      </p>
                      <input
                        value={answers.destaque}
                        onChange={(e) => updateAnswer("destaque", e.target.value)}
                        placeholder={
                          isEcommerce
                            ? "Ex.: terços personalizados, coleção de presentes..."
                            : "Ex.: avaliação psicopedagógica, atendimento domiciliar..."
                        }
                        style={{
                          width: "100%",
                          marginTop: "10px",
                          borderRadius: "12px",
                          border: "1px solid #334155",
                          background: "#020617",
                          color: "#fff",
                          padding: "14px",
                          outline: "none",
                          fontSize: "14px",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    <div>
                      <p style={{ color: "#cbd5e1", margin: 0, fontWeight: 700 }}>
                        Sensação desejada
                      </p>
                      {renderSelectChips("sensacao", SENSACAO_OPTIONS)}
                    </div>

                    <div>
                      <p style={{ color: "#cbd5e1", margin: 0, fontWeight: 700 }}>
                        Preferência para as imagens
                      </p>
                      {renderSelectChips("imagemPreferencia", IMAGEM_OPTIONS)}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {aiVariations[selectedVariationIndex] && (
            <div
              style={{
                marginTop: "24px",
                borderRadius: "26px",
                overflow: "hidden",
                border: "1px solid rgba(148,163,184,.22)",
                background: "linear-gradient(145deg,#0f172a,#020617)",
                boxShadow: "0 24px 60px rgba(0,0,0,.28)",
              }}
            >
              <div
                style={{
                  padding: "28px",
                  background: `linear-gradient(135deg, ${aiVariations[selectedVariationIndex]?.colors?.background || "#f8fafc"
                    }, ${aiVariations[selectedVariationIndex]?.colors?.accent || "#2563eb"
                    })`,
                  minHeight: "260px",
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1.1fr .9fr",
                  gap: "28px",
                  alignItems: "center",
                }}
              >
                <div>
                  <span
                    style={{
                      display: "inline-flex",
                      marginBottom: "12px",
                      padding: "7px 11px",
                      borderRadius: "999px",
                      background: "rgba(255,255,255,.72)",
                      color:
                        aiVariations[selectedVariationIndex]?.colors?.primary ||
                        "#0f172a",
                      fontSize: "11px",
                      fontWeight: 950,
                      textTransform: "uppercase",
                      letterSpacing: ".08em",
                    }}
                  >
                    Prévia do layout escolhido
                  </span>

                  <h2
                    style={{
                      margin: "0 0 12px",
                      color:
                        aiVariations[selectedVariationIndex]?.colors?.primary ||
                        "#0f172a",
                      fontSize: isMobile ? "32px" : "46px",
                      lineHeight: 0.98,
                      fontWeight: 950,
                      maxWidth: "620px",
                    }}
                  >
                    {aiVariations[selectedVariationIndex]?.heroTitle ||
                      getVariationTitle(
                        aiVariations[selectedVariationIndex],
                        selectedVariationIndex,
                      )}
                  </h2>

                  <p
                    style={{
                      margin: "0 0 20px",
                      color:
                        aiVariations[selectedVariationIndex]?.colors?.secondary ||
                        "#334155",
                      fontSize: "15px",
                      lineHeight: 1.65,
                      maxWidth: "560px",
                      fontWeight: 700,
                    }}
                  >
                    {aiVariations[selectedVariationIndex]?.heroSubtitle ||
                      getVariationDescription(aiVariations[selectedVariationIndex])}
                  </p>

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <span style={previewActionPillStyle}>Carrinho</span>
                    <span style={previewActionPillStyle}>Lista de desejo</span>
                    <span style={previewActionPillStyle}>Chat</span>
                    <span style={previewActionPillStyle}>WhatsApp</span>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: "12px",
                  }}
                >
                  {[
                    "Hero profissional",
                    "Seções comerciais",
                    "Botões padronizados",
                    "Mobile otimizado",
                  ].map((item) => (
                    <div
                      key={item}
                      style={{
                        minHeight: "52px",
                        borderRadius: "18px",
                        background: "rgba(255,255,255,.68)",
                        border: "1px solid rgba(255,255,255,.78)",
                        display: "flex",
                        alignItems: "center",
                        padding: "0 16px",
                        gap: "10px",
                        color:
                          aiVariations[selectedVariationIndex]?.colors?.primary ||
                          "#0f172a",
                        fontSize: "13px",
                        fontWeight: 950,
                        boxShadow: "0 10px 24px rgba(0,0,0,.10)",
                      }}
                    >
                      <span
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "999px",
                          background:
                            aiVariations[selectedVariationIndex]?.colors?.accent ||
                            "#2563eb",
                          color: "#fff",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: 950,
                        }}
                      >
                        ✓
                      </span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  padding: "18px 22px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "14px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <strong style={{ color: "#fff", fontSize: "15px" }}>
                    {getVariationTitle(
                      aiVariations[selectedVariationIndex],
                      selectedVariationIndex,
                    )}
                  </strong>
                  <p
                    style={{
                      margin: "5px 0 0",
                      color: "#94a3b8",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    Essa prévia representa a direção visual. O HTML final será montado pelo
                    Render Engine V2.
                  </p>
                </div>

                <span
                  style={{
                    borderRadius: "999px",
                    padding: "8px 12px",
                    background: "rgba(34,197,94,.14)",
                    border: "1px solid rgba(34,197,94,.35)",
                    color: "#bbf7d0",
                    fontSize: "12px",
                    fontWeight: 950,
                  }}
                >
                  Pronto para gerar
                </span>
              </div>
            </div>
          )}

          {!hasGeneratedAiVariations && (
            <button
              className="gerador-button"
              onClick={handleStartProcess}
              disabled={generatingVariations}
              style={{ marginTop: "15px", opacity: generatingVariations ? 0.7 : 1 }}
            >
              {generatingVariations
                ? "Criando sua página..."
                : "Criar minha página"}
            </button>
          )}

          {hasGeneratedAiVariations && latestGeneratedLayout && (
            <div
              style={{
                marginTop: "28px",
                padding: isMobile ? "20px" : "26px",
                borderRadius: "22px",
                background: "#020617",
                border: "1px solid #1e293b",
              }}
            >
              <h2
                style={{
                  margin: "0 0 8px",
                  color: "#fff",
                  fontSize: "22px",
                  fontWeight: 950,
                }}
              >
                Sua página está pronta 🎉
              </h2>

              <p
                style={{
                  margin: "0 0 18px",
                  color: "#94a3b8",
                  fontSize: "13px",
                  lineHeight: 1.65,
                }}
              >
                Confira o resultado. Se quiser uma opção diferente, volte às
                configurações, troque fotos, textos ou cores e crie outra página.
              </p>

              {includedGenerations > 0 && (
                <div
                  style={{
                    marginBottom: "18px",
                    color: "#bfdbfe",
                    fontSize: "12px",
                    fontWeight: 900,
                  }}
                >
                  Opções criadas: {usedGenerations} de {includedGenerations}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() => handleOpenGeneratedLayout()}
                  style={{
                    border: 0,
                    borderRadius: "999px",
                    background: "linear-gradient(90deg,#2563eb,#60a5fa)",
                    color: "#fff",
                    padding: "13px 18px",
                    fontWeight: 950,
                    cursor: "pointer",
                  }}
                >
                  Ver minha página
                </button>

                <button
                  type="button"
                  onClick={handleRegenerateVariations}
                  disabled={generationLimitReached}
                  style={{
                    borderRadius: "999px",
                    border: "1px solid #334155",
                    background: generationLimitReached ? "#1e293b" : "#111827",
                    color: generationLimitReached ? "#64748b" : "#fff",
                    padding: "13px 18px",
                    fontWeight: 900,
                    cursor: generationLimitReached ? "not-allowed" : "pointer",
                  }}
                >
                  {generationLimitReached
                    ? "Limite de opções atingido"
                    : "Criar outra opção"}
                </button>
              </div>
            </div>
          )}

          {!hasGeneratedAiVariations && variationStepReady && aiVariations.length > 0 && (
            <div
              style={{
                marginTop: "34px",
                padding: "22px",
                borderRadius: "20px",
                background: "#020617",
                border: "1px solid #1e293b",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginBottom: "18px",
                }}
              >
                <div>
                  <h2
                    style={{
                      color: "#fff",
                      margin: 0,
                      fontSize: "20px",
                      fontWeight: 900,
                    }}
                  >
                    5. Confira a opção preparada
                  </h2>
                  <p
                    style={{
                      color: "#94a3b8",
                      margin: "6px 0 0",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    A IA sugeriu presets, textos, cores e seções. O motor do
                    GranConecta preserva carrinho, desejo, chat e produtos.
                  </p>
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {hasGeneratedAiVariations && (
                    <button
                      type="button"
                      onClick={handleRegenerateVariations}
                      style={{
                        minHeight: "36px",
                        borderRadius: "999px",
                        border: "1px solid #334155",
                        background: "#111827",
                        color: "#fff",
                        cursor: "pointer",
                        padding: "0 14px",
                        fontSize: "12px",
                        fontWeight: 900,
                      }}
                    >
                      Criar outra opção
                    </button>
                  )}

                  {aiVariations.length > 1 && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={() => scrollCarousel(variationsTrackRef, "left")}
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "999px",
                          border: "1px solid #334155",
                          background: "#0f172a",
                          color: "#fff",
                          cursor: "pointer",
                          fontSize: "22px",
                          fontWeight: 800,
                        }}
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollCarousel(variationsTrackRef, "right")}
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "999px",
                          border: "1px solid #334155",
                          background: "#0f172a",
                          color: "#fff",
                          cursor: "pointer",
                          fontSize: "22px",
                          fontWeight: 800,
                        }}
                      >
                        ›
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div
                ref={variationsTrackRef}
                style={{
                  display: "flex",
                  gap: "18px",
                  overflowX: "auto",
                  WebkitOverflowScrolling: "touch",
                  scrollBehavior: "smooth",
                  paddingBottom: "14px",
                }}
              >
                {aiVariations.map((variation, index) => {
                  const selected = selectedVariationIndex === index;
                  const title = getVariationTitle(variation, index);
                  const description = getVariationDescription(variation);
                  const colors = variation.colors || {};

                  return (
                    <div
                      key={variation.id || `${title}-${index}`}
                      onClick={() => {
                        setSelectedVariationIndex(index);
                        saveVariationsCache(
                          aiVariations,
                          index,
                          answers,
                          descricao,
                          selectedTemplate,
                        );
                      }}
                      style={{
                        flex: isMobile ? "0 0 calc(100vw - 58px)" : "0 0 380px",
                        border: selected
                          ? "2px solid #60a5fa"
                          : "1px solid rgba(148,163,184,.22)",
                        borderRadius: "24px",
                        background: selected
                          ? "linear-gradient(145deg,#111c35,#020617)"
                          : "linear-gradient(145deg,#0f172a,#020617)",
                        cursor: "pointer",
                        overflow: "hidden",
                        boxShadow: selected
                          ? "0 24px 60px rgba(37,99,235,.32)"
                          : "0 16px 38px rgba(0,0,0,.22)",
                      }}
                    >
                      <div
                        style={{
                          minHeight: "180px",
                          background: `linear-gradient(135deg, ${colors.background || "#f8fafc"}, ${colors.accent || "#2563eb"})`,
                          padding: "18px",
                          position: "relative",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: "14px",
                            right: "14px",
                            background: selected ? "#2563eb" : "rgba(15,23,42,.86)",
                            color: "#fff",
                            borderRadius: "999px",
                            padding: "7px 11px",
                            fontSize: "11px",
                            fontWeight: 950,
                          }}
                        >
                          {selected ? "Selecionada" : `Layout ${index + 1}`}
                        </div>

                        <div
                          style={{
                            width: "52px",
                            height: "52px",
                            borderRadius: "18px",
                            background: "rgba(255,255,255,.72)",
                            border: "1px solid rgba(255,255,255,.75)",
                            boxShadow: "0 12px 30px rgba(0,0,0,.16)",
                          }}
                        />

                        <div>
                          <span
                            style={{
                              display: "inline-flex",
                              marginBottom: "8px",
                              padding: "6px 9px",
                              borderRadius: "999px",
                              background: "rgba(255,255,255,.68)",
                              color: colors.primary || "#0f172a",
                              fontSize: "10px",
                              fontWeight: 950,
                              textTransform: "uppercase",
                              letterSpacing: ".08em",
                            }}
                          >
                            {getVariationAccentLabel(variation)}
                          </span>

                          <strong
                            style={{
                              display: "block",
                              color: colors.primary || "#0f172a",
                              fontSize: "23px",
                              lineHeight: 1,
                              fontWeight: 950,
                              maxWidth: "270px",
                            }}
                          >
                            {variation.heroTitle || title}
                          </strong>
                        </div>
                      </div>

                      <div style={{ padding: "18px" }}>
                        <h3
                          style={{
                            color: "#fff",
                            margin: "0 0 8px",
                            fontSize: "17px",
                            fontWeight: 950,
                          }}
                        >
                          {title}
                        </h3>

                        <p
                          style={{
                            color: "#cbd5e1",
                            margin: "0 0 14px",
                            fontSize: "13px",
                            lineHeight: 1.55,
                            whiteSpace: "normal",
                          }}
                        >
                          {description}
                        </p>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "8px",
                            marginBottom: "14px",
                          }}
                        >
                          <span style={variationInfoBadgeStyle}>Hero profissional</span>
                          <span style={variationInfoBadgeStyle}>Mobile otimizado</span>
                          <span style={variationInfoBadgeStyle}>Botões padrão</span>
                          <span style={variationInfoBadgeStyle}>Conversão</span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVariationIndex(index);
                            saveVariationsCache(
                              aiVariations,
                              index,
                              answers,
                              descricao,
                              selectedTemplate,
                            );
                          }}
                          style={{
                            width: "100%",
                            border: 0,
                            borderRadius: "999px",
                            background: selected
                              ? "linear-gradient(90deg,#2563eb,#60a5fa)"
                              : "#1e293b",
                            color: "#fff",
                            padding: "13px 14px",
                            fontWeight: 950,
                            cursor: "pointer",
                            boxShadow: selected
                              ? "0 14px 28px rgba(37,99,235,.28)"
                              : "none",
                          }}
                        >
                          {selected ? "✓ Layout selecionado" : "Escolher este layout"}
                        </button>

                        {selected && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleGenerateFinal();
                            }}
                            disabled={buildProgressOpen}
                            style={{
                              width: "100%",
                              marginTop: "10px",
                              border: "1px solid rgba(255,255,255,.18)",
                              borderRadius: "999px",
                              background: buildProgressOpen
                                ? "#334155"
                                : "linear-gradient(90deg,#16a34a,#22c55e)",
                              color: "#fff",
                              padding: "14px 16px",
                              fontWeight: 950,
                              cursor: buildProgressOpen ? "not-allowed" : "pointer",
                              boxShadow: buildProgressOpen
                                ? "none"
                                : "0 14px 30px rgba(34,197,94,.24)",
                              opacity: buildProgressOpen ? 0.7 : 1,
                            }}
                          >
                            {buildProgressOpen
                              ? "Gerando layout..."
                              : "Criar esta página"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                className="gerador-button"
                onClick={() => void handleGenerateFinal()}
                disabled={buildProgressOpen}
                style={{
                  marginTop: "18px",
                  opacity: buildProgressOpen ? 0.7 : 1,
                  cursor: buildProgressOpen ? "not-allowed" : "pointer",
                }}
              >
                {buildProgressOpen
                  ? "Gerando layout..."
                  : "Criar esta página"}
              </button>
            </div>
          )}

          {!hasGeneratedAiVariations && showProductCheck && (
            <div className="modal-overlay">
              <div className="modal-box">
                <h2>Vitrine de produtos</h2>
                <p>
                  Para um resultado melhor, cadastre seus produtos antes de gerar
                  as variações. O que deseja fazer?
                </p>
                <div className="modal-actions">
                  {(temloja.length > 0 || lojaAtivaId) && (
                    <button
                      onClick={() => {
                        setShowProductCheck(false);
                        setOpenModal(true);
                      }}
                      className="btn-success"
                    >
                      Cadastrar produtos agora
                    </button>
                  )}

                  <button
                    onClick={handleGenerateVariations}
                    className="btn-secondary"
                  >
                    Não, criar minha página agora
                  </button>
                </div>
              </div>
            </div>
          )}

          {!hasGeneratedAiVariations && showNextStepChoice && (
            <div className="modal-overlay" style={{ zIndex: 9999 }}>
              <div className="modal-box">
                <h2 style={{ color: "#2ecc71" }}>✓ Produto salvo!</h2>
                <p>
                  Deseja incluir mais um produto nesta loja ou gerar as variações
                  com IA?
                </p>
                <div className="modal-actions">
                  <button
                    onClick={() => {
                      setShowNextStepChoice(false);
                      setProdutoEditando(null);
                      setOpenModal(true);
                    }}
                    className="btn-success"
                  >
                    + Cadastrar outro
                  </button>

                  <button
                    onClick={() => {
                      setShowNextStepChoice(false);
                      setOpenModal(false);
                      handleGenerateVariations();
                    }}
                    className="btn-secondary"
                  >
                    Gerar variações
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {!hasGeneratedAiVariations && isEcommerce && (
        <ModalCadastroProduto
          open={openModal}
          onClose={() => {
            setOpenModal(false);
            setProdutoEditando(null);
          }}
          lojaId={lojaAtivaId}
          produtoId={produtoEditando?.id}
          dadosProduto={produtoEditando}
          onSuccess={async () => {
            await loadStoreProducts();
            setShowNextStepChoice(true);
          }}
          plan={perfil?.plano || "BASICO"}
        />
      )}

      {buildProgressOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            background: "rgba(2, 6, 23, 0.88)",
            backdropFilter: "blur(14px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            style={{
              width: "min(520px, 100%)",
              borderRadius: "28px",
              background: "linear-gradient(145deg, #0f172a, #020617)",
              border: "1px solid rgba(148,163,184,.22)",
              boxShadow: "0 30px 90px rgba(0,0,0,.45)",
              padding: "32px",
              color: "#fff",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                padding: "8px 12px",
                borderRadius: "999px",
                background: "rgba(37,99,235,.16)",
                border: "1px solid rgba(96,165,250,.35)",
                color: "#bfdbfe",
                fontSize: "12px",
                fontWeight: 900,
                marginBottom: "18px",
              }}
            >
              GranConecta AI
            </div>

            <h2
              style={{
                margin: "0 0 8px",
                fontSize: "28px",
                lineHeight: 1,
                fontWeight: 950,
              }}
            >
              Construindo sua landing profissional
            </h2>

            <p
              style={{
                margin: "0 0 24px",
                color: "#94a3b8",
                lineHeight: 1.6,
                fontSize: "14px",
              }}
            >
              Estamos montando layout, seções, botões e experiência mobile.
            </p>

            <div
              style={{
                height: "10px",
                borderRadius: "999px",
                background: "#1e293b",
                overflow: "hidden",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${((buildProgressStep + 1) / buildSteps.length) * 100}%`,
                  background: "linear-gradient(90deg, #2563eb, #60a5fa, #22c55e)",
                  borderRadius: "999px",
                  transition: "width .35s ease",
                }}
              />
            </div>

            <div style={{ display: "grid", gap: "12px" }}>
              {buildSteps.map((step, index) => {
                const done = index <= buildProgressStep;

                return (
                  <div
                    key={step}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      color: done ? "#e2e8f0" : "#64748b",
                      fontSize: "14px",
                      fontWeight: 800,
                    }}
                  >
                    <span
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "999px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: done ? "#22c55e" : "#1e293b",
                        color: done ? "#052e16" : "#94a3b8",
                        fontSize: "12px",
                        fontWeight: 950,
                      }}
                    >
                      {done ? "✓" : index + 1}
                    </span>
                    {step}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" theme="dark" />
    </div>
  );
}