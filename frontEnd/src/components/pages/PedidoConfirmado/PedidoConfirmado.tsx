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
    Divider
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { socket } from "../../Checkout/socket";
import api from "../../../api/api";

const steps = [
    "pendente",
    "pago",
    "preparando",
    "saiu_entrega",
    "entregue"
];

const statusConfig: Record<string, any> = {
    pendente: { label: "Aguardando pagamento", color: "#ff9800", icon: "💳" },
    pago: { label: "Pagamento confirmado", color: "#4caf50", icon: "✅" },
    preparando: { label: "Em preparo", color: "#2196f3", icon: "👨‍🍳" },
    saiu_entrega: { label: "Saiu para entrega", color: "#9c27b0", icon: "🚚" },
    entregue: { label: "Finalizado", color: "#2e7d32", icon: "📦" },
    cancelado: { label: "Cancelado", color: "#f44336", icon: "❌" }
};

const playSound = () => {
    const audio = new Audio("/sounds/notify.mp3");
    audio.play().catch(() => { });
};

export const PedidoConfirmado = () => {

    const location = useLocation();
    const navigate = useNavigate();

    const [orderId, setOrderId] = useState<string | null>(
        location.state?.orderId || null
    );

    const [order, setOrder] = useState<any>(null);
    const [status, setStatus] = useState("pendente");

    // fallback
    useEffect(() => {
        if (orderId) return;

        const saved = localStorage.getItem("@last_order_id");

        if (saved) setOrderId(saved);
        else navigate("/");
    }, []);

    // fetch inicial
    useEffect(() => {
        if (!orderId) return;

        localStorage.setItem("@last_order_id", orderId);

        api.get(`/order/orders/${orderId}`).then(res => {
            setOrder(res.data);
            setStatus(res.data.status);
        });
    }, [orderId]);

    // realtime
    useEffect(() => {
        if (!orderId) return;

        socket.emit("join_order", orderId);

        const handler = (data: any) => {
            if (data.orderId !== orderId) return;

            setStatus(data.status);
            playSound();
        };

        socket.off("order_updated");
        socket.on("order_updated", handler);

        return () => {
            socket.off("order_updated", handler);
        };

    }, [orderId]);

    const activeStep = Math.max(steps.indexOf(status), 0);
    const current = statusConfig[status];

    return (
        <Container maxWidth="sm" sx={{ py: 6 }}>
            <Paper sx={{ p: 4, borderRadius: 4 }}>

                <Typography variant="h5" fontWeight="900">
                    Pedido confirmado 🎉
                </Typography>

                {/* STATUS COM ANIMAÇÃO */}
                <Box
                    mt={3}
                    mb={4}
                    textAlign="center"
                    sx={{
                        transition: "all .3s ease",
                        transform: "scale(1.05)"
                    }}
                >
                    <Typography fontSize={40}>
                        {current?.icon}
                    </Typography>

                    <Typography
                        variant="h6"
                        fontWeight="bold"
                        sx={{ color: current?.color }}
                    >
                        {current?.label}
                    </Typography>
                </Box>

                {/* STEPPER */}
                <Stepper activeStep={activeStep} alternativeLabel>
                    {steps.map((step) => (
                        <Step key={step}>
                            <StepLabel>
                                {statusConfig[step]?.label}
                            </StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {/* RESUMO */}
                {order && (
                    <>
                        <Divider sx={{ my: 3 }} />

                        <Typography fontWeight="bold">
                            {order.store?.name}
                        </Typography>

                        {order.items?.map((item: any) => (
                            <Box key={item.id} display="flex" justifyContent="space-between">
                                <span>{item.quantity}x {item.product?.name}</span>
                                <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                            </Box>
                        ))}

                        <Divider sx={{ my: 2 }} />

                        <Typography fontWeight="bold">
                            Total: R$ {Number(order.totalAmount).toFixed(2)}
                        </Typography>
                    </>
                )}

                <Box mt={4} textAlign="center">
                    <Button variant="outlined" onClick={() => navigate("/")}>
                        Voltar
                    </Button>
                </Box>

            </Paper>
        </Container>
    );
};