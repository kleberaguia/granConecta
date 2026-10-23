import { Container, Typography, Button, Paper, Stack } from '@mui/material';
import { CheckCircleOutline, ReceiptLong, Home } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';

export const OrderSuccess = () => {

    const searchParams = new URLSearchParams(window.location.search);
    const redirectPath = searchParams.get('redirect') || '/dashboard'; // Default vai pro dashboard

    const navigate = useNavigate();
    // Você pode passar o ID do pedido via URL se quiser mostrar o número
    const { orderId } = useParams();


    navigate(redirectPath);

    return (
        <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
                <CheckCircleOutline sx={{ fontSize: 100, color: '#4caf50', mb: 2 }} />
            </motion.div>

            <Typography variant="h4" fontWeight="800" gutterBottom>
                Pedido Realizado!
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Obrigado pela sua compra. O vendedor já foi notificado e em breve iniciará a preparação do seu pedido.
            </Typography>

            <Paper elevation={0} sx={{ p: 3, bgcolor: '#f8f9fa', borderRadius: 4, mb: 4, border: '1px dashed #ccc' }}>
                <Stack spacing={1}>
                    <Typography variant="subtitle2" color="text.secondary">Número do Pedido</Typography>
                    <Typography variant="h6" fontWeight="bold">#{orderId || '00234'}</Typography>
                </Stack>
            </Paper>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                <Button
                    variant="contained"
                    size="large"
                    startIcon={<Home />}
                    onClick={() => navigate('/')}
                    sx={{ borderRadius: 3, textTransform: 'none', px: 4 }}
                >
                    Voltar para o Início
                </Button>
                <Button
                    variant="outlined"
                    size="large"
                    startIcon={<ReceiptLong />}
                    onClick={() => navigate('/meus-pedidos')}
                    sx={{ borderRadius: 3, textTransform: 'none', px: 4 }}
                >
                    Ver Meus Pedidos
                </Button>
            </Stack>
        </Container>
    );
};