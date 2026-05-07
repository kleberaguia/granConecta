import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Avatar, Button, Container, Grid, Paper,CircularProgress } from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '../../../api/api';

export default function PrestadorDetalhe() {
  const { id } = useParams(); // Pega o ID da URL
  const navigate = useNavigate();
  const [prestador, setPrestador] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDados = async () => {
      try {
        // Busca os dados do prestador específico
        const response = await api.get(`/vitrine/prestador/${id}`);
        setPrestador(response.data);
      } catch (err) {
        console.error("Erro ao carregar prestador");
      } finally {
        setLoading(false);
      }
    };
    fetchDados();
  }, [id]);

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 5 }} />;
  if (!prestador) return <Typography>Profissional não encontrado.</Typography>;

  return (
    <Box sx={{ bgcolor: '#121212', minHeight: '100vh', color: 'white', pb: 5 }}>
      {/* Botão Voltar */}
      <Box sx={{ p: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ color: '#FFD700' }}>
          Voltar para a lista
        </Button>
      </Box>

      <Container maxWidth="md">
        <Paper sx={{ p: 4, bgcolor: '#1e1e1e', color: 'white', borderRadius: 3, border: '1px solid #333' }}>
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: 'center' }}>
              <Avatar 
                src={prestador.foto_perfil_url} 
                sx={{ width: 150, height: 150, mx: 'auto', border: '3px solid #FFD700' }} 
              />
            </Grid>
            <Grid size={{xs:12,md: 8}}>
              <Typography variant="h4" fontWeight="bold">{prestador.nome}</Typography>
              <Typography variant="h6" color="#FFD700" gutterBottom>
                {prestador.servicos_oferecidos?.join(' • ')}
              </Typography>
              <Typography sx={{ opacity: 0.8, mb: 3 }}>{prestador.descricao_bio}</Typography>
              
              <Button 
                variant="contained" 
                fullWidth
                startIcon={<WhatsAppIcon />}
                sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#128C7E' }, fontWeight: 'bold' }}
                onClick={() => window.open(`https://wa.me/${prestador.telefone}`, '_blank')}
              >
                Falar com Profissional
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
}