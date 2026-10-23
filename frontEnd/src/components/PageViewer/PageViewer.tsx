import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../../api/api";
import { API_URL } from "../../utils/config";
import { useAuth } from "../../context/AuthContext";
import { CarrinhoLateral } from "../../components/CarrinhoLateral/CarrinhoLateral";
import { ModalNovaSolicitacao } from "../ModalNovaSolicitacao/ModalNovaSolicitacao";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import {
  Badge,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Modal,
  Typography,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { toast } from "react-toastify";
import { ModalProdutosLoja } from "../ModalProdutosLoja/ModalProdutosLoja";
import { ModalLojaInteresse } from "../ModalLojaInteresse/ModalLojaInteresse";
import ModalDetalhesProduto, {
  type ProdutoDetalhes,
} from "../ModalProdutosLoja/ModalDetalhesProduto";
import ModalDetalhesServico, {
  type ServicoDetalhes,
} from "../ModalProdutosLoja/ModalDetalhesServico";

// IMPORTAÇÃO DO SEU CHATWIDGET (Ajuste o caminho se necessário)
import ChatWidget from "../../components/ChatWidget/ChatWidget";


interface Store {
  id: string;
  name: string;
  descricao_loja?: string;
  logo_url?: string;
  telefone_whatsapp?: string;
  condominio_id?: string;
  categoriaid?: string | number;
  acesso_comercial_liberado?: boolean;
  assinatura_ativa?: boolean;
  assinaturaAtiva?: boolean;
  bloqueado_assinatura?: boolean;
  status_assinatura?: string;
  assinatura?: { ativa?: boolean; status?: string } | null;
}

interface ProductItem {
  id: string;
  name?: string;
  nome?: string;
  description?: string;
  descricao?: string;
  price?: number | string;
  preco?: number | string;
  image?: string;
  imagem?: string;
  image_url?: string;
  foto_url?: string;
  ativo?: boolean | number;
}

interface ServiceItem {
  id: string;
  storeId?: string;
  tipo?: "SERVICO" | "PACOTE" | "PROMOCAO" | string;
  nome?: string;
  descricao?: string | null;
  preco?: number | string;
  precoPromocional?: number | string | null;
  precoVigente?: number | string;
  promocaoAtiva?: boolean;
  duracaoMinutos?: number | null;
  totalSessoes?: number | null;
  modalidade?: string | null;
  schedulingPolicy?: string | null;
  maxSessionsPerWeek?: number | null;
  allowStandalonePurchase?: boolean;
  destaque?: boolean;
  metadata?: Record<string, unknown> | null;
  categoriaId?: string | number | null;
}

interface Section {
  id?: string;
  type: string;
  data: any;
}

interface PageData {
  id?: string;
  title: string;
  content: string;
  layout?: Section[];
  updatedAt?: string;
  logo_url?: string;
  css?: string;
  bodyBgColor?: string;
  footerBgColor?: string;
  footerTextColor?: string;
  telefone_whatsapp?: string;
  usuarioId?: string;
  condominio_id?: string | null;
  categoriaId?: string | number | null;
  categoria_tag?: string;
  tipo?: string;
  acessoComercialLiberado: boolean;
}

interface OpportunityPublicResponse {
  success: boolean;
  opportunityId: string;
  store?: {
    id?: string | null;
    name?: string | null;
    slug?: string | null;
    chatbotTipo?: "LOJA" | "PRESTADOR" | null;
  };
  campaign?: {
    id?: number | null;
    categoriaId?: number | null;
    playbookId?: number | null;
  };
  status?: string;
  score?: number;
}

interface PublicStoreResponse {
  id?: string;
  name?: string;
  tipo?: string;
  descricao_loja?: string;
  pageHtmlPublished?: string;
  pageHtmlDraft?: string;
  pageCssPublished?: string;
  pageCssDraft?: string;
  layoutConfig?: { sections?: Section[] } | string | null;
  updatedAt?: string;
  logo_url?: string;
  bodyBgColor?: string;
  footerBgColor?: string;
  footerTextColor?: string;
  telefone_whatsapp?: string;
  usuarioId?: string;
  condominio_id?: string | null;
  categoriaId?: string | number;
  categoriaid?: string | number;
  categoria_tag?: string;
  acesso_comercial_liberado?: boolean;
  assinatura_ativa?: boolean;
  assinaturaAtiva?: boolean;
  pode_receber_pedidos?: boolean;
  bloqueado_assinatura?: boolean;
  status_assinatura?: string;
  statusAssinatura?: string;
  assinatura?: { ativa?: boolean; status?: string } | null;
}

const STATUS_ASSINATURA_LIBERADOS = new Set([
  "ATIVA", "ATIVO", "ACTIVE", "APROVADA", "APROVADO", "PAGA", "PAGO",
  "TRIAL", "TESTE",
]);

const STATUS_ASSINATURA_BLOQUEADOS = new Set([
  "VENCIDA", "VENCIDO", "ATRASADA", "ATRASADO", "INATIVA", "INATIVO",
  "CANCELADA", "CANCELADO", "SUSPENSA", "SUSPENSO", "BLOQUEADA",
  "BLOQUEADO", "PENDENTE", "PENDING",
]);

function acessoComercialLiberado(source: any): boolean {
  if (!source) return true;
  if (source.bloqueado_assinatura === true) return false;

  const indicador = [
    source.acesso_comercial_liberado,
    source.assinatura_ativa,
    source.assinaturaAtiva,
    source.pode_receber_pedidos,
    source.assinatura?.ativa,
  ].find((valor) => typeof valor === "boolean" || valor === 0 || valor === 1);

  if (indicador !== undefined) return indicador === true || indicador === 1;

  const status = String(
    source.status_assinatura || source.statusAssinatura ||
    source.assinatura?.status || "",
  ).trim().toUpperCase();

  if (STATUS_ASSINATURA_BLOQUEADOS.has(status)) return false;
  if (STATUS_ASSINATURA_LIBERADOS.has(status)) return true;

  // Mantém compatibilidade até o backend passar o indicador explicitamente.
  return true;
}

const MAX_INLINE_IMAGE_LENGTH = 250_000;
const HEAVY_INLINE_IMAGE_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='675' viewBox='0 0 1200 675'%3E%3Crect width='1200' height='675' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial,sans-serif' font-size='32' fill='%236b7280'%3EImagem optimized%3C/text%3E%3C/svg%3E";

const normalizeUrl = (url?: string) => {
  if (!url) return "";

  const raw = String(url).trim();

  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("data:")
  ) {
    return raw;
  }

  let clean = raw.replace(/\\/g, "/");

  let base = (API_URL || "http://localhost:3000").replace(/\/$/, "");

  if (base.endsWith("/api")) {
    base = base.slice(0, -4);
  }

  const uploadIndex = clean.toLowerCase().indexOf("/uploads/");

  if (uploadIndex !== -1) {
    clean = clean.substring(uploadIndex);
    return `${base}${clean.startsWith("/") ? clean : `/${clean}`}`;
  }

  if (clean.startsWith("uploads/")) {
    return `${base}/${clean}`;
  }

  if (clean.startsWith("/")) {
    return `${base}${clean}`;
  }

  return `${base}/uploads/images/${clean}`;
};


const onlyDigits = (value?: string | number | null) =>
  String(value || "").replace(/\D/g, "");

const normalizeBrazilWhatsapp = (value?: string | number | null) => {
  const digits = onlyDigits(value);

  if (!digits) return "";

  return digits.startsWith("55") ? digits : `55${digits}`;
};


const resolveWhatsappFromAny = (source: any): string => {
  if (!source) return "";

  const candidates = [
    source.telefone_whatsapp,
    source.whatsapp,
    source.whatsApp,
    source.whatsappNumber,
    source.whatsapp_number,
    source.numero_whatsapp,
    source.numeroWhatsapp,
    source.telefoneWhatsapp,
    source.telefone_whats,
    source.telefone,
    source.phone,
    source.phoneNumber,
    source.phone_number,
    source.celular,
    source.mobile,
    source.contato,
    source.contato_whatsapp,
    source.contactWhatsapp,
    source.contact_whatsapp,
    source.storeWhatsapp,
    source.store_whatsapp,
    source.lojaWhatsapp,
    source.loja_whatsapp,
    source.ownerWhatsapp,
    source.owner_whatsapp,
    source.usuario?.telefone_whatsapp,
    source.usuario?.whatsapp,
    source.usuario?.telefone,
    source.usuario?.celular,
    source.user?.telefone_whatsapp,
    source.user?.whatsapp,
    source.user?.telefone,
    source.user?.celular,
    source.owner?.telefone_whatsapp,
    source.owner?.whatsapp,
    source.owner?.telefone,
    source.owner?.celular,
    source.store?.telefone_whatsapp,
    source.store?.whatsapp,
    source.loja?.telefone_whatsapp,
    source.loja?.whatsapp,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeBrazilWhatsapp(candidate);

    if (normalized) return normalized;
  }

  return "";
};

const isFullHtmlDocument = (html?: string) => {
  const raw = String(html || "").trim();
  return /<html[\s>]/i.test(raw) || /<!DOCTYPE html/i.test(raw);
};

const parseLayoutSections = (
  layoutConfig: PublicStoreResponse["layoutConfig"],
) => {
  if (!layoutConfig) return [];

  if (typeof layoutConfig === "string") {
    try {
      const parsed = JSON.parse(layoutConfig);
      return Array.isArray(parsed?.sections) ? parsed.sections : [];
    } catch {
      return [];
    }
  }

  return Array.isArray(layoutConfig.sections) ? layoutConfig.sections : [];
};

const stripHeavyInlineImages = (html: string) => {
  return String(html || "").replace(
    /data:image\/(?:png|jpe?g|webp|gif|svg\+xml);base64,[A-Za-z0-9+/=]+/gi,
    (dataUri) =>
      dataUri.length > MAX_INLINE_IMAGE_LENGTH
        ? HEAVY_INLINE_IMAGE_PLACEHOLDER
        : dataUri,
  );
};

const removeViewerArtifacts = (html: string) => {
  return String(html || "")
    .replace(
      /<script\b[^>]*id=["']granconecta-public-bridge["'][^>]*>[\s\S]*?<\/script>/gi,
      "",
    )
    .replace(
      /<style\b[^>]*id=["'](?:granconecta-public-viewer-style|granconecta-inline-editor-style)["'][^>]*>[\s\S]*?<\/style>/gi,
      "",
    )
    .replace(
      /<[^>]*class=["'][^"']*\beditor-hidden-section-label\b[^"']*["'][^>]*>[\s\S]*?<\/[^>]+>/gi,
      "",
    )
    .replace(/\scontenteditable=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\sdata-editor-selected(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?/gi, "");
};

const injectBeforeClosingBody = (html: string, insertion: string) => {
  const closingBodyMatch = html.match(/<\/body\s*>/i);

  if (!closingBodyMatch || closingBodyMatch.index === undefined) {
    return `${html}\n${insertion}`;
  }

  return `${html.slice(0, closingBodyMatch.index)}${insertion}${html.slice(
    closingBodyMatch.index,
  )}`;
};

const MOBILE_PUBLIC_FIX_STYLE = `
<style id="granconecta-mobile-public-fix">
  html,
  body {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow-x: hidden !important;
    -webkit-text-size-adjust: 100%;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box !important;
  }

  img,
  video,
  iframe,
  svg,
  canvas {
    max-width: 100% !important;
  }

  img {
    height: auto;
  }

  .gc-page-viewer-safe-scroll {
    min-height: 100vh;
  }

  /* ==========================================================================
      ESTILOS GLOBAIS PARA TELAS GRANDES (DESKTOP) - CORREÇÃO DO GRID
      ========================================================================== */
  .gc-vitrine-grid,
  .gc-products-grid,
  .gc-category-grid,
  .gc-categories-grid,
  .gc-category-cards,
  div:has(> .gc-category-card),
  [data-gc-products],
  [data-granconecta-products],
  [data-gc-products] > div,
  [data-gc-products] > div > div,
  .gc-generated-products-grid,
  [data-granconecta-products] > div,
  [data-granconecta-products] > div > div {
    display: grid !important;
    grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr)) !important;
    gap: 22px !important;
  }

  .gc-vitrine-grid--bold,
  .gc-vitrine-grid--classic,
  .gc-vitrine-grid--catalog,
  .gc-vitrine-grid--boutique,
  .gc-vitrine-grid--minimal {
    grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr)) !important;
  }

  .j2-products .j2-grid {
    display: grid !important;
    grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr)) !important;
    gap: 22px !important;
  }
  @media (min-width: 641px) {
    .gc-vitrine-grid,
    .gc-products-grid,
    .gc-category-grid,
    .gc-categories-grid,
    .gc-category-cards,
    div:has(> .gc-category-card),
    .j2-products .j2-grid,
    [data-gc-products],
    [data-granconecta-products],
    [data-gc-products] > div,
  [data-gc-products] > div > div,
  .gc-generated-products-grid,
    [data-granconecta-products] > div,
  [data-granconecta-products] > div > div {
      display: grid !important;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)) !important;
      gap: 22px !important;
    }
  }

  @media (hover: hover) and (pointer: fine) {
    .gc-vitrine-grid,
    .gc-products-grid,
    .gc-category-grid,
    .gc-categories-grid,
    .gc-category-cards,
    div:has(> .gc-category-card),
    .j2-products .j2-grid,
    [data-gc-products],
    [data-granconecta-products],
    [data-gc-products] > div,
  [data-gc-products] > div > div,
  .gc-generated-products-grid,
    [data-granconecta-products] > div,
  [data-granconecta-products] > div > div {
      display: grid !important;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)) !important;
      gap: 22px !important;
    }
  }

  /* ==========================================================================
     ESTILOS EXCLUSIVOS PARA TELAS MOBILE
     ========================================================================== */
  @media (max-width: 640px) {
    html,
    body {
      overflow-x: hidden !important;
    }

    body {
      font-size: 16px !important;
    }

    .elementor-section,
    section,
    header,
    footer,
    main {
      max-width: 100% !important;
      overflow-x: hidden !important;
    }

    .elementor-gc_header,
    .elementor-gc_hero,
    .elementor-gc_products_section,
    .elementor-gc_bottom,
    .elementor-gc_footer {
      padding-left: 20px !important;
      padding-right: 20px !important;
    }

    .elementor-gc_header__inner,
    .elementor-gc_hero__inner,
    .elementor-gc_products_inner__inner,
    .elementor-gc_bottom_inner__inner,
    .elementor-gc_footer_inner__inner {
      width: 100% !important;
      max-width: 100% !important;
    }

    .elementor-gc_hero__inner,
    .elementor-gc_products_inner__inner,
    .elementor-gc_bottom_inner__inner,
    .elementor-gc_footer_inner__inner {
      flex-direction: column !important;
    }

    .elementor-gc_logo_col,
    .elementor-gc_nav_col,
    .elementor-gc_icons_col,
    .elementor-gc_hero_text,
    .elementor-gc_hero_image_col,
    .elementor-gc_products_inner,
    .elementor-gc_bottom_inner,
    .elementor-gc_footer_inner,
    [class*="_col"] {
      width: 100% !important;
      max-width: 100% !important;
      flex-basis: 100% !important;
      min-width: 0 !important;
    }

    .elementor-heading-title,
    h1,
    h2,
    h3,
    p {
      max-width: 100% !important;
      overflow-wrap: anywhere !important;
      word-break: normal !important;
    }

    .gc-nav {
      display: flex !important;
      flex-wrap: wrap !important;
      justify-content: center !important;
      gap: 12px !important;
    }

    .gc-icons {
      justify-content: center !important;
    }

    .gc-benefits,
    .gc-bottom-grid,
    .gc-footer-grid,
    .gc-vitrine-grid,
    .gc-products-grid,
    .gc-category-grid,
    .gc-categories-grid,
    .gc-category-cards,
    div:has(> .gc-category-card),
    .j2-products .j2-grid,
    [data-gc-products] > div,
  [data-gc-products] > div > div,
  .gc-generated-products-grid,
    [data-granconecta-products] > div,
  [data-granconecta-products] > div > div {
      display: grid !important;
      grid-template-columns: 1fr !important;
      gap: 18px !important;
    }

    .gc-vitrine-card img,
    .gc-product-card img,
    [data-gc-product-image="true"] {
      width: 100% !important;
      max-height: 360px !important;
      object-fit: cover !important;
    }

    .gc-chatbot-widget {
      left: 16px !important;
      right: 16px !important;
      bottom: 16px !important;
    }

    .gc-chatbot-button {
      width: 100% !important;
    }
  }
  /* Mantem grade em desktop mesmo quando o iframe/janela esta estreito. */
  @media (max-width: 640px) and (hover: hover) and (pointer: fine) {
    .gc-vitrine-grid,
    .gc-products-grid,
    .gc-category-grid,
    .gc-categories-grid,
    .gc-category-cards,
    div:has(> .gc-category-card),
    .j2-products .j2-grid,
    [data-gc-products],
    [data-granconecta-products],
    [data-gc-products] > div,
    [data-gc-products] > div > div,
    .gc-generated-products-grid,
    [data-granconecta-products] > div,
    [data-granconecta-products] > div > div {
      display: grid !important;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)) !important;
      gap: 22px !important;
    }
  }

  body.gc-page-viewer-desktop .gc-generated-products-grid {
    width: 100% !important;
    display: grid !important;
    grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
    gap: 22px !important;
  }

  @media (max-width: 1100px) {
    body.gc-page-viewer-desktop .gc-generated-products-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    }
  }

  @media (max-width: 860px) {
    body.gc-page-viewer-desktop .gc-generated-products-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }
  }
  body.gc-page-viewer-desktop .gc-vitrine-grid,
  body.gc-page-viewer-desktop .gc-products-grid,
  body.gc-page-viewer-desktop .gc-category-grid,
  body.gc-page-viewer-desktop .gc-categories-grid,
  body.gc-page-viewer-desktop .gc-category-cards,
  body.gc-page-viewer-desktop div:has(> .gc-category-card),
  body.gc-page-viewer-desktop .j2-products .j2-grid,
  body.gc-page-viewer-desktop [data-gc-products],
  body.gc-page-viewer-desktop [data-granconecta-products],
  body.gc-page-viewer-desktop [data-gc-products] > div,
  body.gc-page-viewer-desktop [data-gc-products] > div > div,
  body.gc-page-viewer-desktop .gc-generated-products-grid,
  body.gc-page-viewer-desktop [data-granconecta-products] > div,
  body.gc-page-viewer-desktop [data-granconecta-products] > div > div {
    display: grid !important;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)) !important;
    gap: 22px !important;
  }</style>
`;

const TextSection = ({ html }: { html: string }) => (
  <div style={{ width: "100%" }}>
    <div dangerouslySetInnerHTML={{ __html: html }} />
  </div>
);

const CarouselSection = ({ data }: { data: any }) => (
  <Swiper
    modules={[Navigation, Pagination]}
    navigation
    pagination={{ clickable: true }}
  >
    {(data?.slides || []).map((slide: any, i: number) => (
      <SwiperSlide key={i}>
        <img src={normalizeUrl(slide?.image)} alt="" style={{ width: "100%" }} />
      </SwiperSlide>
    ))}
  </Swiper>
);

const GallerySection = ({ data }: { data: any }) => {
  const images = data?.images || [];
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  if (!images.length) return null;

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          width: "100%",
        }}
      >
        {images.map((img: any, i: number) => (
          <img
            key={i}
            src={normalizeUrl(img?.url)}
            onClick={() => {
              setIndex(i);
              setOpen(true);
            }}
            alt=""
            style={{
              width: "100%",
              cursor: "pointer",
              objectFit: "cover",
              borderRadius: 8,
            }}
          />
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)}>
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(0,0,0,0.86)",
            outline: "none",
          }}
        >
          <IconButton
            onClick={() => setOpen(false)}
            sx={{
              position: "fixed",
              top: 20,
              right: 20,
              color: "#fff",
              zIndex: 2,
            }}
          >
            <CloseIcon />
          </IconButton>

          <img
            src={normalizeUrl(images[index]?.url)}
            alt=""
            style={{ maxWidth: "90vw", maxHeight: "80vh" }}
          />

          <div
            style={{
              position: "fixed",
              bottom: 30,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 12,
            }}
          >
            <IconButton
              onClick={() =>
                setIndex((prev) => (prev - 1 + images.length) % images.length)
              }
              sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.16)" }}
            >
              <ArrowBackIosNewIcon />
            </IconButton>

            <IconButton
              onClick={() => setIndex((prev) => (prev + 1) % images.length)}
              sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.16)" }}
            >
              <ArrowForwardIosIcon />
            </IconButton>
          </div>
        </Box>
      </Modal>
    </>
  );
};

function escapeHtml(value: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function resolveProductName(product: ProductItem) {
  return product.name || product.nome || "Produto";
}

function resolveProductDescription(product: ProductItem) {
  return product.description || product.descricao || "";
}

function resolveProductPrice(product: ProductItem) {
  return Number(product.price ?? product.preco ?? 0);
}

function resolveProductImage(product: ProductItem) {
  return normalizeUrl(
    product.image_url ||
    product.foto_url ||
    product.image ||
    product.imagem ||
    (product as any).imageUrl ||
    (product as any).imagem_url ||
    (product as any).foto_perfil ||
    (product as any).foto_hero ||
    (product as any).capa_url ||
    "",
  );
}

function parseMoneyValue(value: any): number {
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

function getProductIdFromAny(value: any): string {
  return String(
    value?.id ||
    value?.productId ||
    value?.produtoId ||
    value?.produto_id ||
    value?.product_id ||
    "",
  ).trim();
}

function findProductById(products: ProductItem[], productId: string) {
  const id = String(productId || "").trim();

  if (!id) return null;

  return (
    products.find((product: any) => {
      return (
        String(product?.id || "") === id ||
        String(product?.productId || "") === id ||
        String(product?.produtoId || "") === id ||
        String(product?.produto_id || "") === id ||
        String(product?.product_id || "") === id
      );
    }) || null
  );
}

function buildCartProductPayload(input: {
  rawPayload: any;
  products: ProductItem[];
}) {
  const rawPayload = input.rawPayload || {};
  const productId = getProductIdFromAny(rawPayload);
  const productFromList = findProductById(input.products, productId);

  const resolvedName =
    rawPayload.name ||
    rawPayload.nome ||
    rawPayload.title ||
    rawPayload.titulo ||
    productFromList?.name ||
    productFromList?.nome ||
    "Produto";

  const resolvedDescription =
    rawPayload.description ||
    rawPayload.descricao ||
    productFromList?.description ||
    productFromList?.descricao ||
    "";

  const resolvedPrice = parseMoneyValue(
    rawPayload.price ??
    rawPayload.preco ??
    rawPayload.valor ??
    rawPayload.amount ??
    productFromList?.price ??
    productFromList?.preco ??
    0,
  );

  const resolvedImage =
    rawPayload.image ||
    rawPayload.imagem ||
    rawPayload.image_url ||
    rawPayload.imageUrl ||
    rawPayload.foto_url ||
    productFromList?.image ||
    productFromList?.imagem ||
    productFromList?.image_url ||
    productFromList?.foto_url ||
    "";

  return {
    ...(productFromList || {}),
    ...rawPayload,

    id: productId,
    productId,
    produtoId: productId,

    name: resolvedName,
    nome: resolvedName,

    description: resolvedDescription,
    descricao: resolvedDescription,

    price: resolvedPrice,
    preco: resolvedPrice,
    valor: resolvedPrice,

    image: resolvedImage,
    imagem: resolvedImage,
    image_url: resolvedImage,

    quantidade: Number(rawPayload.quantidade || rawPayload.quantity || 1) || 1,
  };
}


function renderProductsHtml(
  products: ProductItem[],
  variant: "default" | "j2" = "default",
) {
  if (!products.length) {
    return `
<div style="max-width:1120px;margin:0 auto;text-align:center;padding:32px 20px;color:#64748b;">
  Produtos em atualização. Fale com a loja para consultar disponibilidade.
</div>`;
  }

  if (variant === "j2") {
    return products
      .map((product) => {
        const id = String(product.id || "");
        const name = resolveProductName(product);
        const description = resolveProductDescription(product);
        const price = resolveProductPrice(product);
        const image = resolveProductImage(product);

        return `
<article class="j2-card" data-product-id="${escapeHtml(id)}">
  ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(name)}" />` : ""}
  <div>
    <h3>${escapeHtml(name)}</h3>
    ${description ? `<p>${escapeHtml(description)}</p>` : ""}
    <strong>${price.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}</strong>
    <small>Produto da loja</small>
    <button
      type="button"
      data-action="product-detail"
      data-gc-action="product-detail"
      data-product-id="${escapeHtml(id)}"
      data-product-name="${escapeHtml(name)}"
      data-product-description="${escapeHtml(description)}"
      data-product-price="${price}"
      data-product-image="${escapeHtml(image)}"
      style="width:100%;border:1px solid #111827;border-radius:999px;background:#fff;color:#111827;padding:11px 16px;font-weight:800;cursor:pointer;margin-bottom:10px;"
    >
      Ver detalhes
    </button>
    <button
      type="button"
      data-action="add-to-cart"
      data-gc-action="add-to-cart"
      data-gc-add-to-cart="true"
      data-product-id="${escapeHtml(id)}"
      data-product-name="${escapeHtml(name)}"
      data-product-price="${price}"
      data-product-image="${escapeHtml(image)}"
    >
      Adicionar ao carrinho
    </button>
  </div>
</article>`;
      })
      .join("");
  }

  return `
<div class="gc-generated-products-wrap" style="max-width:1120px;margin:0 auto;padding:0 20px;">
  <div class="gc-generated-products-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:22px;">
    ${products
      .map((product) => {
        const id = String(product.id || "");
        const name = resolveProductName(product);
        const description = resolveProductDescription(product);
        const price = resolveProductPrice(product);
        const image = resolveProductImage(product);

        return `
<article style="border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;background:#fff;box-shadow:0 10px 25px rgba(15,23,42,0.08);">
  ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(name)}" style="width:100%;height:180px;object-fit:cover;display:block;" />` : ""}
  <div style="padding:18px;">
    <h3 style="margin:0 0 8px;font-size:18px;color:#111827;">${escapeHtml(name)}</h3>
    ${description ? `<p style="margin:0 0 12px;color:#64748b;font-size:14px;line-height:1.5;">${escapeHtml(description)}</p>` : ""}
    <strong style="display:block;margin-bottom:14px;font-size:20px;color:#111827;">
      ${price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
    </strong>
    <button
      type="button"
      data-action="product-detail"
      data-gc-action="product-detail"
      data-product-id="${escapeHtml(id)}"
      data-product-name="${escapeHtml(name)}"
      data-product-description="${escapeHtml(description)}"
      data-product-price="${price}"
      data-product-image="${escapeHtml(image)}"
      style="width:100%;border:1px solid #111827;border-radius:999px;background:#fff;color:#111827;padding:11px 16px;font-weight:800;cursor:pointer;margin-bottom:10px;"
    >
      Ver detalhes
    </button>
    <button
      type="button"
      data-action="add-to-cart"
      data-gc-action="add-to-cart"
      data-gc-add-to-cart="true"
      data-product-id="${escapeHtml(id)}"
      data-product-name="${escapeHtml(name)}"
      data-product-price="${price}"
      data-product-image="${escapeHtml(image)}"
      style="width:100%;border:0;border-radius:999px;background:#111827;color:#fff;padding:12px 16px;font-weight:800;cursor:pointer;"
    >
      Adicionar ao carrinho
    </button>
  </div>
</article>`;
      })
      .join("")}
  </div>
</div>`;
}

function injectProductPlaceholders(html: string, products: ProductItem[]) {
  const hasDynamicProductSlot =
    html.includes("data-gc-products") ||
    html.includes("data-granconecta-products") ||
    html.includes("j2-grid");

  if (!hasDynamicProductSlot || !products.length) {
    return html;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const defaultProductsHtml = renderProductsHtml(products, "default");
  const j2ProductsHtml = renderProductsHtml(products, "j2");

  doc
    .querySelectorAll<HTMLElement>(
      [
        "[data-gc-products]",
        "[data-granconecta-products]",
        ".j2-products .j2-grid",
      ].join(","),
    )
    .forEach((element: HTMLElement) => {
      const isJ2 = element.matches(".j2-products .j2-grid");
      element.innerHTML = isJ2 ? j2ProductsHtml : defaultProductsHtml;
    });

  return isFullHtmlDocument(html)
    ? `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`
    : doc.body.innerHTML;
}


function normalizePublishedMediaUrls(html: string) {
  if (!/<video\b|<source\b/i.test(html)) return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  doc.querySelectorAll<HTMLVideoElement>("video").forEach((video) => {
    const src = String(video.getAttribute("src") || "").trim();
    const poster = String(video.getAttribute("poster") || "").trim();

    if (src) video.setAttribute("src", normalizeUrl(src));
    if (poster) video.setAttribute("poster", normalizeUrl(poster));

    video.setAttribute("controls", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("preload", "metadata");
    video.removeAttribute("autoplay");
  });

  doc.querySelectorAll<HTMLSourceElement>("video source[src]").forEach((source) => {
    const src = String(source.getAttribute("src") || "").trim();
    if (src) source.setAttribute("src", normalizeUrl(src));
  });

  return isFullHtmlDocument(html)
    ? `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`
    : doc.body.innerHTML;
}


function formatServicePrice(value: number | string | null | undefined) {
  const price = parseMoneyValue(value);
  return price.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function serviceTypeLabel(service: ServiceItem) {
  const type = String(service.tipo || "SERVICO").toUpperCase();
  if (type === "PACOTE") return "Pacote";
  if (type === "PROMOCAO") return "Promoção";
  return "Serviço";
}

function serviceCtaLabel(service: ServiceItem) {
  const type = String(service.tipo || "SERVICO").toUpperCase();
  if (type === "PACOTE") return "Contratar pacote";
  if (service.schedulingPolicy && service.schedulingPolicy !== "NO_SCHEDULING") {
    return "Agendar serviço";
  }
  return "Solicitar serviço";
}

function renderServicesHtml(services: ServiceItem[]) {
  if (!services.length) return "";

  return `
<div class="gc-generated-services-wrap">
  <div class="gc-generated-services-grid">
    ${services
      .map((service) => {
        const id = String(service.id || "");
        const name = String(service.nome || "Serviço");
        const description = String(service.descricao || "");
        const currentPrice = service.precoVigente ?? service.preco ?? 0;
        const duration = Number(service.duracaoMinutos || 0);
        const sessions = Number(service.totalSessoes || 0);
        const modality = String(service.modalidade || "").toUpperCase();
        const categoryId = String(service.categoriaId || "");
        const typeLabel = serviceTypeLabel(service);
        const ctaLabel = serviceCtaLabel(service);

        const details = [
          duration > 0 ? `${duration} min` : "",
          sessions > 1 ? `${sessions} sessões` : "",
          modality && modality !== "NAO_APLICA"
            ? modality === "AMBOS"
              ? "Presencial ou online"
              : modality === "PRESENCIAL"
                ? "Presencial"
                : modality === "ONLINE"
                  ? "Online"
                  : modality
            : "",
        ].filter(Boolean);

        return `
<article class="gc-generated-service-card" data-service-id="${escapeHtml(id)}" data-gc-item-id="${escapeHtml(id)}">
  <div class="gc-generated-service-card__body">
    <span class="gc-generated-service-card__type">${escapeHtml(typeLabel)}</span>
    <h3>${escapeHtml(name)}</h3>
    ${description ? `<p class="gc-generated-service-card__description">${escapeHtml(description)}</p>` : ""}
    ${details.length ? `<div class="gc-generated-service-card__details">${details.map((detail) => `<span>${escapeHtml(detail)}</span>`).join("")}</div>` : ""}
    <strong class="gc-generated-service-card__price">${escapeHtml(formatServicePrice(currentPrice))}</strong>
    <button
      type="button"
      data-action="service-detail"
      data-gc-action="service-detail"
      data-service-id="${escapeHtml(id)}"
      data-item-id="${escapeHtml(id)}"
      data-gc-item-id="${escapeHtml(id)}"
      data-service-name="${escapeHtml(name)}"
      data-service-description="${escapeHtml(description)}"
      class="gc-generated-service-card__detail"
    >
      Ver detalhes
    </button>
    <button
      type="button"
      data-action="request-service"
      data-gc-action="request-service"
      data-service-id="${escapeHtml(id)}"
      data-item-id="${escapeHtml(id)}"
      data-gc-item-id="${escapeHtml(id)}"
      data-service-name="${escapeHtml(name)}"
      data-service-description="${escapeHtml(description)}"
      ${categoryId ? `data-category-id="${escapeHtml(categoryId)}" data-categoria-id="${escapeHtml(categoryId)}"` : ""}
      class="gc-generated-service-card__cta"
    >
      ${escapeHtml(ctaLabel)}
    </button>
  </div>
</article>`;
      })
      .join("")}
  </div>
</div>`;
}

function injectServicePlaceholders(html: string, services: ServiceItem[]) {
  if (!html.includes("data-gc-services")) return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const servicesHtml = renderServicesHtml(services);

  doc.querySelectorAll<HTMLElement>("[data-gc-services]").forEach((element) => {
    element.innerHTML = servicesHtml;
  });

  return isFullHtmlDocument(html)
    ? `<!DOCTYPE html>\
${doc.documentElement.outerHTML}`
    : doc.body.innerHTML;
}

const GENERATED_SERVICES_STYLE = `
<style id="granconecta-generated-services-style">
  [data-gc-services] { width: 100%; }
  .gc-generated-services-wrap { width: 100%; max-width: 1120px; margin: 0 auto; padding: 0 20px; }
  .gc-generated-services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr)); gap: 22px; width: 100%; }
  .gc-generated-service-card { min-width: 0; border: 1px solid rgba(148,163,184,.28); border-radius: 18px; background: rgba(255,255,255,.96); box-shadow: 0 10px 30px rgba(15,23,42,.08); overflow: hidden; }
  .gc-generated-service-card__body { display: flex; flex-direction: column; height: 100%; padding: 22px; }
  .gc-generated-service-card__type { align-self: flex-start; margin-bottom: 12px; padding: 6px 10px; border-radius: 999px; background: rgba(15,23,42,.07); color: #334155; font-size: 12px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
  .gc-generated-service-card h3 { margin: 0 0 10px; color: #111827; font-size: 20px; line-height: 1.25; }
  .gc-generated-service-card__description { margin: 0 0 16px; color: #64748b; font-size: 14px; line-height: 1.55; }
  .gc-generated-service-card__details { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 16px; }
  .gc-generated-service-card__details span { padding: 6px 9px; border-radius: 999px; background: #f8fafc; color: #475569; font-size: 12px; font-weight: 700; }
  .gc-generated-service-card__price { display: block; margin-top: auto; margin-bottom: 16px; color: #111827; font-size: 22px; }
  .gc-generated-service-card__detail { width: 100%; border: 1px solid #111827; border-radius: 999px; background: #fff; color: #111827; padding: 11px 16px; margin-bottom: 10px; font: inherit; font-weight: 800; cursor: pointer; }
  .gc-generated-service-card__detail:hover { background: #f8fafc; }
  .gc-generated-service-card__detail { width: 100%; margin-bottom: 10px; border: 1px solid #111827; border-radius: 999px; background: #fff; color: #111827; padding: 11px 16px; font: inherit; font-weight: 800; cursor: pointer; }
  .gc-generated-service-card__detail:hover { background: #f8fafc; }
  .gc-generated-service-card__cta { width: 100%; border: 0; border-radius: 999px; background: #111827; color: #fff; padding: 12px 16px; font: inherit; font-weight: 800; cursor: pointer; }
  .gc-generated-service-card__cta:hover { opacity: .92; }
  @media (max-width: 640px) {
    .gc-generated-services-wrap { padding: 0 16px; }
    .gc-generated-services-grid { grid-template-columns: 1fr; gap: 18px; }
  }
</style>`;



export default function PageViewer() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cart, user, addToCart } = useAuth();

  const isDraftPreview =
    String(searchParams.get("preview") || "")
      .trim()
      .toLowerCase() === "draft";

  const opportunityToken =
    String(
      searchParams.get("o") || "",
    ).trim();

  const hasSavedOpportunityContext =
    Boolean(
      opportunityToken &&
      user &&
      localStorage.getItem(
        "granconecta_opportunity_customer_context",
      ),
    );

  const opportunityContinue =
    String(searchParams.get("continue") || "").trim() === "opportunity" ||
    hasSavedOpportunityContext;

  const opportunityAttachRef = useRef("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [page, setPage] = useState<PageData | null>(null);
  const [iframeHtml, setIframeHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [openNovaSolicitacao, setOpenNovaSolicitacao] = useState(false);
  const [selectedServico, setSelectedServico] = useState<any>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [_loadingStore, setLoadingStore] = useState(false);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [solicitacaoPayload, setSolicitacaoPayload] = useState<any>(null);

  const storeCart = cart[page?.id || ""] || [];

  const [modalProdutosOpen, setModalProdutosOpen] = useState(false);
  const [modalPresentesOpen, setModalPresentesOpen] = useState(false);
  const [modalOfertasOpen, setModalOfertasOpen] = useState(false);
  const [modalCombosOpen, setModalCombosOpen] = useState(false);
  const [modalInteresseOpen, setModalInteresseOpen] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<any>(null);
  const [modalDetalhesProdutoOpen, setModalDetalhesProdutoOpen] = useState(false);
  const [produtoDetalhesSelecionado, setProdutoDetalhesSelecionado] =
    useState<ProdutoDetalhes | null>(null);
  const [modalDetalhesServicoOpen, setModalDetalhesServicoOpen] = useState(false);
  const [servicoDetalhesSelecionado, setServicoDetalhesSelecionado] =
    useState<ServicoDetalhes | null>(null);

  // ESTADO DE CONTROLE EXCLUSIVO PARA EXIBIÇÃO DO CHAT COMPONENTE (REACT)
  const [isChatOpen, setIsChatOpen] = useState(false);

  /**
   * Sinal explícito para o ChatWidget executar novamente o bootstrap
   * somente DEPOIS que o PageViewer gravar o marcador pós-login.
   *
   * Isso elimina a corrida entre o useEffect do filho (ChatWidget)
   * e o useEffect do pai (PageViewer).
   */
  const [opportunityResumeSignal, setOpportunityResumeSignal] = useState(0);

  const [
    opportunityId,
    setOpportunityId,
  ] = useState("");

  const [
    opportunityValidated,
    setOpportunityValidated,
  ] = useState(false);

  const [
    opportunityChatbotTipo,
    setOpportunityChatbotTipo,
  ] = useState<"LOJA" | "PRESTADOR" | null>(
    null,
  );

  const isServicePage =
    page?.categoria_tag === "SERVICE" || page?.categoria_tag === "servico";

  useEffect(() => {
    const fetchProducts = async () => {
      if (!page?.id) return;

      if (!page.acessoComercialLiberado) {
        setProducts([]);
        return;
      }

      try {
        const res = await api.get(`/produtos/lojas/publicos/${page.id}`);
        const list = Array.isArray(res.data)
          ? res.data
          : res.data?.produtos || res.data?.products || [];

        setProducts(
          list.filter(
            (product: ProductItem) =>
              product.ativo !== false && product.ativo !== 0,
          ),
        );
      } catch (err) {
        console.error("Erro ao buscar produtos da loja:", err);
        setProducts([]);
      }
    };

    fetchProducts();
  }, [page?.id, page?.acessoComercialLiberado]);

  useEffect(() => {
    const fetchServices = async () => {
      if (!page?.id) {
        setServices([]);
        return;
      }

      if (!page.acessoComercialLiberado) {
        setServices([]);
        return;
      }

      try {
        const res = await api.get(
          `/business-catalog/public/${encodeURIComponent(page.id)}/services`,
        );

        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.items)
            ? res.data.items
            : [];

        setServices(
          list.filter((item: ServiceItem) => {
            const type = String(item?.tipo || "").toUpperCase();
            return Boolean(item?.id) && ["SERVICO", "PACOTE", "PROMOCAO"].includes(type);
          }),
        );
      } catch (err) {
        console.error("Erro ao buscar serviços do catálogo:", err);
        setServices([]);
      }
    };

    void fetchServices();
  }, [page?.id, page?.acessoComercialLiberado]);

  useEffect(() => {
    const fetchStore = async () => {
      if (!page?.id) return;

      try {
        setLoadingStore(true);

        const res = await api.get(`/lojas/publica/id/${page.id}`);

        setStore({
          ...res.data,
          telefone_whatsapp: resolveWhatsappFromAny(res.data),
        });

        setPage((paginaAtual) => {
          if (!paginaAtual) return paginaAtual;

          const novoAcesso =
            paginaAtual.acessoComercialLiberado &&
            acessoComercialLiberado(res.data);

          if (
            novoAcesso ===
            paginaAtual.acessoComercialLiberado
          ) {
            return paginaAtual;
          }

          return {
            ...paginaAtual,
            acessoComercialLiberado: novoAcesso,
          };
        });
      } catch (err) {
        console.error("Erro ao buscar loja:", err);
      } finally {
        setLoadingStore(false);
      }
    };

    fetchStore();
  }, [page?.id]);

  const fetchPage = useCallback(async () => {
    if (!slug) return;

    const controller = new AbortController();

    try {
      setLoading(true);
      setError(false);

      const res = await api.get<PublicStoreResponse>(
        `/lojas/publica/slug/${slug}`,
        { signal: controller.signal },
      );

      const rawData = res.data;

      console.log("PAGEVIEWER LOJA PUBLICA RESPONSE:", rawData);
      console.log("PAGEVIEWER SLUG:", slug);
      console.log("PAGEVIEWER STORE ID RAW:", rawData?.id);
      console.log("PAGEVIEWER OWNER/USUARIO RAW:", rawData?.usuarioId);

      const selectedHtml = isDraftPreview
        ? (
          rawData.pageHtmlDraft ||
          rawData.pageHtmlPublished ||
          rawData.descricao_loja ||
          ""
        )
        : (
          rawData.pageHtmlPublished ||
          rawData.pageHtmlDraft ||
          rawData.descricao_loja ||
          ""
        );

      const selectedCss = isDraftPreview
        ? (
          rawData.pageCssDraft ||
          rawData.pageCssPublished ||
          ""
        )
        : (
          rawData.pageCssPublished ||
          ""
        );

      console.log(
        "[PAGEVIEWER] MODO:",
        isDraftPreview ? "DRAFT_PREVIEW" : "PUBLICADO",
      );

      const content = stripHeavyInlineImages(
        unwrapIframeSrcDoc(selectedHtml),
      );

      const isFullDocument = isFullHtmlDocument(content);

      setPage({
        id: rawData.id || "",
        title: rawData.name || "Sem título",
        content,
        layout: isFullDocument ? [] : parseLayoutSections(rawData.layoutConfig),
        updatedAt: rawData.updatedAt,
        logo_url: rawData.logo_url,
        css: isFullDocument ? "" : selectedCss,
        bodyBgColor: rawData.bodyBgColor || "#ffffff",
        footerBgColor: rawData.footerBgColor || "#1a1a1a",
        footerTextColor: rawData.footerTextColor || "#ffffff",
        telefone_whatsapp: resolveWhatsappFromAny(rawData),
        usuarioId: rawData.usuarioId || "",
        condominio_id: rawData.condominio_id || null,
        categoriaId: rawData.categoriaId || rawData.categoriaid || null,
        categoria_tag: rawData.categoria_tag || "",
        tipo: rawData.tipo || "",
        acessoComercialLiberado: acessoComercialLiberado(rawData),
      });
    } catch (e: any) {
      if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;

      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  }, [slug, isDraftPreview]);

  useEffect(() => {
    if (slug) {
      fetchPage();
    }
  }, [slug, fetchPage]);

  useEffect(() => {
    if (
      !slug ||
      !opportunityToken
    ) {
      setOpportunityId("");
      setOpportunityValidated(false);
      setOpportunityChatbotTipo(null);
      return;
    }

    let cancelled =
      false;

    const resolveOpportunity =
      async () => {
        try {
          const response =
            await api.get<OpportunityPublicResponse>(
              `/marketing/opportunities/public/${encodeURIComponent(
                opportunityToken,
              )}`,
              {
                params: {
                  slug,
                },
              },
            );

          if (
            cancelled ||
            !response.data?.success ||
            !response.data.opportunityId
          ) {
            return;
          }

          setOpportunityId(
            response.data.opportunityId,
          );

          setOpportunityValidated(
            true,
          );

          setOpportunityChatbotTipo(
            response.data.store?.chatbotTipo ===
              "PRESTADOR"
              ? "PRESTADOR"
              : "LOJA",
          );

          /*
           * O usuário veio de um CTA da campanha para continuar
           * o atendimento. Abrimos o chat automaticamente.
           */
          setIsChatOpen(true);

          console.log(
            "[PAGEVIEWER OPPORTUNITY] Oportunidade validada",
            {
              opportunityId:
                response.data.opportunityId,
              slug,
              storeId:
                response.data.store?.id ||
                null,
            },
          );
        } catch (error: any) {
          if (cancelled) {
            return;
          }

          setOpportunityId("");
          setOpportunityValidated(false);
          setOpportunityChatbotTipo(null);

          console.error(
            "[PAGEVIEWER OPPORTUNITY] Falha ao validar oportunidade",
            error?.response?.data ||
            error,
          );

          toast.error(
            error?.response?.data?.message ||
            "Este link de atendimento não é mais válido.",
          );
        }
      };

    void resolveOpportunity();

    return () => {
      cancelled = true;
    };
  }, [
    slug,
    opportunityToken,
  ]);

  /**
   * ================================================================
   * RETORNO PÓS-LOGIN DA OPORTUNIDADE
   * ================================================================
   *
   * Nova arquitetura:
   *
   * Login
   *   ↓
   * PageViewer APENAS sinaliza a retomada
   *   ↓
   * abre o ChatWidget
   *   ↓
   * ChatWidget envia opportunityBootstrap=true + userId
   *   ↓
   * GranConectaChatService
   *   ↓
   * CommercialConversionOrchestrator
   *
   * IMPORTANTE:
   *
   * O PageViewer NÃO chama mais
   * attach-authenticated-customer.
   *
   * Essa rota antiga também executava o
   * MarketingOpportunityConversionService e criava
   * solicitação/candidatura em paralelo ao novo CommercialFlow.
   */
  useEffect(() => {
    const authenticatedUserId =
      String(
        (user as any)?.usuarioId ||
        (user as any)?.id ||
        "",
      ).trim();

    if (
      !opportunityContinue ||
      !opportunityToken ||
      !opportunityValidated ||
      !opportunityId ||
      !authenticatedUserId
    ) {
      if (opportunityContinue) {
        console.log(
          "[PAGEVIEWER OPPORTUNITY] Pós-login aguardando pré-requisitos",
          {
            opportunityToken:
              Boolean(opportunityToken),

            opportunityValidated,

            opportunityId:
              opportunityId ||
              null,

            authenticatedUserId:
              authenticatedUserId ||
              null,

            userKeys:
              user &&
                typeof user === "object"
                ? Object.keys(
                  user as any,
                )
                : [],
          },
        );
      }

      return;
    }

    const resumeKey =
      `${opportunityToken}:${authenticatedUserId}`;

    if (
      opportunityAttachRef.current ===
      resumeKey
    ) {
      return;
    }

    opportunityAttachRef.current =
      resumeKey;

    try {
      let opportunityCustomerContext:
        any = {};

      try {
        opportunityCustomerContext =
          JSON.parse(
            localStorage.getItem(
              "granconecta_opportunity_customer_context",
            ) || "{}",
          );
      } catch {
        opportunityCustomerContext =
          {};
      }

      const authenticatedName =
        String(
          (user as any)?.name ||
          opportunityCustomerContext?.nome ||
          "",
        ).trim();

      const authenticatedEmail =
        String(
          (user as any)?.email ||
          opportunityCustomerContext?.email ||
          "",
        )
          .trim()
          .toLowerCase();

      const authenticatedPhone =
        String(
          (user as any)?.telefone ||
          opportunityCustomerContext?.telefone ||
          "",
        ).trim();

      /**
       * ============================================================
       * MARCADOR CONSUMIDO PELO CHATWIDGET
       * ============================================================
       *
       * O ChatWidget usa esta chave para executar novamente o
       * opportunityBootstrap MESMO quando a conversationId já existe.
       *
       * Ele envia:
       *
       * - mesma conversationId;
       * - opportunityId;
       * - opportunityBootstrap: true;
       * - userId autenticado.
       *
       * O backend então vincula customerUserId ao CommercialFlow
       * e continua de AGUARDANDO_LOGIN.
       */
      localStorage.setItem(
        "granconecta_opportunity_resume_after_login",
        JSON.stringify({
          opportunityId,

          opportunityToken,

          userId:
            authenticatedUserId,

          nome:
            authenticatedName ||
            undefined,

          email:
            authenticatedEmail ||
            undefined,

          telefone:
            authenticatedPhone ||
            undefined,

          storeSlug:
            slug,

          createdAt:
            new Date()
              .toISOString(),
        }),
      );

      /**
       * IMPORTANTE:
       * só sinalizamos o ChatWidget depois que o marcador já existe.
       * O incremento força o effect do widget a rodar novamente mesmo que
       * open, opportunityId, conversationStorageKey e userId já tenham o
       * mesmo valor desde a montagem.
       */
      setOpportunityResumeSignal((current) => current + 1);

      /**
       * O contexto de identificação já foi incorporado ao marcador
       * de retomada. Pode ser removido.
       */
      localStorage.removeItem(
        "granconecta_opportunity_customer_context",
      );

      /**
       * Remove somente o marcador ?continue=opportunity.
       *
       * O token ?o= continua na URL para preservar o contexto da
       * oportunidade.
       */
      navigate(
        `/pagina/${slug}?o=${encodeURIComponent(
          opportunityToken,
        )}`,
        {
          replace:
            true,
        },
      );

      /**
       * Abre o chat. O ChatWidget fará a chamada real ao backend.
       */
      setIsChatOpen(
        true,
      );

      console.log(
        "[PAGEVIEWER OPPORTUNITY] Retomada pós-login entregue ao ChatWidget",
        {
          opportunityId,

          authenticatedUserId,

          storeSlug:
            slug,

          resumeFlag:
            true,
        },
      );

      toast.success(
        "Login confirmado. Continuando sua contratação no atendimento.",
      );
    } catch (error) {
      /**
       * Em caso de erro local, liberamos nova tentativa.
       */
      opportunityAttachRef.current =
        "";

      console.error(
        "[PAGEVIEWER OPPORTUNITY] Falha ao preparar retomada pós-login",
        error,
      );

      toast.error(
        "Não foi possível retomar o atendimento após o login.",
      );
    }
  }, [
    navigate,
    opportunityContinue,
    opportunityId,
    opportunityToken,
    opportunityValidated,
    slug,
    user,
  ]);

  const buildBridgeScript = useCallback(() => {
    const resolvedStoreId = page?.id || "";
    const resolvedStoreName = page?.title || "";
    const resolvedUsuarioId = page?.usuarioId || "";
    const resolvedWhatsapp =
      resolveWhatsappFromAny(page) || resolveWhatsappFromAny(store);
    const resolvedChatbotTipo =
      String(page?.tipo || "").toUpperCase() === "PRESTADOR"
        ? "PRESTADOR"
        : "LOJA";

    const resolvedOpportunityId =
      opportunityValidated
        ? opportunityId
        : "";

    console.log("PAGEVIEWER CONTEXTO CHAT:", {
      slug,
      resolvedStoreId,
      resolvedStoreName,
      resolvedUsuarioId,
      page,
    });

    return `
<script id="granconecta-public-bridge">
  window.GRAN_CHAT_CONTEXT = {
    chatbotTipo: ${JSON.stringify(resolvedChatbotTipo)},
    chatbotOwnerId: ${JSON.stringify(resolvedStoreId)},
    storeId: ${JSON.stringify(resolvedStoreId)},
    lojaId: ${JSON.stringify(resolvedStoreId)},
    usuarioId: ${JSON.stringify(resolvedUsuarioId)},
    origem: "LANDING_PAGE",
    storeName: ${JSON.stringify(resolvedStoreName)},
    storeWhatsapp: ${JSON.stringify(resolvedWhatsapp)},
    opportunityId: ${JSON.stringify(resolvedOpportunityId)}
  };

  console.log("GRAN_CHAT_CONTEXT DENTRO DO IFRAME:", window.GRAN_CHAT_CONTEXT);

  let lastProductClick = null;

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\\u0300-\\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function withChatContext(payload) {
    return {
      ...(payload || {}),
      chatbotTipo: window.GRAN_CHAT_CONTEXT.chatbotTipo,
      chatbotOwnerId: window.GRAN_CHAT_CONTEXT.chatbotOwnerId,
      storeId: window.GRAN_CHAT_CONTEXT.storeId,
      lojaId: window.GRAN_CHAT_CONTEXT.lojaId,
      usuarioId: window.GRAN_CHAT_CONTEXT.usuarioId,
      origem: window.GRAN_CHAT_CONTEXT.origem,
      storeName: window.GRAN_CHAT_CONTEXT.storeName,
      storeWhatsapp: window.GRAN_CHAT_CONTEXT.storeWhatsapp,
      opportunityId: window.GRAN_CHAT_CONTEXT.opportunityId
    };
  }

  function post(type, payload) {
    const finalPayload = withChatContext(payload);

    console.log("POST_MESSAGE PARA PAI:", {
      type: type,
      payload: finalPayload
    });

    window.parent.postMessage({
      type: type,
      payload: finalPayload
    }, "*");
  }

  function openChatWidget() {
    var button =
      document.querySelector(".gc-chatbot-button") ||
      document.querySelector("[data-action='open-chatbot']") ||
      document.querySelector("[data-gc-chatbot-open]");

    if (button) {
      button.click();
      return true;
    }

    var panel = document.querySelector(".gc-chatbot-panel");
    if (panel) {
      panel.style.display = "block";
      panel.setAttribute("aria-hidden", "false");
      return true;
    }

    return false;
  }

  function resolveAction(target) {
    var action = normalizeText(
      target.getAttribute("data-gc-action") ||
      target.getAttribute("data-action") ||
      ""
    );

    if (action === "add-to-cart") return "add-to-cart";
    if (action === "product-detail") return "product-detail";
    if (action === "service-detail") return "service-detail";

    // CTAs explícitos de conversão sempre abrem a solicitação contextual.
    if (
      action === "request" ||
      action === "request-quote" ||
      action === "request-service" ||
      action === "schedule-service" ||
      action === "hire-service" ||
      action === "service-request" ||
      action === "open-service-modal" ||
      action === "open-solicitacao-modal" ||
      action === "solicitar" ||
      action === "solicitacao" ||
      action === "agendar" ||
      action === "orcamento" ||
      action === "orçamento" ||
      action === "contratar"
    ) {
      return "request-quote";
    }

    // CTAs explícitos de conversa continuam abrindo o ChatWidget.
    if (
      action === "chat" ||
      action === "open-chat" ||
      action === "open-chatbot" ||
      action === "talk" ||
      action === "falar"
    ) {
      return "open-chat";
    }

    if (action) return action;

    if (target.hasAttribute("data-gc-add-to-cart")) return "add-to-cart";
    if (target.hasAttribute("data-gc-wishlist")) return "add-to-wishlist";

    var text = normalizeText(target.innerText || target.textContent || "");

    if (
      text.includes("falar no chat") ||
      text.includes("falar com atendimento") ||
      text.includes("chat") ||
      text.includes("atendimento online")
    ) {
      return "open-chat";
    }

    if (
      text.includes("falar agora") ||
      text.includes("fale pelo whatsapp") ||
      text.includes("falar pelo whatsapp") ||
      text.includes("whatsapp") ||
      text.includes("chamar no whatsapp")
    ) {
      return "open-whatsapp";
    }

    if (
      text.includes("aproveitar desconto") ||
      text.includes("desconto real") ||
      text.includes("descontos") ||
      text.includes("promocao") ||
      text.includes("promoção") ||
      text.includes("promocoes") ||
      text.includes("promoções") ||
      text.includes("oferta") ||
      text.includes("ofertas") ||
      text.includes("liquidacao") ||
      text.includes("liquidação")
    ) {
      return "open-offers";
    }

    if (
      text.includes("combo") ||
      text.includes("combos") ||
      text.includes("kit") ||
      text.includes("kits") ||
      text.includes("pacote") ||
      text.includes("pacotes")
    ) {
      return "open-combos";
    }

    if (
      text.includes("ver produto") ||
      text.includes("ver produtos") ||
      text.includes("ver catalogo") ||
      text.includes("ver catálogo") ||
      text.includes("catalogo") ||
      text.includes("catálogo") ||
      text.includes("colecoes") ||
      text.includes("coleções") ||
      text.includes("conheca nossas colecoes") ||
      text.includes("conheça nossas coleções")
    ) {
      return "open-products";
    }

    if (
      text.includes("desejo") ||
      text.includes("favorito") ||
      text.includes("tenho interesse")
    ) {
      return "add-to-wishlist";
    }

    if (
      text.includes("adicionar ao carrinho") ||
      text.includes("comprar") ||
      text.includes("pedir agora") ||
      text.includes("comprar agora")
    ) {
      return "add-to-cart";
    }

    if (text.includes("carrinho")) {
      return "open-cart";
    }

    if (
      text.includes("solicitar") ||
      text.includes("agendar") ||
      text.includes("orcamento") ||
      text.includes("orçamento") ||
      text.includes("quero contratar") ||
      text.includes("contratar agora") ||
      text.includes("contratar serviço") ||
      text.includes("contratar servico") ||
      text.includes("quero atendimento") ||
      text.includes("iniciar atendimento")
    ) {
      return "request-quote";
    }

    return "";
  }

  window.addEventListener("granconecta:add-to-cart", function(e) {
    post("ADD_TO_CART", e.detail || {});
  });

  window.addEventListener("granconecta:open-contact-modal", function(e) {
    post("OPEN_LEAD_MODAL", e.detail || {});
  });

  window.addEventListener("granconecta:open-custom-order-modal", function(e) {
    post("OPEN_LEAD_MODAL", e.detail || {});
  });

  window.addEventListener("granconecta:open-lead-modal", function(e) {
    post("OPEN_LEAD_MODAL", e.detail || {});
  });

  window.addEventListener("granconecta:open-whatsapp", function(e) {
    post("OPEN_WHATSAPP", e.detail || {});
  });

  window.addEventListener("message", function(e) {
    if (!e.data || !e.data.type) return;

    if (e.data.type === "OPEN_WHATSAPP") {
      post("OPEN_WHATSAPP", e.data.payload || {});
    }

    if (e.data.type === "OPEN_SOLICITACAO_MODAL") {
      post("OPEN_SOLICITACAO_MODAL", e.data.payload || {});
    }

    if (e.data.type === "CHAT_MESSAGE") {
      post("CHAT_MESSAGE", e.data.payload || {});
    }
  });

  document.addEventListener("click", function(e) {
    const target = e.target.closest("[data-product-id], [data-gc-add-to-cart], [data-gc-wishlist], [data-action], [data-gc-action], a, button");
    if (!target) return;

    // Âncoras internas têm prioridade sobre a interpretação semântica dos CTAs.
    // Ex.: um menu com href="#produtos" não pode ser confundido com "abrir produtos".
    const internalHref = target.getAttribute("href") || "";
    if (internalHref.startsWith("#") && internalHref.length > 1) {
      const anchorId = decodeURIComponent(internalHref.slice(1));
      const anchorTarget = document.getElementById(anchorId);

      if (anchorTarget) {
        e.preventDefault();
        e.stopPropagation();
        anchorTarget.scrollIntoView({ behavior: "smooth", block: "start" });

        try {
          history.replaceState(null, "", "#" + encodeURIComponent(anchorId));
        } catch (_) {}

        return;
      }
    }

    const explicitAction =
      target.getAttribute("data-action") ||
      target.getAttribute("data-gc-action") ||
      "";

    const action = resolveAction(target);
    const text = normalizeText(target.innerText || target.textContent || "");

    const productCard = target.closest("[data-gc-product-card='true'], .gc-vitrine-card, .j2-card, article[data-product-id]");

    const productId =
      target.getAttribute("data-product-id") ||
      productCard?.getAttribute("data-product-id") ||
      target.closest("[data-product-id]")?.getAttribute("data-product-id") ||
      "";

    // Detalhe de produto: o PageViewer abre o produto real do GranConecta.
    if (action === "product-detail" || explicitAction === "product-detail") {
      e.preventDefault();
      e.stopPropagation();

      post("OPEN_PRODUCT_DETAIL", {
        id: productId,
        productId: productId,
        produtoId: productId,
        name: target.getAttribute("data-product-name") || productCard?.querySelector("h3")?.textContent?.trim() || "Produto",
        description: target.getAttribute("data-product-description") || "",
        price: target.getAttribute("data-product-price") || "",
        image: target.getAttribute("data-product-image") || productCard?.querySelector("img")?.getAttribute("src") || ""
      });
      return;
    }

    // Detalhe de serviço/pacote: mantém o item real do BusinessCatalog.
    if (action === "service-detail" || explicitAction === "service-detail") {
      e.preventDefault();
      e.stopPropagation();

      const serviceId =
        target.getAttribute("data-service-id") ||
        target.getAttribute("data-item-id") ||
        target.getAttribute("data-gc-item-id") ||
        "";

      post("OPEN_SERVICE_DETAIL", {
        id: serviceId,
        serviceId: serviceId,
        itemId: serviceId,
        nome: target.getAttribute("data-service-name") || target.innerText.trim() || "Serviço",
        descricao: target.getAttribute("data-service-description") || ""
      });
      return;
    }

    // 1. Lista de desejos tem prioridade sobre data-action errado.
    // Exemplo real: botão "Lista de desejos" veio com data-action="open-chat".
    if (
      text.includes("lista de desejos") ||
      text.includes("lista de desejo") ||
      text.includes("desejos") ||
      text.includes("desejo") ||
      text.includes("favorito") ||
      explicitAction === "add-to-wishlist" ||
      action === "add-to-wishlist"
    ) {
      e.preventDefault();
      e.stopPropagation();

      post("GC_WISHLIST", {
        id: productId,
        produtoId: productId,
        productId: productId,
        titulo:
          target.getAttribute("data-product-name") ||
          productCard?.querySelector("h3")?.textContent?.trim() ||
          target.innerText.trim(),
        descricao: "Cliente demonstrou interesse pela lista de desejos.",
        image:
          target.getAttribute("data-product-image") ||
          productCard?.querySelector("img")?.getAttribute("src") ||
          ""
      });

      return;
    }

    // 2. Ofertas e descontos abrem vitrine promocional.
    if (
      action === "open-offers" ||
      explicitAction === "open-offers" ||
      action === "open-promotions" ||
      explicitAction === "open-promotions" ||
      text.includes("aproveitar desconto") ||
      text.includes("desconto real") ||
      text.includes("descontos") ||
      text.includes("promocao") ||
      text.includes("promoção") ||
      text.includes("promocoes") ||
      text.includes("promoções") ||
      text.includes("oferta") ||
      text.includes("ofertas") ||
      text.includes("liquidacao") ||
      text.includes("liquidação")
    ) {
      e.preventDefault();
      e.stopPropagation();

      post("OPEN_OFFERS_MODAL", {
        source: "landing",
        text: target.innerText || "",
        action: "open-offers"
      });

      return;
    }

    // 3. Combos, kits e pacotes promocionais.
    if (
      action === "open-combos" ||
      explicitAction === "open-combos" ||
      text.includes("combo") ||
      text.includes("combos") ||
      text.includes("kit") ||
      text.includes("kits") ||
      text.includes("pacote") ||
      text.includes("pacotes")
    ) {
      e.preventDefault();
      e.stopPropagation();

      post("OPEN_COMBOS_MODAL", {
        source: "landing",
        text: target.innerText || "",
        action: "open-combos"
      });

      return;
    }

    // 4. Conhecer peças / produtos abre ModalProdutosLoja.
    if (
      action === "open-products" ||
      action === "open-products-modal" ||
      explicitAction === "open-products" ||
      explicitAction === "open-products-modal" ||
      text.includes("conhecer pecas") ||
      text.includes("conheca as pecas") ||
      text.includes("conheca nossas pecas") ||
      text.includes("conhecer peças") ||
      text.includes("ver produtos") ||
      text.includes("ver produto") ||
      text.includes("produtos") ||
      text.includes("catalogo") ||
      text.includes("catálogo") ||
      text.includes("colecoes") ||
      text.includes("coleções")
    ) {
      e.preventDefault();
      e.stopPropagation();

      post("OPEN_PRODUCTS_MODAL", {
        source: "landing",
        text: target.innerText || ""
      });

      return;
    }

    // 3. Presentes abre ModalProdutosLoja em modo presentes.
    if (
      action === "open-gifts-modal" ||
      explicitAction === "open-gifts-modal" ||
      text.includes("escolher presente") ||
      text.includes("presentes")
    ) {
      e.preventDefault();
      e.stopPropagation();

      post("OPEN_GIFTS_MODAL", {
        source: "landing",
        text: target.innerText || ""
      });

      return;
    }

    // 4. Carrinho.
    if (
      action === "open-cart" ||
      action === "add-to-cart" ||
      explicitAction === "open-cart" ||
      explicitAction === "add-to-cart" ||
      target.hasAttribute("data-gc-add-to-cart")
    ) {
      e.preventDefault();
      e.stopPropagation();

      if (!productId) {
        post("OPEN_PRODUCTS_MODAL", {
          source: "missing-product-id",
          text: target.innerText.trim()
        });
        return;
      }

      if (lastProductClick === productId) return;
      lastProductClick = productId;

      setTimeout(function() {
        lastProductClick = null;
      }, 300);

      post("ADD_TO_CART", {
        id: productId,
        productId: productId,
        name:
          target.getAttribute("data-product-name") ||
          productCard?.querySelector("h3")?.textContent?.trim() ||
          target.innerText.trim(),
        price:
          target.getAttribute("data-product-price") ||
          productCard?.querySelector("strong")?.textContent?.trim() ||
          "",
        image:
          target.getAttribute("data-product-image") ||
          productCard?.querySelector("img")?.getAttribute("src") ||
          ""
      });

      return;
    }

    if (
      action === "open-chat" ||
      action === "open-contact-modal" ||
      explicitAction === "open-chat" ||
      explicitAction === "open-contact-modal" ||
      text.includes("falar com atendimento") ||
      text.includes("falar com atendente") ||
      text.includes("falar agora") ||
      text.includes("falar no chat") ||
      text.includes("chat") ||
      text.includes("atendimento")
    ) {
      e.preventDefault();
      e.stopPropagation();

      if (!openChatWidget()) {
        post("OPEN_CHAT", {
          source: "landing",
          text: target.innerText || ""
        });
      } else {
        post("OPEN_CHAT", {
          source: "landing-widget",
          text: target.innerText || ""
        });
      }

      return;
    }

    if (action === "open-whatsapp" || explicitAction === "open-whatsapp") {
      e.preventDefault();
      e.stopPropagation();

      const phone =
        target.getAttribute("data-whatsapp") ||
        document.body.getAttribute("data-store-whatsapp") ||
        window.GRAN_CHAT_CONTEXT.storeWhatsapp ||
        "";
      const message =
        target.getAttribute("data-message") ||
        "Olá, vim pelo site da " + (window.GRAN_CHAT_CONTEXT.storeName || "loja") + ".";
      const href = target.getAttribute("href") || "";

      const url = phone
        ? "https://wa.me/" + String(phone).replace(/\D/g, "") + "?text=" + encodeURIComponent(message)
        : href;

      post("OPEN_WHATSAPP", {
        url: url,
        whatsapp: phone,
        message: message
      });

      return;
    }

    if (
      action === "request-quote" ||
      action === "request-service" ||
      action === "schedule-service" ||
      action === "hire-service" ||
      action === "open-custom-order-modal"
    ) {
      e.preventDefault();
      e.stopPropagation();

      const categoriaId =
        target.getAttribute("data-category-id") ||
        target.getAttribute("data-categoria-id") ||
        target.getAttribute("data-service-category-id") ||
        "";

      const serviceId =
        target.getAttribute("data-service-id") ||
        target.getAttribute("data-item-id") ||
        target.getAttribute("data-gc-item-id") ||
        "";

      post("SERVICE_REQUEST", {
        titulo:
          target.getAttribute("data-service-name") ||
          target.getAttribute("data-title") ||
          target.innerText.trim() ||
          "Solicitação de atendimento",
        descricao:
          target.getAttribute("data-description") ||
          target.getAttribute("data-service-description") ||
          "Interesse via landing page",
        categoriaId: categoriaId || null,
        serviceId: serviceId || null,
        itemId: serviceId || null,
        produtoId: productId || null,
        productId: productId || null,
        action: action,
        source: "landing"
      });

      return;
    }

    const href = target.getAttribute("href") || "";

    if (href.includes("wa.me") || href.includes("api.whatsapp.com")) {
      e.preventDefault();

      window.open(href, "_blank");

      post("WHATSAPP_CLICK", {
        url: href
      });
    }
  }, true);
</script>`;
  }, [page, slug, store, opportunityId, opportunityValidated]);

  const buildIframeHtml = useCallback(
    (rawHtml: string, pageData: PageData) => {
      const bridgeScript = buildBridgeScript();
      const optimizedHtml = stripHeavyInlineImages(rawHtml);

      const contextScript = `
      <script id="granconecta-context-before-chat">
        window.GRAN_CHAT_CONTEXT = {
          chatbotTipo: ${JSON.stringify(
        String(pageData.tipo || "").toUpperCase() === "PRESTADOR"
          ? "PRESTADOR"
          : "LOJA",
      )},
          chatbotOwnerId: ${JSON.stringify(pageData.id || "")},
          storeId: ${JSON.stringify(pageData.id || "")},
          lojaId: ${JSON.stringify(pageData.id || "")},
          usuarioId: ${JSON.stringify(pageData.usuarioId || "")},
          origem: "LANDING_PAGE",
          storeName: ${JSON.stringify(pageData.title || "")},
          storeWhatsapp: ${JSON.stringify(
        resolveWhatsappFromAny(pageData) || resolveWhatsappFromAny(store),
      )}
        };

        document.addEventListener("DOMContentLoaded", function () {
          document.body.setAttribute("data-chatbot-tipo", ${JSON.stringify(
        String(pageData.tipo || "").toUpperCase() === "PRESTADOR"
          ? "PRESTADOR"
          : "LOJA",
      )});
          document.body.setAttribute("data-chatbot-owner-id", ${JSON.stringify(pageData.id || "")});
          document.body.setAttribute("data-store-id", ${JSON.stringify(pageData.id || "")});
          document.body.setAttribute("data-store-name", ${JSON.stringify(pageData.title || "")});
          document.body.setAttribute("data-store-whatsapp", ${JSON.stringify(
        resolveWhatsappFromAny(pageData) || resolveWhatsappFromAny(store),
      )});
        });

        console.log("GRAN_CHAT_CONTEXT ANTES DO CHAT:", window.GRAN_CHAT_CONTEXT);
      </script>
      `;

      const htmlWithContext = optimizedHtml.replace(
        /<head([^>]*)>/i,
        `<head$1>${contextScript}`,
      );

      const htmlWithMedia = normalizePublishedMediaUrls(htmlWithContext);
      const htmlWithProducts = injectProductPlaceholders(htmlWithMedia, products);
      const htmlWithServices = injectServicePlaceholders(htmlWithProducts, services);

      if (isFullHtmlDocument(htmlWithServices)) {
        const cleanHtml = removeViewerArtifacts(htmlWithServices);

        const generatorCss = `
    <style id="granconecta-published-page-css">
      ${pageData.css || ""}
    </style>
  `;

        const htmlWithPublishedCss = cleanHtml.replace(
          /<\/head>/i,
          `${generatorCss}${GENERATED_SERVICES_STYLE}${MOBILE_PUBLIC_FIX_STYLE}</head>`,
        );

        return injectBeforeClosingBody(
          htmlWithPublishedCss,
          bridgeScript,
        );
      }

      const fallbackStyle = `
      <style id="granconecta-public-viewer-style">
        ${pageData.css || ""}

        html,
        body {
          margin: 0;
          padding: 0;
          width: 100%;
          overflow-x: hidden;
          background: ${pageData.bodyBgColor || "#ffffff"};
        }
      </style>`;


      return `<!DOCTYPE html>
                <html lang="pt-BR">
                <head>
                  <meta charset="UTF-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                  ${fallbackStyle}
                  ${GENERATED_SERVICES_STYLE}
                  ${MOBILE_PUBLIC_FIX_STYLE}
                </head>
                <body>
                  ${htmlWithServices}
                  ${bridgeScript}
                </body>
                </html>`;
    },
    [buildBridgeScript, products, services, store],
  );

  useEffect(() => {
    if (!page) return;

    setIframeHtml(buildIframeHtml(page.content, page));
  }, [page, buildIframeHtml, products, services]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;

      doc.documentElement.style.width = "100%";
      doc.documentElement.style.maxWidth = "100%";
      doc.documentElement.style.overflowX = "hidden";
      doc.body.style.width = "100%";
      doc.body.style.maxWidth = "100%";
      doc.body.style.overflowX = "hidden";
      doc.body.classList.add("gc-page-viewer-safe-scroll");

      // Normaliza os vídeos publicados pelo Generator sem alterar o layout.
      // Garante controles nativos, reprodução por clique e recarrega a mídia após srcDoc.
      const preparePublishedVideos = () => {
        doc.querySelectorAll<HTMLVideoElement>("video").forEach((video) => {
          video.controls = true;
          video.setAttribute("controls", "");
          video.setAttribute("playsinline", "");
          video.setAttribute("preload", "metadata");
          video.removeAttribute("autoplay");
          video.style.setProperty("max-width", "100%", "important");
          video.style.setProperty("height", "auto", "important");
          video.style.setProperty("display", "block", "important");
          video.style.setProperty("pointer-events", "auto", "important");

          const directSrc = String(video.getAttribute("src") || "").trim();
          const source = video.querySelector<HTMLSourceElement>("source[src]");
          const sourceSrc = String(source?.getAttribute("src") || "").trim();

          // Se o Generator colocou a URL em <source>, preserva o source.
          // Se colocou em src, o navegador usa diretamente.
          if (directSrc || sourceSrc) {
            try {
              video.load();
            } catch (error) {
              console.warn("[PAGEVIEWER VIDEO] Não foi possível recarregar o vídeo", error);
            }
          } else {
            console.warn("[PAGEVIEWER VIDEO] Vídeo publicado sem src/source", video);
          }

          video.addEventListener("error", () => {
            console.error("[PAGEVIEWER VIDEO] Erro de reprodução", {
              src: directSrc || sourceSrc,
              currentSrc: video.currentSrc,
              networkState: video.networkState,
              readyState: video.readyState,
              mediaError: video.error?.code || null,
            });
          });
        });
      };

      preparePublishedVideos();

      /**
       * Mantém somente o botão flutuante oficial do PageViewer.
       * Oculta apenas botões/widgets flutuantes dentro do iframe.
       * CTAs normais de WhatsApp continuam visíveis e funcionais.
       */
      const removeDuplicateFloatingButtons = () => {
        const selectors = [
          ".gc-chatbot-button",
          ".gc-whatsapp-floating",
          ".gc-whatsapp-float",
          ".whatsapp-floating",
          ".floating-whatsapp",
          ".whatsapp-float",
          ".whatsapp-button-floating",
          ".floating-chat",
          ".floating-chat-button",
          "[data-gc-chatbot-open]",
          "[data-floating-whatsapp]",
          "[data-whatsapp-floating]",
        ];

        selectors.forEach((selector: string) => {
          doc
            .querySelectorAll<HTMLElement>(selector)
            .forEach((element: HTMLElement) => {
              element.style.setProperty(
                "display",
                "none",
                "important",
              );

              element.setAttribute(
                "data-gc-floating-hidden",
                "true",
              );
            });
        });

        doc
          .querySelectorAll<HTMLElement>(
            'a[href*="wa.me"], a[href*="api.whatsapp.com"], [data-action="open-whatsapp"], [data-gc-action="open-whatsapp"]',
          )
          .forEach((element: HTMLElement) => {
            const computed =
              doc.defaultView?.getComputedStyle(
                element,
              );

            if (
              computed?.position === "fixed"
            ) {
              element.style.setProperty(
                "display",
                "none",
                "important",
              );

              element.setAttribute(
                "data-gc-floating-hidden",
                "true",
              );
            }
          });
      };

      removeDuplicateFloatingButtons();

      const floatingButtonsObserver =
        new MutationObserver(() => {
          removeDuplicateFloatingButtons();
          preparePublishedVideos();
        });

      floatingButtonsObserver.observe(
        doc.body,
        {
          childList: true,
          subtree: true,
        },
      );
      const forceDesktopGrid = () => {
        const isDesktop = window.innerWidth >= 768;
        doc.body.classList.toggle("gc-page-viewer-desktop", isDesktop);

        doc.querySelectorAll<HTMLElement>(".gc-generated-products-grid").forEach((grid) => {
          grid.style.setProperty("display", "grid", "important");
          grid.style.setProperty("width", "100%", "important");
          grid.style.setProperty("gap", "22px", "important");
          grid.style.setProperty(
            "grid-template-columns",
            isDesktop ? "repeat(4, minmax(0, 1fr))" : "1fr",
            "important",
          );
        });
      };

      forceDesktopGrid();
    };

    iframe.addEventListener("load", handleLoad);

    return () => {
      iframe.removeEventListener("load", handleLoad);
    };
  }, [iframeHtml]);

  const lastAddRef = useRef<{ id: string | null; time: number }>({
    id: null,
    time: 0,
  });

  useEffect(() => {
    const registrarInteracao = async (tipo: string, metadata: any) => {
      try {
        await api.post("/lojas/registrar-interacao", {
          lojaId: page?.id,
          usuarioId: user?.id || null,
          tipoInteracao: tipo,
          metaData: metadata,
          condominioId: page?.condominio_id,
        });
      } catch (err) {
        console.error("Erro ao registrar log de negócio:", err);
      }
    };

    const abrirModalSolicitacao = (payload: any = {}) => {
      const dados = {
        ...payload,
        chatbotTipo: payload.chatbotTipo || "LOJA",
        chatbotOwnerId:
          payload.chatbotOwnerId ||
          payload.storeId ||
          payload.lojaId ||
          page?.id,
        storeId: payload.storeId || payload.lojaId || page?.id,
        storeName: payload.storeName || page?.title,
        lojaId: payload.lojaId || payload.storeId || page?.id,
        prestadorId: page?.usuarioId,
        origem: payload.origem || "LANDING_PAGE",
      };

      console.log("ABRIR MODAL SOLICITACAO COM CONTEXTO:", dados);

      setSolicitacaoPayload(dados);
      setSelectedServico(dados);
      setOpenNovaSolicitacao(true);
    };

    const handleMsg = async (e: MessageEvent) => {
      if (!e.data?.type) return;

      if (!page?.acessoComercialLiberado) {
        toast.info(
          "Esta página está temporariamente indisponível para compras e contatos.",
        );
        return;
      }

      const { type, payload = {} } = e.data;

      console.log("PAGEVIEWER MESSAGE RECEBIDA DO IFRAME:", {
        type,
        payload,
        pageId: page?.id,
        pageTitle: page?.title,
      });

      switch (type) {
        case "ADD_TO_CART":
        case "GC_ADD_TO_CART":
        case "GRANCONECTA_ADD_TO_CART": {
          if (!page?.id) return;

          const rawPayload = payload || e.data?.payload || e.data || {};
          const normalizedPayload = buildCartProductPayload({
            rawPayload,
            products,
          });

          const productId = normalizedPayload.productId || normalizedPayload.id;

          if (!productId) {
            console.warn("ADD_TO_CART sem productId. Payload recebido:", rawPayload);
            toast.info("Não foi possível identificar o produto para adicionar ao carrinho.");
            return;
          }

          console.log("ADD_TO_CART NORMALIZADO:", {
            rawPayload,
            normalizedPayload,
            productId,
          });

          const now = Date.now();

          if (
            lastAddRef.current.id === productId &&
            now - lastAddRef.current.time < 500
          ) {
            return;
          }

          lastAddRef.current = {
            id: productId,
            time: now,
          };

          await registrarInteracao("CLIQUE_PRODUTO", normalizedPayload);

          addToCart(page.id, normalizedPayload);

          setIsCartOpen(true);
          break;
        }

        case "OPEN_PRODUCT_DETAIL": {
          const productId = String(
            payload?.productId || payload?.produtoId || payload?.id || "",
          ).trim();
          const product = findProductById(products, productId);

          // O botão "Ver detalhes" possui um modal próprio.
          // Não reutilizamos ModalLojaInteresse, pois ele pertence ao fluxo
          // de interesse/pedido personalizado da loja.
          const detailProduct = (product || payload || null) as ProdutoDetalhes | null;

          setProdutoDetalhesSelecionado(detailProduct);
          setModalDetalhesProdutoOpen(Boolean(detailProduct));
          break;
        }

        case "OPEN_SERVICE_DETAIL": {
          const serviceId = String(
            payload?.serviceId || payload?.itemId || payload?.id || "",
          ).trim();

          const service =
            services.find((item) => String(item.id) === serviceId) ||
            payload ||
            null;

          const detailService = (service || null) as ServicoDetalhes | null;

          setServicoDetalhesSelecionado(detailService);
          setModalDetalhesServicoOpen(Boolean(detailService));
          break;
        }

        // AGORA CAPTURA O SINAL DA PONTE DO IFRAME E ABRE O COMPONENTE COMPACTO EM REACT
        case "OPEN_CHAT":
        case "GC_OPEN_CHAT": {
          await registrarInteracao("ABRIU_CHAT_LOJA", payload);
          setIsChatOpen(true); // <--- ATIVA O COMPONENTE NATIVO NA TELA MESTRE
          break;
        }

        case "OPEN_SOLICITACAO_MODAL":
        case "OPEN_SERVICE_MODAL":
        case "SERVICE_REQUEST": {
          await registrarInteracao("SOLICITACAO_CHATBOT", payload);

          // Solicitação, orçamento, contratação e agendamento devem entrar no
          // fluxo contextual do negócio. O próprio ModalNovaSolicitacao sabe
          // preservar os dados quando o visitante ainda não está autenticado.
          abrirModalSolicitacao({
            ...payload,
            titulo:
              payload?.titulo ||
              payload?.title ||
              `Solicitação para ${page?.title || "este negócio"}`,
            descricao:
              payload?.descricao ||
              payload?.description ||
              payload?.message ||
              "Cliente iniciou uma solicitação pela landing page.",
            categoriaId:
              payload?.categoriaId ||
              payload?.categoryId ||
              page?.categoriaId ||
              store?.categoriaid ||
              null,
          });

          break;
        }

        case "OPEN_CUSTOM_ORDER_MODAL": {
          await registrarInteracao("PEDIDO_PERSONALIZADO", payload);

          if (isServicePage) {
            if (!user) {
              toast.info("Faça login para solicitar o serviço");
              return;
            }

            abrirModalSolicitacao(payload);
            break;
          }

          const productId =
            payload?.produto?.id ||
            payload?.product?.id ||
            payload?.produtoId ||
            payload?.productId ||
            payload?.id ||
            null;

          const produtoEncontrado = productId
            ? products.find((p: any) => String(p.id) === String(productId))
            : null;

          setProdutoSelecionado(
            payload?.produto ||
            payload?.product ||
            produtoEncontrado ||
            products?.[0] ||
            null,
          );

          setModalInteresseOpen(true);
          break;
        }

        case "WHATSAPP_CLICK":
        case "OPEN_WHATSAPP": {
          await registrarInteracao("CONTATO_WHATSAPP", payload);

          const fallbackPhone =
            resolveWhatsappFromAny(payload) ||
            resolveWhatsappFromAny(page) ||
            resolveWhatsappFromAny(store);

          const phone = String(fallbackPhone).replace(/\D/g, "");

          const message = encodeURIComponent(
            payload?.message ||
            payload?.text ||
            `Olá, vim pelo site da ${page?.title || "loja"}.`,
          );

          if (payload?.url && String(payload.url).includes("wa.me")) {
            window.open(payload.url, "_blank", "noopener,noreferrer");
            return;
          }

          if (phone) {
            const normalizedPhone = phone.startsWith("55") ? phone : `55${phone}`;

            console.log('normal ', normalizedPhone)
            window.open(
              `https://wa.me/${normalizedPhone}?text=${message}`,
              "_blank",
              "noopener,noreferrer",
            );
            return;
          }

          console.warn("WhatsApp não configurado. Payload:", {
            payload,
            pageWhitespace: page?.telefone_whatsapp,
            storeWhatsapp: store?.telefone_whatsapp,
          });

          toast.info("WhatsApp não configurado para esta loja.");
          break;
        }

        case "OPEN_OFFERS_MODAL":
        case "GC_OPEN_OFFERS":
        case "OPEN_OFFERS": {
          await registrarInteracao("ABRIU_OFERTAS", payload);

          if (isServicePage) {
            abrirModalSolicitacao({
              ...payload,
              titulo: payload?.titulo || "Quero aproveitar uma oferta",
              descricao:
                payload?.descricao ||
                payload?.message ||
                "Cliente quer conhecer ofertas, pacotes ou condições especiais.",
            });
            break;
          }

          setModalOfertasOpen(true);
          break;
        }

        case "OPEN_COMBOS_MODAL":
        case "GC_OPEN_COMBOS":
        case "OPEN_COMBOS": {
          await registrarInteracao("ABRIU_COMBOS", payload);

          if (isServicePage) {
            abrirModalSolicitacao({
              ...payload,
              titulo: payload?.titulo || "Quero conhecer pacotes",
              descricao:
                payload?.descricao ||
                payload?.message ||
                "Cliente quer conhecer combos, kits ou pacotes promocionais.",
            });
            break;
          }

          setModalCombosOpen(true);
          break;
        }

        case "OPEN_PRODUCTS_MODAL": {
          if (!isServicePage) {
            setModalProdutosOpen(true);
          }
          break;
        }

        case "OPEN_GIFTS_MODAL": {
          if (!isServicePage) {
            setModalPresentesOpen(true);
          }
          break;
        }

        case "GC_WISHLIST": {
          await registrarInteracao("LISTA_DE_DESEJO", payload);

          if (isServicePage) {
            abrirModalSolicitacao({
              ...payload,
              titulo: payload?.titulo || "Tenho interesse",
              descricao:
                payload?.descricao ||
                payload?.message ||
                "Cliente demonstrou interesse pela landing page.",
            });
            break;
          }

          const productId =
            payload?.produto?.id ||
            payload?.product?.id ||
            payload?.produtoId ||
            payload?.productId ||
            payload?.id ||
            null;

          const produtoEncontrado = productId
            ? products.find((p: any) => String(p.id) === String(productId))
            : null;

          setProdutoSelecionado(
            payload?.produto ||
            payload?.product ||
            produtoEncontrado ||
            {
              id: productId || payload?.productId || payload?.produtoId || "",
              name: payload?.titulo || payload?.name || "Tenho interesse",
              nome: payload?.titulo || payload?.name || "Tenho interesse",
              description: payload?.descricao || payload?.description || "Cliente demonstrou interesse pela lista de desejos.",
              descricao: payload?.descricao || payload?.description || "Cliente demonstrou interesse pela lista de desejos.",
              image_url: payload?.image || payload?.image_url || "",
            } ||
            products?.[0] ||
            null,
          );

          setModalInteresseOpen(true);
          break;
        }

        case "OPEN_LEAD_MODAL": {
          if (!isServicePage) {
            const productId =
              payload?.produto?.id ||
              payload?.product?.id ||
              payload?.produtoId ||
              payload?.productId ||
              payload?.id ||
              null;

            const produtoEncontrado = productId
              ? products.find((p: any) => String(p.id) === String(productId))
              : null;

            setProdutoSelecionado(
              payload?.produto ||
              payload?.product ||
              produtoEncontrado ||
              products?.[0] ||
              null,
            );

            setModalInteresseOpen(true);
            return;
          }

          abrirModalSolicitacao({
            ...payload,
            titulo: payload?.titulo || "Tenho interesse",
            descricao:
              payload?.descricao ||
              payload?.message ||
              "Cliente demonstrou interesse pela landing page.",
          });

          break;
        }

        default:
          break;
      }
    };

    window.addEventListener("message", handleMsg);

    return () => {
      window.removeEventListener("message", handleMsg);
    };
  }, [page, user, addToCart, isServicePage, products, store]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !page) {
    return (
      <Box sx={{ textAlign: "center", mt: 10 }}>
        <h2>Página não encontrada</h2>
        <button onClick={() => navigate("/")}>Voltar</button>
      </Box>
    );
  }

  if (!page.acessoComercialLiberado) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
          bgcolor: "#f8fafc",
          background:
            "radial-gradient(circle at top, rgba(245,158,11,0.14), transparent 42%), #f8fafc",
        }}
      >
        <Box
          role="alert"
          sx={{
            width: "100%",
            maxWidth: 520,
            borderRadius: 4,
            bgcolor: "#fff",
            p: { xs: 3, sm: 5 },
            textAlign: "center",
            border: "1px solid #e2e8f0",
            boxShadow: "0 24px 70px rgba(15,23,42,0.14)",
          }}
        >
          <LockOutlinedIcon sx={{ fontSize: 64, color: "#f59e0b", mb: 2 }} />

          <Typography variant="h5" fontWeight={900} color="#0f172a">
            Página temporariamente indisponível
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 1.5, mb: 3 }}>
            Este estabelecimento está temporariamente indisponível para acesso,
            compras, pedidos e contatos.
          </Typography>

          <Button variant="contained" onClick={() => navigate("/")}>
            Voltar para o GranConecta
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <div
      style={{
        background: page.bodyBgColor,
        minHeight: "100vh",
        width: "100vw",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {page.acessoComercialLiberado &&
        !isServicePage &&
        storeCart.length > 0 &&
        !isCartOpen && (
          <Box
            sx={{
              position: "fixed",
              top: { xs: 88, sm: 96 },
              right: { xs: 16, sm: 24 },
              zIndex: 10000,
            }}
          >
            <IconButton
              onClick={() => setIsCartOpen(true)}
              aria-label="Abrir carrinho"
              sx={{
                backgroundColor: "#111",
                color: "#fff",
                width: { xs: 54, sm: 58 },
                height: { xs: 54, sm: 58 },
                boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
                border: "2px solid rgba(255,255,255,0.88)",
                "&:hover": { backgroundColor: "#333" },
              }}
            >
              <Badge
                badgeContent={storeCart.length}
                color="primary"
                overlap="circular"
                anchorOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
              >
                <ShoppingBagIcon />
              </Badge>
            </IconButton>
          </Box>
        )}

      <main
        style={{
          width: "100%",
          height: "100dvh",
          minHeight: "100dvh",
          overflow: "hidden",
        }}
      >
        {page.layout?.length ? (
          <div style={{ paddingTop: "0px" }}>
            {page.layout.map((s, i) => (
              <div key={i}>
                {s.type === "text" && (
                  <TextSection html={s.data?.html || ""} />
                )}
                {s.type === "carousel" && <CarouselSection data={s.data} />}
                {s.type === "gallery" && <GallerySection data={s.data} />}
              </div>
            ))}
          </div>
        ) : !iframeHtml ? (
          <Box
            sx={{
              width: "100%",
              minHeight: "100dvh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: page.bodyBgColor || "#ffffff",
            }}
          >
            <CircularProgress size={32} />
          </Box>
        ) : (
          <iframe
            key={`granconecta-page-${page.id || slug || "public"}-${iframeHtml.length}`}
            ref={iframeRef}
            srcDoc={iframeHtml}
            style={{
              width: "100%",
              minHeight: "100dvh",
              height: "100dvh",
              border: "none",
              display: "block",
              background: "transparent",
              pointerEvents: page.acessoComercialLiberado ? "auto" : "none",
            }}
            loading="eager"
            sandbox={
              page.acessoComercialLiberado
                ? "allow-scripts allow-popups allow-forms allow-same-origin"
                : "allow-same-origin"
            }
            title={page.title}
          />
        )}
      </main>

      {!page.acessoComercialLiberado && (
        <Box
          role="alert"
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 100000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: 2,
            background: "rgba(15, 23, 42, 0.62)",
            backdropFilter: "blur(4px)",
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: 520,
              borderRadius: 4,
              bgcolor: "#fff",
              p: { xs: 3, sm: 5 },
              textAlign: "center",
              boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
            }}
          >
            <LockOutlinedIcon sx={{ fontSize: 58, color: "#f59e0b", mb: 2 }} />
            <Typography variant="h5" fontWeight={900} color="#0f172a">
              Atendimento temporariamente indisponível
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1.5, mb: 3 }}>
              Esta página pode ser visualizada, mas compras, pedidos e contatos
              estão suspensos no momento.
            </Typography>
            <Button variant="contained" onClick={() => navigate("/")}>
              Voltar para o GranConecta
            </Button>
          </Box>
        </Box>
      )}

      {/* ?? ÍCONE FLUTUANTE DO CHAT ESTILO WHATSAPP (SÓ APARECE SE O CHAT ESTIVER FECHADO) */}
      {page.acessoComercialLiberado && !isChatOpen && (
        <IconButton
          onClick={() => setIsChatOpen(true)}
          aria-label="Abrir Atendimento IA"
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 99999,
            width: 60,
            height: 60,
            background: "linear-gradient(135deg, #0f172a, #312e81)",
            color: "#fff",
            boxShadow: "0 14px 40px rgba(15, 23, 42, 0.35)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              transform: "scale(1.08)",
              background: "linear-gradient(135deg, #1e293b, #3730a3)",
            },
          }}
        >
          {/* ÍCONE DE ROBÔ VETORIAL IDÊNTICO AO SEU COMPONENTE DE TELA */}
          <svg viewBox="0 0 64 64" width="28" height="28" fill="currentColor">
            <path d="M32 7c2.2 0 4 1.8 4 4v3h8.5C50.8 14 56 19.2 56 25.5v18C56 49.8 50.8 55 44.5 55h-25C13.2 55 8 49.8 8 43.5v-18C8 19.2 13.2 14 19.5 14H28v-3c0-2.2 1.8-4 4-4Z" />
            <circle cx="23" cy="33" r="5" fill="#fff" />
            <circle cx="41" cy="33" r="5" fill="#fff" />
            <path d="M24 44c4.8 3.2 11.2 3.2 16 0" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" />
          </svg>
        </IconButton>
      )}

      {page.acessoComercialLiberado && (
        <>
          {/* RENDERIZAÇÃO DOS RECURSOS COMERCIAIS */}
          <ChatWidget
            key={
              opportunityValidated && opportunityId
                ? `${page?.id || slug || "store"}:opportunity:${opportunityId}:user:${(user as any)?.usuarioId || (user as any)?.id || "guest"
                }`
                : `${page?.id || slug || "store"}:default:user:${(user as any)?.usuarioId || (user as any)?.id || "guest"
                }`
            }
            open={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            storeId={page?.id || ""}
            storeName={page?.title || ""}
            storeSlug={slug || ""}
            chatbotTipo={
              opportunityValidated
                ? opportunityChatbotTipo || "LOJA"
                : "LOJA"
            }
            userId={
              (user as any)?.usuarioId ||
              (user as any)?.id ||
              undefined
            }
            userName={(user as any)?.name || (user as any)?.nome}
            userType={(user as any)?.role || (user as any)?.tipo}
            condominioId={page?.condominio_id || undefined}
            opportunityId={
              opportunityValidated
                ? opportunityId
                : undefined
            }
            opportunityResumeSignal={opportunityResumeSignal}
          />

          <CarrinhoLateral
            open={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            storeName={page?.title ?? ""}
            storeId={page?.id ?? ""}
            categoria_tag={page?.categoria_tag ?? ""}
          />

          <ModalNovaSolicitacao
            open={openNovaSolicitacao}
            onClose={() => setOpenNovaSolicitacao(false)}
            usuarioId={user?.id ?? ""}
            prestadorId={page?.usuarioId}
            lojaId={page?.id}
            condominio_id={page?.condominio_id || ""}
            prestadorNome={page?.title}
            prestadorFoto={page?.logo_url}
            modo="contextual"
            tituloInicial={
              solicitacaoPayload?.titulo ||
              (solicitacaoPayload?.storeName
                ? `Solicitação para ${solicitacaoPayload.storeName}`
                : `Solicitação para ${page?.title || "este negócio"}`)
            }
            descricaoInicial={
              solicitacaoPayload?.message ||
              solicitacaoPayload?.descricao ||
              selectedServico?.descricao ||
              ""
            }
            categoriaIdInicial={
              solicitacaoPayload?.categoriaId ||
              solicitacaoPayload?.categoryId ||
              page?.categoriaId ||
              store?.categoriaid
            }
            dadosIniciais={{
              titulo:
                solicitacaoPayload?.titulo ||
                (solicitacaoPayload?.storeName
                  ? `Solicitação para ${solicitacaoPayload.storeName}`
                  : `Solicitação para ${page?.title || "este negócio"}`),
              descricao:
                solicitacaoPayload?.message ||
                solicitacaoPayload?.descricao ||
                selectedServico?.descricao ||
                "",
              storeId: solicitacaoPayload?.storeId || page?.id,
              lojaId: page?.id,
              prestadorId: page?.usuarioId,
              origem: "CHATBOT_LANDING",
              chatbotTipo: solicitacaoPayload?.chatbotTipo,
              produtoId:
                solicitacaoPayload?.produtoId ||
                solicitacaoPayload?.productId ||
                solicitacaoPayload?.itemId,
              categoriaNome:
                solicitacaoPayload?.categoriaNome ||
                solicitacaoPayload?.categoryName ||
                page?.title,
              categoriaSlug:
                solicitacaoPayload?.categoriaSlug ||
                solicitacaoPayload?.categorySlug ||
                page?.categoria_tag,
            }}
          />

          <ModalDetalhesProduto
            open={modalDetalhesProdutoOpen}
            produto={produtoDetalhesSelecionado}
            onClose={() => {
              setModalDetalhesProdutoOpen(false);
              setProdutoDetalhesSelecionado(null);
            }}
            onAdicionarCarrinho={(produto: ProdutoDetalhes, quantidade: number) => {
              if (!page?.id) return;

              const normalizedPayload = buildCartProductPayload({
                rawPayload: {
                  ...produto,
                  id: produto.id,
                  productId: produto.id,
                  produtoId: produto.id,
                  quantidade,
                  quantity: quantidade,
                },
                products,
              });

              addToCart(page.id, normalizedPayload);
              setIsCartOpen(true);
            }}
            onComprarAgora={(produto: ProdutoDetalhes, quantidade: number) => {
              if (!page?.id) return;

              const normalizedPayload = buildCartProductPayload({
                rawPayload: {
                  ...produto,
                  id: produto.id,
                  productId: produto.id,
                  produtoId: produto.id,
                  quantidade,
                  quantity: quantidade,
                },
                products,
              });

              addToCart(page.id, normalizedPayload);
              setModalDetalhesProdutoOpen(false);
              setProdutoDetalhesSelecionado(null);
              setIsCartOpen(true);
            }}
            onFalarNoChat={(_produto: ProdutoDetalhes) => {
              setModalDetalhesProdutoOpen(false);
              setProdutoDetalhesSelecionado(null);
              setIsChatOpen(true);

            }}
          />

          <ModalDetalhesServico
            open={modalDetalhesServicoOpen}
            servico={servicoDetalhesSelecionado}
            onClose={() => {
              setModalDetalhesServicoOpen(false);
              setServicoDetalhesSelecionado(null);
            }}
            onSolicitar={(servico: ServicoDetalhes) => {
              const serviceId = String(servico.id || "").trim();

              setSelectedServico(servico);
              setSolicitacaoPayload({
                ...servico,
                serviceId: serviceId || null,
                itemId: serviceId || null,
                storeId: page?.id || null,
                chatbotTipo:
                  String(page?.tipo || "").toUpperCase() === "PRESTADOR"
                    ? "PRESTADOR"
                    : "LOJA",
              });

              setModalDetalhesServicoOpen(false);
              setServicoDetalhesSelecionado(null);
              setOpenNovaSolicitacao(true);
            }}
            onFalarNoChat={(_servico: ServicoDetalhes) => {
              setModalDetalhesServicoOpen(false);
              setServicoDetalhesSelecionado(null);
              setIsChatOpen(true);
            }}
          />

          <ModalProdutosLoja
            open={modalProdutosOpen}
            onClose={() => setModalProdutosOpen(false)}
            lojaId={page?.id}
            slug={slug}
            modo="colecao"
          />

          <ModalProdutosLoja
            open={modalPresentesOpen}
            onClose={() => setModalPresentesOpen(false)}
            lojaId={page?.id}
            slug={slug}
            modo="presentes"
          />

          <ModalProdutosLoja
            open={modalOfertasOpen}
            onClose={() => setModalOfertasOpen(false)}
            lojaId={page?.id}
            slug={slug}
            modo="ofertas"
          />

          <ModalProdutosLoja
            open={modalCombosOpen}
            onClose={() => setModalCombosOpen(false)}
            lojaId={page?.id}
            slug={slug}
            modo="combos"
          />

          <ModalLojaInteresse
            open={modalInteresseOpen}
            onClose={() => setModalInteresseOpen(false)}
            lojaId={page?.id}
            produto={produtoSelecionado}
          />
        </>
      )}
    </div>
  );
}

function unwrapIframeSrcDoc(html: string): string {
  try {
    const raw = String(html || "").trim();

    if (!raw.toLowerCase().includes("<iframe")) {
      return raw;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(raw, "text/html");



    const iframe = doc.querySelector("iframe");

    if (!iframe) {
      return raw;
    }

    const srcdoc = iframe.getAttribute("srcdoc");

    if (!srcdoc) {
      return raw;
    }

    const textarea = document.createElement("textarea");
    textarea.innerHTML = srcdoc;

    return textarea.value;
  } catch (err) {
    console.error("Erro ao extrair srcdoc:", err);
    return html;
  }
}