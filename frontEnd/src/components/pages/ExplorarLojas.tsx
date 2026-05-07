import { useEffect, useRef, useState, useCallback } from "react";
import {
  Container,
  Grid,
  Card,
  CardMedia,
  Typography,
  Box,
  CircularProgress
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";
import { API_URL } from "../../utils/config";

// ✅ Agora o fallback é apenas para quando REALMENTE não houver nada no banco
const IMAGEM_DEFAULT = "/uploads/cat/default_placeholder.webp";

const formatImageUrl = (path: string) => {
  if (!path) return `${API_URL}${IMAGEM_DEFAULT}`;
  if (path.startsWith("http")) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${cleanPath}`;
};

export default function ExplorarLojas() {
  const { categoria } = useParams(); 
  const navigate = useNavigate();

  const [grupo, setGrupo] = useState<any>(null);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(12); // Aumentado para preencher melhor a grade
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadCategorias = useCallback(async () => {
    if (!categoria || loading || !hasMore) return;

    try {
      setLoading(true);
      const res = await api.get(
        `/lojas/publica/categoria/${categoria}?page=${page}&limit=${limit}`
      );

      console.log('res.data ', res.data.categorias)

      const data = res.data || {};
      const novas = Array.isArray(data.categorias) ? data.categorias : [];

      if (data.grupo && !grupo) {
        setGrupo(data.grupo);
      }

      setCategorias(prev => [...prev, ...novas.filter((x:any) => x.tipo?.toLowerCase() !== 'loja')]);
      setPage(prev => prev + 1);

      if (novas.length < limit) {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Erro ao carregar categorias:", err);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [categoria, page, limit, hasMore, grupo, loading]);

  useEffect(() => {
    setGrupo(null);
    setCategorias([]);
    setPage(1);
    setHasMore(true);
    setLoading(false);
  }, [categoria]);

  useEffect(() => {
    const currentSentinel = sentinelRef.current;
    if (!currentSentinel) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadCategorias();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(currentSentinel);
    return () => observer.disconnect();
  }, [loadCategorias, hasMore, loading]);

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="900" gutterBottom sx={{ textTransform: 'uppercase', mb: 3 }}>
        {grupo?.nome || "Explorar"}
      </Typography>

      <Grid container spacing={2}>
        {categorias.map((cat: any, index: number) => {
          // ✅ A MÁGICA AQUI: Usamos a nova coluna 'urlCategoria' que você criou no banco
          // Se o banco retornar cat.urlCategoria, usamos ela. Caso contrário, fallback.
          const image = formatImageUrl(cat?.urlCategoria || cat?.imagem_url);

          return (
            <Grid size={{xs:6,sm:4,md:3}} key={`${cat?.id || index}-${index}`}>
              <Card
                sx={{
                  borderRadius: 3,
                  overflow: "hidden",
                  cursor: "pointer",
                  position: "relative",
                  height: 200, // Ajuste de altura para o novo estilo
                  transition: "transform 0.25s ease",
                  "&:hover": { transform: "scale(1.03)" },
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                }}
                onClick={() => navigate(`/servicos/${cat?.slug || cat?.id}`)}
              >
                <CardMedia
                  component="img"
                  sx={{ height: "100%", objectFit: "cover" }}
                  image={image}
                  alt={cat?.name || "Categoria"}
                />

                <Box
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    width: "100%",
                    background: "linear-gradient(to top, rgba(0,0,0,0.95), transparent)",
                    color: "#fff",
                    p: 1.5
                  }}
                >
                  <Typography variant="subtitle2" fontWeight="bold">
                    {cat?.name || "Sem nome"}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Box ref={sentinelRef} sx={{ py: 6, textAlign: "center" }}>
        {loading && <CircularProgress size={28} />}
        {!hasMore && categorias.length > 0 && (
          <Typography variant="body2" color="text.secondary">
            Você chegou ao fim da lista.
          </Typography>
        )}
      </Box>
    </Container>
  );
}