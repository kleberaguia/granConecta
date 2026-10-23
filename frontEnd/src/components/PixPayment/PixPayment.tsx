import { Box, Typography, Button, Paper, Stack } from "@mui/material";
import { ExternalLink, Smartphone } from "lucide-react";

interface PixProps {
  paymentData: any; 
  amount: number;
}

export const PixPayment = ({ paymentData, amount }: PixProps) => {
  
  const handleRedirect = () => {
    if (paymentData?.link_pagamento) {
      window.open(paymentData.link_pagamento, '_blank');
    }
  };

  return (
    <Paper 
      variant="outlined" 
      sx={{ p: 3, textAlign: 'center', borderRadius: 4, bgcolor: '#fff' }}
    >
      <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" mb={2}>
        <Smartphone size={20} color="#00B1EA" />
        <Typography variant="subtitle1" fontWeight="bold">
          Finalize seu Pagamento
        </Typography>
      </Stack>

      <Typography variant="body2" color="text.secondary" mb={3}>
        Para pagar via **PIX**, Boleto ou Cartão, clique no botão abaixo para abrir o ambiente seguro do Mercado Pago.
      </Typography>

      <Stack spacing={2}>
        <Button 
          variant="contained" 
          endIcon={<ExternalLink size={18} />}
          onClick={handleRedirect}
          sx={{ 
            bgcolor: '#00B1EA', 
            '&:hover': { bgcolor: '#0094c4' },
            borderRadius: 3,
            textTransform: 'none',
            fontWeight: 'bold',
            py: 1.5
          }}
          fullWidth
        >
          Ir para o Pagamento
        </Button>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1 }}>
            <Typography variant="caption" color="text.secondary">Total a pagar:</Typography>
            <Typography variant="h6" fontWeight="900" color="primary">
                R$ {Number(amount).toFixed(2)}
            </Typography>
        </Box>
      </Stack>
    </Paper>
  );
};