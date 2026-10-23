import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api/api";
import generatorApi from "../../api/generatorApi";
import { EditorPanel } from "./preview/EditorPanel";
import { IframeViewer } from "./preview/IframeViewer";
import { prepareHtmlForPublish } from "./preview/utils/prepareHtmlForPublish";

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type GeneratedImageTemplate = {
  html: string;
  css?: string;
  spec?: any;
  page?: any;
  visualLayout?: any;
  croppedLayout?: any;
};

export default function Preview() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialState = (location.state || {}) as any;

  const [html, setHtml] = useState<string>(
    initialState.html ||
      initialState.pageHtmlDraft ||
      initialState.pageHtmlPublished ||
      "",
  );

  const [css, setCss] = useState<string>(
    initialState.css ||
      initialState.pageCssDraft ||
      initialState.pageCssPublished ||
      initialState.aiData?.css ||
      "",
  );
  const [iframeInstanceKey, setIframeInstanceKey] = useState(0);
  const [aiData, setAiData] = useState<any>(initialState.aiData || {});
  const [estilos] = useState<any>(initialState.estilo || {});
  const [hasEdited, setHasEdited] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [imageTemplateSpec, setImageTemplateSpec] = useState<any>(
    initialState.imageTemplateSpec || null,
  );

  const [isImageTemplate, setIsImageTemplate] = useState(
    Boolean(
      initialState.imageTemplateSpec ||
      initialState.source === "image-template",
    ),
  );

  const [previousTemplate, setPreviousTemplate] = useState<{
    html: string;
    spec: any;
    isImageTemplate: boolean;
  } | null>(null);

  const templateName =
    initialState.templateName ||
    initialState.layoutEstruturaId ||
    initialState.nicho ||
    initialState.landingData?.title ||
    aiData.templateName ||
    aiData.layoutEstruturaId ||
    "";

  const storeId =
    initialState.storeId ||
    initialState.id ||
    initialState.store?.id ||
    aiData.storeId ||
    aiData.id ||
    aiData.store?.id ||
    "";

  const usuarioId =
    initialState.usuarioId ||
    initialState.userId ||
    initialState.usuario?.id ||
    initialState.user?.id ||
    aiData.usuarioId ||
    aiData.userId ||
    aiData.usuario?.id ||
    aiData.user?.id ||
    "";

  const tipo = initialState.tipo || aiData.tipo || "empreendedor";

  const generatorProjectId = String(
    initialState.generatorProjectId ||
      aiData.generatorProjectId ||
      "",
  ).trim();

  const generatorLayoutId = String(
    initialState.generatorLayoutId ||
      aiData.generatorLayoutId ||
      "",
  ).trim();

  const isGeneratorLayout =
    String(initialState.source || aiData.source || "")
      .trim()
      .toUpperCase() === "GENERATOR" &&
    Boolean(generatorProjectId) &&
    Boolean(generatorLayoutId);

  const selectedProducts =
    aiData.selectedProducts ||
    aiData.products ||
    aiData.produtos ||
    aiData.selected_products ||
    aiData.produtosSelecionados ||
    initialState.selectedProducts ||
    initialState.products ||
    initialState.produtos ||
    initialState.store?.products ||
    initialState.store?.produtos ||
    [];

  function handleInputChange(field: string, value: any) {
    setHasEdited(true);

    setAiData((current: any) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleHtmlChange(nextHtml: string) {
    setHasEdited(true);
    setHtml(nextHtml);
  }

  useEffect(() => {
    if (!selectedProducts.length) return;

    setIframeInstanceKey((current) => current + 1);
  }, [selectedProducts]);

  function handleImageTemplateGenerated({
    html: generatedHtml,
    css: generatedCss,
    spec,
    page,
    visualLayout,
    croppedLayout,
  }: GeneratedImageTemplate) {
    const resolvedSpec = spec || page || visualLayout || croppedLayout || null;

    setPreviousTemplate({
      html,
      spec: imageTemplateSpec,
      isImageTemplate,
    });

    setHtml(generatedHtml);
    if (typeof generatedCss === "string") {
      setCss(generatedCss);
    }
    setIframeInstanceKey((current) => current + 1);
    setImageTemplateSpec(resolvedSpec);
    setIsImageTemplate(true);
    setHasEdited(true);

    setAiData((current: any) => ({
      ...current,
      imageTemplateSpec: resolvedSpec,
      templateName: resolvedSpec?.name || current.templateName,
      templateMode: resolvedSpec?.mode || current.templateMode,
    }));
  }

  function restorePreviousTemplate() {
    if (!previousTemplate) return;

    setHtml(previousTemplate.html);
    setIframeInstanceKey((current) => current + 1);
    setImageTemplateSpec(previousTemplate.spec);
    setIsImageTemplate(previousTemplate.isImageTemplate);
    setPreviousTemplate(null);
    setHasEdited(true);
  }

  useEffect(() => {
    return;
  }, [
    aiData,
    estilos,
    hasEdited,
    initialState.layoutEstruturaId,
    isImageTemplate,
    storeId,
    templateName,
  ]);

  async function handlePublish() {
    if (!html) {
      throw new Error("Nenhum HTML encontrado para publicar.");
    }

    if (isGeneratorLayout) {
      console.log("PREVIEW - APROVANDO LAYOUT DO GENERATOR", {
        projectId: generatorProjectId,
        layoutId: generatorLayoutId,
        storeId,
      });

      const approvalResponse = await generatorApi.post(
        `/api/projects/${generatorProjectId}/layouts/${generatorLayoutId}/approve`,
      );

      if (approvalResponse.data?.approved !== true) {
        throw new Error(
          "O Generator não confirmou a aprovação do layout.",
        );
      }

      console.log("PREVIEW - LAYOUT APROVADO", {
        projectId: generatorProjectId,
        layoutId: generatorLayoutId,
        activeLayoutId: approvalResponse.data?.activeLayoutId,
      });

      const publishResponse = await generatorApi.post(
        `/api/projects/${generatorProjectId}/layouts/${generatorLayoutId}/publish`,
      );

      if (publishResponse.data?.success !== true) {
        throw new Error(
          "O Generator não confirmou a publicação da página.",
        );
      }

      console.log("PREVIEW - GENERATOR PUBLICADO NO GRANCONECTA", {
        projectId: generatorProjectId,
        layoutId: generatorLayoutId,
        storeId: publishResponse.data?.storeId,
        storeSlug: publishResponse.data?.storeSlug,
        publishedTo: publishResponse.data?.publishedTo,
      });

      setHasEdited(false);
      setPreviousTemplate(null);

      return publishResponse.data;
    }

    if (!storeId && !usuarioId) {
      throw new Error(
        "Não encontrei storeId nem usuarioId. Volte uma etapa e gere o template novamente.",
      );
    }

    const resolvedWhatsapp =
      aiData.telefoneWhatsapp ||
      aiData.store_whatsapp ||
      aiData.telefone_whatsapp ||
      aiData.whatsapp ||
      initialState.store?.telefoneWhatsapp ||
      initialState.store?.telefone_whatsapp ||
      initialState.store?.whatsapp ||
      "";

    const htmlToPublish = await prepareHtmlForPublish(html, {
      storeWhatsapp:
        aiData.store_whatsapp ||
        aiData.telefone_whatsapp ||
        initialState.store?.telefone_whatsapp,

      storeName:
        aiData.store_name ||
        aiData.name ||
        initialState.store?.name,

      storeId:
        storeId ||
        initialState.storeId ||
        initialState.id ||
        initialState.store?.id ||
        aiData.storeId ||
        aiData.id ||
        aiData.store?.id ||
        "",

      storeSlug:
        aiData.store_slug ||
        aiData.slug ||
        initialState.store?.slug,

      instagram: aiData.instagram || aiData.store_instagram,
      facebook: aiData.facebook || aiData.store_facebook,
      tiktok: aiData.tiktok || aiData.store_tiktok,
      site: aiData.site || aiData.store_site,
    });

    if (
      typeof htmlToPublish !== "string" ||
      !htmlToPublish.trim() ||
      htmlToPublish.includes("[object Object]") ||
      htmlToPublish.includes("[object Promise]")
    ) {
      throw new Error(
        "HTML gerado para publicação está inválido. A publicação foi cancelada.",
      );
    }

    const response = await api.post("/templates/save", {
      storeId: storeId || null,
      usuarioId,
      tipo,
      html: htmlToPublish,
      pageHtmlDraft: htmlToPublish,
      pageHtmlPublished: htmlToPublish,
      pageCssDraft: css || null,
      pageCssPublished: css || null,
      publish: true,

      telefoneWhatsapp: resolvedWhatsapp,
      telefone_whatsapp: resolvedWhatsapp,
      store_whatsapp: resolvedWhatsapp,
      whatsapp: resolvedWhatsapp,

      settings: {
        store_name: aiData.store_name || aiData.name || initialState.store?.name,
        store_slug: aiData.store_slug || aiData.slug || initialState.store?.slug,

        telefoneWhatsapp: resolvedWhatsapp,
        telefone_whatsapp: resolvedWhatsapp,
        store_whatsapp: resolvedWhatsapp,
        whatsapp: resolvedWhatsapp,

        capa_url: aiData.capa_url || initialState.store?.capa_url,
        name: aiData.store_name || aiData.name || initialState.store?.name,
        slug: aiData.store_slug || aiData.slug || initialState.store?.slug,
        selectedProducts,
      },

      ...(imageTemplateSpec
        ? {
          pageSpecDraft: imageTemplateSpec,
          pageSpecPublished: imageTemplateSpec,
        }
        : {}),
    });

    setHasEdited(false);
    setPreviousTemplate(null);

    return response.data;
  }

  if (!html) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 p-10 text-white">
        Nenhum template carregado
      </div>
    );
  }

  const isStorePage =
    String(tipo || "").toLowerCase().includes("empreendedor") ||
    String(tipo || "").toLowerCase().includes("loja") ||
    String(aiData.tipo || "").toLowerCase().includes("loja") ||
    String(aiData.tipo_pagina || "").toLowerCase().includes("loja") ||
    String(aiData.page_kind || "").toLowerCase().includes("loja") ||
    String(aiData.businessType || "").toLowerCase().includes("store");

  async function handlePublishClick() {
    try {
      setPublishing(true);

      const result = await handlePublish();

      toast.success("Página publicada com sucesso!");

      console.log("PREVIEW - PUBLICADO", result);
    } catch (error: any) {
      console.error("Erro ao publicar:", error);

      toast.error(
        error?.message ||
        error?.response?.data?.message ||
        "Erro ao publicar página.",
      );
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-slate-950 md:flex-row">
      <div className="fixed left-1/2 top-4 z-40 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/90 px-3 py-2 shadow-2xl backdrop-blur">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800"
        >
          Voltar
        </button>

        <button
          type="button"
          onClick={() => setIframeInstanceKey((current) => current + 1)}
          className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800"
        >
          Atualizar preview
        </button>

        <button
          type="button"
          onClick={handlePublishClick}
          disabled={publishing}
          className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-500 disabled:opacity-60"
        >
          {publishing ? "Publicando..." : "Publicar"}
        </button>
      </div>
      <div className="z-20 max-h-[45vh] w-full overflow-y-auto md:h-full md:max-h-none md:w-auto">
        <EditorPanel
          aiData={aiData}
          handleInputChange={handleInputChange}
          storeId={storeId}
          isPrestador={tipo === "prestador"}
          onPublish={handlePublish}
          onImageTemplateGenerated={handleImageTemplateGenerated}
        />
      </div>

      <div className="min-h-0 w-full flex-1 overflow-hidden">
        <IframeViewer
          html={html}
          css={css}
          instanceKey={iframeInstanceKey}
          onHtmlChange={handleHtmlChange}
          selectedProducts={selectedProducts}
          isStorePage={isStorePage}
          storeId={storeId}
          onAddToCart={(productId) => {
            console.log("Produto clicado:", productId);
          }}
        />
      </div>

      {previousTemplate && (
        <button
          type="button"
          onClick={restorePreviousTemplate}
          className="fixed bottom-4 right-4 z-30 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-xl transition hover:bg-slate-100"
        >
          Voltar ao template anterior
        </button>
      )}
        <ToastContainer position="top-right" theme="dark" />
    </div>    
  );

}