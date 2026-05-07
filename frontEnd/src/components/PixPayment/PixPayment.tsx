import { Box, Typography, Button, Paper, Stack, Alert } from "@mui/material";
import { QRCodeSVG } from "qrcode.react";
import { Copy, CheckCircle, Smartphone } from "lucide-react";
import { useState } from "react";

interface PixProps {
  // Agora recebemos o objeto de pagamento que seu Controller envia
  paymentData: any; 
  amount: number;
}

export const PixPayment = ({ paymentData, amount }: PixProps) => {
  const [copied, setCopied] = useState(false);
  console.log("Dados recebidos no PixPayment:", paymentData);

  const copyPasteCode = paymentData?.copiaCola; // Antes era transaction_data.qr_code
  const expirationDate = paymentData?.expiresAt; // Antes era date_of_expiration

  const handleCopy = () => {
    if (copyPasteCode) {
      navigator.clipboard.writeText(copyPasteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  if (!copyPasteCode) {
    return (
      <Alert severity="error">
        Não foi possível carregar os dados do PIX. Tente gerar o pagamento novamente.
      </Alert>
    );
  }

  return (
    <Paper 
      variant="outlined" 
      sx={{ 
        p: 3, 
        textAlign: 'center', 
        borderRadius: 4, 
        bgcolor: '#fff',
        border: '1px solid #e0e0e0'
      }}
    >
      <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" mb={1}>
        <Smartphone size={20} color="#00B1EA" />
        <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#333' }}>
          Pagamento Instantâneo via PIX
        </Typography>
      </Stack>
      
      <Typography variant="body2" color="text.secondary" mb={2}>
        Loja: <strong>{paymentData?.merchant_order_id || 'Loja GranConecta'}</strong>
      </Typography>

      {/* QR CODE REAL DO MERCADO PAGO */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        my: 2, 
        p: 2, 
        bgcolor: '#f9f9f9', 
        borderRadius: 3,
        border: '1px solid #eee'
      }}>
        <QRCodeSVG value={copyPasteCode} size={220} includeMargin />
      </Box>

      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2, px: 2 }}>
        Abra o app do seu banco, escolha "Pagar com PIX" e escaneie o código acima.
      </Typography>

      <Stack spacing={2}>
        <Button 
          variant="contained" 
          startIcon={copied ? <CheckCircle size={18} /> : <Copy size={18} />}
          onClick={handleCopy}
          sx={{ 
            bgcolor: copied ? '#2e7d32' : '#00B1EA', 
            '&:hover': { bgcolor: '#0094c4' },
            borderRadius: 3,
            textTransform: 'none',
            fontWeight: 'bold',
            py: 1.5
          }}
          fullWidth
        >
          {copied ? "Código Copiado!" : "Copiar Código Copia e Cola"}
        </Button>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1 }}>
            <Typography variant="caption" color="text.secondary">
                Total a pagar:
            </Typography>
            <Typography variant="h6" fontWeight="900" color="primary">
                R$ {amount.toFixed(2)}
            </Typography>
        </Box>

        {expirationDate && (
            <Typography variant="caption" color="error" fontWeight="bold">
                Expira em: {new Date(expirationDate).toLocaleTimeString()}
            </Typography>
        )}
      </Stack>
    </Paper>
  );
};