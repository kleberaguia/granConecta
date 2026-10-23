import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { API_URL } from "../../api/api";
import {
  ArrowRight,
  Info,
  Lock,
  Search,
  Sparkles,
  Store,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import GranFooter from "../footer/Granfooter";

import styles from "./Marketplace.module.css";

type LojaPublica = {
  id?: string;
  slug?: string;
  name?: string;
  nome?: string;
  tipo?: string;
  categoria?: string;
  categoria_tag?: string;
  categoriaTipo?: string;
  descricao?: string;
  descricao_curta?: string;
  capa_url?: string;
  acesso_comercial_liberado?: boolean | number;
  assinatura_ativa?: boolean | number;
  assinaturaAtiva?: boolean | number;
  pode_receber_pedidos?: boolean | number;
  bloqueado_assinatura?: boolean | number;
  status_assinatura?: string;
  statusAssinatura?: string;
  assinatura?: {
    ativa?: boolean | number;
    status?: string;
  } | null;
};

type BannerMarketplace = {
  id: string | number;
  titulo: string;
  subtitulo?: string;
  imagem_url?: string;
  cor_destaque?: string;
  link_destino?: string;
  loja_id?: string;
};

const STATUS_BLOQUEADOS = new Set([
  "VENCIDA",
  "VENCIDO",
  "ATRASADA",
  "ATRASADO",
  "INATIVA",
  "INATIVO",
  "CANCELADA",
  "CANCELADO",
  "SUSPENSA",
  "SUSPENSO",
  "BLOQUEADA",
  "BLOQUEADO",
  "PENDENTE",
  "PENDING",
]);

const withApiUrl = (path?: string) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return `${API_URL}${path}`;
  return `${API_URL}/uploads/images/${path}`;
};

const acessoComercialLiberado = (loja?: LojaPublica | null): boolean => {
  if (!loja) return false;

  if (
    loja.bloqueado_assinatura === true ||
    loja.bloqueado_assinatura === 1
  ) {
    return false;
  }

  const indicador = [
    loja.acesso_comercial_liberado,
    loja.assinatura_ativa,
    loja.assinaturaAtiva,
    loja.pode_receber_pedidos,
    loja.assinatura?.ativa,
  ].find(
    (valor) =>
      typeof valor === "boolean" || valor === 0 || valor === 1,
  );

  if (indicador !== undefined) {
    return indicador === true || indicador === 1;
  }

  const status = String(
    loja.status_assinatura ||
    loja.statusAssinatura ||
    loja.assinatura?.status ||
    "",
  )
    .trim()
    .toUpperCase();

  return !STATUS_BLOQUEADOS.has(status);
};

const slugDoDestino = (destino?: string) =>
  String(destino || "")
    .split("?")[0]
    .replace(/^https?:\/\/[^/]+/i, "")
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .pop() || "";

export default function Marketplace() {
  const [activeTab] = useState<"servicos" | "empreendedor">("empreendedor");
  const [lojas, setLojas] = useState<LojaPublica[]>([]);
  const [banners, setBanners] = useState<BannerMarketplace[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const loadBanners = async () => {
      try {
        const condominioId = (user as any)?.condominio_id || "global";
        const res = await api.get(
          `/marketplace/banners/${condominioId}`,
          {
            params: {
              local: "MARKETPLACE",
            },
          },
        );
        setBanners(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Erro ao carregar banners publicitários", err);
        setBanners([]);
      }
    };

    void loadBanners();
  }, [user]);

  useEffect(() => {
    if (activeTab !== "empreendedor") return;

    const fetchLojas = async () => {
      setLoading(true);

      try {
        const res = await api.get("/lojas/publica/todas");
        const somenteLojas = Array.isArray(res.data)
          ? res.data.filter((item: LojaPublica) => {
            const tipoGeral = String(item.tipo || "").toLowerCase();
            const nichoTag = String(item.categoria_tag || "").toUpperCase();
            const contextoTipo = String(item.categoriaTipo || "").toLowerCase();

            return (
              contextoTipo === "loja" ||
              nichoTag === "LOJA" ||
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

    void fetchLojas();
  }, [activeTab]);

  const lojasFiltradas = lojas.filter((loja) => {
    const termo = search.trim().toLowerCase();
    if (!termo) return true;

    return [
      loja.name,
      loja.nome,
      loja.categoria,
      loja.categoria_tag,
      loja.descricao,
      loja.slug,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(termo);
  });

  const handleOpenLoja = (loja: LojaPublica) => {
    if (!loja.slug || !acessoComercialLiberado(loja)) return;
    navigate(`/pagina/${loja.slug}`);
  };

  const lojaDoBanner = (banner: BannerMarketplace) => {
    if (banner.loja_id) {
      const porId = lojas.find(
        (loja) => String(loja.id) === String(banner.loja_id),
      );
      if (porId) return porId;
    }

    const slug = slugDoDestino(banner.link_destino);
    return lojas.find((loja) => String(loja.slug || "") === slug) || null;
  };

  return (
    <main className={styles.marketplacePage}>
      <section className={styles.marketplaceHero}>
        <div>
          <span className={styles.eyebrow}>
            <Sparkles size={15} />
            Vitrine GranConecta
          </span>
          <h1>Lojas perto de você.</h1>
          <p>
            Descubra lojas da sua comunidade e de outras regiões da rede GranConecta.
          </p>
        </div>

        <div className={styles.heroStats}>
          <div>
            <strong>{lojas.length}</strong>
            <span>lojas disponíveis</span>
          </div>
          <div>
            <strong>24h</strong>
            <span>acesso online</span>
          </div>
        </div>
      </section>

      {banners.length > 0 ? (
        <section className={styles.bannerWrapper} aria-label="Destaques do marketplace">
          <Swiper
            spaceBetween={0}
            centeredSlides
            autoplay={{ delay: 6000, disableOnInteraction: false }}
            pagination={{ clickable: true, dynamicBullets: true }}
            navigation
            modules={[Autoplay, Pagination, Navigation]}
            className={styles.bannerSwiper}
          >
            {banners.map((ad) => {
              const loja = lojaDoBanner(ad);
              const liberado = loja ? acessoComercialLiberado(loja) : true;

              return (
                <SwiperSlide key={ad.id}>
                  <button
                    type="button"
                    disabled={!liberado}
                    onClick={() => {
                      if (liberado && ad.link_destino) {
                        navigate(`/pagina/${slugDoDestino(ad.link_destino)}`);
                      }
                    }}
                    className={styles.bannerSlide}
                    aria-label={
                      liberado
                        ? `Conhecer ${ad.titulo}`
                        : `${ad.titulo} temporariamente indisponível`
                    }
                    style={{
                      cursor: liberado ? "pointer" : "not-allowed",
                      filter: liberado ? "none" : "grayscale(0.65)",
                      backgroundImage: `
                        linear-gradient(90deg, rgba(4,13,24,0.92) 0%, rgba(4,13,24,0.54) 52%, rgba(4,13,24,0.18) 100%),
                        url(${withApiUrl(ad.imagem_url)})
                      `,
                    }}
                  >
                    <span
                      className={styles.bannerGlow}
                      style={{ background: ad.cor_destaque || "#00d9ff" }}
                    />

                    <div className={styles.bannerContent}>
                      <span className={styles.bannerBadge}>
                        {liberado ? "Destaque" : "Indisponível"}
                      </span>
                      <h2>{ad.titulo}</h2>
                      {ad.subtitulo && <p>{ad.subtitulo}</p>}
                      <span
                        className={styles.bannerAction}
                        style={{ backgroundColor: ad.cor_destaque || "#00d9ff" }}
                      >
                        {liberado ? "Conhecer agora" : "Atendimento suspenso"}
                      </span>
                    </div>
                  </button>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </section>
      ) : (
        <section className={styles.bannerPlaceholder}>
          <Info size={24} />
          <strong>Espaço premium para anúncios</strong>
          <span>Divulgue sua loja para clientes da rede GranConecta.</span>
        </section>
      )}

      <section className={styles.toolbar}>
        <div>
          <h2>Encontre uma loja</h2>
          <p>Busque por loja, categoria, produto ou oferta.</p>
        </div>

        <label className={styles.searchBox}>
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar loja, categoria ou produto"
          />
        </label>
      </section>

      {activeTab === "empreendedor" ? (
        <section className={styles.grid}>
          {loading ? (
            <div className={styles.stateBox}>Carregando vitrines...</div>
          ) : lojasFiltradas.length > 0 ? (
            lojasFiltradas.map((loja) => {
              const imageSrc = withApiUrl(loja.capa_url);
              const nome = loja.name || loja.nome || "Loja";
              const categoria = loja.categoria || loja.categoria_tag || "Loja";
              const liberado = acessoComercialLiberado(loja);

              return (
                <button
                  key={loja.id}
                  type="button"
                  disabled={!liberado}
                  onClick={() => handleOpenLoja(loja)}
                  className={styles.card}
                  aria-label={
                    liberado
                      ? `Visitar ${nome}`
                      : `${nome} temporariamente indisponível`
                  }
                  title={liberado ? `Visitar ${nome}` : "Atendimento suspenso"}
                  style={{
                    cursor: liberado ? "pointer" : "not-allowed",
                    opacity: liberado ? 1 : 0.72,
                    filter: liberado ? "none" : "grayscale(0.45)",
                  }}
                >
                  <div className={styles.cardImageWrapper}>
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={nome}
                        className={styles.cardImage}
                        loading="lazy"
                      />
                    ) : (
                      <div className={styles.cardFallback}>
                        <Store size={38} />
                      </div>
                    )}
                    <div className={styles.cardOverlay} />
                    <span className={styles.cardBadge}>
                      {liberado ? categoria : "Temporariamente indisponível"}
                    </span>
                  </div>

                  <div className={styles.cardContent}>
                    <div>
                      <h3>{nome}</h3>
                      <p>
                        {liberado
                          ? loja.descricao_curta ||
                          loja.descricao ||
                          "Clique para visitar a vitrine."
                          : "Esta loja está temporariamente sem atendimento."}
                      </p>
                    </div>

                    <span className={styles.cardAction}>
                      {liberado ? (
                        <>
                          Visitar loja
                          <ArrowRight size={17} />
                        </>
                      ) : (
                        <>
                          Atendimento suspenso
                          <Lock size={17} />
                        </>
                      )}
                    </span>
                  </div>
                </button>
              );
            })
          ) : (
            <div className={styles.stateBox}>
              <Store size={34} />
              <h3>Nenhuma loja encontrada</h3>
              <p>Tente buscar outro termo ou volte mais tarde.</p>
            </div>
          )}
        </section>
      ) : (
        <section className={styles.stateBox}>
          <h3>Prestadores de Serviços</h3>
          <p>Encanadores, eletricistas e outros profissionais da rede GranConecta.</p>
        </section>
      )}

      <GranFooter />
    </main>
  );
}