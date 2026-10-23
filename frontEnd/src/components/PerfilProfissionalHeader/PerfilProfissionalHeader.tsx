
import { Box, Typography, Avatar, Container, Paper, Stack } from '@mui/material';
import { MapPin, Star, ShieldCheck } from 'lucide-react';
import { BadgeVizinho } from '../BadgeVizinho/BadgeVizinho' // O componente que criamos antes

interface PerfilHeaderProps {
  dados: {
    nome_negocio: string;
    categoria: string;
    foto_perfil: string;
    tipo_usuario: 'MORADOR' | 'EXTERNO';
    bloco_apartamento?: string; // Ex: "Bloco B - Ap 42"
    avaliacao: number;
    total_vendas: number;
  };
}

export const PerfilProfissionalHeader = ({ dados }: PerfilHeaderProps) => {
  const isNeighbor = dados.tipo_usuario === 'MORADOR';

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        width: '100%', 
        bgcolor: '#f8f9fa', 
        borderBottom: '1px solid #e0e0e0',
        pt: { xs: 4, md: 6 },
        pb: 4
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          alignItems: { xs: 'center', md: 'flex-end' },
          gap: 3 
        }}>
          
          {/* Avatar com Borda de Destaque se for Vizinho */}
          <Avatar
            src={dados.foto_perfil}
            sx={{
              width: 120,
              height: 120,
              border: `4px solid ${isNeighbor ? '#2e7d32' : '#fff'}`,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              bgcolor: '#ccc'
            }}
          />

          <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
            <Stack 
              direction="row" 
              spacing={1} 
              alignItems="center" 
              justifyContent={{ xs: 'center', md: 'flex-start' }}
              sx={{ mb: 1 }}
            >
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a1a' }}>
                {dados.nome_negocio}
              </Typography>
              {/* O Badge de Vizinho aqui no topo ao lado do nome */}
              <BadgeVizinho tipo={dados.tipo_usuario} />
            </Stack>

            <Typography variant="h6" color="primary" sx={{ mb: 2, fontWeight: 500 }}>
              {dados.categoria}
            </Typography>

            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={{ xs: 1, sm: 3 }} 
              justifyContent={{ xs: 'center', md: 'flex-start' }}
              sx={{ color: '#666' }}
            >
              {/* Se for vizinho, mostra a localização interna, se não, mostra "Parceiro" */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <MapPin size={16} />
                <Typography variant="body2">
                  {isNeighbor ? `Residente: ${dados.bloco_apartamento}` : "Parceiro Homologado"}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Star size={16} color="#faaf00" fill="#faaf00" />
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {dados.avaliacao} (24 avaliações)
                </Typography>
              </Box>

              {isNeighbor && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#2e7d32' }}>
                  <ShieldCheck size={16} />
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    Identidade Verificada
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        </Box>
      </Container>
    </Paper>
  );
};