// src/components/pages/comunidade/ComunidadePage.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, Card, CardContent, Chip, CircularProgress, Container,
  Dialog, DialogContent, DialogTitle, IconButton, MenuItem, Paper,
  Stack, TextField, Typography
} from "@mui/material";
import {
  Add as AddIcon, ArrowBack, Close as CloseIcon, HomeRounded,
  Image as ImageIcon, Delete as DeleteIcon, CampaignRounded,
  RedeemRounded, PetsRounded, SearchRounded, DirectionsCarRounded
} from "@mui/icons-material";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import MuralPostDialog from "../Mural/MuralPostDialog";
import { emitNaoVistosChanged } from "../../utils/naoVistosBus";
import toast from "react-hot-toast";

type Categoria = "VAGA_GARAGEM" | "DESAPEGA" | "ANIMAIS" | "OUTROS";
type Post = {
  id: string; titulo?: string; descricao?: string; categoria?: string;
  visualizado?: boolean; createdAt?: string;
};

const nomeCategoria = (v?: string) => {
  const x = String(v || "").toUpperCase();
  if (x === "VAGA_GARAGEM") return "Vaga de garagem";
  if (x === "DESAPEGA") return "Doação / Desapega";
  if (x === "ANIMAIS") return "Animais";
  return "Comunidade";
};

export default function ComunidadePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const u = user as any;
  const condominioId = String(u?.condominio_id ?? u?.condominio?.id ?? u?.condominio ?? "");
  const visitante = String(u?.tipo || u?.role || "").toUpperCase() === "VISITANTE";

  const [posts, setPosts] = useState<Post[]>([]);
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("TODOS");
  const [loading, setLoading] = useState(true);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [openNovo, setOpenNovo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [novo, setNovo] = useState<{titulo:string; descricao:string; categoria:Categoria}>({
    titulo:"", descricao:"", categoria:"OUTROS"
  });

  const carregar = useCallback(async () => {
    if (!condominioId || visitante) { setLoading(false); return; }
    try {
      const { data } = await api.get(`/condominios/${condominioId}/posts`);
      const lista = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
      // Proteção visual imediata: não exibe a categoria comercial SERVICOS.
      setPosts(lista.filter((p:any) => String(p?.categoria || "").toUpperCase() !== "SERVICOS"));
    } catch (e) {
      console.error("Erro ao carregar comunidade:", e);
      setPosts([]);
    } finally { setLoading(false); }
  }, [condominioId, visitante]);

  useEffect(() => { carregar(); }, [carregar]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return posts.filter(p => {
      const categoria = String(p.categoria || "").toUpperCase();
      const bateCategoria =
        categoriaFiltro === "TODOS" ||
        (categoriaFiltro === "OUTROS" && (!categoria || categoria === "OUTROS")) ||
        categoria === categoriaFiltro;

      const bateBusca =
        !q ||
        String(p.titulo || "").toLowerCase().includes(q) ||
        String(p.descricao || "").toLowerCase().includes(q);

      return bateCategoria && bateBusca;
    });
  }, [posts, busca, categoriaFiltro]);

  const abrir = (p: Post) => {
    setSelectedPostId(p.id);
    if (!p.visualizado) {
      setPosts(prev => prev.map(x => x.id === p.id ? {...x, visualizado:true} : x));
      emitNaoVistosChanged();
    }
  };

  const publicar = async () => {
    const titulo = novo.titulo.trim();
    const descricao = novo.descricao.trim();
    if (!titulo || !descricao) return toast.error("Preencha título e descrição.");
    if (!condominioId) return toast.error("Comunidade não identificada.");
    if (!user?.id) return toast.error("Faça login para publicar.");

    setSalvando(true);
    try {
      const fd = new FormData();
      fd.append("titulo", titulo);
      fd.append("descricao", descricao);
      fd.append("categoria", novo.categoria);
      fd.append("condominio_id", condominioId);
      fd.append("status", "ATIVO");
      fd.append("destaque", "false");
      fd.append("visibilidade", "CONDOMINIO");

      // Desapega na Comunidade é sempre doação, nunca venda.
      if (novo.categoria === "DESAPEGA") {
        fd.append("desapega_condicao", "USADO");
        fd.append("desapega_e_doacao", "true");
      }
      arquivos.forEach(file => fd.append("files", file));
      await api.post("/posts", fd);

      toast.success("Publicado na comunidade!");
      setNovo({titulo:"", descricao:"", categoria:"OUTROS"});
      setArquivos([]);
      setOpenNovo(false);
      await carregar();
      emitNaoVistosChanged();
    } catch (e:any) {
      toast.error(e?.response?.data?.message || e?.response?.data?.error || "Erro ao publicar.");
    } finally { setSalvando(false); }
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper sx={{ p:4, borderRadius:4, textAlign:"center" }}>
          <Typography variant="h4" fontWeight={900}>Comunidade GranConecta</Typography>
          <Typography color="text.secondary" sx={{ mt:1, mb:3 }}>
            Entre para ver os recados e descobertas da sua comunidade.
          </Typography>
          <Button variant="contained" onClick={() => navigate("/login/morador")}>Entrar</Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{
      minHeight:"100vh", bgcolor:"#06182b", color:"#fff",
      pt:{xs:1.5,md:4},
      pb:{xs:"calc(92px + env(safe-area-inset-bottom))",md:4}
    }}>
      <Container maxWidth="lg">
        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb:{xs:1.2,md:2} }}>
          <IconButton onClick={() => navigate("/")} sx={{ color:"#fff", ml:{xs:-1,md:0} }}>
            <ArrowBack />
          </IconButton>
          <HomeRounded sx={{ color:"#18d5ef", fontSize:{xs:19,md:24} }} />
          <Typography fontWeight={900} fontSize={{xs:".88rem",md:"1rem"}}>
            Comunidade GranConecta
          </Typography>
        </Stack>

        <Paper elevation={0} sx={{
          p:{xs:1.5,md:3}, mb:{xs:1.5,md:3}, borderRadius:{xs:3,md:4}, color:"#fff",
          bgcolor:"rgba(9,39,61,.92)", border:"1px solid rgba(31,210,239,.22)"
        }}>
          <Stack direction={{xs:"row",md:"column"}} justifyContent="space-between" alignItems={{xs:"flex-start",md:"stretch"}} spacing={1}>
            <Box>
              <Typography sx={{
                fontWeight:900,
                fontSize:{xs:"1.45rem",md:"2.125rem"},
                lineHeight:{xs:1.05,md:1.2},
                letterSpacing:{xs:"-.02em",md:0}
              }}>
                O que está acontecendo por perto?
              </Typography>
              <Typography sx={{ mt:.6, color:"rgba(232,244,255,.72)", fontSize:{xs:".78rem",md:"1rem"}, lineHeight:1.4 }}>
                Recados, doações, animais, achados e perdidos e vagas de garagem.
              </Typography>
            </Box>
          </Stack>

          <Typography variant="caption" sx={{ display:"block", mt:1, color:"#72e8f5", fontSize:{xs:".66rem",md:".75rem"} }}>
            Vendas e serviços ficam no Marketplace GranConecta.
          </Typography>

          <Stack direction="row" spacing={.8} sx={{
            mt:1.4, overflowX:"auto", pb:.4,
            scrollbarWidth:"none",
            "&::-webkit-scrollbar":{display:"none"}
          }}>
            {[
              { id:"TODOS", label:"Recados", icon:<CampaignRounded sx={{fontSize:16}} /> },
              { id:"DESAPEGA", label:"Doações", icon:<RedeemRounded sx={{fontSize:16}} /> },
              { id:"ANIMAIS", label:"Animais", icon:<PetsRounded sx={{fontSize:16}} /> },
              { id:"OUTROS", label:"Achados", icon:<SearchRounded sx={{fontSize:16}} /> },
              { id:"VAGA_GARAGEM", label:"Garagem", icon:<DirectionsCarRounded sx={{fontSize:16}} /> },
            ].map(item => (
              <Chip
                key={item.id}
                icon={item.icon}
                label={item.label}
                clickable
                onClick={()=>setCategoriaFiltro(item.id)}
                sx={{
                  flex:"0 0 auto",
                  height:32,
                  color: categoriaFiltro === item.id ? "#03131f" : "#dff9ff",
                  bgcolor: categoriaFiltro === item.id ? "#19d5ef" : "rgba(255,255,255,.055)",
                  border:"1px solid rgba(31,210,239,.18)",
                  fontWeight:800,
                  fontSize:".7rem",
                  "& .MuiChip-icon":{ color:"inherit" }
                }}
              />
            ))}
          </Stack>

          <Stack direction={{xs:"row",sm:"row"}} spacing={1} sx={{ mt:1.2 }}>
            <TextField
              fullWidth
              size="small"
              value={busca}
              onChange={e=>setBusca(e.target.value)}
              placeholder="Buscar na comunidade..."
              sx={{
                bgcolor:"#fff", borderRadius:2,
                "& fieldset":{border:0},
                "& .MuiInputBase-root":{height:{xs:42,md:48}},
                "& input":{fontSize:{xs:".82rem",md:"1rem"}}
              }}
            />
            {!visitante && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={()=>setOpenNovo(true)}
                sx={{
                  whiteSpace:"nowrap",
                  minWidth:{xs:46,sm:150},
                  px:{xs:1.2,sm:2.5},
                  borderRadius:2,
                  fontWeight:900,
                  fontSize:{xs:0,sm:".875rem"},
                  "& .MuiButton-startIcon":{m:{xs:0,sm:"0 8px 0 -4px"}}
                }}
                aria-label="Publicar recado"
              >
                <Box component="span" sx={{display:{xs:"none",sm:"inline"}}}>Publicar</Box>
              </Button>
            )}
          </Stack>
        </Paper>

        {loading ? (
          <Box sx={{ display:"grid", placeItems:"center", py:8 }}><CircularProgress /></Box>
        ) : !condominioId ? (
          <Paper sx={{ p:4, borderRadius:4, textAlign:"center" }}>
            <Typography fontWeight={900}>Sua comunidade ainda não foi identificada.</Typography>
          </Paper>
        ) : (
          <Box sx={{ display:"grid", gridTemplateColumns:{xs:"1fr",sm:"repeat(2,1fr)",md:"repeat(3,1fr)"}, gap:2 }}>
            {filtrados.map(p => (
              <Card key={p.id} onClick={()=>abrir(p)} elevation={0} sx={{
                cursor:"pointer", borderRadius:3, bgcolor:"#0b263e", color:"#fff",
                border:p.visualizado ? "1px solid rgba(255,255,255,.1)" : "1px solid #19d5ef",
                transition:".18s", "&:hover":{transform:"translateY(-3px)", boxShadow:"0 16px 35px rgba(0,0,0,.25)"}
              }}>
                <CardContent sx={{ p:{xs:1.5,md:2}, "&:last-child":{pb:{xs:1.5,md:2}} }}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb:1.4 }}>
                    <Chip size="small" label={nomeCategoria(p.categoria)}
                      sx={{ bgcolor:"rgba(24,213,239,.12)", color:"#78eaf6", fontWeight:800 }} />
                    {!p.visualizado && <Chip size="small" label="Novo" color="warning" />}
                  </Stack>
                  <Typography fontWeight={900} fontSize="1.05rem">{p.titulo || "Recado"}</Typography>
                  <Typography sx={{
                    mt:.7, color:"rgba(232,244,255,.68)", fontSize:".88rem",
                    display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden"
                  }}>{p.descricao}</Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {!loading && filtrados.length === 0 && condominioId && (
          <Paper elevation={0} sx={{
            mt:1.5, p:{xs:2.2,md:4}, borderRadius:3, textAlign:"center",
            color:"#fff", bgcolor:"rgba(9,39,61,.72)",
            border:"1px dashed rgba(31,210,239,.22)"
          }}>
            <Typography fontWeight={900}>Ainda não há novidades por aqui.</Typography>
            <Typography sx={{ mt:.5, color:"rgba(232,244,255,.62)", fontSize:{xs:".78rem",md:".9rem"} }}>
              Seja o primeiro a publicar um recado para sua comunidade.
            </Typography>
          </Paper>
        )}
      </Container>

      <Dialog open={openNovo} onClose={()=>!salvando && setOpenNovo(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontWeight:900 }}>
          Novo recado
          <IconButton onClick={()=>setOpenNovo(false)} disabled={salvando}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt:1 }}>
            <TextField label="Título" value={novo.titulo}
              onChange={e=>setNovo(v=>({...v,titulo:e.target.value}))} fullWidth />
            <TextField select label="Categoria" value={novo.categoria}
              onChange={e=>setNovo(v=>({...v,categoria:e.target.value as Categoria}))} fullWidth>
              <MenuItem value="OUTROS">Comunicado / Achados e perdidos</MenuItem>
              <MenuItem value="DESAPEGA">Doação / Desapega</MenuItem>
              <MenuItem value="ANIMAIS">Animais</MenuItem>
              <MenuItem value="VAGA_GARAGEM">Vaga de garagem</MenuItem>
            </TextField>
            <TextField label="Descrição" value={novo.descricao}
              onChange={e=>setNovo(v=>({...v,descricao:e.target.value}))}
              multiline rows={5} fullWidth />
            <Button component="label" variant="outlined" startIcon={<ImageIcon />}>
              Adicionar imagens
              <input hidden multiple type="file" accept="image/*"
                onChange={e=>setArquivos(Array.from(e.target.files || []).filter(f=>f.type.startsWith("image/")))} />
            </Button>
            {arquivos.map((f,i)=>(
              <Stack key={`${f.name}-${i}`} direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="body2" noWrap>{f.name}</Typography>
                <IconButton color="error" onClick={()=>setArquivos(a=>a.filter((_,x)=>x!==i))}><DeleteIcon /></IconButton>
              </Stack>
            ))}
            <Typography variant="caption" color="text.secondary">
              A Comunidade é para convivência entre moradores. Para vender produtos ou oferecer serviços, use o Marketplace.
            </Typography>
            <Button variant="contained" onClick={publicar} disabled={salvando} startIcon={<AddIcon />}>
              {salvando ? "Publicando..." : "Publicar recado"}
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      <MuralPostDialog postId={selectedPostId} onClose={()=>setSelectedPostId(null)} />
    </Box>
  );
}
