import { LinearProgress, Typography, Paper, Stack, Chip, Box } from '@mui/material';
import { differenceInDays, parseISO, format } from 'date-fns';

export default function ListaMeusBanners({ banners }: { banners: any[] }) {
    return (
        <Stack spacing={2} sx={{ mb: 4 }}>
            {banners.map((banner) => {
                const inicio = parseISO(banner.data_inicio || banner.createdAt);
                const fim = parseISO(banner.data_fim);
                const hoje = new Date();
                
                const totalDias = differenceInDays(fim, inicio);
                const diasPassados = Math.max(0, differenceInDays(hoje, inicio));
                const progresso = Math.min(100, (diasPassados / totalDias) * 100);
                
                return (
                    <Paper key={banner.id} sx={{ p: 2, borderRadius: '12px' }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle1" fontWeight="bold">{banner.titulo}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Vencimento: {format(fim, 'dd/MM/yyyy')} • Investimento: <b>R$ {banner.valor_pago || '0,00'}</b>
                                </Typography>
                            </Box>
                            <Chip 
                                label={banner.pago ? (progresso >= 100 ? "Finalizado" : "Ativo") : "Aguardando Pagamento"} 
                                color={banner.pago ? (progresso >= 100 ? "default" : "success") : "warning"}
                                size="small"
                            />
                        </Stack>

                        {banner.pago && progresso < 100 && (
                            <Box sx={{ mt: 2 }}>
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography variant="caption">{diasPassados} dias usados</Typography>
                                    <Typography variant="caption">{totalDias - diasPassados} dias restantes</Typography>
                                </Stack>
                                <LinearProgress 
                                    variant="determinate" 
                                    value={progresso} 
                                    sx={{ height: 8, borderRadius: 5, bgcolor: '#f1f5f9' }} 
                                />
                            </Box>
                        )}
                    </Paper>
                );
            })}
        </Stack>
    );
}