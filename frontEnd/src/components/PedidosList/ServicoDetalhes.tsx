import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container, Box, Typography, Paper, Stack, Button,
  Chip, LinearProgress, Divider, IconButton, Card, CardContent,
  Grid, Stepper, Step, StepLabel
} from "@mui/material";
import {
  ArrowBack, CalendarMonth
} from "@mui/icons-material";
import api from "../../api/api";
import toast from "react-hot-toast";
import { MessageCircle, Wrench } from "lucide-react";

export default function ServicoDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [servico, setServico] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/servicos/solicitacoes/detalhes-completos/${id}`);
      const s = res.data;

      console.log("========== SERVICO DETALHES ==========");
      console.log("SERVICO COMPLETO:", s);
      console.log("servico.id:", s?.id);
      console.log("ofertaId:", s?.ofertaId);
      console.log("oferta_id:", s?.oferta_id);
      console.log("oferta:", s?.oferta);

      if (!s) {
        toast.error("Serviço não encontrado");
        return;
      }

      const normalizarStatus = (value: any) =>
        String(value || "").trim().toUpperCase();

      // A agenda oficial é a mesma usada pelo MoradorDashboard.
      // Isso funciona também quando o negócio é um lojista que atua como PRESTADOR:
      // a decisão aqui é pelo fluxo da solicitação/oferta, não pelo tipo cadastral do negócio.
      let agendaRaw: any[] = [];

      try {
        const agendaRes = await api.get("/servicos/agenda/meus");
        const agendaTodos = Array.isArray(agendaRes.data?.items)
          ? agendaRes.data.items
          : Array.isArray(agendaRes.data)
            ? agendaRes.data
            : [];

        const ofertaId = String(
          s.ofertaId ||
          s.oferta_id ||
          s.oferta?.id ||
          s.candidatura?.ofertaId ||
          s.pagamento?.ofertaId ||
          ""
        );

        agendaRaw = agendaTodos.filter((item: any) => {
          const agendaOfertaId = String(
            item.ofertaId ||
            item.oferta_id ||
            item.oferta?.id ||
            ""
          );

          return !!ofertaId && agendaOfertaId === ofertaId;
        });
      } catch (agendaError) {
        console.warn("[ServicoDetalhes] Não foi possível carregar a agenda oficial:", agendaError);

        // Compatibilidade com registros antigos.
        try {
          const metadata =
            typeof s.metadata === "string"
              ? JSON.parse(s.metadata)
              : s.metadata;

          agendaRaw = Array.isArray(metadata?.agenda)
            ? metadata.agenda
            : [];
        } catch {
          agendaRaw = [];
        }
      }

      const calcularProgresso = () => {
        const statuses = [s.statusReal, s.solicitacao_status, s.oferta_status, s.status].map(normalizarStatus);
        const backend = Number(s.progresso || 0);

        if (statuses.some((st: string) => ["FINALIZADO", "CONCLUIDO", "CONCLUIDA"].includes(st)) || backend >= 100) return 100;
        if (agendaRaw.some((a: any) => ["CONCLUIDO", "CONCLUIDA"].includes(normalizarStatus(a?.status)))) return 90;
        if (statuses.includes("EM_ANDAMENTO") || statuses.includes("EM_EXECUCAO")) return 75;
        if (agendaRaw.some((a: any) => ["AGENDADO", "CONFIRMADO", "LIBERADO_CLIENTE", "FILA_ASSINATURA"].includes(normalizarStatus(a?.status)))) return 60;
        if (statuses.includes("PAGO") || statuses.includes("PARCIALMENTE_PAGO") || statuses.includes("AGUARDANDO_PAGAMENTO")) return 40;
        if (statuses.includes("FECHADO") || statuses.includes("ACEITA")) return 20;
        return Math.max(0, Math.min(100, backend));
      };

      const progressoCalculado = calcularProgresso();

      const dadosFormatados = {
        ...s,
        progresso: progressoCalculado,
        valor: s.valor_final || 0,
        prestador: { name: s.prestador_name || "Aguardando" },
        pagamento: { codigo_verificacao: s.codigo_verificacao || "----" },
        agenda: agendaRaw
      };

      setServico(dadosFormatados);
    } catch (err: any) {
      console.error("ERRO AO CARREGAR:", err);
      toast.error("Erro ao carregar detalhes do serviço");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadDetails();
    }
  }, [id]);

  if (loading) return <LinearProgress sx={{ mt: 5 }} />;
  if (!servico) return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography>Serviço não encontrado ou removido.</Typography>
      <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>Voltar</Button>
    </Box>
  );

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* CABEÇALHO */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: '#fff', border: '1px solid #ddd' }}>
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h5" fontWeight={900}>{servico.titulo}</Typography>
          <Typography variant="body2" color="text.secondary">Protocolo: #{servico.id?.substring(0, 8)}</Typography>
        </Box>
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3, borderRadius: 4, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Evolução do Serviço</Typography>
            <Box sx={{ my: 3 }}>
              <Stack direction="row" justifyContent="space-between" mb={1}>
                <Typography variant="body2" fontWeight="bold">{servico.progresso}% concluído</Typography>
                <Chip
                  label={servico.statusReal || servico.oferta_status || servico.solicitacao_status || 'STATUS'}
                  color={servico.progresso === 100 ? "success" : "primary"}
                  size="small"
                  sx={{ fontWeight: 'bold' }}
                />
              </Stack>
              <LinearProgress
                variant="determinate"
                value={servico.progresso || 0}
                sx={{
                  height: 12,
                  borderRadius: 6,
                  bgcolor: '#f1f5f9',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: servico.progresso === 100 ? '#22c55e' : '#2563eb'
                  }
                }}
              />

              <Stepper
                activeStep={
                  servico.progresso >= 100 ? 5 :
                    servico.progresso >= 75 ? 3 :
                      servico.progresso >= 60 ? 2 :
                        servico.progresso >= 40 ? 1 : 0
                }
                alternativeLabel
                sx={{
                  mt: 3,
                  "& .MuiStepLabel-label": { fontSize: { xs: "0.62rem", sm: "0.72rem" }, fontWeight: 700 },
                  "& .MuiStepIcon-root.Mui-completed": { color: "#22c55e" },
                  "& .MuiStepIcon-root.Mui-active": { color: "#2563eb" }
                }}
              >
                {["Contratado", "Pagamento", "Agendado", "Execução", "Finalizado"].map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              <CalendarMonth sx={{ verticalAlign: 'middle', mr: 1 }} /> Agenda de Encontros
            </Typography>

            <Stack spacing={2} sx={{ mt: 2 }}>
              {servico.agenda.length > 0 ? (
                servico.agenda.map((item: any, index: number) => (
                  <Card key={index} variant="outlined" sx={{ borderRadius: 3, borderLeft: '5px solid #2563eb' }}>
                    <CardContent sx={{ py: '12px !important' }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography fontWeight="bold" variant="body2">
                            {item.titulo || item.descricao || `Sessão ${index + 1}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.data
                              ? new Date(`${String(item.data).substring(0, 10)}T00:00:00`).toLocaleDateString("pt-BR")
                              : "Data não informada"}
                            {item.hora ? ` às ${item.hora}` : ""}
                          </Typography>
                        </Box>
                        <Chip
                          label={String(item.status || "AGENDADO").replaceAll("_", " ")}
                          size="small"
                          color={["CONCLUIDO", "CONCLUIDA"].includes(String(item.status || "").toUpperCase()) ? "success" : "default"}
                        />
                      </Stack>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">Nenhum agendamento registrado.</Typography>
              )}
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, borderRadius: 4, bgcolor: '#f8fafc', mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>PRESTADOR</Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ width: 40, height: 40, bgcolor: '#9c27b0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Wrench size={20} />
              </Box>
              <Box>
                <Typography fontWeight="bold">{servico.prestador.name}</Typography>
                <Button size="small" startIcon={<MessageCircle size={14} />} sx={{ textTransform: 'none', p: 0 }}>Chat</Button>
              </Box>
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="text.secondary">VALOR</Typography>
            <Typography variant="h5" fontWeight="900" color="primary">
              R$ {Number(servico.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Typography>
          </Paper>


        </Grid>
      </Grid>
    </Container>
  );
}