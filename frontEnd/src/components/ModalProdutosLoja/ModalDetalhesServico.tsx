import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";

export interface ServicoDetalhes {
  id: string;
  storeId?: string;
  tipo?: "SERVICO" | "PACOTE" | "PROMOCAO" | string;
  nome?: string;
  descricao?: string | null;
  preco?: number | string | null;
  precoPromocional?: number | string | null;
  precoVigente?: number | string | null;
  promocaoAtiva?: boolean;
  duracaoMinutos?: number | null;
  totalSessoes?: number | null;
  modalidade?: string | null;
  schedulingPolicy?: string | null;
  maxSessionsPerWeek?: number | null;
  allowStandalonePurchase?: boolean;
  destaque?: boolean;
  metadata?: Record<string, unknown> | null;
  categoriaId?: string | number | null;
  [key: string]: unknown;
}

type ModalDetalhesServicoProps = {
  open: boolean;
  servico: ServicoDetalhes | null;
  onClose: () => void;
  onSolicitar?: (servico: ServicoDetalhes) => void;
  onFalarNoChat?: (servico: ServicoDetalhes) => void;
};

function parseMoney(value: number | string | null | undefined): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const raw = String(value ?? "")
    .replace(/R\$/gi, "")
    .replace(/\s/g, "")
    .trim();

  if (!raw) return 0;

  const normalized = raw.includes(",")
    ? raw.replace(/\./g, "").replace(",", ".")
    : raw;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: number | string | null | undefined): string {
  return parseMoney(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function resolveTypeLabel(servico: ServicoDetalhes): string {
  const tipo = String(servico.tipo || "SERVICO").toUpperCase();

  if (tipo === "PACOTE") return "Pacote";
  if (tipo === "PROMOCAO") return "Promoção";
  return "Serviço";
}

function resolveModalityLabel(value?: string | null): string {
  const modalidade = String(value || "").toUpperCase();

  if (!modalidade || modalidade === "NAO_APLICA") return "";
  if (modalidade === "AMBOS") return "Presencial ou online";
  if (modalidade === "PRESENCIAL") return "Presencial";
  if (modalidade === "ONLINE") return "Online";

  return value || "";
}

function resolveActionLabel(servico: ServicoDetalhes): string {
  const tipo = String(servico.tipo || "SERVICO").toUpperCase();

  if (tipo === "PACOTE") return "Contratar pacote";

  if (
    servico.schedulingPolicy &&
    String(servico.schedulingPolicy).toUpperCase() !== "NO_SCHEDULING"
  ) {
    return "Agendar serviço";
  }

  return "Solicitar serviço";
}

export default function ModalDetalhesServico({
  open,
  servico,
  onClose,
  onSolicitar,
  onFalarNoChat,
}: ModalDetalhesServicoProps) {
  if (!servico) return null;

  const nome = String(servico.nome || "Serviço");
  const descricao = String(servico.descricao || "").trim();
  const tipoLabel = resolveTypeLabel(servico);
  const modalidade = resolveModalityLabel(servico.modalidade);
  const duracao = Number(servico.duracaoMinutos || 0);
  const sessoes = Number(servico.totalSessoes || 0);
  const precoAtual =
    servico.precoVigente ??
    (servico.promocaoAtiva && servico.precoPromocional != null
      ? servico.precoPromocional
      : servico.preco) ??
    0;

  const precoOriginal = parseMoney(servico.preco);
  const precoVigente = parseMoney(precoAtual);
  const mostrarPrecoOriginal =
    Boolean(servico.promocaoAtiva) &&
    precoOriginal > 0 &&
    precoVigente > 0 &&
    precoOriginal > precoVigente;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 3 },
          m: { xs: 0, sm: 2 },
          minHeight: { xs: "100dvh", sm: "auto" },
        },
      }}
    >
      <DialogTitle sx={{ pr: 7, pb: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Chip label={tipoLabel} size="small" />
          {servico.destaque ? <Chip label="Destaque" size="small" /> : null}
        </Stack>

        <Typography
          component="h2"
          sx={{ mt: 1.5, fontSize: { xs: 24, sm: 28 }, fontWeight: 800 }}
        >
          {nome}
        </Typography>

        <IconButton
          aria-label="Fechar"
          onClick={onClose}
          sx={{ position: "absolute", right: 12, top: 12 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {descricao ? (
          <Typography
            sx={{
              color: "text.secondary",
              lineHeight: 1.7,
              whiteSpace: "pre-line",
              mb: 2.5,
            }}
          >
            {descricao}
          </Typography>
        ) : null}

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2.5 }}>
          {duracao > 0 ? (
            <Chip
              icon={<AccessTimeIcon />}
              label={`${duracao} min`}
              variant="outlined"
            />
          ) : null}

          {sessoes > 1 ? (
            <Chip
              icon={<EventAvailableIcon />}
              label={`${sessoes} sessões`}
              variant="outlined"
            />
          ) : null}

          {modalidade ? <Chip label={modalidade} variant="outlined" /> : null}
        </Stack>

        <Divider sx={{ mb: 2.5 }} />

        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <PaymentsOutlinedIcon fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              Valor
            </Typography>
          </Stack>

          {mostrarPrecoOriginal ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textDecoration: "line-through" }}
            >
              {formatMoney(servico.preco)}
            </Typography>
          ) : null}

          <Typography sx={{ fontSize: 30, fontWeight: 900, lineHeight: 1.2 }}>
            {formatMoney(precoAtual)}
          </Typography>

          {sessoes > 1 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Pacote com {sessoes} sessões
            </Typography>
          ) : null}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pb: 3,
          pt: 1,
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: onFalarNoChat ? "1fr 1fr" : "1fr",
          },
          gap: 1.25,
        }}
      >
        {onFalarNoChat ? (
          <Button
            variant="outlined"
            size="large"
            startIcon={<ForumOutlinedIcon />}
            onClick={() => onFalarNoChat(servico)}
            sx={{ borderRadius: 999, minHeight: 48 }}
          >
            Falar no chat
          </Button>
        ) : null}

        {onSolicitar ? (
          <Button
            variant="contained"
            size="large"
            onClick={() => onSolicitar(servico)}
            sx={{ borderRadius: 999, minHeight: 48 }}
          >
            {resolveActionLabel(servico)}
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}
