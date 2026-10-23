import { useCallback, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Info,
  LoaderCircle,
  PanelLeftOpen,
  Rocket,
  Settings,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../../../api/api";
import { API_URL } from "../../../utils/config";
import { slugify } from "../../../utils/slugify";
import { AccordionItem, InputField } from "./EditorComponentes/EditorUI";
import { ProductSelectorEditor } from "./ProductSelectorEditor";

type PageBusinessKind = "loja" | "servico";

type GeneratedImageTemplate = {
  html: string;
  spec?: any;
  page?: any;
  visualLayout?: any;
  croppedLayout?: any;
};

type EditorPanelProps = {
  aiData: any;
  handleInputChange: (field: string, value: any) => void;
  storeId?: string;
  isPrestador?: boolean;
  onPublish?: () => Promise<void> | void;
  onImageTemplateGenerated?: (result: GeneratedImageTemplate) => void;
};

export function EditorPanel({
  aiData,
  handleInputChange,
  storeId,
  isPrestador,
  onPublish,
  onImageTemplateGenerated,
}: EditorPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openSection, setOpenSection] =
    useState<string | null>("store_settings");
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState("");
  const [pageKind, setPageKind] = useState<PageBusinessKind>(
    (aiData.tipo === "loja" ||
      aiData.tipo_pagina === "loja" ||
      aiData.pageKind === "loja")
      ? "loja"
      : "servico",
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const toggle = useCallback((id: string) => {
    setOpenSection((prev) => (prev === id ? null : id));
  }, []);

  const handleReferenceImage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setReferenceImage(file);
      setReferencePreview((current) => {
        if (current) URL.revokeObjectURL(current);
        return URL.createObjectURL(file);
      });

      event.target.value = "";
    },
    [],
  );

  const resolveBusinessName = useCallback(() => {
    return (
      aiData.store_name ||
      aiData.name ||
      aiData.nome ||
      "Nova pagina"
    );
  }, [aiData.name, aiData.nome, aiData.store_name]);

  const resolveBusinessSlug = useCallback(() => {
    return (
      aiData.store_slug ||
      aiData.slug ||
      slugify(resolveBusinessName())
    );
  }, [
    aiData.slug,
    aiData.store_slug,
    resolveBusinessName,
  ]);

  const resolveBusinessDescription = useCallback(() => {
    return (
      aiData.businessDescription ||
      aiData.business_description ||
      aiData.descricao ||
      aiData.description ||
      aiData.descricaoNegocio ||
      ""
    );
  }, [
    aiData.businessDescription,
    aiData.business_description,
    aiData.descricao,
    aiData.description,
    aiData.descricaoNegocio,
  ]);

  const resolveCapaPreviewUrl = useCallback(() => {
    const value = String(aiData.capa_url || "").trim();

    if (!value) return "";

    if (
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("data:")
    ) {
      return value;
    }

    const baseUrl = String(API_URL || "").replace(/\/$/, "").replace(/\/api$/, "");
    const cleanValue = value.replace(/\\/g, "/");
    const uploadIndex = cleanValue.toLowerCase().indexOf("/uploads/");

    if (uploadIndex >= 0) {
      return `${baseUrl}${cleanValue.slice(uploadIndex)}`;
    }

    if (cleanValue.startsWith("uploads/")) {
      return `${baseUrl}/${cleanValue}`;
    }

    if (cleanValue.startsWith("/")) {
      return `${baseUrl}${cleanValue}`;
    }

    return `${baseUrl}/uploads/images/${cleanValue}`;
  }, [aiData.capa_url]);

  const resolveTemplateMode = useCallback(() => {
    return pageKind === "loja" ? "commerce" : "service";
  }, [pageKind]);

  const generateFromImage = useCallback(async () => {
    if (!referenceImage) {
      throw new Error("Escolha uma imagem de referencia.");
    }

    const formData = new FormData();

    formData.append("image", referenceImage);
    formData.append("name", resolveBusinessName());
    formData.append("mode", resolveTemplateMode());
    formData.append("renderer", "visual");
    formData.append("tipoPagina", pageKind);
    formData.append(
      "businessType",
      pageKind === "loja" ? "store" : "service",
    );
    formData.append("businessName", resolveBusinessName());
    formData.append("businessSlug", resolveBusinessSlug());
    formData.append(
      "businessDescription",
      resolveBusinessDescription(),
    );

    if (storeId) {
      formData.append("storeId", storeId);
    }

    const response = await api.post("/templates/from-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (!response.data?.html) {
      throw new Error("O servidor nao retornou o HTML da pagina.");
    }

    return {
      html: response.data.html,
      spec:
        response.data.page ||
        response.data.spec ||
        response.data.visualLayout ||
        response.data.template,
      page: response.data.page,
      visualLayout: response.data.visualLayout,
      croppedLayout: response.data.croppedLayout,
    };
  }, [
    pageKind,
    referenceImage,
    resolveBusinessDescription,
    resolveBusinessName,
    resolveBusinessSlug,
    resolveTemplateMode,
    storeId,
  ]);

  const handleGenerateFromImage = useCallback(async () => {
    if (!aiData.store_name && !aiData.name) {
      toast.error(
        "Preencha o nome do negocio em Configuracoes Gerais antes de criar o modelo.",
      );
      setOpenSection("store_settings");
      return;
    }

    if (!referenceImage) {
      toast.error("Escolha uma imagem de referencia para criar o modelo.");
      setOpenSection("image_template");
      return;
    }

    setIsGenerating(true);
    const loading = toast.loading("Criando modelo...");

    try {
      const result = await generateFromImage();

      handleInputChange("tipo_pagina", pageKind);
      handleInputChange("page_kind", pageKind);
      onImageTemplateGenerated?.(result);

      toast.success("Modelo criado e aberto no editor!", {
        id: loading,
      });
    } catch (error: any) {
      console.error("Erro ao criar modelo:", error);
      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        "Nao foi possivel criar o modelo.",
        { id: loading },
      );
    } finally {
      setIsGenerating(false);
    }
  }, [
    aiData.name,
    aiData.store_name,
    generateFromImage,
    handleInputChange,
    onImageTemplateGenerated,
    pageKind,
    referenceImage,
  ]);

  const handleCapaUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const loading = toast.loading("Subindo capa...");
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await api.post("/lojas/store/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const uploadedUrl =
          response.data?.url ||
          response.data?.imageUrl ||
          response.data?.image_url ||
          response.data?.fileUrl ||
          response.data?.file_url ||
          response.data?.path ||
          response.data?.filename;

        if (!uploadedUrl) {
          throw new Error("Resposta do servidor incompleta.");
        }

        handleInputChange("capa_url", uploadedUrl);
        toast.success("Capa atualizada!", { id: loading });
      } catch (error: any) {
        toast.error(
          error?.response?.data?.error ||
          error?.message ||
          "Erro ao subir capa.",
          { id: loading },
        );
      } finally {
        event.target.value = "";
      }
    },
    [handleInputChange],
  );

  const handleSave = async () => {
    if (typeof onPublish !== "function") {
      toast.error("Funcao de publicacao nao configurada.");
      return;
    }

    const loading = toast.loading("Publicando site...");

    try {
      // 1. Publica o site
      await onPublish();

      // 2. Salva a capa na tabela stores
      const capaUrl = String(aiData?.capa_url || "").trim();

      if (storeId && capaUrl) {
        console.log("[EDITOR] Salvando capa da loja", {
          storeId,
          capaUrl,
        });

        await api.put(
          `/lojas/stores/${encodeURIComponent(storeId)}`,
          {
            capa_url: capaUrl,
          },
        );
      }

      toast.success("Site publicado com sucesso!", {
        id: loading,
      });
    } catch (error: any) {
      console.error("[EDITOR] Erro ao publicar:", error);

      toast.error(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Erro ao publicar site.",
        {
          id: loading,
        },
      );
    }
  };

  return (
    <aside
      className={`relative h-[90vh] overflow-visible rounded-2xl border-r bg-white shadow-2xl transition-all duration-300 ${isCollapsed ? "w-14 min-w-14" : "w-full lg:w-96"
        }`}
    >
      <button
        type="button"
        onClick={() => setIsCollapsed((prev) => !prev)}
        className="absolute -right-3 top-6 z-30 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-lg hover:text-blue-600"
        aria-label={isCollapsed ? "Abrir painel" : "Fechar painel"}
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {isCollapsed ? (
        <div className="flex h-full flex-col items-center gap-4 rounded-2xl bg-white py-5">
          <PanelLeftOpen size={18} className="text-blue-600" />
        </div>
      ) : (
        <div className="flex h-full flex-col overflow-hidden rounded-2xl">
          <header className="border-b bg-white p-6">
            <h3 className="text-xl font-black italic text-gray-800">
              Editor da Pagina
            </h3>
            <p className="text-[9px] font-bold uppercase text-gray-400">
              {isPrestador ? "Prestador" : "Pagina"} - edicao visual
            </p>
          </header>

          <div className="custom-scrollbar flex-1 space-y-2 overflow-y-auto bg-gray-50/30 p-4">
            <AccordionItem
              title="Configuracoes Gerais"
              id="store_settings"
              active={openSection}
              onToggle={toggle}
              icon={<Settings size={16} className="text-green-600" />}
            >
              <div className="space-y-4 p-1">
                <InputField
                  label="Nome do Negocio"
                  value={aiData.store_name || ""}
                  onChange={(value: string) => {
                    handleInputChange("store_name", value);

                    if (!aiData.store_slug) {
                      handleInputChange("store_slug", slugify(value));
                    }
                  }}
                />

                <InputField
                  label="Link da Pagina"
                  value={aiData.store_slug || ""}
                  onChange={(value: string) =>
                    handleInputChange("store_slug", slugify(value))
                  }
                />

                <InputField
                  label="WhatsApp"
                  value={
                    aiData.telefoneWhatsapp ||
                    aiData.store_whatsapp ||
                    aiData.whatsapp ||
                    ""
                  }
                  onChange={(value: string) => {
                    handleInputChange("telefoneWhatsapp", value);
                    handleInputChange("store_whatsapp", value);
                    handleInputChange("whatsapp", value);
                  }}
                />

                <label className="block space-y-2">
                  <span className="ml-1 text-[10px] font-bold uppercase text-gray-400">
                    Tipo do negocio
                  </span>
                  <select
                    value={pageKind}
                    onChange={(event) => {
                      const value = event.target.value as PageBusinessKind;
                      setPageKind(value);
                      handleInputChange("tipo_pagina", value);
                      handleInputChange("page_kind", value);
                    }}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 outline-none focus:border-blue-400"
                  >
                    <option value="servico">Servico</option>
                    <option value="loja">Loja</option>
                  </select>
                </label>

                <label className="flex h-28 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-white hover:border-blue-400">
                  {aiData.capa_url ? (
                    <img
                      src={resolveCapaPreviewUrl()}
                      className="h-full w-full object-contain bg-gray-50 p-2"
                      alt="Capa"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-300">
                      <ImageIcon size={22} />
                      <span className="text-[10px] font-bold uppercase">
                        Escolher capa
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleCapaUpload}
                  />
                </label>
              </div>
            </AccordionItem>
            {pageKind === "loja" && (
              <AccordionItem
                title="Produtos da Loja"
                id="products"
                active={openSection}
                onToggle={toggle}
                icon={<ImageIcon size={16} />}
              >
                <ProductSelectorEditor
                  aiData={aiData}
                  handleInputChange={handleInputChange}

                />
              </AccordionItem>
            )}

            <AccordionItem
              title="Criar modelo"
              id="image_template"
              active={openSection}
              onToggle={toggle}
              icon={<Sparkles size={16} className="text-fuchsia-600" />}
            >
              <div className="space-y-4 p-1">
                <p className="text-xs leading-relaxed text-gray-500">
                  Depois de preencher as configuracoes gerais, envie uma imagem
                  de referencia. O sistema vai criar uma pagina baseada nela.
                </p>

                <div className="rounded-xl bg-white p-3 text-xs text-gray-500">
                  <strong className="text-gray-700">Tipo atual:</strong>{" "}
                  {pageKind === "loja" ? "Loja" : "Servico"}
                </div>

                <label className="flex min-h-36 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-white hover:border-fuchsia-400">
                  {referencePreview ? (
                    <img
                      src={referencePreview}
                      className="h-40 w-full object-contain bg-gray-50 p-2"
                      alt="Referencia da pagina"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-5 text-gray-400">
                      <ImageIcon size={24} />
                      <span className="text-center text-[10px] font-bold uppercase">
                        Escolher imagem de referencia
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleReferenceImage}
                  />
                </label>

                <button
                  type="button"
                  onClick={handleGenerateFromImage}
                  disabled={!referenceImage || isGenerating}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-fuchsia-600 px-4 py-3 text-sm font-black text-white hover:bg-fuchsia-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {isGenerating ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <Sparkles size={16} />
                  )}
                  {isGenerating ? "Criando modelo..." : "Criar modelo"}
                </button>
              </div>
            </AccordionItem>

            <AccordionItem
              title="Como editar"
              id="help"
              active={openSection}
              onToggle={toggle}
              icon={<Info size={16} className="text-blue-600" />}
            >
              <div className="space-y-3 rounded-xl bg-white p-3 text-xs leading-relaxed text-gray-600">
                <p>Clique diretamente nos textos para altera-los.</p>
                <p>Clique em uma imagem para troca-la.</p>
                <p>Clique em uma secao para editar, trocar video ou ocultar.</p>
              </div>
            </AccordionItem>
          </div>

          <div className="border-t bg-white p-4">
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700"
            >
              <Rocket size={16} />
              Publicar Site
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
