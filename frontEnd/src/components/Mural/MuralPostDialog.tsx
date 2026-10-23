import { useEffect, useState } from "react";
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
  TextField,

} from "@mui/material";

"@mui/icons-material";

import {
  Close as CloseIcon,
  WhatsApp,
  ZoomIn as ZoomInIcon,
  Send as SendIcon,
  CheckCircle as CheckIcon,
  PauseCircleOutline as PauseIcon,
  PlayCircleOutline as PlayIcon,
  DeleteOutline as DeleteIcon,
  CheckCircleOutline as FinishIcon,
} from "@mui/icons-material";

import api from "../../api/api";
import { API_URL } from "../../utils/config";
import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import { emitNaoVistosChanged } from "../../utils/naoVistosBus";

// ---------------------------------------------------------
// FUNÇÕES AUXILIARES
// ---------------------------------------------------------

const onlyDigits = (str: string) => str.replace(/\D/g, "");

const formatEndereco = (end: any) => {
  if (!end) return "";

  return `${end.logradouro}${end.numero ? `, ${end.numero}` : ""
    } - ${end.bairro}`;
};

const humanCategoria = (cat: string) => {
  const cats: any = {
    moradores: "Moradores",
    servicos: "Serviços",
    produtos: "Produtos",
    doacao: "Doação",
    garagem: "Garagem",
    desapega: "Desapega",
  };

  return cats[cat] || cat;
};

// ---------------------------------------------------------
// PROPS
// ---------------------------------------------------------

interface MuralPostDialogProps {
  postId: string | null;
  onClose: () => void;
}

// ---------------------------------------------------------
// COMPONENTE
// ---------------------------------------------------------

export default function MuralPostDialog({
  postId,
  onClose,
}: MuralPostDialogProps) {
  const { user } = useAuth();

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // -------------------------------------------------------
  // ESTADOS DE INTERFACE
  // -------------------------------------------------------

  const [imgZoom, setImgZoom] = useState<string | null>(null);

  const [mensagem, setMensagem] = useState("");

  const [enviandoInteresse, setEnviandoInteresse] =
    useState(false);

  const [jaInteressado, setJaInteressado] =
    useState(false);

  const [marcandoVisto, setMarcandoVisto] =
    useState(false);

  const [alterandoStatus, setAlterandoStatus] =
    useState(false);

  // -------------------------------------------------------
  // IDENTIFICAÇÃO DO AUTOR
  // -------------------------------------------------------

  const usuarioLogadoId =
    user?.id ||
    (user as any)?.usuarioId;

  const autorPostId =
    post?.autor?.id ||
    post?.autor?.usuarioId ||
    post?.usuarioId ||
    post?.usuario_id;

  const isMeuPost =
    !!post &&
    !!usuarioLogadoId &&
    !!autorPostId &&
    String(autorPostId) === String(usuarioLogadoId);

  // -------------------------------------------------------
  // CARREGAMENTO DO POST
  // -------------------------------------------------------

  useEffect(() => {
    if (postId) {
      fetchPostDetalhes();
    } else {
      // Limpa os estados ao fechar
      setPost(null);
      setJaInteressado(false);
      setMensagem("");
      setMarcandoVisto(false);
    }
  }, [postId]);

  // -------------------------------------------------------
  // BUSCAR DETALHES
  // -------------------------------------------------------

  const fetchPostDetalhes = async () => {
    try {
      setLoading(true);

      const response = await api.get(
        `/posts/${postId}`
      );

      const data = response.data;

      setPost(data);

      // ID do usuário salvo localmente
      const storageUser = localStorage.getItem(
        "@App:usuarioId"
      );

      // Verifica se o usuário já demonstrou interesse
      const jaDemonstrou = data.interesses?.some(
        (i: any) =>
          String(i.interessado_id) ===
          String(storageUser) ||
          String(i.usuarioId) ===
          String(storageUser)
      );

      setJaInteressado(!!jaDemonstrou);

      /*
       * IMPORTANTE:
       *
       * Abrir o post NÃO significa marcar como visto.
       *
       * A visualização somente será registrada quando
       * o usuário clicar explicitamente em:
       *
       * "Marcar como visto"
       */
    } catch (error) {
      console.error(
        "Erro ao carregar post:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------
  // MARCAR COMO VISTO
  // -------------------------------------------------------

  const handleMarcarComoVisto = async () => {
    if (
      !postId ||
      marcandoVisto ||
      isMeuPost
    ) {
      return;
    }

    try {
      setMarcandoVisto(true);

      await api.post(
        `/posts/${postId}/visto`
      );

      // Atualiza contador global de não vistos
      emitNaoVistosChanged();

      toast.success(
        "Recado marcado como visto."
      );

      onClose();
    } catch (error) {
      console.error(
        "Erro ao marcar post como visto:",
        error
      );

      toast.error(
        "Não foi possível marcar o recado como visto."
      );
    } finally {
      setMarcandoVisto(false);
    }
  };
  const handleAlterarStatus = async (
    novoStatus: "ATIVO" | "PAUSADO" | "FECHADO" | "REMOVIDO"
  ) => {
    if (!postId || !isMeuPost || alterandoStatus) {
      return;
    }

    let mensagemConfirmacao = "";

    if (novoStatus === "PAUSADO") {
      mensagemConfirmacao =
        "Deseja suspender este recado? Ele deixará de aparecer para os outros moradores até você reativá-lo.";
    }

    if (novoStatus === "ATIVO") {
      mensagemConfirmacao =
        "Deseja reativar este recado? Ele voltará a aparecer para os moradores.";
    }

    if (novoStatus === "FECHADO") {
      mensagemConfirmacao =
        "Deseja encerrar este recado? Ele deixará de aparecer no Mural.";
    }

    if (novoStatus === "REMOVIDO") {
      mensagemConfirmacao =
        "Deseja excluir este recado? Ele deixará de aparecer no Mural.";
    }

    if (
      mensagemConfirmacao &&
      !window.confirm(mensagemConfirmacao)
    ) {
      return;
    }

    try {
      setAlterandoStatus(true);

      const response = await api.patch(
        `/posts/${postId}/status`,
        {
          status: novoStatus,
        }
      );

      setPost((atual: any) => ({
        ...atual,
        ...(response.data || {}),
        status: novoStatus,
      }));

      emitNaoVistosChanged();

      if (novoStatus === "PAUSADO") {
        toast.success("Recado suspenso.");
      } else if (novoStatus === "ATIVO") {
        toast.success("Recado reativado.");
      } else if (novoStatus === "FECHADO") {
        toast.success("Recado encerrado.");
      } else {
        toast.success("Recado excluído.");
      }

      /*
       * Ao pausar, encerrar ou remover, fechamos o modal
       * porque o post deverá sair da listagem ATIVA.
       */
      if (novoStatus !== "ATIVO") {
        onClose();
      }
    } catch (error) {
      console.error(
        "Erro ao alterar status do post:",
        error
      );

      toast.error(
        "Não foi possível alterar o status do recado."
      );
    } finally {
      setAlterandoStatus(false);
    }
  };


  // -------------------------------------------------------
  // ENVIAR INTERESSE
  // -------------------------------------------------------

  const handleEnviarInteresse = async () => {
    // Segurança extra:
    // o autor nunca deve demonstrar interesse
    // no próprio post.
    if (isMeuPost) {
      return;
    }

    try {
      setEnviandoInteresse(true);

      const meuId = localStorage.getItem(
        "@App:usuarioId"
      );

      await api.post(
        `/posts/${postId}/interesses`,
        {
          interessadoId: meuId,
          mensagem,
        }
      );

      setJaInteressado(true);
      setMensagem("");

      toast.success(
        "Dono do post notificado!"
      );
    } catch (error) {
      console.error(
        "Erro ao enviar interesse:",
        error
      );

      alert(
        "Não foi possível enviar seu interesse agora."
      );
    } finally {
      setEnviandoInteresse(false);
    }
  };

  // -------------------------------------------------------
  // URL COMPLETA DE IMAGEM
  // -------------------------------------------------------

  const getFullUrl = (
    path?: string
  ) => {
    if (!path) return "";

    if (path.startsWith("http")) {
      return path;
    }

    return `${API_URL}/${path.replace(
      /^\//,
      ""
    )}`;
  };

  // -------------------------------------------------------
  // RENDER
  // -------------------------------------------------------

  return (
    <>
      <Dialog
        open={!!postId}
        onClose={onClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 4,
          },
        }}
      >
        {/* ------------------------------------------------ */}
        {/* TÍTULO */}
        {/* ------------------------------------------------ */}

        <DialogTitle
          sx={{
            fontWeight: 900,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {isMeuPost
            ? "Gerenciar meu recado"
            : "Detalhes do Post"}

          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        {/* ------------------------------------------------ */}
        {/* CONTEÚDO */}
        {/* ------------------------------------------------ */}

        <DialogContent dividers>
          {loading ? (
            <Stack spacing={2}>
              <Skeleton
                variant="text"
                width="40%"
                height={30}
              />

              <Skeleton
                variant="text"
                width="80%"
                height={40}
              />

              <Skeleton
                variant="rectangular"
                height={100}
                sx={{
                  borderRadius: 2,
                }}
              />
            </Stack>
          ) : post ? (
            <Stack spacing={2.5}>
              {/* ------------------------------------------ */}
              {/* 1. BADGES */}
              {/* ------------------------------------------ */}

              <Stack
                direction="row"
                spacing={1}
                flexWrap="wrap"
              >
                <Chip
                  size="small"
                  label={humanCategoria(
                    post.categoria
                  )}
                  color="primary"
                  variant="outlined"
                />

                {post.preco && (
                  <Chip
                    size="small"
                    label={`R$ ${post.preco}`}
                    color="success"
                  />
                )}

                {post.status && (
                  <Chip
                    size="small"
                    label={post.status}
                    variant="outlined"
                  />
                )}

                {isMeuPost && (
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      bgcolor: "#f5f9ff",
                      border: "1px solid #dbeafe",
                    }}
                  >
                    <Typography
                      fontWeight={900}
                      color="primary.main"
                      sx={{ mb: 0.5 }}
                    >
                      Administração do seu recado
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      Você publicou este recado e pode controlar sua
                      disponibilidade no Mural.
                    </Typography>

                    <Stack
                      direction={{
                        xs: "column",
                        sm: "row",
                      }}
                      spacing={1}
                      flexWrap="wrap"
                    >
                      {post.status === "ATIVO" && (
                        <Button
                          variant="outlined"
                          color="warning"
                          startIcon={<PauseIcon />}
                          disabled={alterandoStatus}
                          onClick={() =>
                            handleAlterarStatus("PAUSADO")
                          }
                        >
                          Suspender
                        </Button>
                      )}

                      {post.status === "PAUSADO" && (
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<PlayIcon />}
                          disabled={alterandoStatus}
                          onClick={() =>
                            handleAlterarStatus("ATIVO")
                          }
                        >
                          Reativar
                        </Button>
                      )}

                      {(post.status === "ATIVO" ||
                        post.status === "PAUSADO") && (
                          <Button
                            variant="outlined"
                            startIcon={<FinishIcon />}
                            disabled={alterandoStatus}
                            onClick={() =>
                              handleAlterarStatus("FECHADO")
                            }
                          >
                            Encerrar
                          </Button>
                        )}

                      {post.status !== "REMOVIDO" && (
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteIcon />}
                          disabled={alterandoStatus}
                          onClick={() =>
                            handleAlterarStatus("REMOVIDO")
                          }
                        >
                          Excluir
                        </Button>
                      )}
                    </Stack>
                  </Box>
                )}
              </Stack>

              {/* ------------------------------------------ */}
              {/* 2. TÍTULO E DESCRIÇÃO */}
              {/* ------------------------------------------ */}

              <Box>
                <Typography
                  variant="h6"
                  fontWeight={900}
                  gutterBottom
                >
                  {post.titulo}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.6,
                  }}
                >
                  {post.conteudo ||
                    post.descricao ||
                    "—"}
                </Typography>
              </Box>

              <Divider />

              {/* ------------------------------------------ */}
              {/* 3. AUTOR */}
              {/* ------------------------------------------ */}

              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
              >
                <Avatar
                  src={getFullUrl(
                    post.autor?.perfil
                      ?.foto_perfil_url
                  )}
                  sx={{
                    width: 56,
                    height: 56,
                  }}
                />

                <Box
                  sx={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <Typography
                    fontWeight={900}
                    noWrap
                  >
                    {post.autor?.name}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    {post.autor?.endereco
                      ?.bloco_torre &&
                      `Bloco ${post.autor.endereco.bloco_torre}`}

                    {post.autor?.endereco
                      ?.unidade_apto &&
                      ` • Apto ${post.autor.endereco.unidade_apto}`}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    noWrap
                    display="block"
                  >
                    📍{" "}
                    {formatEndereco(
                      post.autor?.endereco
                    )}
                  </Typography>
                </Box>
              </Stack>

              {/* ------------------------------------------ */}
              {/* 4. AVISO PARA O DONO DO POST */}
              {/* ------------------------------------------ */}

              {isMeuPost && (
                <Alert
                  severity="info"
                  sx={{
                    borderRadius: 2,
                    fontWeight: 700,
                  }}
                >
                  Este recado foi publicado por
                  você. Aqui você poderá
                  administrar, editar ou suspender
                  esta publicação.
                </Alert>
              )}

              {/* ------------------------------------------ */}
              {/* 5. INTERESSE                            */}
              {/* SOMENTE OUTROS MORADORES                */}
              {/* ------------------------------------------ */}

              {!isMeuPost && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 3,

                    bgcolor: jaInteressado
                      ? "#f0fdf4"
                      : "#f5f8ff",

                    border: `1px solid ${jaInteressado
                      ? "#bbf7d0"
                      : "#dbeafe"
                      }`,
                  }}
                >
                  {jaInteressado ? (
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      justifyContent="center"
                    >
                      <CheckIcon color="success" />

                      <Typography
                        fontWeight={800}
                        color="success.main"
                      >
                        Interesse enviado ao
                        vizinho!
                      </Typography>
                    </Stack>
                  ) : (
                    <Stack spacing={1.5}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={900}
                        color="#1e40af"
                      >
                        {post.categoria ===
                          "doacao"
                          ? "🙋‍♂️ Você quer este item?"
                          : "🤝 Tem interesse?"}
                      </Typography>

                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Opcional: Deixe um recado..."
                        value={mensagem}
                        onChange={(e) =>
                          setMensagem(
                            e.target.value
                          )
                        }
                        sx={{
                          bgcolor: "white",
                        }}
                      />

                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={
                          <SendIcon />
                        }
                        onClick={
                          handleEnviarInteresse
                        }
                        disabled={
                          enviandoInteresse
                        }
                        sx={{
                          borderRadius: 2,
                          fontWeight: 900,
                          textTransform: "none",
                          boxShadow: "none",
                        }}
                      >
                        {enviandoInteresse
                          ? "Enviando..."
                          : "Sinalizar Interesse"}
                      </Button>
                    </Stack>
                  )}
                </Box>
              )}

              {/* ------------------------------------------ */}
              {/* 6. GALERIA DE FOTOS */}
              {/* ------------------------------------------ */}

              {post.midias &&
                post.midias.length > 0 && (
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      overflowX: "auto",
                      pb: 1,
                    }}
                  >
                    {post.midias.map(
                      (
                        img: any,
                        idx: number
                      ) => (
                        <Box
                          key={idx}
                          onClick={() =>
                            setImgZoom(
                              getFullUrl(
                                img.url
                              )
                            )
                          }
                          sx={{
                            position:
                              "relative",
                            width: 140,
                            height: 140,
                            borderRadius: 2,
                            flexShrink: 0,
                            cursor: "pointer",
                            overflow: "hidden",

                            "&:hover .z-icon":
                            {
                              opacity: 1,
                            },
                          }}
                        >
                          <Box
                            component="img"
                            src={getFullUrl(
                              img.url
                            )}
                            sx={{
                              width: "100%",
                              height: "100%",
                              objectFit:
                                "cover",
                            }}
                          />

                          <Box
                            className="z-icon"
                            sx={{
                              position:
                                "absolute",
                              inset: 0,
                              bgcolor:
                                "rgba(0,0,0,0.2)",
                              display: "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              opacity: 0,
                              transition:
                                "0.2s",
                            }}
                          >
                            <ZoomInIcon
                              sx={{
                                color:
                                  "white",
                              }}
                            />
                          </Box>
                        </Box>
                      )
                    )}
                  </Box>
                )}

              {/* ------------------------------------------ */}
              {/* 7. WHATSAPP                              */}
              {/* SOMENTE OUTROS MORADORES                */}
              {/* ------------------------------------------ */}

              {!isMeuPost &&
                post.autor?.telefone && (
                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    startIcon={<WhatsApp />}
                    sx={{
                      borderRadius: 2,
                      fontWeight: 900,
                      py: 1.2,
                    }}
                    onClick={() => {
                      const tel = onlyDigits(
                        post.autor.telefone
                      );

                      window.open(
                        `https://wa.me/${tel.startsWith(
                          "55"
                        )
                          ? tel
                          : "55" + tel
                        }`,
                        "_blank"
                      );
                    }}
                  >
                    Chamar no WhatsApp
                  </Button>
                )}
            </Stack>
          ) : (
            <Alert severity="error">
              Post não encontrado.
            </Alert>
          )}
        </DialogContent>

        {/* ------------------------------------------------ */}
        {/* AÇÕES DO RODAPÉ */}
        {/* ------------------------------------------------ */}

        <DialogActions
          sx={{
            px: 2,
            py: 1.5,
            gap: 1,
          }}
        >
          <Button
            onClick={onClose}
            disabled={marcandoVisto}
          >
            Fechar
          </Button>

          {/* Outros moradores podem marcar como visto */}

          {!isMeuPost && post && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<CheckIcon />}
              onClick={
                handleMarcarComoVisto
              }
              disabled={marcandoVisto}
              sx={{
                fontWeight: 800,
                textTransform: "none",
              }}
            >
              {marcandoVisto
                ? "Marcando..."
                : "Marcar como visto"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* -------------------------------------------------- */}
      {/* LIGHTBOX / ZOOM DA IMAGEM */}
      {/* -------------------------------------------------- */}

      <Dialog
        open={!!imgZoom}
        onClose={() =>
          setImgZoom(null)
        }
        maxWidth="lg"
      >
        <Box
          sx={{
            position: "relative",
            bgcolor: "black",
            display: "flex",
            alignItems: "center",
          }}
        >
          <IconButton
            onClick={() =>
              setImgZoom(null)
            }
            sx={{
              position: "absolute",
              top: 10,
              right: 10,
              color: "white",
              zIndex: 10,
            }}
          >
            <CloseIcon />
          </IconButton>

          <Box
            component="img"
            src={imgZoom || ""}
            sx={{
              maxWidth: "100%",
              maxHeight: "90vh",
              objectFit: "contain",
            }}
          />
        </Box>
      </Dialog>
    </>
  );
}