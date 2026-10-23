import { useState, useEffect, useMemo, useRef } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  IconButton,
  Fade,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import api from "../../api/api";
import DynamicServiceForm from "../DynamicServiceForm";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const style = {
  position: "absolute" as const,
  left: "50%",
  top: { xs: 12, sm: "50%" },
  transform: { xs: "translateX(-50%)", sm: "translate(-50%, -50%)" },
  width: { xs: "calc(100% - 24px)", sm: 550 },
  bgcolor: "background.paper",
  borderRadius: { xs: 3, sm: 4 },
  boxShadow: 24,
  p: 0,
  overflow: "hidden",
  outline: "none",

  // No mobile, reserva espaço para a navegação inferior do app.
  maxHeight: {
    xs: "calc(100dvh - 12px - 82px - env(safe-area-inset-bottom))",
    sm: "85vh",
  },

  display: "flex",
  flexDirection: "column",
};

const gerarSlug = (texto?: string) => {
  if (!texto) return "";

  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");
};

type DadosIniciais = {
  titulo?: string;
  descricao?: string;
  storeId?: string | number;
  lojaId?: string | number;
  prestadorId?: string | number;
  origem?: string;
  chatbotTipo?: string;
  produtoId?: string | number;
  productId?: string | number;
  categoriaNome?: string;
  categoriaSlug?: string;
  opportunityId?: string;
  opportunityToken?: string;
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;

  usuarioId?: string | number;
  condominio_id: string | number;

  todasCategorias?: any[];
  tipoFiltro?: string;

  prestadorNome?: string;
  tituloInicial?: string;
  descricaoInicial?: string;

  prestadorId?: string | number;
  lojaId?: string | number;
  prestadorFoto?: string;

  modo?: "contextual" | "generico";
  categoriaIdInicial?: string | number;

  dadosIniciais?: DadosIniciais;
}

export const ModalNovaSolicitacao = ({
  open,
  onClose,
  onSuccess,
  usuarioId,
  condominio_id,
  todasCategorias = [],
  tipoFiltro,
  prestadorNome,
  tituloInicial,
  descricaoInicial,
  prestadorId,
  lojaId,
  prestadorFoto,
  modo = "generico",
  categoriaIdInicial,
  dadosIniciais,
}: Props) => {
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    categoriaId: "",
  });

  const [extraFields, setExtraFields] = useState<Record<string, any>>({});
  const hasFetched = useRef(false);

  const categoriaTravada = Boolean(categoriaIdInicial);

  const tituloResolvido =
    tituloInicial ||
    dadosIniciais?.titulo ||
    (prestadorNome ? `Solicitação para ${prestadorNome}` : "");

  const descricaoResolvida =
    descricaoInicial ||
    dadosIniciais?.descricao ||
    "";

  const prestadorIdResolvido =
    prestadorId ||
    dadosIniciais?.prestadorId ||
    null;

  const lojaIdResolvido =
    lojaId ||
    dadosIniciais?.lojaId ||
    dadosIniciais?.storeId ||
    null;

  useEffect(() => {
    if (!open) return;

    setFormData({
      titulo: tituloResolvido || "",
      descricao: descricaoResolvida || "",
      categoriaId: categoriaIdInicial ? String(categoriaIdInicial) : "",
    });

    setExtraFields({
      origem: dadosIniciais?.origem || "LANDING_PAGE",
      chatbotTipo: dadosIniciais?.chatbotTipo,
      lojaId: lojaIdResolvido,
      prestadorId: prestadorIdResolvido,
      produtoId: dadosIniciais?.produtoId || dadosIniciais?.productId,
    });
  }, [
    open,
    tituloResolvido,
    descricaoResolvida,
    categoriaIdInicial,
    dadosIniciais?.origem,
    dadosIniciais?.chatbotTipo,
    dadosIniciais?.produtoId,
    dadosIniciais?.productId,
    lojaIdResolvido,
    prestadorIdResolvido,
    dadosIniciais?.opportunityId,
    dadosIniciais?.opportunityToken,
  ]);

  useEffect(() => {
    if (!open) return;

    const carregar = async () => {
      if (hasFetched.current) return;

      try {
        let dados = todasCategorias;

        if (!dados || dados.length === 0) {
          const res = await api.get("/tipos-combo");
          dados = res.data || [];
        }

        let filtrados = dados.filter((cat: any) => {
          if (!tipoFiltro) {
            const tipo = String(cat.tipo || "").toLowerCase();
            return tipo.includes("servico") || cat.is_servico === true;
          }

          return String(cat.tipo || "").toLowerCase() === tipoFiltro.toLowerCase();
        });

        if (categoriaIdInicial) {
          const categoriaExiste = filtrados.some(
            (cat: any) => String(cat.id) === String(categoriaIdInicial),
          );

          if (!categoriaExiste) {
            const categoriaOriginal = dados.find(
              (cat: any) => String(cat.id) === String(categoriaIdInicial),
            );

            if (categoriaOriginal) {
              filtrados = [categoriaOriginal, ...filtrados];
            } else {
              filtrados = [
                {
                  id: categoriaIdInicial,
                  nome: dadosIniciais?.categoriaNome || prestadorNome || "Serviço selecionado",
                  name: dadosIniciais?.categoriaNome || prestadorNome || "Serviço selecionado",
                  slug: dadosIniciais?.categoriaSlug || gerarSlug(dadosIniciais?.categoriaNome || prestadorNome),
                  tipo: "servico",
                  is_servico: true,
                },
                ...filtrados,
              ];
            }
          }
        }

        setCategorias(filtrados);
        hasFetched.current = true;
      } catch (err) {
        console.error("Erro ao buscar categorias:", err);
        toast.error("Erro ao carregar categorias.");
      }
    };

    carregar();
  }, [
    open,
    todasCategorias,
    tipoFiltro,
    categoriaIdInicial,
    dadosIniciais?.categoriaNome,
    dadosIniciais?.categoriaSlug,
    prestadorNome,
  ]);

  useEffect(() => {
    if (!open) {
      setFormData({
        titulo: "",
        descricao: "",
        categoriaId: "",
      });
      setExtraFields({});
      hasFetched.current = false;
    }
  }, [open]);

  const categoriaSelecionada = useMemo(() => {
    return categorias.find(
      (c) => String(c.id) === String(formData.categoriaId),
    );
  }, [formData.categoriaId, categorias]);

  const slug = useMemo(() => {
    if (!categoriaSelecionada) return "";

    return (
      categoriaSelecionada.slug ||
      gerarSlug(categoriaSelecionada.nome || categoriaSelecionada.name)
    );
  }, [categoriaSelecionada]);

  const handleExtraChange = (name: string, value: any) => {
    setExtraFields((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.categoriaId || !formData.titulo.trim()) {
      toast.error("Preencha o título e a categoria.");
      return;
    }

    const payloadBase = {
      titulo: formData.titulo.trim(),
      descricao: formData.descricao || "",
      categoriaId: Number(formData.categoriaId),
      prestadorId: prestadorIdResolvido,
      prestador_id_exclusivo: prestadorIdResolvido,
      lojaId: lojaIdResolvido,
      condominio_id: condominio_id || null,
      metadata: {
        ...extraFields,
        origem: dadosIniciais?.origem || extraFields.origem || "LANDING_PAGE",
        chatbotTipo: dadosIniciais?.chatbotTipo || extraFields.chatbotTipo,
        storeId: dadosIniciais?.storeId,
        lojaId: lojaIdResolvido,
        prestadorId: prestadorIdResolvido,
        opportunityId: dadosIniciais?.opportunityId,
        opportunityToken: dadosIniciais?.opportunityToken,
        produtoId: dadosIniciais?.produtoId || dadosIniciais?.productId,
        categoriaNome: categoriaSelecionada?.nome || categoriaSelecionada?.name,
      },
    };

    if (!usuarioId) {
      sessionStorage.setItem(
        "pending_service",
        JSON.stringify({
          ...payloadBase,
          extraFields,
        }),
      );

      navigate("/checkout", {
        state: {
          serviceInfo: {
            titulo: payloadBase.titulo,
            descricao: payloadBase.descricao,
            prestadorId: prestadorIdResolvido,
            lojaId: lojaIdResolvido,
            categoriaNome:
              categoriaSelecionada?.nome || categoriaSelecionada?.name,
            categoriaId: formData.categoriaId,
            origem: dadosIniciais?.origem || "CHATBOT_LANDING",
          },
        },
      });

      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...payloadBase,
        usuarioId: String(usuarioId),
      };

      console.log("ENVIANDO PAYLOAD SOLICITAÇÃO:", payload);

      const response = await api.post("/servicos/solicitacoes", payload);

      console.log("RESPOSTA SOLICITAÇÃO:", response.data);

      toast.success("Solicitação enviada com sucesso!");

      if (onSuccess) onSuccess();

      onClose();
    } catch (err: any) {
      const msgErro =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Erro interno no servidor";

      console.error("ERRO DETALHADO DO BACKEND:", err.response?.data);

      toast.error(`Erro ao salvar: ${msgErro}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      disableScrollLock
      onClose={(_event, reason) => {
        if (reason === "backdropClick" || reason === "escapeKeyDown") return;
        onClose();
      }}
    >
      <Fade in={open}>
        <Box sx={style}>
          <Box
            sx={{
              p: { xs: 1.5, sm: 2 },
              flexShrink: 0,
              bgcolor: "#1e293b",
              color: "white",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6" fontWeight="bold">
              {categoriaSelecionada
                ? `Solicitar ${
                    categoriaSelecionada.nome || categoriaSelecionada.name
                  }`
                : "O que você precisa?"}
            </Typography>

            <IconButton onClick={onClose} size="small" sx={{ color: "white" }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {modo === "contextual" && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                p: { xs: 1.5, sm: 2 },
                flexShrink: 0,
                borderBottom: "1px solid #e2e8f0",
                bgcolor: "#f8fafc",
              }}
            >
              <Box
                component="img"
                src={prestadorFoto || "https://via.placeholder.com/60"}
                alt="Prestador"
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Você está solicitando para:
                </Typography>

                <Typography variant="subtitle1" fontWeight="bold">
                  {prestadorNome || "Este negócio"}
                </Typography>

                {categoriaSelecionada && (
                  <Chip
                    size="small"
                    sx={{ mt: 0.75 }}
                    label={categoriaSelecionada.nome || categoriaSelecionada.name}
                  />
                )}
              </Box>
            </Box>
          )}

          <Box
            sx={{
              p: { xs: 2, sm: 3 },
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              overscrollBehavior: "contain",
              WebkitOverflowScrolling: "touch",
              pb: {
                xs: "calc(18px + env(safe-area-inset-bottom))",
                sm: 3,
              },
            }}
          >
            <Stack spacing={{ xs: 2, sm: 3 }}>
              {categoriaTravada && categoriaSelecionada ? (
                <Box
                  sx={{
                    p: 2,
                    border: "1px solid #e2e8f0",
                    borderRadius: 2,
                    bgcolor: "#f8fafc",
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Serviço selecionado
                  </Typography>

                  <Typography fontWeight={800}>
                    {categoriaSelecionada.nome || categoriaSelecionada.name}
                  </Typography>
                </Box>
              ) : (
                <FormControl fullWidth>
                  <InputLabel>Selecione o Serviço</InputLabel>
                  <Select
                    value={formData.categoriaId || ""}
                    label="Selecione o Serviço"
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        categoriaId: e.target.value as string,
                      }));

                      setExtraFields((prev) => ({
                        ...prev,
                        categoriaId: e.target.value,
                      }));
                    }}
                  >
                    {categorias.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.nome || cat.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {slug && (
                <DynamicServiceForm
                  slug={slug}
                  values={extraFields}
                  onChange={handleExtraChange}
                />
              )}

              <TextField
                label="Resumo"
                fullWidth
                value={formData.titulo}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    titulo: e.target.value,
                  }))
                }
              />

              <TextField
                label="Mais detalhes"
                multiline
                rows={3}
                fullWidth
                value={formData.descricao}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    descricao: e.target.value,
                  }))
                }
              />

              <Button
                variant="contained"
                fullWidth
                size="large"
                disabled={loading || !formData.categoriaId || !formData.titulo}
                onClick={handleSubmit}
              >
                {loading ? "Enviando..." : "Confirmar Solicitação"}
              </Button>
            </Stack>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};