import { useEffect, useState } from "react";
import {
    Container,
    Paper,
    Typography,
    Box,
    Stepper,
    Step,
    StepLabel,
    Button,
    Divider,
    Alert
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { socket } from "../../Checkout/socket";
import api from "../../../api/api";

// Passos para PRODUTOS
const productSteps = ["pendente", "pago", "preparando", "saiu_entrega", "entregue"];

// Passos para SERVIÇOS (Ajustado para o seu fluxo de negociação)
const serviceSteps = ["BUSCANDO_PRESTADOR", "DIRECIONADO", "EM_ANDAMENTO", "CONCLUIDO"];

const statusConfig: Record<string, any> = {
    // Status Produto
    pendente: { label: "Aguardando pagamento", color: "#ff9800", icon: "💳" },
    pago: { label: "Pagamento confirmado", color: "#4caf50", icon: "✅" },
    preparando: { label: "Em preparo", color: "#2196f3", icon: "👨‍🍳" },
    saiu_entrega: { label: "Saiu para entrega", color: "#9c27b0", icon: "🚚" },
    entregue: { label: "Finalizado", color: "#2e7d32", icon: "📦" },
    // Status Serviço
    BUSCANDO_PRESTADOR: { label: "Buscando Prestador", color: "#ff9800", icon: "🔍" },
    DIRECIONADO: { label: "Em Negociação", color: "#2196f3", icon: "💬" },
    EM_ANDAMENTO: { label: "Serviço em Execução", color: "#9c27b0", icon: "🛠️" },
    CONCLUIDO: { label: "Serviço Finalizado", color: "#2e7d32", icon: "🏁" },
    cancelado: { label: "Cancelado", color: "#f44336", icon: "❌" }
};

const playSound = () => {
    const audio = new Audio("/sounds/notify.mp3");
    audio.play().catch(() => { });
};

export const PedidoConfirmado = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Pegamos os flags do estado
    const { isService, isVisitor } = location.state || {};
    
    const [orderId, setOrderId] = useState<string | null>(location.state?.orderId || null);
    const [order, setOrder] = useState<any>(null);
    const [status, setStatus] = useState(isService ? "BUSCANDO_PRESTADOR" : "pendente");

    useEffect(() => {
        if (orderId) return;
        const saved = localStorage.getItem("@last_order_id");
        if (saved) setOrderId(saved);
        else navigate("/");
    }, [orderId, navigate]);

    useEffect(() => {
        if (!orderId) return;
        localStorage.setItem("@last_order_id", orderId);

        api.get(`/order/orders/${orderId}`).then(res => {
            setOrder(res.data);
            setStatus(res.data.status);
        });
    }, [orderId]);

    useEffect(() => {
        if (!orderId) return;
        socket.emit("join_order", orderId);
        const handler = (data: any) => {
            if (data.orderId !== orderId) return;
            setStatus(data.status);
            playSound();
        };
        socket.on("order_updated", handler);
        return () => { socket.off("order_updated", handler); };
    }, [orderId]);

    // Define qual lista de passos usar
    const currentSteps = isService ? serviceSteps : productSteps;
    const activeStep = Math.max(currentSteps.indexOf(status), 0);
    const current = statusConfig[status];

    return (
        <Container maxWidth="sm" sx={{ py: 6 }}>
            <Paper sx={{ p: 4, borderRadius: 4, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                
                <Typography variant="h5" fontWeight="900" textAlign="center">
                    {isService ? "Solicitação Enviada! 📩" : "Pedido Confirmado! 🎉"}
                </Typography>

                {isVisitor && (
                    <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                        Sua conta foi criada! Você receberá atualizações via WhatsApp.
                    </Alert>
                )}

                {/* STATUS COM ANIMAÇÃO */}
                <Box mt={3} mb={4} textAlign="center">
                    <Typography fontSize={60}>{current?.icon}</Typography>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: current?.color }}>
                        {current?.label}
                    </Typography>
                    {isService && status === "DIRECIONADO" && (
                        <Typography variant="body2" color="text.secondary">
                            O prestador está analisando sua solicitação.
                        </Typography>
                    )}
                </Box>

                {/* STEPPER DINÂMICO */}
                <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                    {currentSteps.map((step) => (
                        <Step key={step}>
                            <StepLabel>{statusConfig[step]?.label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                <Divider sx={{ my: 3 }} />

                {/* RESUMO CONDICIONAL (SERVIÇO VS PRODUTO) */}
                {order && (
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            {isService ? "DETALHES DA SOLICITAÇÃO" : "RESUMO DO PEDIDO"}
                        </Typography>
                        <Typography fontWeight="bold" variant="h6">
                            {order.store?.name}
                        </Typography>

                        {isService ? (
                            <Box sx={{ mt: 1, p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                                <Typography variant="body1" fontWeight="bold">{order.titulo}</Typography>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mt: 1 }}>
                                    {order.descricao}
                                </Typography>
                            </Box>
                        ) : (
                            <Box sx={{ mt: 1 }}>
                                {order.items?.map((item: any) => (
                                    <Box key={item.id} display="flex" justifyContent="space-between" mb={0.5}>
                                        <Typography variant="body2">{item.quantity}x {item.product?.name}</Typography>
                                        <Typography variant="body2">R$ {(item.price * item.quantity).toFixed(2)}</Typography>
                                    </Box>
                                ))}
                                <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />
                                <Box display="flex" justifyContent="space-between">
                                    <Typography fontWeight="bold">Total Pago:</Typography>
                                    <Typography fontWeight="bold" color="primary">
                                        R$ {Number(order.totalAmount).toFixed(2)}
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                    </Box>
                )}

                <Box mt={5} display="flex" flexDirection="column" gap={2}>
                    <Button 
                        variant="contained" 
                        fullWidth 
                        size="large"
                        onClick={() => navigate(isVisitor ? "/minhas-solicitacoes" : "/dashboard")}
                    >
                        Acompanhar no Painel
                    </Button>
                    <Button variant="text" onClick={() => navigate("/")}>
                        Voltar para o Início
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};