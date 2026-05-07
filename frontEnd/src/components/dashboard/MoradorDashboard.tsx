import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  Button,
  Stack,
  Chip,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  IconButton,
  DialogContent

} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  Add as AddIcon,
  Autorenew,
  Build,
  Home,
  Inbox,
  ShoppingBag,
  Star as StarIcon,
  Store
} from "@mui/icons-material";

import { useAuth } from "../../context/AuthContext";
import api from "../../api/api";
import toast from "react-hot-toast";
import { emitNaoVistosChanged } from "../../utils/naoVistosBus";
import BannerPropaganda from "../pages/home/BannerPropaganda";
import { PedidosList } from "../PedidosList/PedidosList";
import { ModalNovaSolicitacao } from "../ModalNovaSolicitacao/ModalNovaSolicitacao";
import CloseIcon from "@mui/icons-material/Close";
import { socket } from "../Checkout/socket";
// --- Tipagens ---
type DashTabKey = "MORADOR_ABERTOS" | "MORADOR_ANDAMENTO" | "MORADOR_COMPRAS" | "MURAL" | "PORTARIA" | "SINDICO";
type PostCategoria = "GARAGEM" | "DOACAO" | "DESAPEGA";

type MuralPost = {
  id: string;
  titulo?: string;
  descricao?: string;
  categoria?: string;
  createdAt?: string;
  preco?: number | string;
  visualizado?: boolean;
  destaque?: boolean;
  midias?: any[];
};

function humanCategoria(c?: string) {
  const x = String(c || "").toUpperCase();
  if (x === "GARAGEM") return "Garagem";
  if (x === "DOACAO" || x === "DOAÇÃO") return "Doação";
  if (x === "DESAPEGA") return "Desapega";
  return c || "Post";
}

export default function MoradorDashboard() {
  const { user } = useAuth();
  const u = user as any;

  // Estados de UI
  const [tab, setTab] = useState(0);
  const [_selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [openNovaSolicitacao, setOpenNovaSolicitacao] = useState(false);
  const [_openNovoPost, setOpenNovoPost] = useState(false);
 

  // Estados de Dados
  const [_loadingMural, setLoadingMural] = useState(false);
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [posts, setPosts] = useState<MuralPost[]>([]);
  const [_loading, setLoadingServicos] = useState(false);
  const [filtroCategoria] = useState<"TODAS" | PostCategoria>("TODAS");
  const [busca] = useState("");


  // --- Lógica de Permissões ---
  const condominio_id = useMemo(() => {
    const v = u?.condominio_id ?? u?.condominio?.id ?? u?.condominio;
    return (v && v !== "null") ? String(v) : "";
  }, [u]);

  const role = String(u?.role || u?.tipo || "MORADOR").toUpperCase();
  const ehPortaria = role === "PORTARIA";
  const ehSindico = role === "SINDICO" || role === "ADMIN";
  const podeVerMoradorTabs = !ehPortaria && (role !== "PRESTADOR" || !!condominio_id);

  // --- Carregamento de Dados ---
  const carregarServicos = useCallback(async () => {
    if (!podeVerMoradorTabs) return;
    setLoadingServicos(true);
    try {
      const { data } = await api.get("/servicos/solicitacoes/minhas-solicitacoes");
      setSolicitacoes(Array.isArray(data) ? data : data?.items || []);
    } catch (err) { console.error(err); } finally { setLoadingServicos(false); }
  }, [podeVerMoradorTabs]);

  const carregarMural = useCallback(async () => {
    if (!condominio_id) return;
    setLoadingMural(true);
    try {
      const { data } = await api.get(`/condominios/${condominio_id}/posts`);
      setPosts(Array.isArray(data) ? data : data?.items || []);
    } catch (err) { console.error(err); } finally { setLoadingMural(false); }
  }, [condominio_id]);




  useEffect(() => { carregarServicos(); }, [carregarServicos]);
  useEffect(() => { if (condominio_id) carregarMural(); }, [condominio_id, carregarMural]);

  const abrirDetalhePost = async (p: MuralPost) => {
    setSelectedPostId(p.id);
    if (!p.visualizado) {
      try {
        await api.post(`/posts/${p.id}/visto`, { usuarioId: user?.id });
        setPosts(prev => prev.map(item => item.id === p.id ? { ...item, visualizado: true } : item));
        emitNaoVistosChanged();
      } catch (err) { console.error(err); }
    }
  };

   // --- Filtros Front-end ---
  const postsParaBanner = useMemo(() => posts.filter(p => p.destaque), [posts]);
  const solicitacoesAbertas = useMemo(() => solicitacoes.filter(s => ["BUSCANDO_PRESTADOR", "CANDIDATOS"].includes(s.statusReal)), [solicitacoes]);
  const solicitacoesEmAndamento = useMemo(() => solicitacoes.filter(s => !["BUSCANDO_PRESTADOR", "CANDIDATOS"].includes(s.statusReal)), [solicitacoes]);

  const postsFiltrados = useMemo(() => {
    return posts.filter(p => {
      const matchCat = filtroCategoria === "TODAS" || p.categoria === filtroCategoria;
      const matchBusca = !busca || `${p.titulo} ${p.descricao}`.toLowerCase().includes(busca.toLowerCase());
      return matchCat && matchBusca;
    });
  }, [posts, filtroCategoria, busca]);

  // --- Definição de Tabs (RESTAURADA) ---
  const tabs = useMemo(() => {
    const t = [];

    if (podeVerMoradorTabs) {
      t.push({
        key: "MORADOR_ABERTOS",
        label: (
          <Stack direction="row" spacing={1} alignItems="center">
            <Inbox fontSize="small" />
            <span>Abertos</span>
            <Chip size="small" label={solicitacoesAbertas.length} />
          </Stack>
        ),
      });

      t.push({
        key: "MORADOR_ANDAMENTO",
        label: (
          <Stack direction="row" spacing={1} alignItems="center">
            <Autorenew fontSize="small" />
            <span>Em Andamento</span>
            <Chip size="small" label={solicitacoesEmAndamento.length} />
          </Stack>
        ),
      });

      t.push({
        key: "MORADOR_COMPRAS",
        label: (
          <Stack direction="row" spacing={1} alignItems="center">
            <ShoppingBag fontSize="small" />
            <span>Compras</span>
          </Stack>
        ),
      });

      t.push({
        key: "MURAL",
        label: (
          <Stack direction="row" spacing={1} alignItems="center">
            <Home fontSize="small" />
            <span>Mural</span>
          </Stack>
        ),
      });
    }

    if (ehPortaria || (ehSindico && !!condominio_id)) {
      t.push({
        key: "PORTARIA",
        label: (
          <Stack direction="row" spacing={1} alignItems="center">
            <Store fontSize="small" />
            <span>Portaria</span>
          </Stack>
        ),
      });
    }

    if (ehSindico) {
      t.push({
        key: "SINDICO",
        label: (
          <Stack direction="row" spacing={1} alignItems="center">
            <Build fontSize="small" />
            <span>Síndico</span>
          </Stack>
        ),
      });
    }

    return t;
  }, [
    podeVerMoradorTabs,
    ehPortaria,
    ehSindico,
    solicitacoesAbertas.length,
    solicitacoesEmAndamento.length,
    condominio_id
  ]);


  const currentTabKey = (tabs[tab]?.key as DashTabKey) || "MORADOR_ABERTOS";

  useEffect(() => {
    if (!user?.id) return;

    // Entra na sala de notificações do usuário
    socket.emit("join_user_room", user.id);

    socket.on("status_changed", (data) => {
      toast.success(data.message, {
        icon: '🛵',
        duration: 6000,
        position: 'top-right'
      });
      // Se quiser atualizar a lista de compras automaticamente:
      if (currentTabKey === "MORADOR_COMPRAS") {
        // Se o PedidosList tiver uma função de refresh, chame-a aqui
      }
    });

    return () => {
      socket.off("status_changed");
    };
  }, [user?.id, currentTabKey]);


  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>

      {/* HEADER PRINCIPAL */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 3,
          border: "1px solid #eaeaea",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie suas atividades e comunidade
          </Typography>
        </Box>

        <Button
          variant="contained"
          sx={{ borderRadius: 2, fontWeight: 700 }}
          startIcon={<AddIcon />}
          onClick={() =>
            currentTabKey === "MURAL"
              ? setOpenNovoPost(true)
              : setOpenNovaSolicitacao(true)
          }
        >
          {currentTabKey === "MURAL" ? "Novo Post" : "Novo Pedido"}
        </Button>
      </Paper>
      {postsParaBanner.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <BannerPropaganda
            posts={postsParaBanner}
            onOpenPost={(id) => setSelectedPostId(id)}
          />
        </Box>
      )}

      {/* TABS MODERNAS */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 3,
          border: "1px solid #eaeaea",
          overflow: "hidden"
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              minHeight: 56
            }
          }}
        >
          {tabs.map((t, i) => (
            <Tab key={i} label={t.label} />
          ))}
        </Tabs>
      </Paper>

      {/* CONTEÚDO */}
      <Box sx={{ mt: 2 }}>
        <Grid container spacing={2}>

          {/* MURAL */}
          {currentTabKey === "MURAL" && postsFiltrados.map((p) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={p.id}>
              <Card
                onClick={() => abrirDetalhePost(p)}
                sx={{
                  height: 200,
                  borderRadius: 3,
                  cursor: "pointer",
                  transition: "0.2s",
                  borderLeft: p.destaque
                    ? "5px solid #f59e0b"
                    : p.visualizado
                      ? "1px solid #eee"
                      : "4px solid #1976d2",
                  "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: 4
                  }
                }}
              >
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Chip
                      size="small"
                      label={humanCategoria(p.categoria)}
                      color={p.destaque ? "warning" : "primary"}
                    />
                    {p.destaque && <StarIcon fontSize="small" />}
                  </Stack>

                  <Typography fontWeight={800} sx={{ mt: 1 }} noWrap>
                    {p.titulo}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mt: 1,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden"
                    }}
                  >
                    {p.descricao}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* SOLICITAÇÕES */}
          {currentTabKey === "MORADOR_ABERTOS" && solicitacoesAbertas.map((sol) => (
            <Grid size={{ xs: 12, md: 4 }} key={sol.id}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography fontWeight={800}>
                    {sol.titulo}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    #{sol.id.slice(0, 8)}
                  </Typography>

                  <Button fullWidth sx={{ mt: 2 }} variant="outlined">
                    Ver Propostas
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* COMPRAS */}
          {currentTabKey === "MORADOR_COMPRAS" && (
            <Grid size={12}>
              <Paper sx={{ p: 2, borderRadius: 3 }}>
                <PedidosList />
              </Paper>
            </Grid>
          )}

        </Grid>
      </Box>
      <Dialog
        open={openNovaSolicitacao}
        onClose={() => setOpenNovaSolicitacao(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
          Nova Solicitação

          <IconButton onClick={() => setOpenNovaSolicitacao(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <ModalNovaSolicitacao
            open={openNovaSolicitacao}
            onClose={() => setOpenNovaSolicitacao(false)}
            usuarioId={user?.id}
            condominio_id={condominio_id}
          />
        </DialogContent>
      </Dialog>
    </Container>
  );
}