import { useEffect, useState } from "react";
import {
  Box, Card, CardContent, Typography, Button, Chip, Stack, Stepper, Step, StepLabel, LinearProgress, Paper, useTheme, alpha, Collapse, IconButton, Divider
} from "@mui/material";
import {
  ChevronDown, ChevronUp, ShoppingBag, ChevronRight, Clock, Copy
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import { socket } from "../Checkout/socket";

// ==========================================
// STATUS CORRIGIDOS CONFORME ENUM DO BACKEND (Order.ts)
// ==========================================
const statusStepsDelivery = [
  "pendente",
  "pago",
  "em_preparo",     // 🟢 Corrigido de 'preparando' para 'em_preparo'
  "em_transporte",  // 🟢 Corrigido de 'saiu_entrega' para 'em_transporte'
  "entregue"
];

const statusStepsService = ["CONTRATADO", "PAGAMENTO", "AGENDADO", "EXECUCAO", "FINALIZADO"];

const serviceStepLabels: Record<string, string> = {
  CONTRATADO: "Contratado",
  PAGAMENTO: "Pagamento",
  AGENDADO: "Agendado",
  EXECUCAO: "Execução",
  FINALIZADO: "Finalizado"
};

const normalizeStatus = (value: any) => String(value || "").trim().toUpperCase();

const resolveServiceProgress = (item: any) => {
  const statuses = [
    item.status, item.statusReal, item.solicitacao_status,
    item.oferta_status, item.oferta?.status
  ].map(normalizeStatus);

  const agenda = Array.isArray(item.agenda) ? item.agenda : [];
  const agendaConcluida = agenda.some((a: any) =>
    ["CONCLUIDO", "CONCLUIDA"].includes(normalizeStatus(a?.status))
  );
  const agendaConfirmada = agenda.some((a: any) =>
    ["AGENDADO", "CONFIRMADO", "LIBERADO_CLIENTE", "FILA_ASSINATURA", "CONCLUIDO", "CONCLUIDA"]
      .includes(normalizeStatus(a?.status))
  );
  const backend = Number(item.progresso || 0);

  if (statuses.some((s: string) => ["FINALIZADO", "CONCLUIDO", "CONCLUIDA"].includes(s)) || backend >= 100) return 100;
  if (agendaConcluida) return 90;
  if (statuses.includes("EM_ANDAMENTO") || statuses.includes("EM_EXECUCAO")) return 75;
  if (agendaConfirmada) return 60;
  if (statuses.includes("PAGO") || statuses.includes("PARCIALMENTE_PAGO") || statuses.includes("AGUARDANDO_PAGAMENTO")) return 40;
  if (statuses.includes("FECHADO") || statuses.includes("ACEITA")) return 20;
  return Math.max(0, Math.min(100, backend));
};

const resolveServiceStep = (progress: number) => {
  if (progress >= 100) return statusStepsService.length;
  if (progress >= 75) return 3;
  if (progress >= 60) return 2;
  if (progress >= 40) return 1;
  return 0;
};

const deliveryLabels: any = {
  pendente: "I PENDENTE",
  pago: "💳 PAGO",
  em_preparo: "👨‍🍳 EM PREPARO",
  em_transporte: "🛵 SAIU PARA ENTREGA",
  entregue: "✅ ENTREGUE"
};

const deliveryProgressMap: any = {
  pendente: 10,
  pago: 30,
  em_preparo: 60,
  em_transporte: 85,
  entregue: 100
};

const statusMap: any = {
  pendente: { label: "Pendente", color: "#ed6c02" },
  pago: { label: "Pago", color: "#0288d1" },
  em_preparo: { label: "Em Preparo", color: "#ed6c02" },
  em_transporte: { label: "Saiu para Entrega", color: "#9c27b0" }, // 🟢 Roxo destacado para trânsito
  entregue: { label: "Entregue", color: "#2e7d32" },
  cancelado: { label: "Cancelado", color: "#d32f2f" },
  
  // Status de Serviços
  FECHADO: { label: "Acordo Fechado", color: "#1976d2" },
  EM_ANDAMENTO: { label: "Em Execução", color: "#ed6c02" },
  FINALIZADO: { label: "Concluído", color: "#2e7d32" },
  AGUARDANDO_PAGAMENTO: { label: "Aguardando Pagamento", color: "#ed6c02" }
};

export const PedidosList = () => {
  const [items, setItems] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<any>({});
  const navigate = useNavigate();
  const theme = useTheme();

  const loadAllData = async () => {
    try {
      let lanchesRaw: any[] = [];
      let servicosRaw: any[] = [];

      // CARREGAR PEDIDOS (PRODUTOS)
      try {
        const resOrders = await api.get("/order/orders/my");
        lanchesRaw = Array.isArray(resOrders.data) 
          ? resOrders.data 
          : (Array.isArray(resOrders.data?.orders) ? resOrders.data.orders : []);
      } catch (err) {
        console.error("Erro pedidos:", err);
      }

      // CARREGAR SOLICITAÇÕES (SERVIÇOS)
      try {
        const resServices = await api.get("/servicos/solicitacoes/minhas-solicitacoes");
        servicosRaw = Array.isArray(resServices.data?.items) ? resServices.data.items : [];
      } catch (err) {
        console.error("Erro serviços:", err);
      }

      // FORMATAR PRODUTOS
      const lanchesFormatados = lanchesRaw.map((o: any) => ({
        ...o,
        uiType: "PRODUCT",
        createdAt: o.createdAt || o.created_at || o.dataCriacao || new Date().toISOString(),
        status: (o.status || "pendente").toLowerCase(),
        totalAmount: o.totalAmount || o.total || o.valor_total || 0
      }));

      // FORMATAR SERVIÇOS
      // Enriquece cada serviço com a mesma fonte usada pela tela Agenda e Evolução.
      const servicosFormatados = await Promise.all(
        servicosRaw.map(async (s: any) => {
          let detalhe: any = {};
          try {
            const detalheRes = await api.get(`/servicos/solicitacoes/detalhes-completos/${s.id}`);
            detalhe = detalheRes.data || {};
          } catch (err) {
            console.warn(`[Minhas Atividades] Falha ao enriquecer serviço ${s.id}`, err);
          }

          const combinado = { ...s, ...detalhe };
          const progresso = resolveServiceProgress(combinado);

          return {
            ...combinado,
            uiType: "SERVICE",
            status: progresso >= 100
              ? "FINALIZADO"
              : normalizeStatus(detalhe.statusReal || s.statusReal || detalhe.oferta_status || s.status || "FECHADO"),
            progresso,
            totalAmount: detalhe.valor_final || s.valor_final || detalhe.valor || s.valor || 0,
            createdAt: s.createdAt || s.created_at || s.dataCriacao || detalhe.createdAt || new Date().toISOString()
          };
        })
      );

      // UNIFICAR E ORDENAR POR DATA
      const unified = [...lanchesFormatados, ...servicosFormatados].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      // SEPARAR ATIVOS DE CONCLUÍDOS (Ativos no topo)
      const activeItems = unified.filter((item) => {
        if (item.uiType === "PRODUCT") {
          return item.status !== "entregue" && item.status !== "cancelado";
        }
        return item.status !== "FINALIZADO";
      });

      const finishedItems = unified.filter((item) => {
        if (item.uiType === "PRODUCT") {
          return item.status === "entregue" || item.status === "cancelado";
        }
        return item.status === "FINALIZADO";
      });

      setItems([...activeItems, ...finishedItems]);
    } catch (err) {
      console.error("Erro geral na unificação:", err);
      setItems([]);
    }
  };

  useEffect(() => {
    loadAllData();
    socket.on("order_updated", loadAllData);
    socket.on("service_progress_updated", loadAllData);

    return () => {
      socket.off("order_updated", loadAllData);
      socket.off("service_progress_updated", loadAllData);
    };
  }, []);

  const toggleExpand = (id: any) => {
    setExpanded((prev: any) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Stack spacing={2} sx={{ p: 2, maxWidth: 650, mx: "auto", bgcolor: "#f5f5f5", minHeight: "100vh" }}>
      {/* HEADER */}
      <Box>
        <Typography variant="h5" fontWeight="900">Minhas Atividades</Typography>
        <Typography variant="body2" color="text.secondary">Acompanhe seus pedidos e serviços</Typography>
      </Box>

      {/* TELA DE VAZIO */}
      {items.length === 0 && (
        <Paper sx={{ p: 4, textAlign: "center", borderRadius: 5 }}>
          <ShoppingBag size={50} color={theme.palette.divider} />
          <Typography mt={2} color="text.secondary">Nenhuma atividade encontrada</Typography>
        </Paper>
      )}

      {/* RENDER DOS CARDS */}
      {items.map((item) => {
        const isService = item.uiType === "SERVICE";
        const steps = isService ? statusStepsService : statusStepsDelivery;
        const currentStatus = isService ? (item.status || "").toUpperCase() : (item.status || "").toLowerCase();
        const progressoReal = isService ? resolveServiceProgress(item) : 0;

        let activeStep = isService ? resolveServiceStep(progressoReal) : steps.indexOf(currentStatus);
        if (!isService && activeStep === steps.length - 1) activeStep = steps.length;
        if (activeStep < 0) activeStep = 0;

        const serviceFinished = isService && progressoReal >= 100;
        const config = serviceFinished
          ? statusMap.FINALIZADO
          : (statusMap[currentStatus] || { label: currentStatus, color: "#999" });
        const isExpanded = expanded[item.id];
        const isEmTransito = currentStatus === "em_transporte";

        const isActive = isService
          ? !serviceFinished
          : currentStatus !== "entregue" && currentStatus !== "cancelado";

        const deliveryProgress = deliveryProgressMap[currentStatus] || 0;

        return (
          <Card
            key={`${item.uiType}-${item.id}`}
            elevation={0}
            sx={{
              borderRadius: 5,
              overflow: "hidden",
              border: isActive ? `2px solid ${config.color}` : "1px solid #e0e0e0",
              boxShadow: isActive ? `0 8px 24px ${alpha(config.color, 0.18)}` : "none"
            }}
          >
            {/* TOPO DO CARD CLICKÁVEL */}
            <Box
              onClick={() => toggleExpand(item.id)}
              sx={{ p: 2, cursor: "pointer", bgcolor: isActive ? alpha(config.color, 0.05) : "white" }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack spacing={0.5} sx={{ width: "80%" }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gap={0.5}>
                    <Chip
                      size="small"
                      label={isService ? "SERVIÇO" : "LOJA"}
                      sx={{ bgcolor: isService ? "#9c27b0" : "#FF8C00", color: "white", fontWeight: 800 }}
                    />
                    {isEmTransito && (
                      <Chip
                        size="small"
                        label="SAIU PARA ENTREGA"
                        color="secondary"
                        sx={{ animation: "pulse 1.5s infinite", fontWeight: "900", bgcolor: "#9c27b0" }}
                      />
                    )}
                    {isActive && !isEmTransito && (
                      <Chip
                        size="small"
                        label={isService ? config.label.toUpperCase() : "EM ANDAMENTO"}
                        sx={{ bgcolor: config.color, color: "white", fontWeight: 900 }}
                      />
                    )}
                    {serviceFinished && (
                      <Chip size="small" label="CONCLUÍDO" sx={{ bgcolor: "#2e7d32", color: "white", fontWeight: 900 }} />
                    )}
                  </Stack>

                  <Typography fontWeight="900" sx={{ fontSize: { xs: "1rem", sm: "1.1rem" } }}>
                    {isService ? item.titulo : (item.store?.name || "Pedido Marketplace")}
                  </Typography>

                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Clock size={12} />
                      {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                    </Typography>
                    <Typography variant="caption" sx={{ color: config.color, fontWeight: 800 }}>
                      • {config.label}
                    </Typography>
                  </Stack>
                </Stack>

                <Stack alignItems="flex-end">
                  <Typography fontWeight="900" sx={{ color: config.color }}>
                    R$ {Number(item.totalAmount || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </Typography>
                  <IconButton size="small">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </IconButton>
                </Stack>
              </Stack>
            </Box>

            {/* CONTEÚDO EXPANSÍVEL */}
            <Collapse in={isExpanded}>
              <Divider />
              <CardContent>
                {/* BLOCÃO DE NOTIFICAÇÃO SE ESTIVER EM TRÂNSITO */}
                {isEmTransito && (
                  <Paper
                    elevation={0}
                    sx={{
                      mb: 2.5,
                      p: 2,
                      borderRadius: 4,
                      bgcolor: "#f3e5f5",
                      border: "2px solid #9c27b0",
                      textAlign: "center"
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight="900" color="#7b1fa2">
                      🚀 O MOTOBOY ESTÁ CHEGANDO!
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Prepare o código de entrega abaixo para confirmar o recebimento com segurança.
                    </Typography>
                  </Paper>
                )}

                {/* 🔒 EXIBIÇÃO DE CÓDIGO DO MOTOBOY (BLINDADO E HIGHLIGHTED) */}
                {!isService && currentStatus !== "entregue" && (item.deliveryCode || item.codigo_confirmacao) && (
                  <Paper
                    elevation={0}
                    sx={{
                      mb: 3,
                      p: 2.5,
                      borderRadius: 4,
                      bgcolor: isEmTransito ? "#fff8f0" : "#f8fafc",
                      border: isEmTransito ? "2.5px dashed #FF8C00" : "1px solid #e2e8f0",
                      textAlign: "center"
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 800, color: isEmTransito ? "#FF8C00" : "#64748b" }}>
                      Código de Entrega
                    </Typography>
                    
                    <Typography
                      sx={{
                        fontWeight: 900,
                        letterSpacing: 6,
                        color: isEmTransito ? "#FF8C00" : "#334155",
                        mt: 1,
                        fontFamily: "monospace",
                        fontSize: { xs: "2.5rem", sm: "3rem" }
                      }}
                    >
                      {item.deliveryCode || item.codigo_confirmacao}
                    </Typography>

                    <Button
                      startIcon={<Copy size={16} />}
                      variant="outlined"
                      size="small"
                      color={isEmTransito ? "warning" : "inherit"}
                      fullWidth
                      sx={{ mt: 1.5, borderRadius: '8px', textTransform: 'none', fontWeight: 'bold' }}
                      onClick={() => navigator.clipboard.writeText(item.deliveryCode || item.codigo_confirmacao)}
                    >
                      Copiar Código
                    </Button>
                  </Paper>
                )}

                {/* STATUS BAR */}
                <Box sx={{ mb: 3 }}>
                  <Stack direction="row" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" fontWeight="700">
                      {isService ? "Progresso do Serviço" : "Acompanhamento do Pedido"}
                    </Typography>
                    <Typography variant="body2" fontWeight="900">
                      {isService ? progressoReal : deliveryProgress}%
                    </Typography>
                  </Stack>

                  <LinearProgress
                    variant="determinate"
                    value={isService ? progressoReal : deliveryProgress}
                    sx={{
                      height: 10,
                      borderRadius: 999,
                      bgcolor: alpha(config.color, 0.15),
                      "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: config.color }
                    }}
                  />
                </Box>

                {/* LISTA DE ITENS COMPRADOS */}
                {!isService && item.items && (
                  <Stack spacing={1} sx={{ mb: 3, bgcolor: '#f8fafc', p: 1.5, borderRadius: '8px' }}>
                    <Typography variant="caption" fontWeight="bold" color="text.secondary">Produtos Comprados:</Typography>
                    {item.items.map((i: any) => (
                      <Box key={i.id} display="flex" justifyContent="space-between">
                        <Typography variant="body2">
                          <Box component="span" sx={{ fontWeight: 800, color: 'primary.main', mr: 1 }}>{i.quantity || 1}x</Box> 
                          {i.product?.name || i.name}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                )}

                {/* ETAPAS STEPPER VISUAL */}
                <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3, "& .MuiStepLabel-label": { fontSize: { xs: "0.55rem", sm: "0.7rem" }, mt: 0.5, fontWeight: 700 } }}>
                  {steps.map((label, index) => {
                    const isCompleted = activeStep > index || activeStep === steps.length;
                    return (
                      <Step key={label} completed={isCompleted}>
                        <StepLabel StepIconProps={{ sx: { "&.Mui-completed": { color: "#2e7d32" }, "&.Mui-active": { color: config.color } } }}>
                          {!isService ? (deliveryLabels[label] || label) : serviceStepLabels[label]}
                        </StepLabel>
                      </Step>
                    );
                  })}
                </Stepper>

                {/* BOTÃO DE ACESSO COMPLETO */}
                <Button
                  variant="contained"
                  fullWidth
                  endIcon={<ChevronRight size={18} />}
                  onClick={() => navigate(isService ? `/servico/${item.id}` : `/pedido/${item.id}`)}
                  sx={{
                    py: 1.3,
                    borderRadius: 3,
                    fontWeight: 900,
                    textTransform: "none",
                    boxShadow: "none",
                    bgcolor: isService ? "#9c27b0" : "#1a1a1a",
                    "&:hover": { bgcolor: isService ? "#7b1fa2" : "#000" }
                  }}
                >
                  {isService ? "Agenda e Evolução" : "Detalhes Completo do Pedido"}
                </Button>
              </CardContent>
            </Collapse>
          </Card>
        );
      })}
    </Stack>
  );
};