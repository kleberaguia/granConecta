import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Box,
  Typography,
  Button,
  Stack
} from '@mui/material';
import { Add, Remove, ShoppingCartCheckout, DeleteOutline } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../api/api';

// Tipo para os itens do carrinho
interface CartItem {
  id: string;
  name: string;
  price: number | string;
  image?: string;
  quantity: number;
}

interface CarrinhoLateralProps {
  open: boolean;
  onClose: () => void;
  storeName: string;
  storeId: string;
  categoria_tag: string;
}

export function CarrinhoLateral({ open, onClose, storeName, storeId, categoria_tag }: CarrinhoLateralProps) {
  const { cart, updateCartQuantity, user } = useAuth();
  const navigate = useNavigate();

  const normalizePrice = (price: number | string): number => {
    if (typeof price === 'string') {
      const parsed = parseFloat(price.replace(/[^\d,.-]/g, '').replace(',', '.'));
      return isNaN(parsed) ? 0 : parsed;
    }
    return price > 0 ? price : 0;
  };

  // ✅ pega somente o carrinho da loja atual
  const storeCart: CartItem[] = cart[storeId] || [];

  // ✅ total correto
  const total = storeCart.reduce((acc: number, item: CartItem) => {
    const price = normalizePrice(item.price);
    return acc + price * item.quantity;
  }, 0);

  const handleCheckout = async () => {
    if (storeCart.length === 0) {
      toast.error("Sua sacola está vazia!");
      return;
    }

    // 🔒 BLOQUEIO DE SEGURANÇA (Caso deslogado)
    if (!user) {
      toast("Você precisa se identificar para finalizar a compra");

      const tagNormalizada = String(categoria_tag || "").toUpperCase();
      const loginPath = (tagNormalizada === "SERVICE" || tagNormalizada === "SERVICO")
        ? "/login/prestador"
        : "/login/morador";

      // Redireciona enviando o estado do carrinho atual daquela loja específica
      navigate(loginPath, {
        state: {
          redirectTo: "/checkout",
          cartBackup: storeCart,
          storeId: storeId,
          storeName: storeName
        }
      });

      return;
    }

    // 🔐 VALIDAÇÃO DE PERMISSÃO ATUALIZADA (INCLUSÃO DE VISITANTE)
    const allowedTypes = ["MORADOR", "PRESTADOR", "VISITANTE"];

    if (!allowedTypes.includes(String(user.tipo).toUpperCase())) {
      toast.error("Seu perfil não tem permissão para finalizar compras.");
      return;
    }

    try {
      // Rastreamento analítico do checkout - Enviando o storeId também!
      await api.post('/vendas/tracking-checkout', {
        usuarioId: user.id,
        storeId: storeId, // 🟢 Adicionado para o tracking ficar completo
        itens: storeCart,
        total: total
      });

      onClose();
      navigate('/checkout', { state: { storeId } }); // Passa o ID da loja alvo para o checkout
    } catch (error) {
      console.error("Erro ao registrar intenção de checkout:", error);
      // Mesmo com erro de tracking, permitimos avançar para não perder a venda
      onClose();
      navigate('/checkout', { state: { storeId } });
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} container={document.body}>
      <Box sx={{
        width: { xs: '100vw', sm: 380 },
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'relative'
      }}>

        {/* HEADER */}
        <Box sx={{ p: 3, pb: 0 }}>
          <Typography variant="h6" fontWeight="bold" display="flex" justifyContent="space-between" alignItems="center">
            Minha Sacola
            <IconButton onClick={onClose}>
              <DeleteOutline color="action" />
            </IconButton>
          </Typography>

          {storeName && (
            <Typography variant="caption" color="primary" fontWeight="bold">
              LOJA: {storeName.toUpperCase()}
            </Typography>
          )}

          <Divider sx={{ my: 2 }} />
        </Box>

        {/* LISTA */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 3 }}>
          {storeCart.length === 0 ? (
            <Box textAlign="center" sx={{ mt: 8 }}>
              <Typography color="text.secondary">
                Sua sacola está vazia.
              </Typography>
            </Box>
          ) : (
            <List>
              {storeCart.map((item: CartItem) => (
                <ListItem
                  key={item.id}
                  disableGutters
                  secondaryAction={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <IconButton
                        size="small"
                        onClick={() => updateCartQuantity(storeId, item.id, -1)}
                      >
                        <Remove fontSize="small" />
                      </IconButton>

                      <Typography fontWeight="medium">
                        {item.quantity}
                      </Typography>

                      <IconButton
                        size="small"
                        onClick={() => updateCartQuantity(storeId, item.id, 1)}
                      >
                        <Add fontSize="small" />
                      </IconButton>
                    </Stack>
                  }
                >
                  <ListItemText
                    primary={item.name}
                    secondary={`R$ ${normalizePrice(item.price).toFixed(2)}`}
                    primaryTypographyProps={{ fontWeight: 600, sx: { maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        {/* FOOTER */}
        {storeCart.length > 0 && (
          <Box sx={{
            p: 3,
            borderTop: '1px solid #eee',
            bgcolor: 'white',
            pb: { xs: 4, sm: 4 }, // Ajustado espaçamento inferior para evitar sobreposição em telas P
            boxShadow: '0 -4px 10px rgba(0,0,0,0.05)'
          }}>
            <Box sx={{ mb: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
              <Typography display="flex" justifyContent="space-between" variant="body1">
                <span>Total:</span>
                <strong>
                  R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
              </Typography>
            </Box>

            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<ShoppingCartCheckout />}
              sx={{
                py: 1.8,
                borderRadius: 3,
                textTransform: 'none',
                fontSize: '1.1rem',
                fontWeight: 'bold',
              }}
              onClick={handleCheckout}
            >
              Finalizar Pedido
            </Button>
          </Box>
        )}
      </Box>
    </Drawer>
  );
}