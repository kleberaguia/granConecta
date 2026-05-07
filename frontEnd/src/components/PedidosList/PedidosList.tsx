import { useEffect, useState } from "react";
import {
  Box, Card, CardContent, Typography, Button, Chip,
  Stack, Divider, Stepper, Step, StepLabel
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import { QRCodeSVG } from "qrcode.react";
import { socket } from "../Checkout/socket";
import { Banknote, ShieldCheck, ClipboardCheck } from "lucide-react";

const statusSteps = ['pendente', 'pago', 'preparando', 'saiu_entrega', 'entregue'];

const statusColor: any = {
  pendente: "warning",
  pago: "info",
  preparando: "info",
  saiu_entrega: "secondary",
  entregue: "success",
  cancelado: "error"
};

// Mapeamento para nomes amigáveis de pagamento
const paymentMethodName: any = {
  pix: "PIX",
  online: "Cartão Online",
  dinheiro: "Dinheiro",
  maquininha: "Cartão (Maquininha)"
};

const getStoreColor = (storeId: string) => {
  const colors = ['#1976d2', '#9c27b0', '#2e7d32', '#ed6c02', '#d32f2f', '#009688'];
  const index = parseInt(storeId.substring(0, 8), 16) % colors.length;
  return colors[index] || '#757575';
};

export const PedidosList = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
    socket.on("order_updated", (update) => {
      setOrders(prev => {
        const exists = prev.find(o => o.id === update.orderId);
        if (!exists) return prev;
        return prev.map(o => o.id === update.orderId ? { ...o, status: update.status } : o);
      });
    });
    return () => { socket.off("order_updated"); };
  }, []);

  const loadOrders = async () => {
    try {
      const res = await api.get("/order/orders/my");
      setOrders(res.data);
    } catch (err) { console.error("Erro ao carregar pedidos:", err); }
  };

  return (
    <Stack spacing={3} sx={{ p: 1, maxWidth: 500, mx: 'auto' }}>
      {orders.length === 0 && (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
          Você ainda não realizou nenhuma compra.
        </Typography>
      )}

      {orders.map(order => {
        const activeStep = statusSteps.indexOf(order.status);
        const storeColor = getStoreColor(String(order.storeId));
        
        // Lógica para identificar se o pagamento é na entrega
        const isPaymentOnDelivery = ['dinheiro', 'maquininha'].includes(order.paymentMethod);
        const paymentLabel = paymentMethodName[order.paymentMethod] || order.paymentMethod;

        return (
          <Card
            key={order.id}
            variant="outlined"
            sx={{
              borderRadius: 4,
              borderLeft: `6px solid ${storeColor}`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}
          >
            <CardContent>
              {/* CABEÇALHO DA LOJA */}
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle1" fontWeight="900" sx={{ color: storeColor }}>
                  {order.store?.name || "Loja Parceira"}
                </Typography>
                <Chip
                  label={order.status.toUpperCase()}
                  color={statusColor[order.status]}
                  size="small"
                  sx={{ fontWeight: 'bold', fontSize: '0.65rem' }}
                />
              </Box>

              {/* RESUMO DOS ITENS COMPRADOS */}
              <Box sx={{ bgcolor: '#fdfdfd', border: '1px solid #eee', p: 1.5, borderRadius: 2, mb: 2 }}>
                {order.items?.slice(0, 3).map((item: any) => (
                  <Typography key={item.id} variant="body2" color="text.primary" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span><strong>{item.quantity}x</strong> {item.name}</span>
                    <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                  </Typography>
                ))}
                {order.items?.length > 3 && (
                  <Typography variant="caption" color="text.secondary">
                    + {order.items.length - 3} itens no pedido...
                  </Typography>
                )}
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" fontWeight="900" textAlign="right">
                  Total: R$ {Number(order.totalAmount).toFixed(2)}
                </Typography>
              </Box>

              {/* ÁREA DE PAGAMENTO (REATIVADA) */}
              {order.status === 'pendente' && (
                <Box sx={{ mb: 2 }}>
                  {!isPaymentOnDelivery ? (
                    <Button 
                      variant="contained" 
                      fullWidth 
                      color="warning"
                      startIcon={<ClipboardCheck />}
                      onClick={() => navigate(`/pedido/${order.id}/pagar`)}
                      sx={{ borderRadius: 2, fontWeight: 'bold', textTransform: 'none' }}
                    >
                      Pagar com PIX / Cartão
                    </Button>
                  ) : (
                    <AlertPaymentOnDelivery method={paymentLabel} />
                  )}
                </Box>
              )}

              {/* SEGURANÇA E QR CODE */}
              {order.status === 'saiu_entrega' && order.deliveryCode && (
                <Box sx={{ my: 2, p: 2, bgcolor: '#f0f7ff', borderRadius: 3, border: '1px dashed #0066ff', textAlign: 'center' }}>
                  <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" mb={1}>
                    <ShieldCheck size={16} color="#0066ff" />
                    <Typography variant="caption" fontWeight="black" color="primary">
                      ENTREGA PROTEGIDA
                    </Typography>
                  </Stack>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                    <QRCodeSVG value={String(order.deliveryCode)} size={130} fgColor="#0066ff" includeMargin />
                  </Box>
                  <Typography variant="h4" fontWeight="900" color="primary" sx={{ letterSpacing: 2 }}>
                    {order.deliveryCode}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, px: 2 }}>
                    Mostre o código apenas ao receber seu pedido em mãos.
                  </Typography>
                </Box>
              )}

              {/* STEPPER DE PROGRESSO */}
              <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 2, '& .MuiStepLabel-label': { fontSize: '0.55rem' } }}>
                {statusSteps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label.toUpperCase()}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              <Button
                variant="contained"
                fullWidth
                size="large"
                sx={{
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: '900',
                  fontSize: '1rem',
                  mt: 2,
                  background: 'linear-gradient(45deg, #FF8C00 30%, #FF4500 90%)',
                  boxShadow: '0 4px 15px rgba(255, 69, 0, 0.4)',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #e67e00 30%, #e63e00 90%)',
                    transform: 'translateY(-2px)',
                  }
                }}
                onClick={() => navigate(`/pedido/${order.id}`)}
              >
                Ver Detalhes do Pedido
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
};

const AlertPaymentOnDelivery = ({ method }: { method: string }) => (
  <Box sx={{ p: 1.5, bgcolor: '#e8f5e9', borderRadius: 2, border: '1px solid #c8e6c9', display: 'flex', alignItems: 'center', gap: 1 }}>
    <Banknote size={20} color="#2e7d32" />
    <Typography variant="caption" color="#1b5e20" fontWeight="bold">
      Você escolheu pagar {method} no ato da entrega. Prepare o valor!
    </Typography>
  </Box>
);