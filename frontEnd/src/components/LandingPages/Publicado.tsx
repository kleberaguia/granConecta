import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface SavedData {
  html: string;
  css: string;
  usuarioId: string;
  condominioId: string | null;
  telefoneWhatsApp?: string;
}

export default function Publicado() {
  const [pageData, setPageData] = useState<SavedData | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const adicionarAoCarrinho = (id: string | null) => {
    console.log("Integrando com o sistema... Adicionando ID:", id);
  };

  const getAuthToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("token") ||
      sessionStorage.getItem("authToken") ||
      ""
    );
  };

  useEffect(() => {
    const saved = localStorage.getItem("landing_page_draft");
    if (saved) {
      try {
        const parsed: SavedData = JSON.parse(saved);
        setPageData(parsed);
      } catch (err) {
        console.error("Erro ao ler dados do site:", err);
      }
    }
  }, []);

  const telefoneLimpo = useMemo(() => {
    return String(pageData?.telefoneWhatsApp || "").replace(/\D/g, "");
  }, [pageData?.telefoneWhatsApp]);

  useEffect(() => {
    (window as any).gravarSolicitacaoBackground = async (formData: any = {}) => {
      try {
        const token = getAuthToken();

        if (!token) {
          console.error("Token não encontrado no storage.");
          return false;
        }

        const payload = {
          id: crypto.randomUUID(),
          ...formData,
          usuarioId: String((user as any)?.id || pageData?.usuarioId || ""),
          prestadorId: String(pageData?.usuarioId || (user as any)?.id || ""),
          condominio_id: String((user as any)?.condominio_id || pageData?.condominioId || ""),
          status: "ABERTO",
          progresso: 0,
          valor_sugerido: parseFloat("0.00"),
        };

        console.log("TOKEN:", token);
        console.log("PAYLOAD:", payload);
        const url = import.meta.env.VITE_API_URL;
        const response = await fetch(`${url}/api/servicos/solicitacoes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Erro ao registrar solicitação:", response.status, errorText);
        }

        return response.ok;
      } catch (error) {
        console.error("Erro ao registrar solicitação em background:", error);
        return false;
      }
    };

    (window as any).handleInteraction = async (
      titulo: string,
      descricao: string,
      redirectWhatsapp = false
    ) => {
      try {
        if (redirectWhatsapp) {
          await (window as any).gravarSolicitacaoBackground({
            titulo: titulo || "Contato via WhatsApp",
            descricao: `[Via WhatsApp] ${descricao || "Interesse vindo da landing page"}`,
            canal: "whatsapp",
            origem: "landing_publicada",
          });

          if (!telefoneLimpo) {
            console.warn("Telefone do WhatsApp não configurado.");
            return;
          }

          const msg = encodeURIComponent(`Olá! Tenho interesse em: ${titulo || "atendimento"}.`);
          window.open(`https://wa.me/${telefoneLimpo}?text=${msg}`, "_blank");
          return;
        }

        if (typeof (window as any).abrirModalNovaSolicitacao === "function") {
          (window as any).abrirModalNovaSolicitacao({
            titulo: titulo || "Novo contato",
            descricao: descricao || "Interesse vindo da landing page",
            usuarioId: String((user as any)?.id || pageData?.usuarioId || ""),
            condominio_id: String((user as any)?.condominio_id || pageData?.condominioId || ""),
            prestadorId: String(pageData?.usuarioId || (user as any)?.id || ""),
            status: "ABERTO",
            progresso: 0,
            valor_sugerido: parseFloat("0.00"),
          });
          return;
        }

        await (window as any).gravarSolicitacaoBackground({
          titulo: titulo || "Novo contato",
          descricao: descricao || "Interesse vindo da landing page",
          canal: "formulario",
          origem: "landing_publicada",
        });

        alert(`${titulo || "Novo contato"}\n\n${descricao || "Interesse vindo da landing page"}`);
      } catch (error) {
        console.error("Erro em handleInteraction:", error);
      }
    };

    return () => {
      delete (window as any).handleInteraction;
      delete (window as any).gravarSolicitacaoBackground;
    };
  }, [user, pageData, telefoneLimpo]);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (target.classList.contains("buy-button")) {
        const productId = target.getAttribute("data-id");
        adicionarAoCarrinho(productId);
        alert("Produto adicionado ao carrinho!");
        return;
      }

      if (target.tagName === "A" && target.getAttribute("href") === "#") {
        e.preventDefault();
      }
    };

    document.addEventListener("click", handleGlobalClick);
    return () => document.removeEventListener("click", handleGlobalClick);
  }, []);

  useEffect(() => {
    if (pageData) {
      const timer = setTimeout(() => {
        const elements = document.querySelectorAll("[contenteditable]");
        elements.forEach((el) => {
          el.removeAttribute("contenteditable");
          (el as HTMLElement).style.outline = "none";
        });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [pageData]);

  if (!pageData) {
    return (
      <div style={{ textAlign: "center", padding: "50px", fontFamily: "sans-serif" }}>
        <h2>Nenhum site publicado encontrado.</h2>
        <button onClick={() => navigate("/")} style={btnBackStyle}>
          Voltar ao Editor
        </button>
      </div>
    );
  }

  return (
    <>
      <style>
        {pageData.css}
        {`
          body { margin: 0; padding: 0; overflow-x: hidden; font-family: sans-serif; }
          .luxury-hero { display: flex; align-items: center; background-size: cover; background-position: center; min-height: 500px; }
          .hero-align-left { justify-content: flex-start; text-align: left; }
          .hero-align-center { justify-content: center; text-align: center; }
          .hero-align-right { justify-content: flex-end; text-align: right; }
          .buy-button { transition: transform 0.2s, background 0.2s; }
          .buy-button:hover { transform: scale(1.02); opacity: 0.9; }
          img { max-width: 100%; height: auto; }
        `}
      </style>

      <div
        className="published-content"
        dangerouslySetInnerHTML={{ __html: pageData.html }}
      />

      <button onClick={() => navigate("/")} style={floatingBtnStyle}>
        ✏️ Editar Novamente
      </button>
    </>
  );
}

const btnBackStyle = {
  padding: "10px 20px",
  background: "#3b82f6",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  marginTop: "20px",
};

const floatingBtnStyle: React.CSSProperties = {
  position: "fixed",
  bottom: "20px",
  right: "20px",
  padding: "12px 20px",
  background: "rgba(0,0,0,0.8)",
  color: "white",
  border: "none",
  borderRadius: "30px",
  cursor: "pointer",
  fontSize: "14px",
  zIndex: 9999,
  boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
  backdropFilter: "blur(5px)",
};