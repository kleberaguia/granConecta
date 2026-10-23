import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Chip,
  Avatar,
  Stack,
  Card,
  CardMedia,
  Fade,
  CircularProgress,
  Divider,
} from "@mui/material";
import Grid2 from "@mui/material/Grid";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import NearMeOutlinedIcon from "@mui/icons-material/NearMeOutlined";
import toast from "react-hot-toast";
import api, { API_URL } from "../../api/api";
import { slugify } from "../../utils/slugify";
import { useAuth } from "../../context/AuthContext";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
const SAFE_IMAGE = "";

type TipoServico = {
  id: string;
  slug: string;
  nome: string;
  name?: string;
  descricao?: string;
  icone?: string;
};

type Categoria = {
  id: number;
  name: string;
  tipo: string;
  storeId: string;
};

type StorePrestador = {
  id: string;
  slug: string;
  tipo: string;
  usuarioId?: string;
  ownerId?: string;
  userId?: string;
  nome_profissional?: string;
  distanciaKm?: number | null;
  plano?: "PREMIUM" | "INTERMEDIARIO" | "BASICO" | string;
  name?: string;
  descricao_loja?: string;
  categoria?: Categoria | string;
  categoria_tag?: string;
  categoriaid?: number;
  logo_url?: string;
  capa_url?: string;
  telefone_whatsapp?: string;
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

type BannerServico = {
  id: string | number;
  titulo: string;
  subtitulo?: string | null;
  imagem_url?: string | null;
  cor_destaque?: string | null;
  link_destino?: string | null;
  local_exibicao?: "MARKETPLACE" | "SERVICOS" | "AMBOS";
};

type PrestadorProximidade = {
  usuarioId?: string;
  distanciaKm?: number | null;
};

type RaioKm = 5 | 10 | 20 | 50 | null;

const OPCOES_RAIO: Array<{ label: string; value: RaioKm }> = [
  { label: "Todos", value: null },
  { label: "5 km", value: 5 },
  { label: "10 km", value: 10 },
  { label: "20 km", value: 20 },
  { label: "50 km", value: 50 },
];

const STATUS_BLOQUEADOS = new Set([
  "VENCIDA", "VENCIDO", "ATRASADA", "ATRASADO", "INATIVA", "INATIVO",
  "CANCELADA", "CANCELADO", "SUSPENSA", "SUSPENSO", "BLOQUEADA",
  "BLOQUEADO", "PENDENTE", "PENDING",
]);

const acessoComercialLiberado = (item?: StorePrestador | null) => {
  if (!item) return false;
  if (
    item.bloqueado_assinatura === true ||
    item.bloqueado_assinatura === 1
  ) {
    return false;
  }

  const indicador = [
    item.acesso_comercial_liberado,
    item.assinatura_ativa,
    item.assinaturaAtiva,
    item.pode_receber_pedidos,
    item.assinatura?.ativa,
  ].find((valor) => typeof valor === "boolean" || valor === 0 || valor === 1);

  if (indicador !== undefined) return indicador === true || indicador === 1;

  const status = String(
    item.status_assinatura || item.statusAssinatura || item.assinatura?.status || "",
  ).trim().toUpperCase();

  return !STATUS_BLOQUEADOS.has(status);
};

const getCategoriaSlug = (item: StorePrestador) => {
  const value =
    (typeof item?.categoria === 'string' ? item.categoria : item?.categoria?.name) ||
    item?.categoria_tag ||
    "";
  return value ? slugify(value) : "";
};

const getPrestadorUsuarioId = (item?: StorePrestador | null) =>
  String(item?.usuarioId || item?.ownerId || item?.userId || "").trim();

const formatarDistancia = (distanciaKm?: number | null) => {
  if (
    distanciaKm === null ||
    distanciaKm === undefined ||
    !Number.isFinite(Number(distanciaKm))
  ) {
    return null;
  }

  const valor = Number(distanciaKm);

  if (valor < 1) {
    return `${Math.max(1, Math.round(valor * 1000))} m`;
  }

  return `${valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} km`;
};

export default function ServiceShowcase() {
  const { categoryTag } = useParams<{ categoryTag?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();


  console.log('categoryTag ', categoryTag)

  const [prestadores, setPrestadores] = useState<StorePrestador[]>([]);
  const [banners, setBanners] = useState<BannerServico[]>([]);
  const [tipoServicoAtual, setTipoServicoAtual] = useState<TipoServico | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [raioKm, setRaioKm] = useState<RaioKm>(null);
  const [ordenarMaisProximos, setOrdenarMaisProximos] = useState(false);

  useEffect(() => {
    const carregarBanners = async () => {
      try {
        const condominioId =
          (user as any)?.condominio_id ||
          (user as any)?.condominio?.id ||
          "global";

        const response = await api.get(
          `/marketplace/banners/${condominioId}`,
          {
            params: {
              local: "SERVICOS",
            },
          },
        );

        setBanners(
          Array.isArray(response.data)
            ? response.data
            : [],
        );
      } catch (error) {
        console.error(
          "Erro ao carregar banners de serviços:",
          error,
        );
        setBanners([]);
      }
    };

    void carregarBanners();
  }, [user]);

  useEffect(() => {
    let ativo = true;

    const loadData = async () => {
      setLoading(true);

      try {
        const tiposRes = await api.get("/tipos-combo");
        const tipos = Array.isArray(tiposRes.data) ? tiposRes.data : [];

        const encontrado = categoryTag
          ? tipos.find(
              (item: any) =>
                String(item.id) === String(categoryTag) ||
                item.slug === categoryTag ||
                item.name === categoryTag ||
                item.nome === categoryTag,
            ) || null
          : null;

        if (!ativo) return;

        if (encontrado) {
          setTipoServicoAtual({
            ...encontrado,
            nome: encontrado.nome || encontrado.name,
          });
        } else {
          setTipoServicoAtual(null);
        }

        // Mantém a rota pública como fonte visual/comercial dos cards.
        const lojasRes = await api.get("/lojas/publica/todas");
        const lojas = Array.isArray(lojasRes.data) ? lojasRes.data : [];

        const somentePrestadores = lojas.filter(
          (item: StorePrestador) =>
            String(item.tipo || "").toLowerCase() === "prestador",
        );

        const filtradosPorCategoria = categoryTag
          ? somentePrestadores.filter((item: StorePrestador) => {
              if (
                encontrado &&
                String(item.categoriaid) === String(encontrado.id)
              ) {
                return true;
              }

              return (
                getCategoriaSlug(item) === slugify(categoryTag || "")
              );
            })
          : somentePrestadores;

        let resultadoFinal: StorePrestador[] = filtradosPorCategoria;

        // Proximidade só depende do usuário autenticado.
        if (user) {
          try {
            const params: Record<string, string | number> = {};

            if (encontrado?.id !== undefined && encontrado?.id !== null) {
              params.categoria = String(encontrado.id);
            }

            if (raioKm !== null) {
              params.raioKm = raioKm;
            }

            if (ordenarMaisProximos) {
              params.ordenar = "MAIS_PROXIMOS";
            }

            const proximidadeRes = await api.get(
              "/perfil-prestador/vitrine",
              { params },
            );

            const proximidade: PrestadorProximidade[] =
              Array.isArray(proximidadeRes.data)
                ? proximidadeRes.data
                : [];

            const porUsuarioId = new Map<string, PrestadorProximidade>();

            proximidade.forEach((perfil) => {
              const usuarioId = String(perfil.usuarioId || "").trim();
              if (usuarioId) porUsuarioId.set(usuarioId, perfil);
            });

            resultadoFinal = filtradosPorCategoria
              .filter((loja) => {
                if (raioKm === null) return true;
                const usuarioId = getPrestadorUsuarioId(loja);
                return usuarioId ? porUsuarioId.has(usuarioId) : false;
              })
              .map((loja) => {
                const usuarioId = getPrestadorUsuarioId(loja);
                const geo = usuarioId
                  ? porUsuarioId.get(usuarioId)
                  : undefined;

                return {
                  ...loja,
                  distanciaKm:
                    geo?.distanciaKm === null ||
                    geo?.distanciaKm === undefined
                      ? null
                      : Number(geo.distanciaKm),
                };
              });

            if (ordenarMaisProximos) {
              resultadoFinal.sort((a, b) =>
                (a.distanciaKm ?? Number.POSITIVE_INFINITY) -
                (b.distanciaKm ?? Number.POSITIVE_INFINITY),
              );
            }
          } catch (geoError) {
            console.error(
              "Erro ao carregar proximidade dos profissionais:",
              geoError,
            );

            if (raioKm !== null) {
              resultadoFinal = [];
              toast.error(
                "Não foi possível aplicar o filtro de distância agora.",
              );
            }
          }
        }

        if (!ativo) return;

        setPrestadores(resultadoFinal);
        setHeroIndex(0);
      } catch (err) {
        console.error("Erro ao carregar vitrine:", err);
        if (ativo) setPrestadores([]);
      } finally {
        if (ativo) setLoading(false);
      }
    };

    void loadData();

    return () => {
      ativo = false;
    };
  }, [categoryTag, raioKm, ordenarMaisProximos, user]);

  const tiers = useMemo(() => {
    const filtrados = prestadores;
    return {
      premium: filtrados.filter(p => String(p.plano || "").toUpperCase() === "PREMIUM"),
      outros: filtrados.filter(p => String(p.plano || "").toUpperCase() !== "PREMIUM"),
    };
  }, [prestadores]);

  const currentPremium = tiers.premium[heroIndex] || tiers.premium[0];

  const resolveImageUrl = (url?: string) => {
    if (!url) return SAFE_IMAGE;
    if (url.startsWith("http") || url.startsWith("blob:") || url.startsWith("data:")) return url;
    const base = api.defaults.baseURL?.replace("/api", "") || "";
    return `${base}/api/uploads/images/${url}`;
  };

  const getDisplayName = (item?: StorePrestador | null) =>
    item?.name || item?.nome_profissional || "Profissional";
  const getDisplayDescription = (item?: StorePrestador | null) => item?.descricao_loja || "Conheça este profissional.";

  const getDisplayCategory = (item?: StorePrestador | null) => {
    return (typeof item?.categoria === 'string' ? item.categoria : item?.categoria?.name) ||
      item?.categoria_tag || "Serviços Gerais";
  };

  const handleOpenPage = (item?: StorePrestador | null) => {
    if (!item?.slug) return;

    if (!acessoComercialLiberado(item)) {
      toast.error(
        "Este profissional está temporariamente indisponível para contatos e pedidos.",
      );
      return;
    }

    window.open(`/pagina/${item.slug}`, '_blank');
  };

  const resolveBannerImageUrl = (
    url?: string | null,
  ) => {
    if (!url) return "";
    if (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("blob:") ||
      url.startsWith("data:")
    ) {
      return url;
    }

    if (url.startsWith("/")) {
      return `${API_URL}${url}`;
    }

    return `${API_URL}/uploads/images/${url}`;
  };

  const abrirDestinoBanner = (
    destino?: string | null,
  ) => {
    const valor = String(destino || "").trim();
    if (!valor) return;

    if (/^https?:\/\//i.test(valor)) {
      window.open(valor, "_blank", "noopener,noreferrer");
      return;
    }

    if (valor.startsWith("/")) {
      navigate(valor);
      return;
    }

    navigate(`/pagina/${valor}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", bgcolor: "#020617", color: "white" }}>
        <CircularProgress color="inherit" />
        <Typography sx={{ mt: 2 }}>Buscando profissionais...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "#F8FAFC", minHeight: "100vh", pb: 10 }}>
      {banners.length > 0 && (
        <Box
          component="section"
          aria-label="Destaques de serviços"
          sx={{
            px: { xs: 2, md: 6 },
            pt: { xs: 2, md: 4 },
          }}
        >
          <Swiper
            spaceBetween={18}
            centeredSlides
            autoplay={{
              delay: 6000,
              disableOnInteraction: false,
            }}
            pagination={{ clickable: true }}
            navigation
            modules={[Autoplay, Pagination, Navigation]}
          >
            {banners.map((banner) => (
              <SwiperSlide key={banner.id}>
                <Box
                  component="button"
                  type="button"
                  onClick={() =>
                    abrirDestinoBanner(banner.link_destino)
                  }
                  sx={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    minHeight: { xs: 300, md: 410 },
                    overflow: "hidden",
                    border: 0,
                    borderRadius: { xs: 3, md: 5 },
                    px: { xs: 3, md: 8 },
                    py: 5,
                    color: "white",
                    textAlign: "left",
                    cursor: banner.link_destino
                      ? "pointer"
                      : "default",
                    backgroundColor: "#020617",
                    backgroundImage: `linear-gradient(90deg, rgba(2,6,23,.96) 0%, rgba(2,6,23,.72) 48%, rgba(2,6,23,.18) 100%), url(${resolveBannerImageUrl(
                      banner.imagem_url,
                    )})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box
                    sx={{
                      position: "relative",
                      zIndex: 1,
                      maxWidth: 680,
                    }}
                  >
                    <Chip
                      label="DESTAQUE DA COMUNIDADE"
                      sx={{
                        mb: 2,
                        bgcolor:
                          banner.cor_destaque || "#D4AF37",
                        color: "white",
                        fontWeight: 900,
                      }}
                    />

                    <Typography
                      variant="h2"
                      sx={{
                        fontSize: { xs: "2rem", md: "3.4rem" },
                        fontWeight: 900,
                        lineHeight: 1.05,
                      }}
                    >
                      {banner.titulo}
                    </Typography>

                    {banner.subtitulo && (
                      <Typography
                        variant="h6"
                        sx={{
                          mt: 2,
                          maxWidth: 600,
                          color: "rgba(255,255,255,.84)",
                        }}
                      >
                        {banner.subtitulo}
                      </Typography>
                    )}

                    {banner.link_destino && (
                      <Box
                        component="span"
                        sx={{
                          display: "inline-flex",
                          mt: 3,
                          px: 3,
                          py: 1.4,
                          borderRadius: 2,
                          bgcolor:
                            banner.cor_destaque || "#D4AF37",
                          fontWeight: 900,
                        }}
                      >
                        Conhecer agora
                      </Box>
                    )}
                  </Box>
                </Box>
              </SwiperSlide>
            ))}
          </Swiper>
        </Box>
      )}

      {prestadores.length === 0 ? (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", px: 3, textAlign: "center" }}>
          <SearchOffIcon sx={{ fontSize: 80, color: "#CBD5E1", mb: 2 }} />
          <Typography variant="h5" fontWeight={800} color="#1e293b">Nenhum profissional encontrado</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1, mb: 4 }}>
            {raioKm !== null
              ? `Não encontramos profissionais desta categoria em um raio de ${raioKm} km.`
              : "Ainda não temos páginas publicadas nesta categoria."}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            {raioKm !== null && (
              <Button
                variant="contained"
                sx={{ borderRadius: 2, bgcolor: "#1e293b", px: 4 }}
                onClick={() => setRaioKm(null)}
              >
                Mostrar todos
              </Button>
            )}
            <Button
              variant={raioKm !== null ? "outlined" : "contained"}
              sx={{ borderRadius: 2, px: 4 }}
              onClick={() => navigate("/")}
            >
              Ver todas as categorias
            </Button>
          </Stack>
        </Box>
      ) : (
        <>
          {/* Cabeçalho */}
          <Box sx={{ px: { xs: 3, md: 10 }, pt: 4, pb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h5" fontWeight={900} color="#0f172a">
                {tipoServicoAtual?.nome || "Profissionais"}
              </Typography>
              {categoryTag && <Chip label={categoryTag} size="small" sx={{ bgcolor: "#E2E8F0", fontWeight: 700 }} />}
            </Stack>
          </Box>

          {/* Filtros de distância e ordenação */}
          <Box sx={{ px: { xs: 3, md: 10 }, pb: 4 }}>
            <Box
              sx={{
                p: { xs: 2, md: 2.5 },
                bgcolor: "white",
                border: "1px solid #e2e8f0",
                borderRadius: 4,
                boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
              }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2.5}
                alignItems={{ xs: "stretch", md: "center" }}
                justifyContent="space-between"
              >
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      mb: 1,
                      color: "#64748b",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: ".06em",
                    }}
                  >
                    Distância
                  </Typography>

                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    {OPCOES_RAIO.map((opcao) => {
                      const selecionado = raioKm === opcao.value;

                      return (
                        <Chip
                          key={opcao.label}
                          label={opcao.label}
                          clickable
                          disabled={!user && opcao.value !== null}
                          onClick={() => setRaioKm(opcao.value)}
                          sx={{
                            fontWeight: 800,
                            bgcolor: selecionado ? "#0f172a" : "#f1f5f9",
                            color: selecionado ? "white" : "#334155",
                            "&:hover": {
                              bgcolor: selecionado ? "#0f172a" : "#e2e8f0",
                            },
                          }}
                        />
                      );
                    })}
                  </Stack>
                </Box>

                <Button
                  variant={ordenarMaisProximos ? "contained" : "outlined"}
                  disabled={!user}
                  startIcon={<NearMeOutlinedIcon />}
                  onClick={() =>
                    setOrdenarMaisProximos((valor) => !valor)
                  }
                  sx={{
                    minHeight: 44,
                    borderRadius: 3,
                    px: 2.5,
                    textTransform: "none",
                    fontWeight: 800,
                    bgcolor: ordenarMaisProximos ? "#0f172a" : undefined,
                    borderColor: "#cbd5e1",
                    color: ordenarMaisProximos ? "white" : "#0f172a",
                    "&:hover": {
                      bgcolor: ordenarMaisProximos ? "#1e293b" : "#f8fafc",
                      borderColor: "#94a3b8",
                    },
                  }}
                >
                  {ordenarMaisProximos
                    ? "Mais próximos primeiro"
                    : "Ordenar por proximidade"}
                </Button>
              </Stack>

              {!user && (
                <Typography
                  variant="caption"
                  sx={{ display: "block", mt: 1.5, color: "#64748b" }}
                >
                  Entre na sua conta para usar distância e proximidade.
                </Typography>
              )}
            </Box>
          </Box>

          {/* Destaque Premium (Hero) */}
          {tiers.premium.length > 0 && currentPremium && (
            <Box sx={{ height: "70vh", position: "relative", bgcolor: "#000", mb: 6 }}>
              <Fade in timeout={800} key={currentPremium.id}>
                <Box sx={{
                  position: "absolute", inset: 0,
                  backgroundImage: `linear-gradient(to right, rgba(2, 6, 23, 0.9) 20%, rgba(2, 6, 23, 0.2)), url(${resolveImageUrl(currentPremium.capa_url || currentPremium.logo_url)})`,
                  backgroundSize: "cover", backgroundPosition: "center", zIndex: 1,
                }} />
              </Fade>
              <Box sx={{ position: "relative", zIndex: 10, height: "100%", display: "flex", alignItems: "center", px: { xs: 3, md: 10 } }}>
                <Stack spacing={3} maxWidth={700}>
                  <Chip label="MEMBRO VIP" sx={{ bgcolor: "#D4AF37", color: "white", fontWeight: 900, width: "fit-content" }} />
                  <Typography variant="h2" sx={{ color: "white", fontWeight: 900, fontSize: { xs: "2.5rem", md: "3.5rem" } }}>
                    {getDisplayName(currentPremium)}
                  </Typography>
                  <Typography variant="h6" sx={{ color: "rgba(255,255,255,0.8)", fontWeight: 300 }}>
                    {getDisplayDescription(currentPremium)}
                  </Typography>
                  {formatarDistancia(currentPremium.distanciaKm) && (
                    <Chip
                      icon={<LocationOnOutlinedIcon />}
                      label={`${formatarDistancia(currentPremium.distanciaKm)} de você`}
                      sx={{
                        width: "fit-content",
                        bgcolor: "rgba(255,255,255,0.14)",
                        color: "white",
                        fontWeight: 800,
                        "& .MuiChip-icon": { color: "white" },
                      }}
                    />
                  )}
                  <Button
                    variant="contained"
                    size="large"
                    disabled={!acessoComercialLiberado(currentPremium)}
                    sx={{ bgcolor: "#D4AF37", color: "white", px: 5, py: 2, fontWeight: 900, borderRadius: 3 }}
                    onClick={() => handleOpenPage(currentPremium)}
                  >
                    {acessoComercialLiberado(currentPremium)
                      ? "VER PÁGINA VIP"
                      : "TEMPORARIAMENTE INDISPONÍVEL"}
                  </Button>
                </Stack>
              </Box>
            </Box>
          )}

          {/* GRID UNIFICADO DE CARDS PROFISSIONAIS */}
          <Box sx={{ px: { xs: 3, md: 10 } }}>
            <Typography variant="h5" fontWeight={900} mb={4} color="#0f172a">
              {tiers.premium.length > 0 ? "Mais Profissionais" : ""}
            </Typography>

            <Grid2 container spacing={4}>
              {tiers.outros.map((p) => (
                <Grid2 size={{ xs: 12, sm: 6, md: 3 }} key={p.id}>
                  <Card
                    sx={{
                      borderRadius: 5,
                      cursor: acessoComercialLiberado(p) ? "pointer" : "default",
                      overflow: "hidden",
                      border: "1px solid #e2e8f0",
                      bgcolor: "white",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                      transition: "all 0.4s ease",
                      "&:hover": {
                        transform: "translateY(-10px)",
                        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
                        borderColor: "#D4AF37"
                      }
                    }}
                    onClick={() => handleOpenPage(p)}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia
                        component="img"
                        height="200"
                        image={resolveImageUrl(p.capa_url || p.logo_url)}
                        sx={{
                          width: "100%",
                          height: 220,
                          objectFit: "cover",
                          objectPosition: "center",
                        }}
                      />
                      <Avatar
                        src={resolveImageUrl(p.capa_url)}
                        sx={{
                          position: 'absolute', bottom: -20, left: 20,
                          width: 50, height: 50, border: '3px solid white', boxShadow: 2
                        }}
                      />
                    </Box>

                    <Box sx={{ p: 3, pt: 4 }}>
                      {!acessoComercialLiberado(p) && (
                        <Chip
                          icon={<LockOutlinedIcon />}
                          label="Temporariamente indisponível"
                          color="warning"
                          size="small"
                          sx={{ mb: 1.5, fontWeight: 800 }}
                        />
                      )}
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="h6" fontWeight={800} sx={{ color: "#1e293b", lineHeight: 1.2, mb: 0.5 }}>
                            {getDisplayName(p)}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#D4AF37", fontWeight: 700, textTransform: 'uppercase' }}>
                            {getDisplayCategory(p)}
                          </Typography>
                          {formatarDistancia(p.distanciaKm) && (
                            <Stack
                              direction="row"
                              spacing={0.5}
                              alignItems="center"
                              sx={{ mt: 0.8, color: "#475569" }}
                            >
                              <LocationOnOutlinedIcon sx={{ fontSize: 16 }} />
                              <Typography variant="caption" sx={{ fontWeight: 800 }}>
                                {formatarDistancia(p.distanciaKm)} de você
                              </Typography>
                            </Stack>
                          )}
                        </Box>
                      </Stack>

                      <Typography
                        variant="body2" color="text.secondary"
                        sx={{
                          mt: 1.5, display: '-webkit-box', WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '40px'
                        }}
                      >
                        {getDisplayDescription(p)}
                      </Typography>

                      <Divider sx={{ my: 2 }} />

                      <Button
                        fullWidth variant="outlined"
                        disabled={!acessoComercialLiberado(p)}
                        endIcon={<ArrowForwardIosIcon sx={{ fontSize: '10px !important' }} />}
                        sx={{
                          borderRadius: 2, textTransform: 'none', fontWeight: 700,
                          borderColor: '#e2e8f0', color: '#1e293b',
                          "&:hover": { bgcolor: '#f8fafc', borderColor: '#D4AF37' }
                        }}
                      >
                        {acessoComercialLiberado(p)
                          ? "Ver Perfil Completo"
                          : "Atendimento suspenso"}
                      </Button>
                    </Box>
                  </Card>
                </Grid2>
              ))}
            </Grid2>
          </Box>
        </>
      )}
    </Box>
  );
}