import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// Importe seu hook de carrinho aqui. Exemplo:
// import { useCarrinho } from "./CarrinhoContext"; 

interface SavedData {
    html: string;
    css: string;
    usuarioId: string;
    condominioId: string | null;
}

export default function Publicado() {
    const [pageData, setPageData] = useState<SavedData | null>(null);
    const navigate = useNavigate();
    
    // Supondo que sua função seja algo assim:
    // const { adicionarAoCarrinho } = useCarrinho(); 
    // Se não tiver context ainda, usei uma função mock abaixo:
    const adicionarAoCarrinho = (id: string | null) => {
        console.log("Integrando com o sistema... Adicionando ID:", id);
        // Sua lógica real aqui
    };

    // 1. Carregar dados do localStorage
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

    // 2. Gerenciar cliques (Carrinho e Prevenção de links vazios)
    useEffect(() => {
        const handleGlobalClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            // Lógica do Carrinho
            if (target.classList.contains('buy-button')) {
                const productId = target.getAttribute('data-id');
                adicionarAoCarrinho(productId);
                alert("Produto adicionado ao carrinho!");
                return;
            }

            // Impede que links vazios recarreguem a página
            if (target.tagName === 'A' && target.getAttribute('href') === '#') {
                e.preventDefault();
            }
        };

        document.addEventListener('click', handleGlobalClick);
        return () => document.removeEventListener('click', handleGlobalClick);
    }, []);

    // 3. Limpeza de atributos de edição (ContentEditable)
    useEffect(() => {
        if (pageData) {
            // Pequeno delay para garantir que o DOM injetado pelo dangerouslySetInnerHTML já exista
            const timer = setTimeout(() => {
                const elements = document.querySelectorAll('[contenteditable]');
                elements.forEach(el => {
                    el.removeAttribute('contenteditable');
                    // Remove também o outline de foco que usamos no editor
                    (el as HTMLElement).style.outline = 'none';
                });
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [pageData]);

    if (!pageData) {
        return (
            <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>
                <h2>Nenhum site publicado encontrado.</h2>
                <button onClick={() => navigate("/")} style={btnBackStyle}>Voltar ao Editor</button>
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
                    
                    /* Efeito de hover nos botões de compra reais */
                    .buy-button { transition: transform 0.2s, background 0.2s; }
                    .buy-button:hover { transform: scale(1.02); opacity: 0.9; }
                    
                    /* Garante que imagens não quebrem o layout */
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
    padding: '10px 20px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginTop: '20px'
};

const floatingBtnStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    padding: '12px 20px',
    background: 'rgba(0,0,0,0.8)',
    color: 'white',
    border: 'none',
    borderRadius: '30px',
    cursor: 'pointer',
    fontSize: '14px',
    zIndex: 9999,
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
    backdropFilter: 'blur(5px)'
};