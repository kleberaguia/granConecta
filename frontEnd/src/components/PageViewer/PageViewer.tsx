import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";
import { API_URL } from "../../utils/config";
import { useAuth } from "../../context/AuthContext";
import { CarrinhoLateral } from "../../components/CarrinhoLateral/CarrinhoLateral";
import { ModalNovaSolicitacao } from "../ModalNovaSolicitacao/ModalNovaSolicitacao";
import modernStyle from "./PageViewer.module.css";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import {
  Box,
  CircularProgress,
  IconButton,
  Modal,
  Badge,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { toast } from "react-toastify";

interface Store {
  id: string;
  name: string;
  descricao_loja?: string;
  logo_url?: string;
  telefone_whatsapp?: string;
  condominio_id?: string;
  categoriaid?: string;
  // adicione outros campos que existem na tabela
}
// --- INTERFACES ---
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
  categoriaId?: string | number;
  categoria_tag?: string;
}

interface PublicStoreResponse {
  id?: string;
  name?: string;
  descricao_loja?: string;
  pageHtmlPublished?: string;
  pageHtmlDraft?: string;
  pageCssPublished?: string;
  pageCssDraft?: string;
  layoutConfig?: { sections?: Section[] };
  updatedAt?: string;
  logo_url?: string;
  bodyBgColor?: string;
  footerBgColor?: string;
  footerTextColor?: string;
  telefone_whatsapp?: string;
  usuarioId?: string;
  condominio_id?: string | null;
  categoriaId?: string | number;
  categoria_tag?: string;
}
// --- UTILITÁRIOS ---
const normalizeUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  let clean = url.replace(/\\/g, "/");
  const index = clean.toLowerCase().indexOf("/uploads/");
  if (index !== -1) clean = clean.substring(index);
  if (!clean.startsWith("/")) clean = `/${clean}`;
  let base = (API_URL || "http://localhost:3000").replace(/\/$/, "");
  if (base.endsWith("/api")) base = base.slice(0, -4);
  return `${base}${clean}`;
};

const isFullHtmlDocument = (html?: string) => {
  const raw = String(html || "").trim();
  return /<html[\s>]/i.test(raw) || /<!DOCTYPE html/i.test(raw);
};

// --- COMPONENTES DE SEÇÃO ---
const TextSection = ({ html }: { html: string }) => (
  <div className={modernStyle.sectionText}>
    <div className={modernStyle.content} dangerouslySetInnerHTML={{ __html: html }} />
  </div>
);

const CarouselSection = ({ data }: { data: any }) => (
  <Swiper modules={[Navigation, Pagination]} navigation pagination={{ clickable: true }} className={modernStyle.carouselSwiper}>
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
      <div className={modernStyle.galleryGrid}>
        {images.map((img: any, i: number) => (
          <img key={i} src={normalizeUrl(img?.url)} onClick={() => { setIndex(i); setOpen(true); }} alt="" />
        ))}
      </div>
      <Modal open={open} onClose={() => setOpen(false)}>
        <Box className={modernStyle.lightbox}>
          <IconButton className={modernStyle.closeBtn} onClick={() => setOpen(false)}><CloseIcon /></IconButton>
          <img src={normalizeUrl(images[index]?.url)} alt="" style={{ maxWidth: '90vw', maxHeight: '80vh' }} />
          <div className={modernStyle.navBtns}>
            <IconButton onClick={() => setIndex((prev) => (prev - 1 + images.length) % images.length)}><ArrowBackIosNewIcon /></IconButton>
            <IconButton onClick={() => setIndex((prev) => (prev + 1) % images.length)}><ArrowForwardIosIcon /></IconButton>
          </div>
        </Box>
      </Modal>
    </>
  );
};

export default function PageViewer() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { cart, user, addToCart } = useAuth();

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [openNovaSolicitacao, setOpenNovaSolicitacao] = useState<boolean>(false);
  const [selectedServico, setSelectedServico] = useState<any>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [_loadingStore, setLoadingStore] = useState(false);
  const storeCart = cart[page?.id || ""] || [];

  useEffect(() => {
    const fetchStore = async () => {
      try {
        setLoadingStore(true); // ✅ isolado
        const res = await api.get(`/lojas/publica/id/${page?.id}`);

        setStore(res.data);
        setLoadingStore(res.data);
      } catch (err) {
        console.error("Erro ao buscar loja:", err);
      } finally {
        setLoadingStore(false); // ✅ isolado
      }
    };

    if (page?.id) fetchStore();
  }, [page?.id]);

  const fetchPage = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<PublicStoreResponse>(`/lojas/publica/slug/${slug}`);
      const rawData = res.data;

      setPage({
        id: rawData.id || "",
        title: rawData.name || "Sem título",
        content: rawData.pageHtmlPublished || rawData.pageHtmlDraft || rawData.descricao_loja || "",
        layout: rawData.layoutConfig?.sections || [],
        updatedAt: rawData.updatedAt,
        logo_url: rawData.logo_url,
        css: rawData.pageCssPublished || rawData.pageCssDraft || "",
        bodyBgColor: rawData.bodyBgColor || "#ffffff",
        footerBgColor: rawData.footerBgColor || "#1a1a1a",
        footerTextColor: rawData.footerTextColor || "#ffffff",
        telefone_whatsapp: rawData.telefone_whatsapp || "",
        usuarioId: rawData.usuarioId || "",
        condominio_id: rawData.condominio_id || null,
        categoriaId: (rawData as any).categoriaId || null,
        categoria_tag: (rawData as any).categoria_tag || ''
      });
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { if (slug) fetchPage(); }, [slug, fetchPage]);

  // --- CONSTRUÇÃO DO HTML DO IFRAME ---
  const buildIframeHtml = useCallback((rawHtml: string, pageData: PageData) => {
    const finalBodyBgColor = pageData.bodyBgColor || "#ffffff";

    const injectedStyle = `
      <style>
        ${pageData.css || ""}
        html, body {
          margin: 0 !important; padding: 0 !important;
          width: 100%; height: auto !important; 
          overflow-x: hidden !important;
          background: ${finalBodyBgColor} !important;
        }
        #main-header { position: relative !important; top: 0 !important; width: 100% !important; z-index: 10 !important; }
        
        /* AJUSTE DO HERO - SEM MIN-HEIGHT FIXO QUE TRAVA O LAYOUT */
        #hero-section {
          min-height: clamp(420px, 65vh, 720px) !important;
          height: auto !important;
          max-height: none !important;

          display: flex !important;
          align-items: center !important;
          justify-content: center !important;

          padding: 40px 0 !important;
          box-sizing: border-box;
        }
        .hero-content { padding: 60px 5% !important; box-sizing: border-box !important; width: 100% !important; }
        
        img { max-width: 100%; height: auto !important; }
        footer, .footer, .footer-editable { 
          background: ${pageData.footerBgColor || "#1a1a1a"} !important; 
          color: ${pageData.footerTextColor || "#ffffff"} !important; 
        }
      </style>
    `;

    const bridgeScript = `
<script>
  let lastProductClick = null;

  document.addEventListener("click", function(e) {
    //const target = e.target.closest("a, button, [data-action], [data-product-id]");
     const target = e.target.closest("[data-product-id], a, button, [data-action]");
    if (!target) return;

    // =========================
    // 1. PRODUTOS (CARRINHO)
    // =========================
    const productId = target.getAttribute("data-product-id");

    if (productId) {
      e.preventDefault();
      e.stopPropagation();

      // 🔒 anti duplo clique
      if (lastProductClick === productId) return;
      lastProductClick = productId;

      setTimeout(() => lastProductClick = null, 300);

      window.parent.postMessage({
        type: "ADD_TO_CART",
        payload: {
          id: productId,
          name: target.getAttribute("data-product-name"),
          price: target.getAttribute("data-product-price"),
          image: target.getAttribute("data-product-image")
        }
      }, "*");

      return;
    }

    // =========================
    // 2. SERVIÇOS
    // =========================
    const isServiceAction =
      target.innerText.toLowerCase().includes("solicitar") ||
      target.innerText.toLowerCase().includes("agendar") ||
      target.getAttribute("data-action") === "service-request";

    if (isServiceAction) {
      e.preventDefault();

      window.parent.postMessage({
        type: "SERVICE_REQUEST",
        payload: {
          titulo: target.getAttribute("data-service-name") || target.innerText.trim(),
          descricao: "Interesse em serviço via site",
          categoriaId: target.getAttribute("data-categoria-id")
        }
      }, "*");

      return;
    }

    // =========================
    // 3. WHATSAPP
    // =========================
    const href = target.getAttribute("href") || "";

    if (href.includes("wa.me")) {
      window.parent.postMessage({
        type: "WHATSAPP_CLICK",
        payload: { url: href }
      }, "*");
    }

  }, true);
</script>
`;

    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script src="https://cdn.tailwindcss.com"></script>
        ${injectedStyle}
        ${bridgeScript}
      </head>
      <body>${rawHtml}</body>
      </html>
    `;
  }, []);

  // --- RESIZE DO IFRAME ---
  useEffect(() => {
    if (!page || !isFullHtmlDocument(page.content)) return;
    const iframe = iframeRef.current;
    if (!iframe) return;

    iframe.srcdoc = buildIframeHtml(page.content, page);

    iframe.onload = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;

      const resize = () => {
        const height = Math.max(
          doc.body.getBoundingClientRect().height,
          doc.documentElement.getBoundingClientRect().height
        );
        iframe.style.height = `${height}px`;
      };

      resize();
      setTimeout(resize, 600);
      const observer = new MutationObserver(resize);
      observer.observe(doc.body, { childList: true, subtree: true, attributes: true });
      window.addEventListener("resize", resize);
      (iframe as any)._cleanup = () => { observer.disconnect(); window.removeEventListener("resize", resize); };
    };

    return () => { if ((iframeRef.current as any)?._cleanup) (iframeRef.current as any)._cleanup(); };
  }, [page, buildIframeHtml]);

  const lastAddRef = useRef<{ id: string | null; time: number }>({
    id: null,
    time: 0
  });
  useEffect(() => {
    const registrarInteracao = async (tipo: string, metadata: any) => {
      try {
        await api.post('/lojas/registrar-interacao', {
          lojaId: page?.id,
          usuarioId: user?.id || null,
          tipoInteracao: tipo,
          metaData: metadata,
          condominioId: page?.condominio_id
        });
      } catch (err) {
        console.error("Erro ao registrar log de negócio:", err);
      }
    };

    const handleMsg = async (e: MessageEvent) => {
      if (!e.data?.type) return;

      const { type, payload } = e.data;

      switch (type) {

        case "ADD_TO_CART": {
          if (!page?.id) return;

          const now = Date.now();

          // 🔒 anti duplicação real
          if (
            lastAddRef.current.id === payload.id &&
            now - lastAddRef.current.time < 500
          ) {
            return;
          }

          lastAddRef.current = {
            id: payload.id,
            time: now
          };

          await registrarInteracao("CLIQUE_PRODUTO", payload);

          addToCart(page.id, payload);
          setIsCartOpen(true);

          break;
        }

        case "OPEN_SERVICE_MODAL":
          setSelectedServico(payload);
          setOpenNovaSolicitacao(true);
          break;

        case "SERVICE_REQUEST":
          if (!user) {
            toast.info("Faça login para solicitar o serviço");
            return;
          }

          setSelectedServico(payload);
          setOpenNovaSolicitacao(true);
          break;

        case "WHATSAPP_CLICK":
          await registrarInteracao("CONTATO_WHATSAPP", payload);
          window.open(payload.url, "_blank");
          break;
      }
    };

    window.addEventListener("message", handleMsg);
    return () => window.removeEventListener("message", handleMsg);

  }, [page, user, addToCart]);

  if (loading) return <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}><CircularProgress /></Box>;
  if (error || !page) return <Box sx={{ textAlign: 'center', mt: 10 }}><h2>Página não encontrada</h2><button onClick={() => navigate("/")}>Voltar</button></Box>;

  const fullDocumentMode = !page.layout?.length && isFullHtmlDocument(page.content);

  const isServicePage = page?.categoria_tag === "SERVICE" || page?.categoria_tag === "servico";
  return (
    <div
      className={modernStyle.overlayWrapper}
      style={{
        background: page.bodyBgColor,
        minHeight: '100vh', 
        width: '100vw',
        overflowY: 'auto', 
        overflowX: 'hidden',
        position: 'relative'
      }}
    >
      {/* ✅ BOTÃO DO CARRINHO FLUTUANTE 
          Removida a barra superior inteira. Agora só temos este botão discreto 
          se houver itens no carrinho ou for uma loja de produtos.
      */}
      {!isServicePage && storeCart.length > 0 && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 30,
            right: 30,
            zIndex: 10000,
          }}
        >
          <IconButton 
            onClick={() => setIsCartOpen(true)} 
            sx={{ 
              backgroundColor: '#111', 
              color: '#fff',
              width: 60,
              height: 60,
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
              '&:hover': { backgroundColor: '#333' }
            }}
          >
            <Badge badgeContent={storeCart.length} color="primary">
              <ShoppingBagIcon />
            </Badge>
          </IconButton>
        </Box>
      )}

      {/* ✅ CONTEÚDO 100% DA TELA 
          Todos os paddings foram zerados para o site ocupar a tela inteira.
      */}
      <main style={{ width: '100%', minHeight: '100vh' }}>
        {page.layout?.length ? (
          <div style={{ paddingTop: '0px' }}>
            {page.layout.map((s, i) => (
              <div key={i}>
                {s.type === "text" && <TextSection html={s.data?.html || ""} />}
                {s.type === "carousel" && <CarouselSection data={s.data} />}
                {s.type === "gallery" && <GallerySection data={s.data} />}
              </div>
            ))}
          </div>
        ) : fullDocumentMode ? (
          <div style={{ paddingTop: '0px' }}>
            <iframe
              ref={iframeRef}
              style={{ 
                width: "100%", 
                border: "none", 
                display: 'block', 
                minHeight: '100vh' 
              }}
              sandbox="allow-scripts allow-same-origin allow-popups"
              title={page.title}
            />
          </div>
        ) : (
          <div 
            style={{ paddingTop: '0px' }} 
            dangerouslySetInnerHTML={{ __html: page.content }} 
          />
        )}
      </main>

      <CarrinhoLateral open={isCartOpen} onClose={() => setIsCartOpen(false)} storeName={page?.title ?? ""} storeId={page?.id ?? "" } categoria_tag={page?.categoria_tag ?? ""} />
      <ModalNovaSolicitacao
        open={openNovaSolicitacao}
        onClose={() => setOpenNovaSolicitacao(false)}
        usuarioId={user?.id ?? ""}
        prestadorId={page?.usuarioId}
        lojaId={page?.id}
        condominio_id={page?.condominio_id || ""}
        prestadorNome={page?.title}
        prestadorFoto={page?.logo_url} // 👈 usa logo ou capa
        modo="contextual" // 👈 IMPORTANTE
        tituloInicial={selectedServico?.nome}
        descricaoInicial={selectedServico?.descricao}
        categoriaIdInicial={store?.categoriaid}
      />
    </div>
  )
};
