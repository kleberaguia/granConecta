import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import { injectHero } from "./componentes/hero";
import { injectHeader } from "./componentes/header";
import { injectGallery } from "./componentes/gallery";
import { injectCTA } from "./componentes/cta";
import { injectFooter } from "./componentes/footer";
import { injectSections } from "./componentes/sections";
import { injectVitrine } from "./componentes/vitrine";
import { templateConfig } from "./templateConfig";
import { injectLeads } from "./componentes/Leads";
import { injectServices } from "./componentes/injectServices";

export const IframeViewer = forwardRef(({
  aiData, primaryColor, textColor, bodyBgColor, fontFamily,
  isPrestador, categoria_tag, businessType,
  // ✅ Adicione essas props que devem vir do componente pai (Preview.tsx)
  onOpenCart, onOpenServiceModal
}: any, ref) => {

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const readyRef = useRef(false);


  if (aiData) aiData.business_type = businessType;
  useImperativeHandle(ref, () => iframeRef.current);



  // 1. O Bridge Script (Igual ao que você fez, está certo!)
  const buildIframeHtml = useCallback(() => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&family=Inter:wght@400;700&display=swap" rel="stylesheet">
        <style>
          body { margin:0; min-height: 100vh; transition: background 0.3s ease; }
          section { position: relative; width: 100%; }
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
          :root {
              --primary-color: ${primaryColor};
              --bg-color: ${bodyBgColor};
              --text-color: ${textColor};
              --font-family: ${fontFamily};
            }
            body { 
              background-color: var(--bg-color); 
              color: var(--text-color); 
              font-family: var(--font-family);
            }
            img {
              object-fit: contain;
              width: 100%;
              height: auto;
            }
            .logo-img {
              object-fit: contain;
              width: 100%;
              height: auto;
              max-width: 100%;
              max-height: 100%;
              display: block;
            }

        </style>
        <script>
          document.addEventListener("click", function(e) {
            const target = e.target.closest("a, button, [data-action]");
            if (!target) return;

            const href = target.getAttribute("href") || "";
            
            // WHATSAPP LEAD
            if (href.includes("wa.me") || target.getAttribute("data-action") === "whatsapp-lead") {
              e.preventDefault();
              window.parent.postMessage({ type: "WHATSAPP_LEAD", payload: { url: href } }, "*");
              return;
            }

            // CARRINHO
            const productId = target.getAttribute("data-product-id");
            if (productId) {
              e.preventDefault();
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

            // MODAL DE SERVIÇO
           if (target.getAttribute("data-action") === "service-request") {
              e.preventDefault();
              window.parent.postMessage({
                type: "OPEN_SERVICE_MODAL",
                payload: {
                  titulo: target.getAttribute("data-service-name") || target.innerText,
                  descricao: target.getAttribute("data-service-description") || "",
                  categoriaId: target.getAttribute("data-service-category-id") || "",
                }
              }, "*");
            }
          }, true);

          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  primary: 'var(--primary-color)',
                  bodyBg: 'var(--bg-color)',
                  bodyText: 'var(--text-color)',
                },
                fontFamily: {
                  sans: ['var(--font-family)', 'sans-serif'],
                }
              }
            }
          }
        </script>
      </head>
      <body>
        <header id="main-header"></header>
        <main>
          <section id="hero-section"></section>
          <section id="trust_badges-section"></section>
          <section id="services-section"></section> 
          <section id="sobre-section"></section>
          <section id="vitrine-section"></section>
          <section id="gallery-section"></section>
          <section id="testimonials-section"></section>
          <section id="faq-section"></section>
          <section id="cta-section"></section>
          <section id="leads-section"></section>
        </main>
        <footer id="footer-section"></footer>
      </body>
      </html>
    `;
  }, []);

  // 2. LISTENER DE MENSAGENS (O que faltava!)
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data?.type) return;

      const { type, payload } = e.data;

      switch (type) {
        case "WHATSAPP_LEAD":
          // Abre o whats em nova aba
          window.open(payload.url, "_blank");
          break;

        case "ADD_TO_CART":
          // Chama a função que abre o carrinho no seu Preview.tsx
          if (onOpenCart) onOpenCart(payload);
          break;

        case "OPEN_SERVICE_MODAL":
          // Chama a função que abre o modal de serviço no seu Preview.tsx
          if (onOpenServiceModal) onOpenServiceModal(payload);
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onOpenCart, onOpenServiceModal]);

  // 3. SEU SYNC ALL (Mantido exatamente como está)
  const syncAll = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;

    const doc = iframe.contentDocument;

    // Configurações visuais globais
    doc.body.style.backgroundColor = bodyBgColor || "#ffffff";
    doc.body.style.fontFamily = fontFamily || "'Inter', sans-serif";
    doc.body.style.color = textColor || "#1e293b";
    const vitrineSec = doc.getElementById('vitrine-section');
    const gallerySec = doc.getElementById('gallery-section');
    // Se não tivermos dados da IA, não há o que injetar
    if (!aiData) return;

    // ✅ 1. Header (usando as props que estavam paradas)
    injectHeader(doc, aiData, primaryColor);

    // ✅ 2. Hero (Passando todos os argumentos que ele exige)
    injectHero(
      doc,
      aiData,
      primaryColor,
      
    );

    // ✅ 3. Vitrine (Passando a tag para o sistema saber o que listar)
    // Se categoria_tag for "loja", ele renderiza produtos, se for "serviço", renderiza serviços
    injectServices(doc, aiData, primaryColor);
    if (businessType === "loja") {
      // ✅ É LOJA: Injeta Vitrine e Garante que Galeria suma
      injectVitrine(doc, aiData, primaryColor);

      if (gallerySec) gallerySec.innerHTML = ''; // Limpa a galeria
    } else {
      // ✅ É SERVIÇO: Injeta Galeria e Garante que Vitrine suma
      injectGallery(doc, aiData, primaryColor);

      if (vitrineSec) vitrineSec.innerHTML = ''; // Limpa a vitrine
    }
    injectCTA(doc, aiData);

    injectLeads(doc, aiData, primaryColor);

    // ✅ 4. Demais seções
    injectSections(doc, aiData, primaryColor);
    injectFooter(doc, aiData);

    // ✅ Usando o templateConfig (que o TS disse estar parado)
    // Você pode usar para aplicar estilos específicos baseados no tipo de negócio
    const config = templateConfig[businessType] || templateConfig['servico'];
    console.log("Aplicando configuração de template:", config);

  }, [
    aiData, primaryColor, textColor, bodyBgColor,
    fontFamily, businessType, isPrestador, categoria_tag // ✅ Adicionados aqui para o useCallback atualizar
  ]);
  // 4. SEUS UEEFFECTS DE INICIALIZAÇÃO (Mantidos!)
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    iframe.srcdoc = buildIframeHtml();
    iframe.onload = () => {
      readyRef.current = true;
      syncAll();
    };
  }, [buildIframeHtml]);

  useEffect(() => {
    if (readyRef.current) syncAll();
  }, [aiData, syncAll]);

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.data.type === 'UPDATE_THEME') {
        const { primaryColor, bodyBgColor, textColor, fontFamily } = event.data.payload;

        const doc = iframeRef.current?.contentDocument;
        if (!doc) return;

        // ✅ CORREÇÃO: Altera o root de DENTRO do iframe
        const root = doc.documentElement;
        root.style.setProperty('--primary-color', primaryColor);
        root.style.setProperty('--bg-color', bodyBgColor);
        root.style.setProperty('--text-color', textColor);
        root.style.setProperty('--font-family', fontFamily);
        if (fontFamily && fontFamily !== 'sans-serif') {
        const fontId = 'dynamic-google-font';
        let link = doc.getElementById(fontId) as HTMLLinkElement;
        
        if (!link) {
          link = doc.createElement('link');
          link.id = fontId;
          link.rel = 'stylesheet';
          doc.head.appendChild(link);
        }
        
        // Formata o nome: "Playfair Display" -> "Playfair+Display"
        const formattedFont = fontFamily.replace(/\s+/g, '+');
        link.href = `https://fonts.googleapis.com/css2?family=${formattedFont}:wght@400;700;900&display=swap`;
      }

        // ✅ IMPORTANTE: Re-injetar seções para aplicar cores em elementos 
        // que não usam variáveis (como SVGs ou gradientes complexos)
        syncAll();
      }
    };

    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [syncAll]);

  return (
    <div className="w-full h-full bg-[#f8fafc] p-4 flex items-center justify-center">
      <div className="w-full h-full max-w-[1280px] shadow-2xl rounded-2xl overflow-hidden bg-white">
        <iframe ref={iframeRef} className="w-full h-full border-0" title="Site Preview" />
      </div>
    </div>
  );
});