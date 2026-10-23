import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, Card, Divider, Button, Stack, Chip, CircularProgress } from "@mui/material";
import { MapPin, Store, MessageCircle, ArrowLeft } from "lucide-react";
import api from "../../api/api";
import { PixPayment } from "../PixPayment/PixPayment";
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

export const PedidoDetalhe = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOrderDetail();
    }, [id]);

    const loadOrderDetail = async () => {
        try {
            const res = await api.get(`/order/orders/${id}`);
            setOrder(res.data);
        } catch (err) {
            console.error("Erro ao carregar detalhes:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleGerarPagamento = async () => {
        try {
            const res = await api.post(`gateway/create-payment/${order.id}`);
            console.log("Retorno do Backend:", res.data); // ADICIONE ISSO AQUI

            // Verifique se o caminho é res.data.payment ou res.data.payment.payment
            setOrder({ ...order, payment_data: res.data.payment });
        } catch (err) {
            console.error("Erro ao gerar PIX oficial", err);
        }
    };

    if (loading) return <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>;
    if (!order) return <Typography textAlign="center">Pedido não encontrado.</Typography>;

    return (
        <Box sx={{ p: 2, maxWidth: 600, mx: 'auto' }}>
            <Button startIcon={<ArrowLeft />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Voltar</Button>

            <Card sx={{ borderRadius: 4, p: 3, mb: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight="900">Detalhes do Pedido</Typography>
                    <Chip label={order.status.toUpperCase()} color={order.status === 'pago' ? "success" : "info"} />
                </Stack>

                {/* IDENTIFICAÇÃO DA LOJA */}
                <Stack direction="row" spacing={1} alignItems="center" sx={{ bgcolor: '#f0f7ff', p: 2, borderRadius: 2, mb: 3 }}>
                    <Store size={20} color="#0066ff" />
                    <Box>
                        <Typography variant="caption" color="text.secondary">Vendido e entregue por:</Typography>
                        <Typography variant="body1" fontWeight="bold">{order.store?.name}</Typography>
                        <Typography variant="caption" display="block">
                            Realizado em: {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                        </Typography>
                    </Box>
                </Stack>

                <Divider sx={{ my: 2 }} />

                {/* ========================================== */}
                {/* SEÇÃO DE PAGAMENTO DINÂMICA */}
                {/* ========================================== */}
                {order.status === 'pendente' && order.paymentMethod === 'pix'  && (
                    <Box sx={{ my: 2 }}>
                        {!order.payment_data ? (
                            <Button
                                variant="contained"
                                fullWidth
                                color="warning"
                                onClick={handleGerarPagamento}
                                sx={{ borderRadius: 3, fontWeight: 'bold', py: 1.5 }}
                            >
                                Gerar QR Code para Pagar
                            </Button>
                        ) : (
                            /* Assim que o handleGerarPagamento terminar, este componente aparece */
                            <PixPayment
                                paymentData={order.payment_data}
                                amount={Number(order.totalAmount)}
                            />
                        )}
                    </Box>
                )}
                <Box sx={{ p: 2, bgcolor: '#fff9f0', borderRadius: 3, border: '1px solid #ffe0b2', mt: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <LocalShippingIcon color="warning" />
                        <Typography variant="body2" fontWeight="bold">Informações de Entrega</Typography>
                    </Stack>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        O lojista estima a entrega em: <strong>{order.store?.estimatedTime || 'A combinar'}</strong>
                    </Typography>
                    <Typography variant="caption" display="block">
                        Taxa de entrega: <strong>{order.store?.deliveryFee > 0 ? `R$ ${order.store.deliveryFee.toFixed(2)}` : 'Grátis'}</strong>
                    </Typography>
                </Box>

                <Box sx={{ bgcolor: '#fdfdfd', border: '1px solid #eee', p: 1.5, borderRadius: 2, mb: 2 }}>
                    {/* Itens do Pedido */}
                    {order.items?.map((item: any) => (
                        <Typography key={item.id} variant="body2" color="text.primary" sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <span><strong>{item.quantity}x</strong> {item.name}</span>
                            <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                        </Typography>
                    ))}

                    <Divider sx={{ my: 1.5 }} />

                    {/* Linha da Taxa de Entrega */}
                    <Stack spacing={0.5} sx={{ mb: 1.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Subtotal</span>
                            <span>R$ {(Number(order.totalAmount) - Number(order.deliveryFee || 0)).toFixed(2)}</span>
                        </Typography>

                        <Typography variant="body2" color="success.main" sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                            <span>Taxa de Entrega</span>
                            <span>{Number(order.deliveryFee) > 0 ? `+ R$ ${Number(order.deliveryFee).toFixed(2)}` : 'Grátis'}</span>
                        </Typography>
                    </Stack>

                    <Divider sx={{ my: 1 }} />

                    {/* Total Final */}
                    <Typography variant="subtitle1" fontWeight="900" textAlign="right" color="primary">
                        Total: R$ {Number(order.totalAmount).toFixed(2)}
                    </Typography>
                </Box>

                {/* ENDEREÇO E CONDOMÍNIO (Resumo) */}
                <Box sx={{ mt: 3, mb: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #e2e8f0' }}>
                    <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                        <MapPin size={18} color="#64748b" />
                        <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
                            Endereço de Entrega
                        </Typography>
                    </Stack>

                    {/* Nome do Condomínio em Destaque */}
                    {order.customer?.endereco?.condominio && (
                        <Typography variant="body1" fontWeight="900" color="primary" sx={{ mb: 0.5 }}>
                            {order.customer.endereco.condominio.nome.toUpperCase()}
                        </Typography>
                    )}

                    {/* Logradouro e Número */}
                    <Typography variant="body2" fontWeight="600" color="text.primary">
                        {order.customer?.endereco?.logradouro}, {order.customer?.endereco?.numero}
                    </Typography>

                    {/* Bloco e Unidade (Essencial para o GranConecta) */}
                    {(order.customer?.endereco?.bloco_torre || order.customer?.endereco?.unidade_apto) && (
                        <Typography variant="body2" color="text.secondary">
                            {order.customer.endereco.bloco_torre && `Bloco/Torre: ${order.customer.endereco.bloco_torre}`}
                            {order.customer.endereco.bloco_torre && order.customer.endereco.unidade_apto && " | "}
                            {order.customer.endereco.unidade_apto && `Apto/Unidade: ${order.customer.endereco.unidade_apto}`}
                        </Typography>
                    )}

                    {/* Bairro e Cidade */}
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        {order.customer?.endereco?.bairro} — {order.customer?.endereco?.cidade}/{order.customer?.endereco?.uf}
                    </Typography>

                    <Divider sx={{ my: 1.5, borderStyle: 'dotted' }} />

                    <Typography variant="caption" fontWeight="bold" sx={{ color: '#2e7d32' }}>
                        Tipo de Entrega: {order.deliveryMode === 'delivery' ? 'Entrega no Condomínio' : 'Retirada na Loja'}
                    </Typography>
                </Box>

                {/* BOTÃO DE SUPORTE */}
                <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<MessageCircle />}
                    sx={{ mt: 2, borderRadius: 3 }}
                    onClick={() => window.open(`https://wa.me/${order.store?.telefone}`)}
                >
                    Falar com a Loja
                </Button>
            </Card>
        </Box>
    );
};