import { useEffect, useState } from 'react';
import { 
  Container, Typography, Paper, Box, Chip, Divider, 
  CircularProgress, Stack, Button, Dialog, DialogTitle, 
  DialogContent, DialogActions, Alert 
} from '@mui/material';
import api from '../../api/api';
import { QrCodeScanner, ContentCopy } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../utils/config';

export const MeusPedidos = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPixModal, setShowPixModal] = useState(false);
    const [pedidoSelecionado, setPedidoSelecionado] = useState<any>(null);

    const handleOpenPix = (pedido: any) => {
        setPedidoSelecionado(pedido);
        setShowPixModal(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pendente': return 'warning';
            case 'preparando': return 'info';
            case 'saiu_para_entrega': return 'primary';
            case 'entregue': return 'success';
            case 'cancelado': return 'error';
            default: return 'default';
        }
    };

    useEffect(() => {
        api.get('/orders/my')
            .then(res => setOrders(res.data))
            .catch(() => toast.error("Erro ao carregar pedidos"))
            .finally(() => setLoading(false));

    }, []);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;

    return (
        <Container maxWidth="md" sx={{ py: 5 }}>
            <Typography variant="h4" fontWeight="800" gutterBottom>🛍️ Meus Pedidos</Typography>

            {orders.length === 0 ? (
                <Typography color="text.secondary">Você ainda não fez nenhum pedido.</Typography>
            ) : (
                <Stack spacing={3}>
                    {orders.map((order) => (
                        <Paper key={order.id} elevation={0} sx={{ p: 3, border: '1px solid #eee', borderRadius: 4 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">Pedido #{order.id}</Typography>
                                    {/* Ajustado para order.store?.name que é o padrão que vimos no seu log */}
                                    <Typography variant="h6" fontWeight="700">{order.store?.name || 'Loja Vizinha'}</Typography>
                                </Box>
                                <Chip
                                    label={order.status.toUpperCase()}
                                    color={getStatusColor(order.status) as any}
                                    sx={{ fontWeight: 'bold' }}
                                />
                            </Box>

                            <Divider sx={{ my: 2 }} />
                            
                            {/* {(order.status === 'pendente' || order.status === 'PENDENTE') && ( */}
                                <Button
                                    variant="contained"
                                    color="warning"
                                    size="small"
                                    sx={{ mb: 2 }}
                                    onClick={() => handleOpenPix(order)}
                                    startIcon={<QrCodeScanner />}
                                >
                                    Pagar com PIX
                                </Button>
                            {/* )} */}

                            {order.items?.map((item: any) => (
                                <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2">{item.quantity}x {item.product?.nome}</Typography>
                                    <Typography variant="body2" fontWeight="600">R$ {Number(item.price).toFixed(2)}</Typography>
                                </Box>
                            ))}

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 2, borderTop: '1px dashed #eee' }}>
                                <Typography fontWeight="700">Total</Typography>
                                <Typography fontWeight="800" color="primary">R$ {Number(order.totalAmount).toFixed(2)}</Typography>
                            </Box>
                        </Paper>
                    ))}
                </Stack>
            )}

            {/* ADICIONADO: Modal de Pagamento PIX */}
            <Dialog open={showPixModal} onClose={() => setShowPixModal(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>Pagamento via PIX</DialogTitle>
                <DialogContent sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" gutterBottom>
                        Loja: <strong>{pedidoSelecionado?.store?.name}</strong>
                    </Typography>
                    
                    <Box sx={{ my: 2, p: 2, border: '1px solid #eee', borderRadius: 4, display: 'inline-block' }}>
                        {pedidoSelecionado?.store?.qrCodePixUrl ? (
                            <img 
                                src={`${API_URL}/uploads/${pedidoSelecionado.store.qrCodePixUrl}`} 
                                alt="QR Code" 
                                style={{ width: 200, height: 200, objectFit: 'contain' }} 
                            />
                        ) : (
                            <Box sx={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
                                <Typography variant="caption" color="error">QR Code não disponível</Typography>
                            </Box>
                        )}
                    </Box>

                    <Paper elevation={0} sx={{ bgcolor: '#f0f7ff', p: 2, borderRadius: 2, mb: 2 }}>
                        <Typography variant="caption" display="block">CHAVE PIX</Typography>
                        <Typography variant="body1" fontWeight="bold" sx={{ wordBreak: 'break-all' }}>
                            {pedidoSelecionado?.store?.chavePix || "Não informada"}
                        </Typography>
                        <Button 
                            size="small" 
                            startIcon={<ContentCopy />}
                            onClick={() => {
                                if (pedidoSelecionado?.store?.chavePix) {
                                    navigator.clipboard.writeText(pedidoSelecionado.store.chavePix);
                                    toast.success("Chave copiada!");
                                }
                            }}
                        >
                            Copiar Chave
                        </Button>
                    </Paper>
                    
                    <Alert severity="info">Após o pagamento, o lojista mudará o status do seu pedido.</Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowPixModal(false)} fullWidth color="inherit">Fechar</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};