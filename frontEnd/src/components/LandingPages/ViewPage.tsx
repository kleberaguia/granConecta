import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/api";

export default function ViewPage() {
  const { slug } = useParams();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPageContent = async () => {
      try {
        setLoading(true);

        const response = await api.get(`/lojas/publica/${slug}`);

        const {
          id,
          storeId,
          lojaId,
          usuarioId,
          ownerId,
          userId,

          name,
          nome,
          storeName,

          pageHtmlPublished,
          pageCssPublished,
          bodyBgColor,
          footerBgColor,
          footerTextColor,
        } = response.data || {};

        // const resolvedStoreId = storeId || lojaId || id || null;


        const resolvedStoreId =
          storeId ||
          lojaId ||
          id ||
          null;

        const resolvedOwnerId = ownerId || usuarioId || userId || resolvedStoreId || null;

        console.log("========================================");
        console.log("SLUG:", slug);
        console.log("LOJA PUBLICA RESPONSE:", response.data);

        console.log("id:", id);
        console.log("storeId:", storeId);
        console.log("lojaId:", lojaId);

        console.log("ownerId:", ownerId);
        console.log("usuarioId:", usuarioId);
        console.log("userId:", userId);

        console.log("resolvedStoreId:", resolvedStoreId);
        console.log("resolvedOwnerId:", resolvedOwnerId);

        console.log("resolvedStoreName:", storeName || name || nome);
        console.log("========================================");

        const resolvedStoreName = storeName || name || nome || "";

        const finalBodyBgColor = bodyBgColor || "#ffffff";
        const finalFooterBgColor = footerBgColor || "#1a1a1a";
        const finalFooterTextColor = footerTextColor || "#ffffff";

        if (!iframeRef.current) return;

        const rawHtml = String(pageHtmlPublished || "").trim();

        const isFullDocument =
          /<html[\s>]/i.test(rawHtml) || /<!DOCTYPE html/i.test(rawHtml);

        const injectedStyle = `
          <style>
            ${pageCssPublished || ""}

            html, body {
              margin: 0 !important;
              padding: 0 !important;
              width: 100%;
              min-height: 100%;
              height: auto;
              overflow-x: hidden !important;
            }

            body {
              background: ${finalBodyBgColor} !important;
              background-image: none !important;
            }

            .luxury-container,
            .site-shell,
            .page-viewer-body-bg {
              background: ${finalBodyBgColor} !important;
            }

            footer,
            .footer,
            .footer-editable {
              background: ${finalFooterBgColor} !important;
              background-image: none !important;
              color: ${finalFooterTextColor} !important;
              --footer-text-color: ${finalFooterTextColor} !important;
            }

            footer *,
            .footer *,
            .footer-editable * {
              color: inherit !important;
            }

            [contenteditable]:hover,
            [contenteditable]:focus,
            img:hover {
              outline: none !important;
            }

            .del-btn {
              display: none !important;
            }

            [contenteditable] {
              pointer-events: none !important;
              caret-color: transparent !important;
            }

            a,
            button {
              cursor: pointer;
            }
          </style>
        `;

        const fallbackScript = `
<script>

console.log("========================================");
console.log("IFRAME INICIADO");

window.GRAN_CHAT_CONTEXT = {
  chatbotTipo: "LOJA",
  chatbotOwnerId: ${JSON.stringify(resolvedOwnerId)},
  storeId: ${JSON.stringify(resolvedStoreId)},
  lojaId: ${JSON.stringify(resolvedStoreId)},
  origem: "LANDING_PAGE",
  storeName: ${JSON.stringify(resolvedStoreName)}
};

console.log("GRAN_CHAT_CONTEXT:", window.GRAN_CHAT_CONTEXT);

window.handleInteraction = window.handleInteraction || function(title, description, isWhatsapp) {
  console.log("Interação iframe:", {
    title,
    description,
    isWhatsapp,
    contexto: window.GRAN_CHAT_CONTEXT
  });

  if (isWhatsapp) {
    alert("Aqui você pode integrar o link do WhatsApp.");
  } else {
    alert("Aqui você pode abrir formulário, modal ou página de contato.");
  }
};

console.log("========================================");

</script>
`;

        let finalHtml = "";

        if (isFullDocument) {
          finalHtml = rawHtml;

          if (/<head[\s>]/i.test(finalHtml)) {
            finalHtml = finalHtml.replace(
              /<\/head>/i,
              `${injectedStyle}${fallbackScript}</head>`
            );
          } else if (/<html[\s>]/i.test(finalHtml)) {
            finalHtml = finalHtml.replace(
              /<html([^>]*)>/i,
              `<html$1><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${injectedStyle}${fallbackScript}</head>`
            );
          } else {
            finalHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${injectedStyle}
  ${fallbackScript}
</head>
<body>
  ${finalHtml}
</body>
</html>
            `;
          }
        } else {
          finalHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link
    href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Great+Vibes&family=Inter:wght@400;500;600;700;800&display=swap"
    rel="stylesheet"
  />
  ${injectedStyle}
  ${fallbackScript}
</head>
<body>
  ${rawHtml}
</body>
</html>
          `;
        }

        iframeRef.current.srcdoc = finalHtml;

        iframeRef.current.onload = () => {
          const iframe = iframeRef.current;
          const doc = iframe?.contentDocument;

          if (!iframe || !doc) return;

          try {
            if (doc.body) {
              doc.body.contentEditable = "false";
            }

            const resizeIframe = () => {
              try {
                const bodyHeight = doc.body?.scrollHeight || 0;
                const docHeight = doc.documentElement?.scrollHeight || 0;
                const finalHeight = Math.max(
                  bodyHeight,
                  docHeight,
                  window.innerHeight
                );

                iframe.style.height = `${finalHeight}px`;
              } catch (err) {
                console.error("Erro ao ajustar altura do iframe:", err);
              }
            };

            resizeIframe();

            setTimeout(resizeIframe, 150);
            setTimeout(resizeIframe, 500);
            setTimeout(resizeIframe, 1000);

            const observer = new MutationObserver(() => {
              resizeIframe();
            });

            if (doc.body) {
              observer.observe(doc.body, {
                childList: true,
                subtree: true,
                attributes: true,
                characterData: true,
              });
            }

            iframe.dataset.observerAttached = "true";

            window.addEventListener("resize", resizeIframe);

            const cleanup = () => {
              observer.disconnect();
              window.removeEventListener("resize", resizeIframe);
            };

            (iframe as any)._cleanupResize = cleanup;
          } catch (err) {
            console.error("Erro no onload do iframe:", err);
          }
        };
      } catch (error) {
        console.error("Erro ao carregar a página da loja:", error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadPageContent();
    }
  }, [slug]);

  useEffect(() => {
    return () => {


      const iframe = iframeRef.current as any;

      if (iframe?._cleanupResize) {
        iframe._cleanupResize();
      }
    };
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          fontFamily: "sans-serif",
          background: "#fff",
        }}
      >
        <p>Carregando loja...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "#fff",
      }}
    >
      <iframe
        ref={iframeRef}
        title="Visualização da Loja"
        style={{
          width: "100%",
          minHeight: "100vh",
          border: "none",
          display: "block",
        }}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      />
    </div>
  );
}