import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { API_URL } from "../../api/api";
import { Wrench, ArrowRight, Info } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

// --- SWIPER IMPORTS ---
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

export default function Marketplace() {
    const [activeTab, _setActiveTab] = useState<"servicos" | "empreendedor">("empreendedor");
    const [lojas, setLojas] = useState<any[]>([]);
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user } = useAuth();


    // 1. Carregar Banners (Publicidade)
    useEffect(() => {
        const loadBanners = async () => {
            try {
                // Filtra por condomínio do usuário ou traz os globais [cite: 2026-01-27]
                const condominioId = user?.condominio_id || 'global';
                console.log('idCondo ', condominioId)
                const res = await api.get(`/marketplace/banners/${condominioId}`);

                setBanners(res.data);
            } catch (err) {
                console.error("Erro ao carregar banners publicitários");
            }
        };
        loadBanners();
    }, [user]);

    // 2. Carregar Lista de Lojas
    useEffect(() => {
        if (activeTab === "empreendedor") {
            fetchLojas();
        }
    }, [activeTab]);

    const fetchLojas = async () => {
        setLoading(true);
        try {
            const res = await api.get("/lojas/publica/todas");
            const somenteLojas = Array.isArray(res.data)
                ? res.data.filter((item: any) => {
                    // 1. Normaliza as strings para comparação segura
                    const tipoGeral = String(item.tipo || "").toLowerCase();
                    const nichoTag = String(item.categoria_tag || "").toUpperCase(); // ✅ Aqui vem "LOJA"
                    const contextoTipo = String(item.categoriaTipo || "").toLowerCase();

                    return (
                        contextoTipo === "loja" ||
                        nichoTag === "LOJA" ||            // <--- Adicionado para seu caso atual
                        nichoTag === "AUTOMOTIVO" ||
                        nichoTag === "PRODUTO" ||
                        tipoGeral === "empreendedor"
                    );
                })
                : [];

            setLojas(somenteLojas);
        } catch (err) {
            console.error("Erro ao carregar lojas no marketplace", err);
            setLojas([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: "30px 20px", maxWidth: "1300px", margin: "0 auto", minHeight: "100vh" }}>

            {banners.length > 0 ? (
                <div style={bannerWrapperStyle}>
                    <Swiper
                        spaceBetween={0}
                        centeredSlides={true}
                        autoplay={{ delay: 6000, disableOnInteraction: false }}
                        pagination={{ clickable: true, dynamicBullets: true }}
                        navigation={true}
                        modules={[Autoplay, Pagination, Navigation]}
                        className="mySwiper"
                        style={{ height: "100%", borderRadius: "20px" }}
                    >
                        {banners.map((ad: any) => (
                            <SwiperSlide key={ad.id}>
                                <div
                                    onClick={() => navigate(`/pagina/${ad.link_destino}`)} // Navegação via slug [cite: 2026-01-10]
                                    style={{
                                        ...bannerSlideStyle,
                                        backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.1) 70%), url(${API_URL}${ad.imagem_url})`,
                                    }}
                                >
                                    <div style={{
                                        ...geometricDetailStyle,
                                        background: ad.cor_destaque || "#3b82f6"
                                    }} />

                                    <div style={bannerContentStyle}>
                                        <span style={badgeAnuncioStyle}>Destaque</span>
                                        <h2 style={bannerTitleStyle}>{ad.titulo}</h2>
                                        <p style={bannerSubStyle}>{ad.subtitulo}</p>
                                        <button style={{ ...btnActionStyle, backgroundColor: ad.cor_destaque || "#3b82f6" }}>
                                            Conhecer Agora
                                        </button>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            ) : (
                <div style={bannerPlaceholderStyle}>
                    <Info size={24} />
                    <span>Espaço para sua propaganda aqui. Entre em contato!</span>
                </div>
            )}

        
            {/* --- GRID DE CONTEÚDO --- */}
            {activeTab === "empreendedor" ? (
                <div style={gridStyle}>
                    {loading ? (
                        <p>Carregando vitrines...</p>
                    ) : lojas.length > 0 ? (
                        lojas.map((loja: any) => (
                            <div
                                key={loja.id}
                                onClick={() => navigate(`/pagina/${loja.slug}`)} // ✅ Navegação restaurada aqui
                                className="relative group overflow-hidden rounded-2xl shadow-lg cursor-pointer transition-transform hover:scale-[1.02]"
                                style={cardStyle} // Aplica os estilos de card definidos lá embaixo
                            >
                                <div className="relative">
                                    <img
                                        src={`${API_URL}/uploads/images/${loja.capa_url}`}
                                        alt={loja.name}
                                        className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    {/* Opcional: Badge de Verificado ou Categoria */}
                                    <div style={verificadoBadgeStyle}>
                                        {loja.categoria || "Loja"}
                                    </div>
                                </div>

                                <div className="p-4 bg-white flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-gray-800">{loja.name}</h3>
                                        <p className="text-xs text-gray-500">Clique para visitar</p>
                                    </div>
                                    <ArrowRight size={18} className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>Nenhuma loja encontrada neste condomínio.</p>
                    )}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '100px 0', color: '#94a3b8' }}>
                    <Wrench size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
                    <h3>Em breve: Prestadores de Serviços</h3>
                    <p>Encanadores, eletricistas e muito mais do Gran Reserva.</p>
                </div>
            )}
        </div>
    );
}

// --- CSS-IN-JS OBJECTS ---

const bannerWrapperStyle: React.CSSProperties = {
    width: "100%",
    height: "400px",
    marginBottom: "40px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    borderRadius: "20px"
};

const bannerSlideStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "flex",
    alignItems: "center",
    padding: "0 8%",
    position: "relative",
    cursor: "pointer",
    color: "white"
};

const geometricDetailStyle: React.CSSProperties = {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: "45%",
    height: "100%",
    clipPath: "polygon(100% 0, 20% 100%, 100% 100%)",
    opacity: 0.7,
    zIndex: 1
};

const bannerContentStyle: React.CSSProperties = {
    maxWidth: "550px",
    zIndex: 2,
    display: "flex",
    flexDirection: "column",
    gap: "10px"
};

const bannerTitleStyle: React.CSSProperties = {
    fontSize: "3rem",
    fontWeight: 900,
    margin: 0,
    lineHeight: "1.1",
    textShadow: "2px 2px 4px rgba(0,0,0,0.3)"
};

const bannerSubStyle: React.CSSProperties = {
    fontSize: "1.2rem",
    opacity: 0.9,
    marginBottom: "20px"
};

const badgeAnuncioStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.2)",
    width: "fit-content",
    padding: "4px 12px",
    borderRadius: "50px",
    fontSize: "0.75rem",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "1px",
    backdropFilter: "blur(5px)"
};

const btnActionStyle: React.CSSProperties = {
    padding: "14px 30px",
    border: "none",
    borderRadius: "50px",
    color: "white",
    fontWeight: "bold",
    fontSize: "1rem",
    width: "fit-content",
    cursor: "pointer",
    boxShadow: "0 5px 15px rgba(0,0,0,0.2)"
};

const bannerPlaceholderStyle: React.CSSProperties = {
    width: "100%",
    height: "200px",
    background: "#f8fafc",
    border: "2px dashed #e2e8f0",
    borderRadius: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    color: "#94a3b8",
    marginBottom: "40px"
};
const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "30px"
};

const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
    cursor: "pointer",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    border: "1px solid #f1f5f9"
};

const verificadoBadgeStyle: React.CSSProperties = {
    position: "absolute",
    bottom: "12px",
    left: "12px",
    background: "rgba(0,0,0,0.7)",
    color: "white",
    padding: "4px 12px",
    borderRadius: "6px",
    fontSize: "10px",
    fontWeight: 800,
    backdropFilter: "blur(4px)"
};
