import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import api from "../../../api/api";
import toast from "react-hot-toast";

type KnowledgeTipo =
  | "GERAL"
  | "SOBRE"
  | "ENTREGA"
  | "PAGAMENTO"
  | "CARDAPIO"
  | "PROMOCAO"
  | "NORMA"
  | "FAQ"
  | "ATENDIMENTO";

type KnowledgeItem = {
  id: string;
  store_id: string;
  titulo: string;
  tipo: KnowledgeTipo;
  conteudo: string;
  ativo: number;
  createdAt?: string;
  updatedAt?: string;
};

type Props = {
  storeId: string;
};

const tipos: Array<{ value: KnowledgeTipo; label: string }> = [
  { value: "SOBRE", label: "Sobre a empresa" },
  { value: "ENTREGA", label: "Entrega / Retirada" },
  { value: "PAGAMENTO", label: "Pagamento" },
  { value: "CARDAPIO", label: "Cardápio / Serviços" },
  { value: "PROMOCAO", label: "Promoções / Pacotes" },
  { value: "NORMA", label: "Normas / Regras" },
  { value: "FAQ", label: "Perguntas frequentes" },
  { value: "ATENDIMENTO", label: "Atendimento" },
  { value: "GERAL", label: "Geral" },
];

const modelosPorTipo: Record<KnowledgeTipo, string> = {
  SOBRE:
    "Conte um resumo da empresa, diferenciais, experiência, especialidade e público atendido.",
  ENTREGA:
    "Explique áreas atendidas, prazo médio, taxa de entrega, retirada, horários e regras importantes.",
  PAGAMENTO:
    "Informe formas de pagamento aceitas, Pix, cartão, dinheiro, sinal, pagamento antecipado ou na entrega.",
  CARDAPIO:
    "Liste produtos, serviços, cardápio, pacotes, valores aproximados e observações importantes.",
  PROMOCAO:
    "Descreva promoções ativas, combos, descontos, validade e condições.",
  NORMA:
    "Informe regras da empresa, cancelamento, garantia, troca, devolução, reagendamento e responsabilidades.",
  FAQ:
    "Cadastre perguntas e respostas comuns dos clientes.",
  ATENDIMENTO:
    "Explique como o bot deve atender: tom de voz, perguntas que deve fazer e quando encaminhar para solicitação.",
  GERAL:
    "Adicione qualquer informação importante para o chatbot responder melhor.",
};

export default function StoreChatbotKnowledgeManager({ storeId }: Props) {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<{
    titulo: string;
    tipo: KnowledgeTipo;
    conteudo: string;
  }>({
    titulo: "",
    tipo: "SOBRE",
    conteudo: "",
  });

  const currentPlaceholder = useMemo(
    () => modelosPorTipo[form.tipo],
    [form.tipo],
  );

  async function loadItems() {
    if (!storeId) return;

    try {
      setLoading(true);

      const response = await api.get(
        `/stores/${storeId}/chatbot-knowledge`,
      );

      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          "Erro ao carregar conhecimentos do chatbot.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, [storeId]);

  function resetForm() {
    setEditingId(null);
    setForm({
      titulo: "",
      tipo: "SOBRE",
      conteudo: "",
    });
  }

  function startEdit(item: KnowledgeItem) {
    setEditingId(item.id);
    setForm({
      titulo: item.titulo,
      tipo: item.tipo,
      conteudo: item.conteudo,
    });
  }

  async function handleSave() {
    if (!storeId) {
      toast.error("Loja não identificada.");
      return;
    }

    if (!form.titulo.trim()) {
      toast.error("Informe um título.");
      return;
    }

    if (!form.conteudo.trim()) {
      toast.error("Informe o conteúdo.");
      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        await api.put(`/stores/chatbot-knowledge/${editingId}`, {
          titulo: form.titulo,
          tipo: form.tipo,
          conteudo: form.conteudo,
          ativo: 1,
        });

        toast.success("Conteúdo atualizado.");
      } else {
        await api.post("/stores/chatbot-knowledge", {
          store_id: storeId,
          titulo: form.titulo,
          tipo: form.tipo,
          conteudo: form.conteudo,
        });

        toast.success("Conteúdo criado.");
      }

      resetForm();
      await loadItems();
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          "Erro ao salvar conteúdo do chatbot.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const confirm = window.confirm(
      "Deseja remover este conteúdo do chatbot?",
    );

    if (!confirm) return;

    try {
      await api.delete(`/stores/chatbot-knowledge/${id}`);
      toast.success("Conteúdo removido.");
      await loadItems();
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          "Erro ao remover conteúdo.",
      );
    }
  }

  async function toggleAtivo(item: KnowledgeItem) {
    try {
      await api.put(`/stores/chatbot-knowledge/${item.id}`, {
        ativo: item.ativo ? 0 : 1,
      });

      await loadItems();
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao alterar status.");
    }
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={900}>
          Atendente IA da Loja
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Cadastre as informações que o chatbot deve usar para responder
          clientes desta loja. Ele usará somente estes dados junto com os
          produtos/serviços cadastrados.
        </Typography>
      </Stack>

      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            {editingId ? <EditIcon /> : <AddIcon />}
            <Typography fontWeight={900}>
              {editingId ? "Editar informação" : "Nova informação"}
            </Typography>
          </Stack>

          <Stack spacing={2}>
            <TextField
              label="Título"
              value={form.titulo}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  titulo: event.target.value,
                }))
              }
              placeholder="Ex: Formas de pagamento"
              fullWidth
            />

            <TextField
              select
              label="Tipo"
              value={form.tipo}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  tipo: event.target.value as KnowledgeTipo,
                }))
              }
              fullWidth
            >
              {tipos.map((tipo) => (
                <MenuItem key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Conteúdo para o chatbot"
              value={form.conteudo}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  conteudo: event.target.value,
                }))
              }
              placeholder={currentPlaceholder}
              minRows={6}
              multiline
              fullWidth
            />

            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                startIcon={
                  saving ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <SaveIcon />
                  )
                }
                onClick={handleSave}
                disabled={saving}
              >
                {editingId ? "Salvar alterações" : "Adicionar"}
              </Button>

              {editingId && (
                <Button variant="outlined" onClick={resetForm}>
                  Cancelar edição
                </Button>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>
        Informações cadastradas
      </Typography>

      {loading ? (
        <Box sx={{ py: 4, textAlign: "center" }}>
          <CircularProgress />
        </Box>
      ) : items.length === 0 ? (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography color="text.secondary">
              Nenhuma informação cadastrada ainda.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {items.map((item) => (
            <Card
              key={item.id}
              sx={{
                borderRadius: 3,
                opacity: item.ativo ? 1 : 0.55,
              }}
            >
              <CardContent>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  alignItems={{ xs: "flex-start", md: "center" }}
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography fontWeight={900}>
                        {item.titulo}
                      </Typography>

                      <Chip
                        label={item.tipo}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />

                      <Chip
                        label={item.ativo ? "Ativo" : "Inativo"}
                        size="small"
                        color={item.ativo ? "success" : "default"}
                        onClick={() => toggleAtivo(item)}
                        sx={{ cursor: "pointer" }}
                      />
                    </Stack>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mt: 1,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {item.conteudo}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1}>
                    <IconButton onClick={() => startEdit(item)}>
                      <EditIcon />
                    </IconButton>

                    <IconButton
                      color="error"
                      onClick={() => handleDelete(item.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                </Stack>

                <Divider sx={{ mt: 2 }} />
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}