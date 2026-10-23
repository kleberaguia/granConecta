import { 
  
  Card, 
  Stack, 
  Box, 
  Typography, 
  Chip, 
  Button,
  alpha, // Importação necessária para o efeito de cor
  Grid
} from '@mui/material';
import { 
  Place, 
  EventNote, 
  CheckCircleOutline, 
  ArrowForward,
  SearchOff 
} from '@mui/icons-material';

interface ListaDemandasProps {
  oportunidades: any[];
  meusTrabalhos: any[];
  onSelecionar: (servico: any) => void;
}

export default function ListaDemandas({ oportunidades, meusTrabalhos, onSelecionar }: ListaDemandasProps) {
  
  if (oportunidades.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8, opacity: 0.6 }}>
        <SearchOff sx={{ fontSize: 64, mb: 2 }} />
        <Typography variant="h6">Nenhuma oportunidade disponível</Typography>
        <Typography variant="body2">Novos serviços aparecem aqui assim que publicados.</Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {oportunidades.map((op) => {
        const jaCandidatado = meusTrabalhos.some((t: any) => t.solicitacao_id === op.id);

        return (
          <Grid size={{ xs: 12 }} key={op.id}>
            <Card 
              variant="outlined" 
              sx={{ 
                p: 2.5, 
                borderRadius: 4, 
                transition: '0.2s',
                borderColor: jaCandidatado ? 'divider' : 'grey.300',
                bgcolor: jaCandidatado ? 'action.hover' : 'background.paper',
                '&:hover': {
                  borderColor: jaCandidatado ? 'divider' : 'primary.main',
                  boxShadow: jaCandidatado ? 'none' : 2
                }
              }}
            >
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between">
                
                <Box sx={{ flexGrow: 1 }}>
                  <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                    <Chip 
                      label={op.tipo?.nome || 'Serviço'} 
                      size="small" 
                      sx={{ 
                        fontWeight: 'bold',
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                        color: 'primary.main'
                      }} 
                    />
                    {jaCandidatado && (
                      <Chip 
                        icon={<CheckCircleOutline fontSize="small" />} 
                        label="Já me candidatei" 
                        size="small" 
                        variant="outlined"
                        color="success" 
                      />
                    )}
                  </Stack>

                  <Typography variant="h6" fontWeight="800" gutterBottom color={jaCandidatado ? 'text.secondary' : 'text.primary'}>
                    {op.titulo}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {op.descricao}
                  </Typography>

                  <Stack direction="row" spacing={3} color="text.disabled">
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Place sx={{ fontSize: 16 }} />
                      <Typography variant="caption" fontWeight="bold">
                        {op.morador?.bloco ? `Bloco ${op.morador.bloco}` : 'Condomínio'}
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <EventNote sx={{ fontSize: 16 }} />
                      <Typography variant="caption">
                        {new Date(op.createdAt).toLocaleDateString()}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>

                <Box sx={{ 
                  textAlign: { xs: 'left', sm: 'right' }, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'center',
                  minWidth: { sm: '180px' },
                  p: 2,
                  borderRadius: 3,
                  bgcolor: jaCandidatado ? 'transparent' : (theme) => alpha(theme.palette.success.main, 0.05)
                }}>
                  <Typography variant="caption" color="text.secondary">Sugestão de Valor</Typography>
                  <Typography variant="h5" color="success.main" fontWeight="900" sx={{ mb: 1.5 }}>
                    R$ {op.valor_sugerido?.toFixed(2)}
                  </Typography>

                  <Button 
                    variant={jaCandidatado ? "outlined" : "contained"}
                    disabled={jaCandidatado}
                    endIcon={!jaCandidatado && <ArrowForward />}
                    onClick={() => onSelecionar(op)}
                    fullWidth
                    sx={{ borderRadius: 2, textTransform: 'none' }}
                  >
                    {jaCandidatado ? "Aguardando" : "Candidatar-se"}
                  </Button>
                </Box>

              </Stack>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}