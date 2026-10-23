import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import "./Gerador.css";

type PageKind = "loja" | "servico";

type GeradorRouteState = {
    storeId?: string;
    id?: string;
    tipo?: string;
    name?: string;
    nome?: string;
    slug?: string;
    pageKind?: PageKind;
    page_kind?: PageKind;
    generatorProjectId?: string;
    store?: {
        id?: string;
        name?: string;
        nome?: string;
        slug?: string;
        tipo?: string;
    };
    aiData?: {
        storeId?: string;
        id?: string;
        tipo?: string;
        name?: string;
        nome?: string;
        slug?: string;
        pageKind?: PageKind;
        page_kind?: PageKind;
        generatorProjectId?: string;
    };
};

export default function Gerador() {
    const navigate = useNavigate();
    const location = useLocation();

    const initialState = (location.state || {}) as GeradorRouteState;

    const storeId = String(
        initialState.storeId ||
        initialState.id ||
        initialState.store?.id ||
        initialState.aiData?.storeId ||
        initialState.aiData?.id ||
        "",
    ).trim();

    const tipo = String(
        initialState.tipo ||
        initialState.store?.tipo ||
        initialState.aiData?.tipo ||
        "",
    )
        .trim()
        .toUpperCase();

    const name = String(
        initialState.name ||
        initialState.nome ||
        initialState.store?.name ||
        initialState.store?.nome ||
        initialState.aiData?.name ||
        initialState.aiData?.nome ||
        "",
    ).trim();

    const slug = String(
        initialState.slug ||
        initialState.store?.slug ||
        initialState.aiData?.slug ||
        "",
    ).trim();

    const generatorProjectId = String(
        initialState.generatorProjectId ||
        initialState.aiData?.generatorProjectId ||
        "",
    ).trim();

    const pageKind: PageKind = useMemo(() => {
        const explicit =
            initialState.pageKind ||
            initialState.page_kind ||
            initialState.aiData?.pageKind ||
            initialState.aiData?.page_kind;

        if (explicit === "loja" || explicit === "servico") {
            return explicit;
        }

        return tipo === "EMPREENDEDOR" ? "loja" : "servico";
    }, [
        initialState.aiData?.pageKind,
        initialState.aiData?.page_kind,
        initialState.pageKind,
        initialState.page_kind,
        tipo,
    ]);

    function handleContinue() {
        if (!storeId) {
            toast.error(
                "Não encontrei o storeId do negócio. Abra o gerador a partir do dashboard do prestador ou empreendedor.",
            );
            return;
        }

        navigate("/generator-page-setup", {
            state: {
                storeId,
                tipo,
                name,
                slug,
                pageKind,
                generatorProjectId,
                store: initialState.store,
            },
        });
    }

    return (
        <div className="gerador-container">
            <section className="gerador-section">
                <header className="gerador-header">
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 10,
                            marginBottom: 12,
                        }}
                    >
                        <h1 style={{ margin: 0 }}>
                            GranConecta <span className="ai-badge">AI</span>
                        </h1>

                    </div>

                    <p>
                        O novo Generator será responsável por todo o design da página, sem
                        Preview ou IframeViewer intermediários.
                    </p>
                </header>

                <div className="gerador-form">
                    <div
                        style={{
                            border: "1px solid rgba(148,163,184,.25)",
                            borderRadius: 18,
                            padding: 18,
                            background: "rgba(15,23,42,.55)",
                            marginBottom: 20,
                        }}
                    >
                        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
                            Negócio
                        </div>

                        <div style={{ fontSize: 18, fontWeight: 800 }}>
                            {name || "Negócio GranConecta"}
                        </div>

                        <div style={{ marginTop: 12, fontSize: 13, opacity: 0.72 }}>
                            Tipo: {tipo || "não informado"}
                        </div>

                        <div style={{ marginTop: 4, fontSize: 13, opacity: 0.72 }}>
                            Página: {pageKind === "loja" ? "Loja / e-commerce" : "Serviço"}
                        </div>

                        {slug && (
                            <div style={{ marginTop: 4, fontSize: 13, opacity: 0.72 }}>
                                Slug atual: {slug}
                            </div>
                        )}
                    </div>

                    <button className="gerador-button" onClick={handleContinue}>
                        Configurar e gerar página →
                    </button>
                </div>
            </section>

            <ToastContainer position="top-right" theme="dark" />
        </div>
    );
}
