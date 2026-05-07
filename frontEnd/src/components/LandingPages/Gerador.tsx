import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useResult } from "./ResultContext";
import "./Gerador.css";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/api";
import ModalCadastroProduto from "../ModalCadastroProduto/ModalNovoProduto";

type GeradorProps = {
  tipo?: "PRESTADOR" | "EMPREENDEDOR" | "MORADOR";
};

export default function Gerador({ tipo }: GeradorProps) {
  const { user } = useAuth();
  const { setResult } = useResult();
  const navigate = useNavigate();

  const [templates, setTemplates] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [descricao, setDescricao] = useState<string>("");
  const [loadingExistente, setLoadingExistente] = useState(true);
  const [perfil, setPerfil] = useState<any>(null);

  const [openModal, setOpenModal] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<any>(null);
  const [showProductCheck, setShowProductCheck] = useState(false);
  const [showNextStepChoice, setShowNextStepChoice] = useState(false);
  const [lojaAtivaId, setLojaAtivaId] = useState<string | null>(null);
  const [temloja, setTemloja] = useState<any[]>([])
  // 🔍 BUSCA PERFIL E LOJA AO CARREGAR
  useEffect(() => {
    const checkExistingStore = async () => {
      if (!user?.id) return;
      try {
        const resUser = await api.get(`/users/${user.id}`);
        const perfilData = resUser.data?.perfil;
        setPerfil(perfilData);

        const resStore = await api.get(`/lojas/publica/todas`);
        const lojas = Array.isArray(resStore.data) ? resStore.data : [];

      //  const categoria =   await api.get(`/${user.categoriaid}`);

        setTemloja(lojas.filter(x => x.tipo === 'loja' && x.usuarioId === user.id))

        console.log('Usuario logado: ', user.id)
        console.log('usuario da loja  ', temloja)


        const lojaExistente = lojas.find(
          (l: any) =>
            String(l.usuarioId) === String(user.id) &&
            String(l.tipo).toUpperCase() === String(tipo).toUpperCase()
        );


        if (lojaExistente) {
          setLojaAtivaId(lojaExistente.id);
          setResult({
            id: lojaExistente.id,
            html: lojaExistente.pageHtmlPublished || lojaExistente.pageHtmlDraft,
            css: lojaExistente.pageCssDraft || "",
            estilo: lojaExistente.layoutConfig ? JSON.parse(lojaExistente.layoutConfig) : {},
            store: lojaExistente,
            tipo: tipo,
            usuarioId: user.id
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

  // 📋 CARREGA TEMPLATES
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data } = await api.get("/templates", { params: { tipo } });
        const list = data?.templates || [];
        setTemplates(list);
        if (list.length > 0) setSelectedTemplate(list[0]);
      } catch (error) {
        console.error("Erro ao buscar templates:", error);
      }
    };
    fetchTemplates();
  }, [tipo]);

  const handleStartProcess = () => {
    if (!descricao.trim()) return toast.error("Descreva seu negócio para a IA!");
    setShowProductCheck(true);
  };

  // 🚀 GERAÇÃO DO SITE (CHAMADA PELA OPÇÃO "NÃO") OU PELO PROCESSO NORMAL
  const handleGenerate = async () => {
    setShowProductCheck(false);
    const loadingToast = toast.loading("A IA está criando seu design...");

    try {
      const res = await api.post("/generate", {
        templateName: selectedTemplate || "master",
        usuarioId: user?.id,
        descricaoDoCliente: descricao,
        tipo: tipo,
        condominioId: (user as any)?.condominio_id,
      });

      //const { store } = res.data;
      const { store, businessType } = res.data;
      // ✅ GARANTE O ID DA LOJA ANTES DE QUALQUER NAVEGAÇÃO
      if (store?.id) {
        setLojaAtivaId(store.id);
      }

      setResult({ ...res.data, usuarioId: user?.id, tipo });

      const novoResultado = {
        ...res.data,
        id: store?.id,
        storeId: store?.id,
        usuarioId: user?.id,
        tipo: tipo,
        businessType: businessType || (tipo === "EMPREENDEDOR" ? "loja" : "servico")
      };
      setResult(novoResultado);
      toast.update(loadingToast, {
        render: "Site criado com sucesso!",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });


      // Se viemos do "Não, apenas gerar", levamos direto para o preview
      navigate("/preview", { state: novoResultado });

    } catch (err: any) {
      console.error("Erro na geração:", err);
      toast.update(loadingToast, {
        render: "Erro ao gerar site. Verifique sua descrição.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const handleSucessoProduto = () => {
    // 🟢 NÃO setamos openModal(false) aqui imediatamente para não dar "pulo" na tela
    // apenas abrimos a escolha do próximo passo
    setShowNextStepChoice(true);
  };

  if (loadingExistente) {
    return (
      <div className="gerador-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loader-simples"></div>
        <p style={{ color: 'white', marginLeft: '10px' }}>Sincronizando dados...</p>
      </div>
    );
  }

  return (
    <div className="gerador-container">
      <section className="gerador-section">
        <header className="gerador-header">
          <h1>GranConecta <span className="ai-badge">AI</span></h1>
          <p>Seu negócio pronto para vender.</p>
        </header>

        <div className="gerador-form">
          <div className="template-grid">
            {templates.map((t) => (
              <div
                key={t}
                className={`template-card ${selectedTemplate === t ? "active" : ""}`}
                onClick={() => setSelectedTemplate(t)}
              >
                <div className={`preview-container ${t}`}>
                  {selectedTemplate === t && <div className="selected-check">✓</div>}
                </div>
                <div className="template-info"><span>{t.toUpperCase()}</span></div>
              </div>
            ))}
          </div>

          <div className="input-group">
            <label>O que você faz?</label>
            <textarea
              placeholder="Descreva seu negócio para a IA..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <button className="gerador-button" onClick={handleStartProcess}>
            Gerar Site e Produtos
          </button>

          {/* 1. PERGUNTA INICIAL: CADASTRA OU GERA DIRETO? */}
          {showProductCheck && (
            <div className="modal-overlay">
              <div className="modal-box">
                <h2>Vitrine de Produtos</h2>
                <p>Para um resultado melhor, cadastre seus produtos. O que deseja fazer?</p>
                <div className="modal-actions">
                  {temloja.length > 0 && (
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

                  <button onClick={handleGenerate} className="btn-secondary">
                    Não, apenas gerar design
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. ESCOLHA PÓS-CADASTRO */}
          {showNextStepChoice && (
            <div className="modal-overlay" style={{ zIndex: 9999 }}>
              <div className="modal-box">
                <h2 style={{ color: '#2ecc71' }}>✔ Produto Salvo!</h2>
                <p>Deseja incluir mais um produto nesta loja ou finalizar o site?</p>
                <div className="modal-actions">
                  <button
                    onClick={() => {
                      setShowNextStepChoice(false);
                      setProdutoEditando(null);
                      setOpenModal(true); // Garante que o modal de cadastro continue aberto
                    }}
                    className="btn-success"
                  >
                    + Cadastrar outro
                  </button>
                  <button
                    onClick={() => {
                      setShowNextStepChoice(false);
                      setOpenModal(false);
                      handleGenerate(); // Agora gera o site COM os produtos cadastrados
                    }}
                    className="btn-secondary"
                  >
                    Finalizar e Gerar Site
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <ModalCadastroProduto
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setProdutoEditando(null);
        }}
        lojaId={lojaAtivaId}
        produtoId={produtoEditando?.id}
        dadosProduto={produtoEditando}
        onSuccess={handleSucessoProduto}
        plan={perfil?.plano || 'BASICO'}
      />

      <ToastContainer position="top-right" theme="dark" />
    </div>
  );
}