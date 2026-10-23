import { Box, Typography } from '@mui/material';
import { QRCodeSVG } from 'qrcode.react'; // Biblioteca de geração
import { QrCode as QrIcon } from 'lucide-react'; // Ícone (opcional)


// Na tela de "Meu Pedido" do cliente
export const OrderTracking = ({ order }: any) => {
    return (
        <Box textAlign="center" p={3} bgcolor="#fff" borderRadius={4}>
            <Typography variant="h6" fontWeight="900">Seu Código de Entrega</Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
                Apresente este QR Code ao entregador
            </Typography>

            {/* O QR Code contém o código OTP que o lojista precisa validar */}
            <Box display="flex" flexDirection="column" alignItems="center" p={2} bgcolor="#f9f9f9" borderRadius={2}>
                {/* Este é o componente que REALMENTE gera o código dinâmico */}
                <QRCodeSVG
                    value={String(order.deliveryCode)}
                    size={200}
                    fgColor="#2563eb"
                    level="H"
                    includeMargin={true}
                />

                <Box mt={2} display="flex" alignItems="center" gap={1}>
                    <QrIcon size={16} className="text-gray-400" />
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">
                        TOKEN DE SEGURANÇA DIGITAL
                    </Typography>
                </Box>
            </Box>

            <Typography variant="h4" fontWeight="900" mt={2} letterSpacing={4}>
                {order.deliveryCode}
            </Typography>
        </Box>
    );
};