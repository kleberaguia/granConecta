import { useState, useEffect } from 'react';
import {
    Container, Paper, Typography, Box, TextField, Button,
    Divider, Stack, Radio, RadioGroup, FormControlLabel,
    Dialog, DialogTitle, DialogContent, DialogActions, List
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../api/api';
import { socket } from "./socket";
import { PixPayment } from "../PixPayment/PixPayment";


// =========================
// FORM VISITANTE
// =========================
const CheckoutForm = ({ onSubmit }: { onSubmit: (data: any) => void }) => {
    const [formData, setFormData] = useState({
        nome: "",
        email: "",
        telefone: "",
        endereco: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleConfirm = () => {
        if (!formData.nome || !formData.telefone || !formData.endereco) {
            toast.error("Preencha nome, telefone e endereço.");
            return;
        }

        onSubmit(formData);
    };




    return (
        <Box display="flex" flexDirection="column" gap={2} mt={2}>
            <Typography variant="h6">Dados de entrega</Typography>

            <TextField label="Nome *" name="nome" value={formData.nome} onChange={handleChange} fullWidth />
            <TextField label="Email" name="email" value={formData.email} onChange={handleChange} fullWidth />
            <TextField label="Telefone *" name="telefone" value={formData.telefone} onChange={handleChange} fullWidth />
            <TextField label="Endereço *" name="endereco" value={formData.endereco} onChange={handleChange} fullWidth />

            <Button variant="contained" onClick={handleConfirm}>
                Confirmar
            </Button>
        </Box>
    );
};


// =========================
// CHECKOUT
// =========================
export const Checkout = () => {

    const { user, cart, clearCart } = useAuth();
    const navigate = useNavigate();

    const [deliveryConfig, setDeliveryConfig] = useState<any>(null);



    // =========================
    // NORMALIZA CART
    // =========================
    const cartEntries = Object.entries(cart || {});

    const items = cartEntries.flatMap(([storeId, items]) =>
        (items || []).map(item => ({
            ...item,
            storeId
        }))
    );

    const storeId = items[0]?.storeId;

    // Dentro do componente Checkout
    const [paymentConfig, setPaymentConfig] = useState<any>(null);

    useEffect(() => {
        const fetchConfigs = async () => {
            if (!storeId) return;
            try {
                // Busca ambas as configurações
                const [payRes, delRes] = await Promise.all([
                    api.get(`/stores/${storeId}/payment-config`),
                    api.get(`/lojas/delivery-config/${storeId}`) // O endpoint que criamos
                ]);

                setPaymentConfig(payRes.data);
                setDeliveryConfig(delRes.data);

                if (payRes.data.pix_enabled) setPagamento('pix');
            } catch (err) {
                console.error("Erro ao buscar configurações", err);
            }
        };
        fetchConfigs();
    }, [storeId]);

    // =========================
    // STATES
    // =========================
    const [visitorData, setVisitorData] = useState<any>(null);
    const [showForm, setShowForm] = useState(false);
    const [pagamento, setPagamento] = useState('pix');
    const [loading, setLoading] = useState(false);
    const [showPixModal, setShowPixModal] = useState(false);
    const [orderData, setOrderData] = useState<any>(null);

    // =========================
    // CALCULOS
    // =========================
    const frete = deliveryConfig?.acceptDelivery ? Number(deliveryConfig.deliveryFee) : 0;
    const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    const total = subtotal + frete;
    const isBelowMinimum = deliveryConfig?.minOrderValue > 0 && subtotal < Number(deliveryConfig.minOrderValue);
    // =========================
    // SOCKET REALTIME
    // =========================
    useEffect(() => {
        if (!orderData?.order?.id) return;


        console.log('orderDataaaaaaaaaaaaaaaaaaaaaaaaa  ', orderData)

        const orderId = orderData.order.id;

        socket.emit("join_order", orderId);

        const handler = (data: any) => {
            if (data.orderId !== orderId) return;

            if (data.status === "PAID") {
                toast.success("Pagamento aprovado!");

                clearCart();

                navigate("/pedido-confirmado", {
                    state: {
                        orderId,
                        paymentType: pagamento
                    }
                });
            }
        };

        socket.on("order_updated", handler);

        return () => {
            socket.off("order_updated", handler);
        };

    }, [orderData, pagamento, clearCart, navigate]);

    // =========================
    // FINALIZAR PEDIDO
    // =========================
    const handleFinalizeOrder = async () => {
        if (items.length === 0) return;

        if (!storeId) {
            toast.error("Erro: loja não identificada");
            return;
        }

        if (!user && !visitorData) {
            toast.error("Preencha os dados de entrega");
            return;
        }

        setLoading(true);

        try {
            const payload = {
                store_id: storeId,
                payment_method: pagamento,
                delivery_address: user ? "Endereço do morador" : visitorData.endereco,
                usuarioId: user?.id || null,
                customer_info: user ? null : visitorData,
                items: items.map(item => ({
                    name: item.name,
                    productId: item.id,
                    quantity: item.quantity,
                    price: item.price
                })),
                delivery_fee: frete,
                totalAmount: total
            };
            const res = await api.post('/order/orders', payload);
            const data = res.data as any;
            const payment = data.payment;

            setOrderData(data);
            // --- LÓGICA DE REDIRECIONAMENTO E MODAL ---
            const deliveryCode = data.order?.deliveryCode || data.deliveryCode;
            // 1. Caso seja PIX: Abre o Modal que já está no seu JSX
            if (pagamento === 'pix') {
                setOrderData(data);
                setShowPixModal(true);

                toast.success("Pedido criado!");
            }
            else if (pagamento === 'online') {
                // Agora o TS aceita 'init_point' porque 'payment' veio de um objeto 'any'
                const checkoutUrl = payment?.init_point;

                if (checkoutUrl) {
                    toast.success("Redirecionando para o Mercado Pago...");
                    setTimeout(() => {
                        window.location.href = checkoutUrl;
                    }, 1000);
                } else {
                    toast.error("Erro: Link de pagamento não encontrado na resposta.");
                    console.error("Dados recebidos sem init_point:", data);
                }
            }            // 3. Métodos Offline (Dinheiro/Maquininha)
            else {
                toast.success("Pedido enviado com sucesso!");
                clearCart();
                navigate('/pedido-confirmado', {
                    state: {
                        orderId: res.data.order?.id || res.data.id,
                        paymentType: pagamento,
                        deliveryCode: deliveryCode

                    }
                });
            }

        } catch (err: any) {
            console.error("Erro no Checkout:", err);
            toast.error("Erro ao processar pedido. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    // =========================
    // FECHAR PIX
    // =========================
    const handleClosePix = () => {
        setShowPixModal(false);

        navigate("/pedido-confirmado", {
            state: {
                orderId: orderData?.order?.id,
                paymentType: "pix",
                deliveryCode: orderData?.order?.deliveryCode
            }
        });
    };

    // =========================
    // RENDER
    // =========================
    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Grid container spacing={4}>

                {/* ESQUERDA */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Paper sx={{ p: 3 }}>

                        {(user || visitorData) ? (
                            <>
                                <Typography variant="h6">Entrega</Typography>

                                <Typography>
                                    {user ? "Morador logado" : visitorData?.endereco}
                                </Typography>

                                <Divider sx={{ my: 2 }} />

                                <Stack spacing={1}>
                                    <Box display="flex" justifyContent="space-between">
                                        <Typography color="text.secondary">Subtotal:</Typography>
                                        <Typography>R$ {subtotal.toFixed(2)}</Typography>
                                    </Box>

                                    <Box display="flex" justifyContent="space-between">
                                        <Typography color="text.secondary">Entrega:</Typography>
                                        <Typography color={frete === 0 ? "success.main" : "text.primary"}>
                                            {frete === 0 ? "Grátis" : `R$ ${frete.toFixed(2)}`}
                                        </Typography>
                                    </Box>

                                    <Box display="flex" justifyContent="space-between" sx={{ mt: 1 }}>
                                        <Typography fontWeight="bold" variant="h6">Total:</Typography>
                                        <Typography fontWeight="bold" variant="h6" color="primary">
                                            R$ {total.toFixed(2)}
                                        </Typography>
                                    </Box>
                                </Stack>

                                {/* Aviso de Prazo */}
                                {deliveryConfig?.estimatedTime && (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                                        Prazo estimado: {deliveryConfig.estimatedTime}
                                    </Typography>
                                )}

                                <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>Forma de Pagamento</Typography>

                                <RadioGroup value={pagamento} onChange={(e) => setPagamento(e.target.value)}>
                                    {/* PIX */}
                                    {paymentConfig?.pix_enabled && (
                                        <FormControlLabel value="pix" control={<Radio />} label="PIX" />
                                    )}

                                    {/* DINHEIRO */}
                                    {paymentConfig?.cash_enabled && (
                                        <FormControlLabel value="dinheiro" control={<Radio />} label="Dinheiro na Entrega" />
                                    )}

                                    {/* MAQUININHA */}
                                    {paymentConfig?.card_terminal_enabled && (
                                        <FormControlLabel value="maquininha" control={<Radio />} label="Cartão (levar maquininha)" />
                                    )}

                                    {/* MERCADO PAGO / STRIPE (Pagamento Online) */}
                                    {(paymentConfig?.mercado_pago_enabled || paymentConfig?.stripe_enabled) && (
                                        <FormControlLabel value="online" control={<Radio />} label="Cartão de Crédito (Online)" />
                                    )}
                                </RadioGroup>
                                {!paymentConfig && <Typography variant="caption">Carregando opções de pagamento...</Typography>}
                            </>
                        ) : (
                            <>
                                {!showForm ? (
                                    <Stack spacing={2}>
                                        <Button onClick={() => navigate('/login/morador')}>
                                            Login Morador
                                        </Button>

                                        <Button onClick={() => setShowForm(true)}>
                                            Comprar como visitante
                                        </Button>
                                    </Stack>
                                ) : (
                                    <CheckoutForm onSubmit={setVisitorData} />
                                )}
                            </>
                        )}

                    </Paper>
                </Grid>

                {/* DIREITA */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Paper sx={{ p: 3 }}>
                        <Typography>Resumo</Typography>

                        <List>
                            {items.map(item => (
                                <Box key={item.id} display="flex" justifyContent="space-between">
                                    <span>{item.quantity}x {item.name}</span>
                                    <span>R$ {(Number(item.price) * item.quantity).toFixed(2)}</span>
                                </Box>
                            ))}
                        </List>

                        <Divider sx={{ my: 2 }} />

                        <Typography>Subtotal: R$ {subtotal.toFixed(2)}</Typography>
                        <Typography>Frete: {frete === 0 ? "Grátis" : `R$ ${frete}`}</Typography>
                        <Typography fontWeight="bold">Total: R$ {total.toFixed(2)}</Typography>

                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handleFinalizeOrder}
                            // Desabilita se estiver carregando OU se não atingiu o valor mínimo
                            disabled={loading || isBelowMinimum || items.length === 0}
                            sx={{
                                mt: 2,
                                py: 1.5,
                                fontWeight: 'bold',
                                borderRadius: 3,
                                // Cor de alerta caso esteja abaixo do mínimo
                                bgcolor: isBelowMinimum ? '#ccc' : 'primary.main'
                            }}
                        >
                            {loading ? "Processando..." : isBelowMinimum
                                ? `Mínimo de R$ ${Number(deliveryConfig.minOrderValue).toFixed(2)}`
                                : "Finalizar Pedido"}
                        </Button>
                    </Paper>
                </Grid>
            </Grid>

            {/* PIX MODAL */}
            <Dialog open={showPixModal} onClose={handleClosePix}>
                <DialogTitle>Pagamento via PIX</DialogTitle>
                <DialogContent>
                    {/* Passando as props corretamente */}
                    <PixPayment
                        paymentData={orderData?.payment} // ou orderData?.payment_data dependendo do seu retorno
                        amount={Number(orderData?.totalAmount || total)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClosePix} variant="contained">
                        Já paguei / Fechar
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};