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
import SearchOffIcon from "@mui/icons-material/SearchOff";
import api from "../../api/api";
import { slugify } from "../../utils/slugify";
const SAFE_IMAGE = "https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=2000";

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
  plano?: "PREMIUM" | "INTERMEDIARIO" | "BASICO" | string;
  name?: string;
  descricao_loja?: string;
  categoria?: Categoria | string;
  categoria_tag?: string;
  categoriaid?: number;
  logo_url?: string;
  capa_url?: string;
  telefone_whatsapp?: string;
};

const getCategoriaSlug = (item: StorePrestador) => {
  const value =
    (typeof item?.categoria === 'string' ? item.categoria : item?.categoria?.name) ||
    item?.categoria_tag ||
    "";
  return value ? slugify(value) : "";
};

export default function ServiceShowcase() {
  const { categoryTag } = useParams<{ categoryTag?: string }>();
  const navigate = useNavigate();


  console.log('categoryTag ', categoryTag)

  const [prestadores, setPrestadores] = useState<StorePrestador[]>([]);
  const [tipoServicoAtual, setTipoServicoAtual] = useState<TipoServico | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const tiposRes = await api.get("/tipos-combo");
        const tipos = Array.isArray(tiposRes.data) ? tiposRes.data : [];

        // 1. Busca o tipo de serviço (por ID ou Slug)
        const encontrado = categoryTag
          ? tipos.find((item: any) =>
            String(item.id) === String(categoryTag) ||
            item.slug === categoryTag ||
            item.name === categoryTag
          ) || null
          : null;

        // 2. Normaliza e atualiza o estado (Uma única vez)
        if (encontrado) {
          const tipoNormalizado = {
            ...encontrado,
            nome: encontrado.nome || encontrado.name // Resolve o problema do name vs nome
          };
          setTipoServicoAtual(tipoNormalizado);
          console.log('Tipo de Serviço Identificado:', tipoNormalizado);
        } else {
          setTipoServicoAtual(null);
        }

        // 3. Busca todas as lojas
        const res = await api.get("/lojas/publica/todas");
        console.log('ressssssssss ', res)

        const data = Array.isArray(res.data) ? res.data : [];

        const somentePrestadores = data.filter(
          (item: StorePrestador) => String(item.tipo || "").toLowerCase() === "prestador"
        );

        // 4. Filtra por Categoria usando o ID (preferencial) ou Slug
        const filtradosPorCategoria = categoryTag
          ? somentePrestadores.filter((item: StorePrestador) => {
            // Se achamos a categoria oficial, comparamos pelo ID numérico (mais seguro)
            if (encontrado) {
              if (String(item.categoriaid) === String(encontrado.id)) return true;
            }

            // Fallback por slug caso o ID não bata ou a categoria não seja encontrada no tipos-combo
            const itemSlug = getCategoriaSlug(item);
            const urlCategorySlug = slugify(categoryTag || "");
            return itemSlug === urlCategorySlug;
          })
          : somentePrestadores;

        setPrestadores(filtradosPorCategoria);
        setHeroIndex(0);
      } catch (err) {
        console.error("Erro ao carregar vitrine:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [categoryTag]);

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

  const getDisplayName = (item?: StorePrestador | null) => item?.name || "Profissional";
  const getDisplayDescription = (item?: StorePrestador | null) => item?.descricao_loja || "Conheça este profissional.";

  const getDisplayCategory = (item?: StorePrestador | null) => {
    return (typeof item?.categoria === 'string' ? item.categoria : item?.categoria?.name) ||
      item?.categoria_tag || "Serviços Gerais";
  };

  const handleOpenPage = (item?: StorePrestador | null) => {
    if (!item?.slug) return;
    window.open(`/pagina/${item.slug}`, '_blank');
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
      {prestadores.length === 0 ? (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", px: 3, textAlign: "center" }}>
          <SearchOffIcon sx={{ fontSize: 80, color: "#CBD5E1", mb: 2 }} />
          <Typography variant="h5" fontWeight={800} color="#1e293b">Nenhum profissional encontrado</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1, mb: 4 }}>
            Ainda não temos páginas publicadas nesta categoria.
          </Typography>
          <Button variant="contained" sx={{ borderRadius: 2, bgcolor: "#1e293b", px: 4 }} onClick={() => navigate("/")}>
            Ver todas as categorias
          </Button>
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
                  <Button variant="contained" size="large" sx={{ bgcolor: "#D4AF37", color: "white", px: 5, py: 2, fontWeight: 900, borderRadius: 3 }} onClick={() => handleOpenPage(currentPremium)}>
                    VER PÁGINA VIP
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
                      cursor: "pointer",
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
                        sx={{ objectFit: "cover" }}
                      />
                      <Avatar
                        src={resolveImageUrl(p.logo_url)}
                        sx={{
                          position: 'absolute', bottom: -20, left: 20,
                          width: 50, height: 50, border: '3px solid white', boxShadow: 2
                        }}
                      />
                    </Box>

                    <Box sx={{ p: 3, pt: 4 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="h6" fontWeight={800} sx={{ color: "#1e293b", lineHeight: 1.2, mb: 0.5 }}>
                            {getDisplayName(p)}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#D4AF37", fontWeight: 700, textTransform: 'uppercase' }}>
                            {getDisplayCategory(p)}
                          </Typography>
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
                        endIcon={<ArrowForwardIosIcon sx={{ fontSize: '10px !important' }} />}
                        sx={{
                          borderRadius: 2, textTransform: 'none', fontWeight: 700,
                          borderColor: '#e2e8f0', color: '#1e293b',
                          "&:hover": { bgcolor: '#f8fafc', borderColor: '#D4AF37' }
                        }}
                      >
                        Ver Perfil Completo
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