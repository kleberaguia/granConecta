import { Box, CircularProgress, IconButton, GlobalStyles } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

type StoreContent = { html: string; css: string };

type PublicStoreResponse = {
  name?: string;
  pageHtmlPublished?: string;
  pageCssPublished?: string;
  pageHtmlDraft?: string;
  pageCssDraft?: string;
};

/**
 * Constrói o documento HTML para o iframe.
 * - Injeta Tailwind (opcional)
 * - Injeta CSS vindo do banco
 * - Injeta um patch CSS para reduzir problemas de width/height fixos
 */
function buildIframeDoc(bodyHtml: string, cssText: string) {
  const fontsHref =
    "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500;600&display=swap";

  const safeBody = bodyHtml || "";
  const safeCss = cssText || "";

  return `
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <link href="${fontsHref}" rel="stylesheet">

    <!-- Tailwind CDN (se você realmente usa classes tailwind no HTML salvo) -->
    <script src="https://cdn.tailwindcss.com"></script>

    <style>
      /* 1) RESET BASE */
      html, body {
        margin: 0;
        padding: 0;
        min-height: 100vh;
        overflow-x: hidden;
        -webkit-font-smoothing: antialiased;
        background: #fff;
      }
      body { font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }

      /* Imagens e mídia: evita esmagar */
      img, video, svg, canvas {
        max-width: 100%;
        height: auto;
      }

      /* 2) CSS DO BANCO (GERADO/SALVO) */
      ${safeCss}

      /* 3) PATCH DE CORREÇÃO (tenta ser compatível com layouts diferentes) */

      /* Evita containers fixos travando o layout */
      .store-container, .container, main, section {
        max-width: 100%;
      }

      /* Caso algum CSS do banco force widths muito pequenas */
      .store-container * {
        min-width: 0;
      }

      /* HERO: tenta deixar responsivo sem depender de classes específicas */
      .hero {
        width: 100%;
      }

      /* Se existir hero “split” com colunas, melhora wrap */
      .heroWrap, .hero-inner, .heroGrid, .heroSGrid, .foodGrid {
        display: grid;
        grid-template-columns: 1.05fr .95fr;
        gap: 28px;
        align-items: center;
      }

      /* Media do hero com imagem */
      .heroMedia, .hero-image, .heroSPic, .foodImg, .darkMedia {
        width: 100%;
        display: block;
      }
      .heroMedia img, .hero-image img, .heroSPic img, .foodImg img, .darkMedia img {
        width: 100%;
        height: auto;
        object-fit: cover;
        display: block;
      }

      /* “features” / galerias comuns */
      .feature-images {
        display: flex;
        flex-wrap: wrap;
        gap: 24px;
        justify-content: center;
        margin: 40px 0;
        padding: 0 20px;
      }
      .feature-images img {
        width: 100%;
        max-width: 340px;
        height: 240px;
        object-fit: cover;
        border-radius: 10px;
        flex: 1 1 300px;
      }

      /* Responsivo */
      @media (max-width: 980px) {
        .heroWrap, .hero-inner, .heroGrid, .heroSGrid, .foodGrid {
          grid-template-columns: 1fr !important;
        }
      }

      @media (max-width: 768px) {
        nav { padding: 16px !important; flex-direction: column !important; gap: 12px !important; }
        nav ul { padding: 0; flex-wrap: wrap; justify-content: center; }

        /* Caso tenha h1 dentro do hero */
        .hero h1, .heroCopy h1, .hero-content h1, .heroSCard h1, .foodHero h1 {
          font-size: 2.1em !important;
          text-align: center !important;
          line-height: 1.15 !important;
        }

        .hero-buttons, .actions { justify-content: center !important; }
        .service-cards { display: grid !important; grid-template-columns: 1fr !important; padding: 16px !important; }
      }
    </style>
  </head>
  <body>
    <div class="store-container">
      ${safeBody}
    </div>
  </body>
</html>
`.trim();
}

export function StoreFront() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [content, setContent] = useState<StoreContent>({ html: "", css: "" });
  const [loading, setLoading] = useState<boolean>(true);

  // Use env se existir, senão fallback
  // Vite: import.meta.env.VITE_API_URL
  // CRA: process.env.REACT_APP_API_URL
  let baseUrl = "http://localhost:3000";

  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) {
    baseUrl = import.meta.env.VITE_API_URL;
  } else if (typeof process !== "undefined" && process.env?.REACT_APP_API_URL) {
    baseUrl = process.env.REACT_APP_API_URL;
  }

  const API_URL = baseUrl;

  useEffect(() => {
    if (!slug) return;

    const controller = new AbortController();

    const loadStore = async () => {
      try {
        setLoading(true);

        const url = `${String(API_URL).replace(/\/$/, "")}/lojas/publica/slug/${encodeURIComponent(slug)}`;

        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`Erro ao buscar dados: HTTP ${response.status}`);

        const data = (await response.json()) as PublicStoreResponse;

        const html = data?.pageHtmlPublished || data?.pageHtmlDraft || "";
        const css = data?.pageCssPublished || data?.pageCssDraft || "";

        setContent({ html, css });

        document.title = data?.name ? String(data.name) : "Loja";
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error("Erro ao carregar os dados da montra:", err);
        // opcional: aqui você pode navegar pra 404
        // navigate("/404");
      } finally {
        setLoading(false);
      }
    };

    loadStore();

    return () => controller.abort();
  }, [slug, API_URL]);

  const srcDoc = useMemo(() => buildIframeDoc(content.html, content.css), [content.html, content.css]);

  if (loading) {
    return (
      <Box sx={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#fff" }}>
        <CircularProgress sx={{ color: "#E4D0B2" }} />
      </Box>
    );
  }

  return (
    <>
      <GlobalStyles styles={{ body: { margin: 0, padding: 0, overflow: "hidden" } }} />

      <Box sx={{ position: "fixed", inset: 0, zIndex: 9998, bgcolor: "#fff" }}>
        <IconButton
          onClick={() => navigate("/")}
          sx={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 9999,
            bgcolor: "rgba(0,0,0,0.6)",
            color: "#fff",
            "&:hover": { bgcolor: "#000" },
          }}
          aria-label="Fechar"
        >
          <CloseIcon fontSize="medium" />
        </IconButton>

        <iframe
          title="Montra da Loja"
          srcDoc={srcDoc}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            display: "block",
          }}
        />
      </Box>
    </>
  );
}