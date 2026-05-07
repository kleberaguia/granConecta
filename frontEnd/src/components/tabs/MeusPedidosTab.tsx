import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Chip, Divider, CircularProgress, Stack, Button, Alert, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import api from '../../api/api';
import toast from 'react-hot-toast';
import { ContentCopy, QrCodeScanner } from '@mui/icons-material';
import { API_URL } from '../../utils/config';


export default function MeusPedidosTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPixModal, setShowPixModal] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<any>(null);


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

  const handleOpenPix = (pedido: any) => {
    setPedidoSelecionado(pedido);
    setShowPixModal(true);
  };

  useEffect(() => {
    api.get('/order/orders/my')
      .then(res => setOrders(res.data))
      .catch(() => toast.error("Erro ao carregar pedidos"))
      .finally(() => setLoading(false));
  }, []);


  console.log('orders ', orders)
  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>;

  return (
    <Box>
      {orders.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
          <Typography color="text.secondary">Você ainda não realizou compras na vitrine.</Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {orders.map((order) => (
            <Paper key={order.id} variant="outlined" sx={{ p: 3, borderRadius: 4, border: '1px solid #eee' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" color="primary" fontWeight="bold">
                  #{order.id} • {order.store?.nome}
                </Typography>
                <Chip
                  label={order.status.toUpperCase()}
                  size="small"
                  color={getStatusColor(order.status) as any}
                  sx={{ fontWeight: '900', fontSize: '10px' }}
                />
              </Box>

              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                Realizado em: {new Date(order.createdAt).toLocaleDateString()}
              </Typography>

              {order.items?.map((item: any) => (
                <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', my: 0.5 }}>
                  <Typography variant="body2">{item.quantity}x {item.product?.nome}</Typography>
                  <Typography variant="body2">R$ {Number(item.price).toFixed(2)}</Typography>
                </Box>
              ))}

              <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />
              {(order.status === 'pendente' || order.status === 'PENDENTE') && (
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
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" fontWeight="bold">Total</Typography>
                <Typography variant="body2" fontWeight="900">
                  R$ {Number(order.totalAmount).toFixed(2)}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Stack>
      )}

      <Dialog open={showPixModal} onClose={() => setShowPixModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>Pagamento via PIX</DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Typography variant="body2" gutterBottom>
            Loja: <strong>{pedidoSelecionado?.store?.name}</strong>
          </Typography>

          <Box sx={{ my: 2, p: 2, border: '1px solid #eee', borderRadius: 4, display: 'inline-block' }}>
            {pedidoSelecionado?.store?.qrCodePixUrl ? (
              <img
                src={`${API_URL}/uploads/images/${pedidoSelecionado.store.qrCodePixUrl}`}
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
    </Box>
  );
}