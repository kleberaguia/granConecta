import { useEffect, useState } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  IconButton,
  Fade,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import api from "../../api/api";
import toast from "react-hot-toast";

const style = {
  position: "absolute" as const,
  top: "12%",
  left: "50%",
  transform: "translateX(-50%)",
  width: { xs: "94%", sm: 520 },
  bgcolor: "background.paper",
  borderRadius: 4,
  boxShadow: 24,
  overflow: "hidden",
  outline: "none",
};

type Produto = {
  id?: string | number;
  nome?: string;
  name?: string;
  titulo?: string;
  preco?: number | string;
  price?: number | string;
  imagem_url?: string;
  image?: string;
};

interface Props {
  open: boolean;
  onClose: () => void;
  lojaId?: string | number;
  storeId?: string | number;
  produto?: Produto | null;
  origem?: string;
  onSuccess?: () => void;
}

export const ModalLojaInteresse = ({
  open,
  onClose,
  lojaId,
  storeId,
  produto,
  origem = "LANDING_PAGE",
  onSuccess,
}: Props) => {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    email: "",
    mensagem: "",
    aceitaMarketing: true,
  });

  useEffect(() => {
    if (!open) {
      setForm({
        nome: "",
        telefone: "",
        email: "",
        mensagem: "",
        aceitaMarketing: true,
      });
    }
  }, [open]);

  const produtoNome =
    produto?.nome || produto?.name || produto?.titulo || "produto selecionado";

  const handleSubmit = async () => {
    if (!form.nome.trim() || !form.telefone.trim()) {
      toast.error("Informe seu nome e telefone/WhatsApp.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        lojaId: lojaId || storeId || null,
        storeId: storeId || lojaId || null,
        produtoId: produto?.id || null,
        nome: form.nome.trim(),
        telefone: form.telefone.trim(),
        email: form.email.trim(),
        mensagem: form.mensagem.trim(),
        aceitaMarketing: form.aceitaMarketing,
        origem,
        tipo: "DESEJO",
        metadata: {
          produto,
        },
      };

      console.log('payload ', payload)

      // await api.post("/lojas/interesses", payload);
      await api.post("/lojas/lista-desejos", payload);

      toast.success("Interesse registrado com sucesso!");

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Erro ao registrar interesse:", err.response?.data || err);
      toast.error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Erro ao registrar interesse.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} disableScrollLock>
      <Fade in={open}>
        <Box sx={style}>
          <Box
            sx={{
              p: 2,
              bgcolor: "#7A4D42",
              color: "white",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight={800}>
                Registrar interesse
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {produtoNome}
              </Typography>
            </Box>

            <IconButton onClick={onClose} size="small" sx={{ color: "white" }}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{ p: 3 }}>
            <Stack spacing={2.2}>
              <TextField
                label="Seu nome"
                fullWidth
                value={form.nome}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, nome: e.target.value }))
                }
              />

              <TextField
                label="Telefone / WhatsApp"
                fullWidth
                value={form.telefone}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, telefone: e.target.value }))
                }
              />

              <TextField
                label="E-mail"
                type="email"
                fullWidth
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
              />

              <TextField
                label="Mensagem"
                multiline
                rows={3}
                fullWidth
                value={form.mensagem}
                placeholder="Tenho interesse nesse produto..."
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, mensagem: e.target.value }))
                }
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.aceitaMarketing}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        aceitaMarketing: e.target.checked,
                      }))
                    }
                  />
                }
                label="Aceito receber novidades, promoções e mensagens desta loja."
              />

              <Button
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                onClick={handleSubmit}
                sx={{
                  bgcolor: "#B98B73",
                  borderRadius: 999,
                  py: 1.4,
                  fontWeight: 800,
                  "&:hover": { bgcolor: "#7A4D42" },
                }}
              >
                {loading ? "Salvando..." : "Registrar interesse"}
              </Button>
            </Stack>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};