import { useState, useCallback, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import api from "../../api/api";
import toast, { Toaster } from "react-hot-toast";
import { EditorPanel } from "./preview/EditorPanel";
import { IframeViewer } from "./preview/IframeViewer";
import { CarrinhoLateral } from "../CarrinhoLateral/CarrinhoLateral";
import { ModalNovaSolicitacao } from "../ModalNovaSolicitacao/ModalNovaSolicitacao";
import { useAuth } from "../../context/AuthContext";
import { slugify } from "../../utils/slugify"; // Certifique-se que o arquivo existe em utils

export default function Preview() {
  const { user } = useAuth();
  const location = useLocation();
  const state = location.state as any;
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [_selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const businessType = (state?.businessType || 'servico').toLowerCase();
  const usuarioId = state?.usuarioId;
  const [storeId, setStoreId] = useState(state?.id || state?.store?.id || '');
  const [isPrestador, setIsPrestador] = useState(state?.tipo || '');
  const [_openCarrinho, setOpenCarrinho] = useState(false);
  const [userData, setUserData] = useState({
    categoriaid: "",
    categoria: "",
    condominio_id: state?.condominio_id || ""
  });
  const [aiData, setAiData] = useState<any>(
    state?.aiData || {
      titulo: "Meu Site Profissional",
      subtitulo: "Configurando o layout...",
      hero_bg_type: "gradient",
      hero_grad_1: "#1a1a1a",
      hero_grad_2: "#3b82f6",
      show_hero: true,
      produtos: []
    }
  );

  const [estilos, setEstilos] = useState({
    primaryColor: state?.estilo?.primary_color || "#3b82f6",
    bodyBgColor: state?.estilo?.body_bg || "#ffffff",
    textColor: state?.estilo?.body_text_color || "#333333",
    fontFamily: state?.estilo?.body_font || "sans-serif",
  });

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const handleCloseCarrinho = () => {
    setOpenCarrinho(false);
  };
  useEffect(() => {
    if (!usuarioId) return;

    const loadContext = async () => {
      try {
        const { data: userDataRes } = await api.get(`/users/${usuarioId}`);
        const perfil = userDataRes.perfil;

        if (perfil?.categoriaid) {
          const { data: catRes } = await api.get(`/categorias/${perfil.categoriaid}`);
          setUserData(prev => ({
            ...prev,
            categoriaid: perfil.categoriaid,
            categoria: catRes.data?.name || "Geral",
            condominio_id: perfil.condominio_id || prev.condominio_id
          }));
        }
      } catch (err) {
        console.error("Erro ao carregar contexto:", err);
      }
    };
    loadContext();
  }, [usuarioId]);

  useEffect(() => {
    const fetchStoreData = async () => {
      if (!storeId) return;

      try {
        const { data } = await api.get(`/lojas/stores/${storeId}`);

        if (data) {
          // 1. Atualiza os dados de conteúdo da IA
          if (data.aiData) {
            setAiData(data.aiData);
          }

          // 2. Atualiza os estilos visuais salvos
          if (data.estilo) {
            setEstilos({
              primaryColor: data.estilo.primary_color || "#3b82f6",
              bodyBgColor: data.estilo.body_bg || "#ffffff",
              textColor: data.estilo.body_text_color || "#333333",
              fontFamily: data.estilo.body_font || "sans-serif",
            });
          }

          // 3. Atualiza o tipo de prestador se necessário
          if (data.tipo) setIsPrestador(data.tipo);
        }
      } catch (err) {
        console.error("Erro ao recuperar dados salvos da loja:", err);
        // Não exibimos toast de erro aqui para não atrapalhar a experiência inicial
      }
    };

    fetchStoreData();
  }, [storeId]);

  const registrarLead = async (tipo: string, metadata: any) => {
    try {
      await api.post('/lojas/registrar-interacao', {
        lojaId: storeId,
        usuarioId: user?.id,
        tipoInteracao: tipo,
        metaData: metadata,
        condominioId: userData.condominio_id
      });
    } catch (err) {
      console.error("Erro ao registrar lead:", err);
    }
  };

  const handleInputChange = useCallback((field: string, value: any) => {
    setAiData((prev: any) => {
      const keys = field.split(".");
      const newData = { ...prev };
      let obj = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        obj[key] = { ...obj[key] };
        obj = obj[key];
      }
      obj[keys[keys.length - 1]] = value;
      return newData;
    });
  }, []);

  const handleSave = async () => {
    const loading = toast.loading("Sincronizando...");
    try {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) throw new Error("Documento do Iframe não acessível");

      // --- LOGICA SEGURA DE LIMPEZA ---
      const docClone = doc.documentElement.cloneNode(true) as HTMLElement;
      const imagens = docClone.querySelectorAll('img');

      imagens.forEach((img: HTMLImageElement) => {
        // SÓ limpa se for Base64. Se for URL (http ou /uploads), ele NÃO mexe.
        if (img.src.startsWith('data:image')) {
          img.src = "/api/uploads/images/default_placeholder.webp";
        }
      });

      const htmlParaPublicar = docClone.outerHTML || "";

      // Tratamento do aiData (layoutConfig)
      const aiDataLimpo = { ...aiData, business_type: businessType };

      // Se as URLs de logo/capa forem Base64, limpa para não travar o banco
      if (aiDataLimpo.logo_url?.startsWith('data:image')) aiDataLimpo.logo_url = '';
      if (aiDataLimpo.capa_url?.startsWith('data:image')) aiDataLimpo.capa_url = '';

      const payload = {
        usuarioId,
        name: aiData.store_name || aiData.nome_marca || "Minha Loja",
        // Aplica slugify no slug da loja
        slug: slugify(aiData.store_slug || aiData.store_name || `site-${usuarioId?.substring(0, 5)}`),
        aiData: aiDataLimpo,
        pageHtmlPublished: htmlParaPublicar,
        categoriaid: userData.categoriaid,
        // Garante que categoria_tag siga o padrão de hífens para o filtro da vitrine
        categoria_tag: slugify(userData.categoria || "servico"),
        tipo: isPrestador,
        categoriaTipo: businessType,
        estilo: {
          primary_color: estilos.primaryColor,
          body_bg: estilos.bodyBgColor,
          body_text_color: estilos.textColor,
          body_font: estilos.fontFamily,
          // Se você adicionou gradientes no Header, salve-os aqui também:
          header_bg_type: aiData.header_bg_type,
          header_grad_1: aiData.header_grad_1,
          header_grad_2: aiData.header_grad_2
        }
      };

      if (storeId) {
        await api.put(`/lojas/stores/${storeId}`, payload);
      } else {
        const res = await api.post(`/lojas/stores`, payload);
        if (res.data?.id) setStoreId(res.data.id);
      }

      toast.success("Publicado com sucesso!", { id: loading });
    } catch (error: any) {
      console.error("Erro ao salvar loja:", error);
      toast.error("Erro ao salvar dados. Verifique a conexão.", { id: loading });
    }
  };

  useEffect(() => {
    // Verifique se o iframe está pronto antes de mandar mensagem
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'UPDATE_THEME',
        payload: estilos
      }, '*');
    }
  }, [estilos]);


  const saveDraft = async () => {
    try {
      const payload = {
        usuarioId,
        aiData,
        estilo: {
          primary_color: estilos.primaryColor,
          body_bg: estilos.bodyBgColor,
          body_text_color: estilos.textColor,
          body_font: estilos.fontFamily
        }
      };
     // await api.put(`/lojas/stores/${storeId}/draft`, payload);
      await api.put(`/lojas/stores/${storeId}`, payload);
      toast.success("Rascunho salvo!");
    } catch (e) {
      console.error("Erro no rascunho", e);
    }
  };


  useEffect(() => {
    const timer = setTimeout(() => {
      if (storeId) { // Só salva rascunho se a loja já existir
        saveDraft();
      }
    }, 3000); // Aguarda 3 segundos após a última alteração para não sobrecarregar o servidor

    return () => clearTimeout(timer);
  }, [aiData, estilos, storeId, saveDraft]);

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-100 overflow-hidden">
      <Toaster position="top-right" />

      <EditorPanel
        aiData={aiData}
        handleInputChange={handleInputChange}
        // Cores individuais para os ColorPickers manuais
        primaryColor={estilos.primaryColor}
        setPrimaryColor={(color: string) => setEstilos(prev => ({ ...prev, primaryColor: color }))}
        bodyBgColor={estilos.bodyBgColor}
        setBodyBgColor={(color: string) => setEstilos(prev => ({ ...prev, bodyBgColor: color }))}
        textColor={estilos.textColor}
        setTextColor={(color: string) => setEstilos(prev => ({ ...prev, textColor: color }))}

        // ✅ ADICIONE ESSA LINHA PARA OS TEMAS FUNCIONAREM:
        setEstilos={setEstilos}

        onSave={handleSave}
        categoriaTipo={businessType}
        storeId={storeId}
      />

      <div className="flex-1 flex flex-col items-center p-4 gap-4 overflow-hidden">
        <IframeViewer
          ref={iframeRef}
          aiData={aiData}
          {...estilos}
          isPrestador={isPrestador === 'PRESTADOR'}
          businessType={businessType}
          onOpenCart={async (produto: any) => {
            await registrarLead("CLIQUE_PRODUTO", produto);
            setSelectedProduct(produto);
            setIsCartOpen(true);
          }}
          onOpenServiceModal={async (servico: any) => {
            await registrarLead("INTERESSE_SERVICO", servico);
            setSelectedService(servico);
            setIsServiceModalOpen(true);
          }}
        />

        <CarrinhoLateral
          open={isCartOpen}
          storeName={aiData.store_name || aiData.nome_marca}
          onClose={handleCloseCarrinho}
          storeId={storeId}
          categoria_tag={userData.categoria}
        />

        <ModalNovaSolicitacao
          open={isServiceModalOpen}
          onClose={() => setIsServiceModalOpen(false)}
          usuarioId={user?.id}
          condominio_id={userData.condominio_id}
          prestadorNome={aiData.store_name || aiData.nome_marca}
          tituloInicial={selectedService?.name || selectedService?.titulo}
          descricaoInicial={selectedService?.descricao}
        />
      </div>
    </div>
  );
}