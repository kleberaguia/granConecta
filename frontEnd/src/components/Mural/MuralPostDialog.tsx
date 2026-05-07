import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  IconButton,
  Stack,
  Box,
  Typography,
  Avatar,
  Skeleton,
  Button,
  Alert,
  Divider,
  Chip,
  TextField
} from '@mui/material';
import {
  Close as CloseIcon,
  WhatsApp,
  ZoomIn as ZoomInIcon,
  Send as SendIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import api from '../../api/api';
import { API_URL } from '../../utils/config';
import toast from 'react-hot-toast';

// --- Funções Auxiliares ---
const onlyDigits = (str: string) => str.replace(/\D/g, "");

const formatEndereco = (end: any) => {
  if (!end) return "";
  return `${end.logradouro}${end.numero ? `, ${end.numero}` : ""} - ${end.bairro}`;
};

const humanCategoria = (cat: string) => {
  const cats: any = { moradores: "Moradores", servicos: "Serviços", produtos: "Produtos", doacao: "Doação", garagem: "Garagem", desapega: "Desapega" };
  return cats[cat] || cat;
};

interface MuralPostDialogProps {
  postId: string | null;
  onClose: () => void;
}

export default function MuralPostDialog({ postId, onClose }: MuralPostDialogProps) {
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Estados de Interface
  const [imgZoom, setImgZoom] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [enviandoInteresse, setEnviandoInteresse] = useState(false);
  const [jaInteressado, setJaInteressado] = useState(false);

  useEffect(() => {
    if (postId) {
      fetchPostDetalhes();
    } else {
      // Limpa os estados ao fechar
      setPost(null);
      setJaInteressado(false);
      setMensagem("");
    }
  }, [postId]);

  const fetchPostDetalhes = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/posts/${postId}`);
      const data = response.data;
      setPost(data);

      // Pegamos o ID do usuário de forma segura
      const storageUser = localStorage.getItem('@App:usuarioId');

      // Se no seu sistema o 'interesses' for uma lista de objetos:
      const jaDemonstrou = data.interesses?.some((i: any) =>
        String(i.interessado_id) === String(storageUser) || String(i.usuarioId) === String(storageUser)
      );

      setJaInteressado(!!jaDemonstrou);

      // ✅ Registro de visualização usando o padrão usuarioId
      await api.post(`/posts/${postId}/visto`, { usuarioId: storageUser });

    } catch (error) {
      console.error("Erro ao carregar post:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarInteresse = async () => {
    try {
      setEnviandoInteresse(true);

      // Recuperamos o ID do usuário logado (usando o seu padrão)
      const meuId = localStorage.getItem('@App:usuarioId');

      await api.post(`/posts/${postId}/interesses`, {
        interessadoId: meuId, // Mudamos de usuarioId para interessadoId para casar com o backend
        mensagem: mensagem
      });

      setJaInteressado(true);
      setMensagem("");

      // Feedback visual de sucesso
      toast?.success("Dono do post notificado!");
    } catch (error) {
      console.error("Erro ao enviar interesse:", error);
      alert("Não foi possível enviar seu interesse agora.");
    } finally {
      setEnviandoInteresse(false);
    }
  };

  const getFullUrl = (path?: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${API_URL}/${path.replace(/^\//, "")}`;
  };

  return (
    <>
      <Dialog
        open={!!postId}
        onClose={onClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Detalhes do Post
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {loading ? (
            <Stack spacing={2}>
              <Skeleton variant="text" width="40%" height={30} />
              <Skeleton variant="text" width="80%" height={40} />
              <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
            </Stack>
          ) : post ? (
            <Stack spacing={2.5}>
              {/* 1. Badges */}
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip size="small" label={humanCategoria(post.categoria)} color="primary" variant="outlined" />
                {post.preco && <Chip size="small" label={`R$ ${post.preco}`} color="success" />}
                {post.status && <Chip size="small" label={post.status} variant="outlined" />}
              </Stack>

              {/* 2. Título e Descrição */}
              <Box>
                <Typography variant="h6" fontWeight={900} gutterBottom>
                  {post.titulo}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                  {post.conteudo || post.descricao || "—"}
                </Typography>
              </Box>

              <Divider />

              {/* 3. Autor */}
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar src={getFullUrl(post.autor?.perfil?.foto_perfil_url)} sx={{ width: 56, height: 56 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography fontWeight={900} noWrap>{post.autor?.name}</Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {post.autor?.endereco?.bloco_torre && `Bloco ${post.autor.endereco.bloco_torre}`}
                    {post.autor?.endereco?.unidade_apto && ` • Apto ${post.autor.endereco.unidade_apto}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap display="block">
                    📍 {formatEndereco(post.autor?.endereco)}
                  </Typography>
                </Box>
              </Stack>

              {/* 4. SEÇÃO DE INTERESSE (Integrada com sua Tabela) */}
              <Box
                sx={{
                  p: 2, borderRadius: 3,
                  bgcolor: jaInteressado ? '#f0fdf4' : '#f5f8ff',
                  border: `1px solid ${jaInteressado ? '#bbf7d0' : '#dbeafe'}`
                }}
              >
                {jaInteressado ? (
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                    <CheckIcon color="success" />
                    <Typography fontWeight={800} color="success.main">Interesse enviado ao vizinho!</Typography>
                  </Stack>
                ) : (
                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2" fontWeight={900} color="#1e40af">
                      {post.categoria === 'doacao' ? "🙋‍♂️ Você quer este item?" : "🤝 Tem interesse?"}
                    </Typography>
                    <TextField
                      fullWidth size="small" placeholder="Opcional: Deixe um recado..."
                      value={mensagem} onChange={(e) => setMensagem(e.target.value)}
                      sx={{ bgcolor: 'white' }}
                    />
                    <Button
                      variant="contained" fullWidth startIcon={<SendIcon />}
                      onClick={handleEnviarInteresse} disabled={enviandoInteresse}
                      sx={{ borderRadius: 2, fontWeight: 900, textTransform: 'none', boxShadow: 'none' }}
                    >
                      {enviandoInteresse ? "Enviando..." : "Sinalizar Interesse"}
                    </Button>
                  </Stack>
                )}
              </Box>

              {/* 5. Galeria de Fotos com Zoom */}
              {post.midias && post.midias.length > 0 && (
                <Box sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 1 }}>
                  {post.midias.map((img: any, idx: number) => (
                    <Box
                      key={idx}
                      onClick={() => setImgZoom(getFullUrl(img.url))}
                      sx={{
                        position: 'relative', width: 140, height: 140, borderRadius: 2,
                        flexShrink: 0, cursor: 'pointer', overflow: 'hidden',
                        '&:hover .z-icon': { opacity: 1 }
                      }}
                    >
                      <Box component="img" src={getFullUrl(img.url)} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <Box className="z-icon" sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '0.2s' }}>
                        <ZoomInIcon sx={{ color: 'white' }} />
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}

              {/* 6. Contato Direto */}
              {post.autor?.telefone && (
                <Button
                  variant="contained" color="success" fullWidth startIcon={<WhatsApp />}
                  sx={{ borderRadius: 2, fontWeight: 900, py: 1.2 }}
                  onClick={() => {
                    const tel = onlyDigits(post.autor.telefone);
                    window.open(`https://wa.me/${tel.startsWith('55') ? tel : '55' + tel}`, "_blank");
                  }}
                >
                  Chamar no WhatsApp
                </Button>
              )}
            </Stack>
          ) : (
            <Alert severity="error">Post não encontrado.</Alert>
          )}
        </DialogContent>
        <DialogActions><Button onClick={onClose}>Fechar</Button></DialogActions>
      </Dialog>

      {/* LIGHTBOX ZOOM */}
      <Dialog open={!!imgZoom} onClose={() => setImgZoom(null)} maxWidth="lg">
        <Box sx={{ position: 'relative', bgcolor: 'black', display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => setImgZoom(null)} sx={{ position: 'absolute', top: 10, right: 10, color: 'white', zIndex: 10 }}>
            <CloseIcon />
          </IconButton>
          <Box component="img" src={imgZoom || ''} sx={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain' }} />
        </Box>
      </Dialog>
    </>
  );
}