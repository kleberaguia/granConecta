import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useResult } from "./ResultContext";
import "./Gerador.css";

export default function Gerador() {
    const { setResult } = useResult();
    const navigate = useNavigate();

    const [templates, setTemplates] = useState<string[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>("");
    const [descricao, setDescricao] = useState<string>(""); // Estado para o prompt da IA
    const [usuarioId] = useState<string>("user_2026_99"); // Seu padrão usuarioId

    const URL =  import.meta.env.VITE_API_URL || "http://localhost:3000";

    useEffect(() => {
        fetch(`${URL}/templates`)
            .then((res) => res.json())
            .then((data) => {
                setTemplates(data.templates);
                if (data.templates.length > 0) setSelectedTemplate(data.templates[0]);
            })
            .catch(() => toast.error("Erro ao carregar lista de templates."));
    }, []);

    const handleGenerate = async () => {
        if (!selectedTemplate) return toast.error("Selecione um modelo!");
        if (!descricao.trim()) return toast.error("Descreva seu negócio para a IA!");

        const loadingToast = toast.loading("A IA está trabalhando no seu design...");

        try {
            const res = await fetch("http://localhost:0/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    templateName: selectedTemplate,
                    usuarioId: usuarioId,
                    descricaoDoCliente: descricao // Enviando o contexto para o retoque
                }),
            });

            const data = await res.json();
            setResult({ html: data.html, css: data.css });

            toast.update(loadingToast, {
                render: "Landing page personalizada com sucesso!",
                type: "success",
                isLoading: false,
                autoClose: 2000
            });

            navigate("/preview");
        } catch (err) {
            toast.update(loadingToast, {
                render: "Erro ao gerar a landing page.",
                type: "error",
                isLoading: false,
                autoClose: 3000
            });
        }
    };

    return (
        <div className="gerador-container">
            <section className="gerador-section">
                <header className="gerador-header">
                    <h1>GranConecta <span className="ai-badge">AI</span></h1>
                    <p>Transforme sua ideia em uma página de alta conversão em segundos.</p>
                </header>

                <div className="gerador-form">
                    {/* SELEÇÃO VISUAL DE TEMPLATES */}
                    <div className="template-grid">
                        {templates.map((t) => (
                            <div
                                key={t}
                                className={`template-card ${selectedTemplate === t ? "active" : ""}`}
                                onClick={() => setSelectedTemplate(t)}
                            >
                                <div className={`preview-container ${t}`}>
                                    {/* Adiciona um selo de selecionado */}
                                    {selectedTemplate === t && <div className="selected-check">✓</div>}
                                    <div className="skeleton-line"></div>
                                    <div className="skeleton-line short"></div>
                                </div>
                                <div className="template-info">
                                    <span>{t.replace("-", " ").toUpperCase()}</span>
                                    <small>{t === 'minimal-light' ? 'Elegante & Clean' : 'Tech & Futurista'}</small>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* INPUT DE CONTEXTO PARA IA */}
                    <div className="input-group">
                        <label>Sobre o que é o seu negócio?</label>
                        <textarea
                            placeholder="Ex: Uma joalheria artesanal chamada Luna que vende peças minimalistas e elegantes..."
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                        />
                    </div>

                    <button className="gerador-button" onClick={handleGenerate}>
                        Gerar com Inteligência Artificial
                    </button>
                </div>
            </section>

            <ToastContainer position="top-right" theme="dark" />
        </div>
    );
}