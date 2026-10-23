import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../../utils/config';
import './BannerPropaganda.css';

interface BannerPropagandaProps {
    posts: any[];
    onOpenPost: (id: string) => void;
}

const BannerPropaganda = ({ posts, onOpenPost }: BannerPropagandaProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [visible, setVisible] = useState(false);
    const [isActive, setIsActive] = useState(true);
    const navigate = useNavigate();
    const cycleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const getBannerStyle = (index: number, categoria: string) => {
        const catFmt = (categoria || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const styles: any = {
            moradores: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
            doacao: 'linear-gradient(135deg, #206e58 0%, #58f2c6 100%)',
            desapega: 'linear-gradient(135deg, #92400e 0%, #f59e0b 100%)',
            garagem: 'linear-gradient(135deg, #374151 0%, #111827 100%)',
        };
        const fallback = index % 2 === 0
            ? 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)'
            : 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)';

        return styles[catFmt] || fallback;
    };

    useEffect(() => {
        if (posts.length === 0) return;

        let interval: NodeJS.Timeout;

        if (isActive) {
            setVisible(true);
            interval = setInterval(() => {
                setCurrentIndex((prev) => {
                    if (prev === posts.length - 1) {
                        finalizarCiclo();
                        return prev;
                    }
                    return prev + 1;
                });
            }, 5000); // 5 segundos por card
        }

        const finalizarCiclo = () => {
            setVisible(false);
            setIsActive(false);
            clearInterval(interval);

            cycleTimeoutRef.current = setTimeout(() => {
                setCurrentIndex(0);
                setIsActive(true);
            }, 10000); // 10 segundos de descanso
        };

        return () => {
            if (interval) clearInterval(interval);
            if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current);
        };
    }, [posts.length, isActive]);

    const currentPost = posts[currentIndex];

    const handleVerDetalhes = () => {
        const token = localStorage.getItem('@App:token');
        if (!token) {
            navigate('/login/morador');
            return;
        }
        if (currentPost) {
            setVisible(false);
            setTimeout(() => {
                onOpenPost(currentPost.id);
                setIsActive(false);
            }, 300); // Espera a animação de saída
        }
    };

    const fecharManualmente = (e: React.MouseEvent) => {
        e.stopPropagation();
        setVisible(false);
        setIsActive(false);
        // Reinicia o ciclo após 30 segundos se fechar no X
        cycleTimeoutRef.current = setTimeout(() => setIsActive(true), 30000);
    };

    if (!currentPost) return null;

    return (
        <div className={`propaganda-overlay ${visible && isActive ? 'show' : ''}`}>
            <div className="propaganda-card-premium"
                style={{
                    background: getBannerStyle(currentIndex, currentPost.categoria),
                    transition: 'background 1s ease'
                }}
            >
                <div className="progress-bar-container">
                    <div className="progress-bar-fill" key={currentIndex} />
                </div>

                <button className="close-x" onClick={fecharManualmente}>×</button>

                <div className="propaganda-header-info">
                    <span className="badge-categoria-premium">
                        {currentPost.categoria?.toUpperCase() || "DESTAQUE"}
                    </span>
                    <div className="propaganda-badge-count">
                        {currentIndex + 1} / {posts.length}
                    </div>
                </div>

                <div className="propaganda-content" onClick={handleVerDetalhes}>
                    <div className="propaganda-text-large">
                        <h2 className="titulo-banner-premium">{currentPost.titulo}</h2>
                        <p className="descricao-banner-premium">
                            {currentPost.descricao?.substring(0, 75)}...
                        </p>
                    </div>

                    {currentPost.midias?.[0]?.url && (
                        <div className="propaganda-img-container-mini">
                            <img
                                src={`${API_URL}/${currentPost.midias[0].url.replace(/^\//, "")}`}
                                alt="thumb"
                            />
                        </div>
                    )}
                </div>

                <button className="propaganda-btn-premium" onClick={handleVerDetalhes}>
                    QUERO VER AGORA 🚀
                </button>
            </div>
        </div>
    );
};

export default BannerPropaganda;