import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import api from "../../api/api";
import { API_URL } from "../../utils/config";
import { emitNaoVistosChanged } from "../../utils/naoVistosBus";
import { useAuth } from "../../context/AuthContext";

type HomeItem = {
  kind: "AVISO" | "POST";
  id: string;
  titulo: string;
  resumo: string;
  createdAt: string;
  visibilidade: "CONDOMINIO" | "REDE" | "ALVO";
  priorityScore: number;
  tipo?: string;
  categoria?: string;
  midiaUrl?: string | null;
};

export function HomeNaoVistosWidget(props: { limit?: number; onChanged?: () => void }) {
  const limit = props.limit ?? 8;

  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<HomeItem[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<HomeItem | null>(null);
  const [marking, setMarking] = useState(false);

  const resolveImg = (url?: string | null) => {
    if (!url) return "";
    return url.startsWith("http") ? url : `${API_URL}${url}`;
  };

  const modalLabel = useMemo(() => {
    if (!selected) return "";
    return selected.kind === "AVISO"
      ? selected.tipo ?? "AVISO"
      : selected.categoria ?? "POST";
  }, [selected]);

  const visLabel = (v: HomeItem["visibilidade"]) => {
    if (v === "REDE") return "Todos";
    if (v === "ALVO") return "Selecionados";
    return "Condomínio";
  };

  const load = async (signal?: AbortSignal) => {
    // ✅ se não tem user logado, não tenta carregar (evita 401/403 + spinner eterno)
    if (!user?.id) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.get("/home/nao-vistos", {
        params: { limit },
        signal,
        timeout: 15000,
      });

      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (err: any) {
      // cancelado? ignora
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
    // ✅ recarrega quando logar/deslogar ou mudar limit
  }, [user?.id, limit]);

  const handleOpen = (it: HomeItem) => {
    setSelected(it);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelected(null);
  };

  const marcarComoVisto = async () => {
    if (!selected) return;
    setMarking(true);
    try {
      if (selected.kind === "AVISO") {
        await api.post(`/avisos/${selected.id}/visto`);
      } else {
        await api.post(`/posts/${selected.id}/visto`);
      }

      setItems((prev) => prev.filter((x) => !(x.kind === selected.kind && x.id === selected.id)));

      handleClose();
      props.onChanged?.();
      emitNaoVistosChanged();
    } finally {
      setMarking(false);
    }
  };

  // ✅ Se não está logado, não mostra widget (e não trava)
  if (!user?.id) return null;

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (!items.length) return null;

  return (
    <Box sx={{ mb: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight={900}>
          Novidades
        </Typography>
        <Chip label={`${items.length} não vistos`} size="small" />
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
          gap: 2,
        }}
      >
        {items.map((it) => (
          <Card
            key={`${it.kind}-${it.id}`}
            variant="outlined"
            sx={{
              borderRadius: 4,
              cursor: "pointer",
              overflow: "hidden",
              "&:hover": { boxShadow: "0 6px 18px rgba(0,0,0,0.08)" },
            }}
            onClick={() => handleOpen(it)}
          >
            {it.kind === "POST" && it.midiaUrl ? (
              <Box
                sx={{
                  height: 140,
                  backgroundImage: `url(${resolveImg(it.midiaUrl)})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            ) : null}

            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    size="small"
                    label={it.kind === "AVISO" ? "Aviso" : "Post"}
                    color={it.kind === "AVISO" ? "primary" : "default"}
                  />
                  <Chip size="small" label={visLabel(it.visibilidade)} variant="outlined" />
                </Stack>

                {Number(it.priorityScore ?? 0) > 0 ? (
                  <Chip size="small" label="Destaque" color="warning" />
                ) : null}
              </Stack>

              <Typography fontWeight={900} noWrap>
                {it.titulo}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {it.resumo}
              </Typography>

              <Stack direction="row" spacing={1} alignItems="center" mt={1.5}>
                <Chip
                  size="small"
                  label={it.kind === "AVISO" ? it.tipo ?? "AVISO" : it.categoria ?? "POST"}
                />
                <Typography variant="caption" color="text.secondary">
                  {new Date(it.createdAt).toLocaleDateString()}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {selected?.titulo}
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1}>
              <Chip label={selected?.kind === "AVISO" ? "Aviso" : "Post"} />
              {selected?.visibilidade ? <Chip label={visLabel(selected.visibilidade)} variant="outlined" /> : null}
              {modalLabel ? <Chip label={modalLabel} variant="outlined" /> : null}
            </Stack>

            {selected?.kind === "POST" && selected?.midiaUrl ? (
              <Box
                sx={{
                  width: "100%",
                  height: 220,
                  borderRadius: 3,
                  backgroundImage: `url(${resolveImg(selected.midiaUrl)})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            ) : null}

            <Typography color="text.secondary">{selected?.resumo}</Typography>

            <Typography variant="caption" color="text.secondary">
              Publicado em: {selected ? new Date(selected.createdAt).toLocaleString() : ""}
            </Typography>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} disabled={marking}>
            Fechar
          </Button>
          <Button variant="contained" onClick={marcarComoVisto} disabled={marking}>
            {marking ? "Marcando..." : "Marcar como visto"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
