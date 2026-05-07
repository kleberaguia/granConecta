import { useEffect, useState } from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Stack,
    Chip,
    Divider,
    Tooltip
} from "@mui/material";
import {
    Truck,
    Package,
    CheckCircle,
    ShieldCheck,
    Smartphone,
    MapPin,
    QrCode
} from "lucide-react";
import api from "../../api/api";
import { socket } from "../Checkout/socket";
import toast from "react-hot-toast";
import { Html5QrcodeScanner } from "html5-qrcode";

const statusColor: any = {
    pendente: "warning",
    pago: "success",
    preparando: "info",
    saiu_entrega: "secondary",
    entregue: "success",
    cancelado: "error"
};

const nextStatusMap: any = {
    pendente: "pago",
    pago: "preparando",
    preparando: "saiu_entrega",
    saiu_entrega: "entregue"
};

const statusLabels: any = {
    pendente: "Aguardando Pagamento",
    pago: "Pago - Iniciar Preparo",
    preparando: "Pronto - Despachar",
    saiu_entrega: "Confirmar Entrega (OTP)",
    entregue: "Pedido Finalizado"
};

export const StoreOrdersPanel = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [scanningOrderId, setScanningOrderId] = useState<string | null>(null);

    useEffect(() => {
        loadOrders();

        socket.on("new_order", (order) => {
            toast.success("Novo pedido recebido!");
            setOrders(prev => [order, ...prev]);
        });

        socket.on("order_updated", (update) => {
            setOrders(prev =>
                prev.map(o => o.id === update.orderId ? { ...o, status: update.status } : o)
            );
        });

        return () => {
            socket.off("new_order");
            socket.off("order_updated");
        };
    }, []);

    const loadOrders = async () => {
        try {
            const res = await api.get("/order/orders/my-store");
            setOrders(res.data);
        } catch (err) {
            toast.error("Erro ao carregar pedidos");
        }
    };

    const handleNextStatus = async (order: any, manualCode?: string) => {
        const next = nextStatusMap[order.status];
        if (!next) return;

        let codeToVerify = manualCode;

        if (next === "entregue" && !codeToVerify) {
            const userCode = prompt(`🔒 SEGURANÇA: Peça ao cliente o código de entrega.\nDigite os 4 dígitos:`);
            if (!userCode) return;
            codeToVerify = userCode;
        }

        try {
            await api.patch(`/order/orders/${order.id}/status`, {
                status: next,
                userCode: codeToVerify
            });
            toast.success(`Pedido atualizado!`);
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Erro ao atualizar status");
        }
    };

    const startScanner = (orderId: string) => {
        setScanningOrderId(orderId);

        setTimeout(() => {
            // Configuração do scanner
            const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }, false);

            scanner.render(async (decodedText) => {
                const targetOrder = orders.find(o => String(o.id) === String(orderId));
                if (targetOrder) {
                    await handleNextStatus(targetOrder, decodedText);
                }
                scanner.clear();
                setScanningOrderId(null);
            }, () => { /* ignore silent errors */ });
        }, 100);
    };

    return (
        <Stack spacing={2} sx={{ p: 2, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
            <Typography variant="h5" fontWeight="900" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Package color="#2563eb" /> PAINEL DE EXPEDIÇÃO
            </Typography>

            {orders.length === 0 ? (
                <Box textAlign="center" py={10}>
                    <Typography color="text.secondary">Nenhum pedido no momento.</Typography>
                </Box>
            ) : (
                orders.map(order => (
                    <Card key={order.id} sx={{
                        borderRadius: 4,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                        border: order.status === 'saiu_entrega' ? "2px solid #9c27b0" : "1px solid #eee",
                        transition: "0.3s"
                    }}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                <Box>
                                    <Typography variant="caption" fontWeight="bold" color="text.secondary">
                                        #{String(order.id).padStart(4, '0')}
                                    </Typography>
                                    <Typography variant="h6" fontWeight="900" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Smartphone size={18} /> {order.customer?.name || "Cliente"}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <MapPin size={14} /> {order.deliveryAddress || "Retirada no Local"}
                                    </Typography>
                                </Box>
                                <Chip
                                    label={order.status.toUpperCase()}
                                    color={statusColor[order.status]}
                                    size="small"
                                    sx={{ fontWeight: "900", borderRadius: 1.5 }}
                                />
                            </Box>

                            <Divider sx={{ my: 2, borderStyle: "dashed" }} />

                            <Box sx={{ bgcolor: "#fafafa", p: 1.5, borderRadius: 2 }}>
                                {order.items?.map((item: any) => (
                                    <Typography key={item.id} variant="body2" fontWeight="600">
                                        <span style={{ color: "#2563eb" }}>{item.quantity}x</span> {item.product?.name}
                                    </Typography>
                                ))}
                            </Box>

                            <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                                <Typography variant="h6" fontWeight="900" color="primary">
                                    Total: R$ {Number(order.totalAmount).toFixed(2)}
                                </Typography>

                                {order.status === 'saiu_entrega' && (
                                    <Tooltip title="Chave para conferência manual">
                                        <Box sx={{ border: "1px dashed #9c27b0", px: 1, borderRadius: 1, bgcolor: "#f3e5f5" }}>
                                            <Typography variant="caption" fontWeight="bold" color="secondary">
                                                CHAVE: {order.deliveryCode}
                                            </Typography>
                                        </Box>
                                    </Tooltip>
                                )}
                            </Box>

                            <Stack spacing={1} mt={2}>
                                {order.status === 'saiu_entrega' && (
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        color="secondary"
                                        startIcon={<QrCode size={18} />}
                                        onClick={() => startScanner(order.id)}
                                        sx={{ borderRadius: 3, fontWeight: "900", textTransform: "none" }}
                                    >
                                        Escanear QR Code do Cliente
                                    </Button>
                                )}

                                <Button
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    sx={{
                                        borderRadius: 3,
                                        py: 1.5,
                                        fontWeight: "900",
                                        textTransform: "none",
                                        bgcolor: order.status === 'saiu_entrega' ? "#9c27b0" : "primary.main",
                                        "&:hover": {
                                            bgcolor: order.status === 'saiu_entrega' ? "#7b1fa2" : "primary.dark",
                                        }
                                    }}
                                    onClick={() => handleNextStatus(order)}
                                    disabled={!nextStatusMap[order.status]}
                                    startIcon={
                                        order.status === 'preparando' ? <Truck /> :
                                        order.status === 'saiu_entrega' ? <ShieldCheck /> : <CheckCircle />
                                    }
                                >
                                    {nextStatusMap[order.status] ? statusLabels[order.status] : "Pedido Entregue"}
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                ))
            )}

            {/* OVERLAY DO SCANNER */}
            {scanningOrderId && (
                <Box
                    sx={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        zIndex: 9999, bgcolor: 'rgba(0,0,0,0.9)', display: 'flex',
                        flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3
                    }}
                >
                    <Typography color="#fff" mb={2} fontWeight="900">ESCANEAR QR CODE DO CLIENTE</Typography>
                    <Box id="reader" sx={{ width: '100%', maxWidth: 400, borderRadius: 4, overflow: 'hidden', bgcolor: '#fff' }} />
                    <Button
                        variant="contained"
                        color="error"
                        sx={{ mt: 3, fontWeight: '900' }}
                        onClick={() => {
                           setScanningOrderId(null);
                           window.location.reload(); // Forma simples de resetar o hardware da câmera se travar
                        }}
                    >
                        Cancelar
                    </Button>
                </Box>
            )}
        </Stack>
    );
};