import { Box, Button, Card, CardContent, Typography, Divider } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import StarIcon from '@mui/icons-material/Star';
import { TODOS_RECURSOS } from '../constants/planos'; // Ajuste o caminho se necessário

const BRANCO_GELO = '#f8fafc';

interface PlanoData {
    id: string;
    titulo: string;
    precoMensal: number;
    precoAnual: number;
    desc: string;
    vantagens: string[];
    destaque: boolean;
}

interface CardPlanoProps {
    plano: PlanoData;
    frequencia: 'mensal' | 'anual';
    selecionado: boolean;
    onSelect: (id: string) => void;
}

const CardPlano_Prestador = ({ plano, frequencia, selecionado, onSelect }: CardPlanoProps) => {
    const valorMensalExibido = frequencia === 'anual' ? plano.precoAnual / 12 : plano.precoMensal;
    const economiaPorc = Math.round(100 - (plano.precoAnual / (plano.precoMensal * 12)) * 100);
    const mostrarEconomia = frequencia === 'anual' && economiaPorc > 0;

    return (
        <Card sx={{
            bgcolor: '#181818',
            color: BRANCO_GELO,
            borderRadius: 8,
            transition: '0.4s',
            // Borda verde se selecionado, azul se destaque, cinza se normal
            border: selecionado ? '3px solid #22c55e' : (plano.destaque ? '2px solid #00d4ff' : '1px solid #2a2a2a'),
            boxShadow: selecionado ? '0 0 20px rgba(34, 197, 94, 0.4)' : 'none',
            position: 'relative',
            overflow: 'hidden',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            cursor: 'pointer',
            '&:hover': { transform: 'translateY(-10px)' }
        }} onClick={() => onSelect(plano.id)}>

            {mostrarEconomia && (
                <Box sx={{
                    position: 'absolute', top: 22, right: -40, bgcolor: '#22c55e', color: 'white',
                    px: 6, py: 0.5, transform: 'rotate(45deg)', fontWeight: '900', fontSize: '0.7rem',
                    zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                }}>
                    {economiaPorc}% OFF
                </Box>
            )}

            <CardContent sx={{ p: 5, pt: 7, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                {plano.destaque && (
                    <Box sx={{
                        position: 'absolute', top: 20, left: 30,
                        bgcolor: '#00d4ff', color: 'black',
                        px: 1.5, py: 0.3, borderRadius: 1,
                        fontWeight: 'bold', fontSize: '0.65rem',
                        display: 'flex', alignItems: 'center', gap: 0.5
                    }}>
                        <StarIcon sx={{ fontSize: 12 }} /> {plano.id === "PREMIUM" ? "RECOMENDADO" : "MAIS POPULAR"}
                    </Box>
                )}

                <Typography variant="h4" fontWeight="900" textAlign="center">{plano.titulo}</Typography>

                <Box sx={{ textAlign: 'center', my: 4 }}>
                    <Typography variant="body2" sx={{ color: '#555', textDecoration: 'line-through', mb: -0.5 }}>
                        De: R$ {plano.precoMensal.toFixed(2).replace('.', ',')}
                    </Typography>
                    <Typography variant="h3" fontWeight="900" sx={{ color: selecionado ? '#22c55e' : (plano.destaque ? '#00d4ff' : BRANCO_GELO) }}>
                        <Typography component="span" variant="h6" sx={{ verticalAlign: 'top', mr: 0.5 }}>R$</Typography>
                        {valorMensalExibido.toFixed(2).replace('.', ',')}
                        <Typography component="span" variant="body2" sx={{ color: '#666' }}>/mês</Typography>
                    </Typography>
                </Box>

                <Divider sx={{ mb: 4, bgcolor: '#2a2a2a' }} />

                <Box sx={{ flexGrow: 1 }}>
                    {TODOS_RECURSOS.map((item) => {
                        const possui = plano.vantagens.includes(item.key);
                        return (
                            <Typography key={item.key} variant="body2" sx={{ mb: 2, display: 'flex', alignItems: 'center', color: possui ? BRANCO_GELO : '#888888' }}>
                                {possui ? <CheckCircleOutlineIcon sx={{ fontSize: 18, mr: 1.5, color: '#22c55e' }} /> : <CancelOutlinedIcon sx={{ fontSize: 18, mr: 1.5, color: '#ef4444' }} />}
                                {item.texto}
                            </Typography>
                        );
                    })}
                </Box>

                <Button
                    fullWidth
                    variant="contained"
                    sx={{
                        mt: 4, py: 2, borderRadius: 4, fontWeight: '900',
                        bgcolor: selecionado ? '#22c55e' : (plano.destaque ? '#00d4ff' : BRANCO_GELO),
                        color: 'black',
                        '&:hover': { bgcolor: selecionado ? '#16a34a' : '#fff' }
                    }}
                >
                    {selecionado ? 'SELECIONADO' : 'SELECIONAR PLANO'}
                </Button>
            </CardContent>
        </Card>
    );
};

export default CardPlano_Prestador;