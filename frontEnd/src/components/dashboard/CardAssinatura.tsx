import { Card, CardContent, Typography, Button, Chip, Box } from '@mui/material';
import { Pix, ReceiptLong } from '@mui/icons-material';

export function CardAssinatura({ assinatura }: any) {
    return (
        <Card sx={{ borderRadius: 4, border: '1px solid #e2e8f0', mb: 3 }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">Minha Assinatura</Typography>
                    <Chip 
                        label={assinatura.status === 'ativo' ? 'EM DIA' : 'PENDENTE'} 
                        color={assinatura.status === 'ativo' ? 'success' : 'error'} 
                        size="small" 
                    />
                </Box>
                
                <Typography variant="body2" color="textSecondary">
                    Plano: <strong>{assinatura.planoNome}</strong> ({assinatura.frequencia})
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    Próximo pagamento: <strong>{assinatura.dataVencimento}</strong>
                </Typography>

                {assinatura.status !== 'ativo' && (
                    <Button 
                        variant="contained" 
                        fullWidth 
                        startIcon={<Pix />}
                        sx={{ bgcolor: '#32bcad', '&:hover': { bgcolor: '#2ba699' } }}
                    >
                        Pagar Mensalidade
                    </Button>
                )}
                
                <Button 
                    variant="text" 
                    fullWidth 
                    size="small" 
                    startIcon={<ReceiptLong />}
                    sx={{ mt: 1, color: '#64748b' }}
                >
                    Histórico de Pagamentos
                </Button>
            </CardContent>
        </Card>
    );
}