import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Tabs, Tab, Stack, Button,
  Card, CardContent, Chip, CircularProgress, Divider
} from '@mui/material';
import api from '../../api/api';
import toast from 'react-hot-toast';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import PaymentIcon from '@mui/icons-material/Payment';
import PersonIcon from '@mui/icons-material/Person';
import HomeIcon from '@mui/icons-material/Home';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ShieldIcon from '@mui/icons-material/Shield';

export function StoreOrdersPanel() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('TODOS');

  const carregarPedidos = async () => {
    try {
      setLoading(true);
      // Bate na rota da loja do empreendedor logado
      const res = await api.get('/order/orders/store');
      console.log('ressssssssssssssss ', res)
      setOrders(Array.isArray(res.data) ? res.data : res.data.pedidos || []);
    } catch (err: any) {
      console.error(
        "Erro ao carregar pedidos:",
        err?.response?.status,
        err?.response?.data
      );
      toast.error("Não foi possível carregar a lista de pedidos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarPedidos();
  }, []);

  const alterarStatusPedido = async (pedidoId: number, novoStatus: string) => {
    try {
      await api.patch(`/order/orders/${pedidoId}/status`, { status: novoStatus });
      toast.success(`Pedido #${pedidoId} movido com sucesso!`);
      carregarPedidos();
    } catch (err) {
      console.error("Erro ao mudar status:", err);
      toast.error("Erro ao atualizar o status do pedido");
    }
  };

  // Mapeamento dos Enums do seu Model (Order.ts) para exibição amigável
  const statusMap: { [key: string]: { label: string; color: any; fase: string } } = {
    'pendente': { label: 'Aguardando PIX', color: 'error', fase: '1. Pagamento' },
    'PENDENTE': { label: 'Aguardando PIX', color: 'error', fase: '1. Pagamento' },
    'pending': { label: 'Aguardando PIX', color: 'error', fase: '1. Pagamento' },
    'pago': { label: 'Pago - Iniciar', color: 'success', fase: '2. Preparo' },
    'APPROVED': { label: 'Pago - Iniciar', color: 'success', fase: '2. Preparo' },
    'APROVADO': { label: 'Pago - Iniciar', color: 'success', fase: '2. Preparo' },
    'em_preparo': { label: 'Em Preparo', color: 'warning', fase: '2. Preparo' },
    'EM_PREPARO': { label: 'Em Preparo', color: 'warning', fase: '2. Preparo' },
    'em_transporte': { label: 'A Caminho', color: 'info', fase: '3. Entrega' },
    'SAIU_PARA_ENTREGA': { label: 'A Caminho', color: 'info', fase: '3. Entrega' },
    'entregue': { label: 'Finalizado', color: 'default', fase: '4. Concluído' },
    'FINALIZADO': { label: 'Finalizado', color: 'default', fase: '4. Concluído' },
  };

  const pedidosFiltrados = orders.filter(order => {
    if (statusFilter === 'TODOS') return true;
    if (statusFilter === 'PAGO') return order.status === 'APPROVED' || order.status === 'APROVADO' || order.status === 'pago';
    return order.status === statusFilter || order.status?.toLowerCase() === statusFilter.toLowerCase();
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="900" gutterBottom>
          Esteira de Produção & Pedidos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Monitore o status do Pix em custódia e faça a gestão das etapas do pedido.
        </Typography>
      </Box>

      {/* TABS DE FILTRO */}
      <Paper sx={{ mb: 4, borderRadius: '12px', overflow: 'hidden' }} variant="outlined">
        <Tabs
          value={statusFilter}
          onChange={(_, valor) => setStatusFilter(valor)}
          variant="scrollable"
          scrollButtons="auto"
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab value="TODOS" label={`Todos (${orders.length})`} />
          <Tab value="PAGO" label={`Prontos p/ Preparar (${orders.filter(o => ['APPROVED', 'APROVADO', 'pago'].includes(o.status)).length})`} />
          <Tab value="em_preparo" label={`Em Preparo (${orders.filter(o => ['EM_PREPARO', 'em_preparo'].includes(o.status)).length})`} />
          <Tab value="em_transporte" label={`A Caminho (${orders.filter(o => ['SAIU_PARA_ENTREGA', 'em_transporte'].includes(o.status)).length})`} />
          <Tab value="entregue" label={`Finalizados (${orders.filter(o => ['FINALIZADO', 'entregue'].includes(o.status)).length})`} />
        </Tabs>
      </Paper>

      {/* LISTAGEM DE CARDS */}
      {pedidosFiltrados.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '16px' }} variant="outlined">
          <Typography color="text.secondary">Nenhum pedido localizado nesta etapa.</Typography>
        </Paper>
      ) : (
        <Stack spacing={3}>
          {pedidosFiltrados.map((pedido) => {
            // Identifica se o pagamento já foi confirmado
            const statusLower = pedido.status?.toLowerCase();
            const isPago = ['approved', 'aprovado', 'pago', 'em_preparo', 'em_transporte', 'saiu_para_entrega', 'entregue', 'finalizado'].includes(statusLower);
            const isAguardando = ['pendente', 'pending'].includes(statusLower);

            const currentStatus = statusMap[pedido.status] || { label: pedido.status, color: 'default', fase: 'Desconhecida' };

            // 🟢 LEITURA CORRIGIDA CONFORME SEU MODEL (Order.ts)
            const compradorNome = pedido.customer?.name || pedido.clienteNome || "Usuário não identificado";
            const compradorTel = pedido.customer?.telefone || "Não informado";
            const enderecoDestino = pedido.deliveryMode === 'retirada'
              ? "RETIRADA NA LOJA (O cliente vai buscar)"
              : (pedido.deliveryAddress || "Endereço não preenchido");

            return (
              <Card
                key={pedido.id}
                variant="outlined"
                sx={{
                  borderRadius: '16px',
                  boxShadow: '0px 2px 10px rgba(0,0,0,0.03)',
                  borderLeft: `6px solid ${isAguardando ? '#d32f2f' : pedido.status?.toLowerCase().includes('preparo') ? '#ed6c02' : '#2e7d32'}`
                }}
              >
                <CardContent sx={{ p: 3 }}>

                  {/* CABEÇALHO: Informações de Status e Custódia */}
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" gap={1}>
                      <Typography variant="h6" fontWeight="bold">
                        Pedido #{pedido.id}
                      </Typography>

                      {/* Indicador de Fase Atual */}
                      <Chip label={`Fase atual: ${currentStatus.fase}`} variant="outlined" size="small" sx={{ fontWeight: '500' }} />

                      {/* 🔒 INDICADOR SE ESTÁ EM CUSTÓDIA DA GRANCONECTA */}
                      {isPago ? (
                        <Chip
                          icon={<ShieldIcon style={{ color: '#fff', fontSize: 16 }} />}
                          label="PAGAMENTO EM CUSTÓDIA"
                          color="success"
                          size="small"
                          sx={{ fontWeight: 'bold', bgcolor: '#2e7d32', color: '#fff' }}
                        />
                      ) : (
                        <Chip
                          label="AGUARDANDO CONFIRMAÇÃO"
                          color="error"
                          variant="outlined"
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      )}
                    </Stack>

                    <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
                      <AccessTimeIcon sx={{ fontSize: 16 }} />
                      <Typography variant="caption">
                        {pedido.createdAt ? new Date(pedido.createdAt).toLocaleString('pt-BR') : 'Horário pendente'}
                      </Typography>
                    </Stack>
                  </Stack>

                  <Divider sx={{ my: 1.5 }} />

                  {/* CORPO: Cliente/Endereço vs Itens */}
                  <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1.2fr' }} gap={3}>

                    {/* COLUNA ESQUERDA: Quem fez o pedido e Endereço */}
                    <Stack spacing={2}>
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                          <PersonIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                          <Typography variant="subtitle2" fontWeight="700">Comprador / Usuário</Typography>
                        </Stack>
                        <Typography variant="body2" fontWeight="600" sx={{ color: '#2c3e50' }}>
                          {compradorNome}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Contato: {compradorTel}
                        </Typography>
                      </Box>

                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                          <HomeIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                          <Typography variant="subtitle2" fontWeight="700">Endereço de Destino</Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ bgcolor: '#f1f2f6', p: 1.5, borderRadius: '8px', border: '1px solid #e4e7eb' }}>
                          {enderecoDestino}
                        </Typography>
                      </Box>
                    </Stack>

                    {/* COLUNA DIREITA: Ficha de Produção dos Itens */}
                    <Box sx={{ bgcolor: '#f8f9fa', p: 2, borderRadius: '12px', border: '1px solid #f0f0f0' }}>
                      <Typography variant="subtitle2" fontWeight="700" sx={{ mb: 1.5, color: '#2c3e50' }}>
                        Itens para Preparar
                      </Typography>

                      <Stack spacing={1} sx={{ mb: 2 }}>
                        {pedido.items && pedido.items.length > 0 ? (
                          pedido.items.map((item: any, idx: number) => (
                            <Stack key={idx} direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2">
                                <Box component="span" sx={{ fontWeight: 'bold', color: 'primary.main', mr: 1, bgcolor: '#e3f2fd', px: 1, py: 0.2, borderRadius: '4px' }}>
                                  {item.quantity || 1}x
                                </Box>
                                {item.product?.name || item.name || "Produto cadastrado"}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" fontWeight="500">
                                R$ {Number(item.price || 0).toFixed(2)}
                              </Typography>
                            </Stack>
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            Nenhum item mapeado ou encontrado na estrutura do pedido.
                          </Typography>
                        )}
                      </Stack>

                      <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2" fontWeight="bold">Valor Total:</Typography>
                        <Typography variant="subtitle1" fontWeight="900" color="primary.main">
                          R$ {Number(pedido.totalAmount).toFixed(2)}
                        </Typography>
                      </Stack>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* RODAPÉ: Botões de Movimentação da Esteira baseados no seu Enum OrderStatus */}
                  <Stack direction="row" justifyContent="flex-end">
                    <Stack direction="row" spacing={1}>

                      {/* Caso o status venha como pago ou aprovado pelo webhook */}
                      {(pedido.status === 'pago' || pedido.status === 'APPROVED' || pedido.status === 'APROVADO') && (
                        <Button
                          variant="contained"
                          color="warning"
                          startIcon={<RestaurantIcon />}
                          onClick={() => alterarStatusPedido(pedido.id, 'em_preparo')}
                          sx={{ textTransform: 'none', fontWeight: 'bold', borderRadius: '8px' }}
                        >
                          Aceitar e Iniciar Preparo
                        </Button>
                      )}

                      {/* Se estiver em preparo, move para em transporte */}
                      {(pedido.status === 'em_preparo' || pedido.status === 'EM_PREPARO') && (
                        <Button
                          variant="contained"
                          color="info"
                          startIcon={<LocalShippingIcon />}
                          onClick={() => alterarStatusPedido(pedido.id, 'em_transporte')}
                          sx={{ textTransform: 'none', fontWeight: 'bold', borderRadius: '8px' }}
                        >
                          Pronto! Despachar para Entrega
                        </Button>
                      )}

                      {/* Se saiu para entrega, finaliza como entregue */}
                      {(pedido.status === 'em_transporte' || pedido.status === 'SAIU_PARA_ENTREGA') && (
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => alterarStatusPedido(pedido.id, 'entregue')}
                          sx={{ textTransform: 'none', fontWeight: 'bold', borderRadius: '8px' }}
                        >
                          Confirmar Entrega / Finalizar
                        </Button>
                      )}

                      {/* Bloqueador de segurança caso o Pix ainda não tenha compensado no webhook */}
                      {isAguardando && (
                        <Button
                          variant="outlined"
                          color="error"
                          disabled
                          startIcon={<PaymentIcon />}
                          sx={{ textTransform: 'none', borderRadius: '8px' }}
                        >
                          Aguardando PIX (Não produzir ainda)
                        </Button>
                      )}
                    </Stack>
                  </Stack>

                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}