import { Card, CardMedia, CardContent, Typography, Box } from "@mui/material";
import { BadgeVizinho } from "../BadgeVizinho/BadgeVizinho";

export const CardServico = ({ prestador }: any) => {
  return (
    <Card sx={{ maxWidth: 345, borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="140"
          image={prestador.foto_servico || "/placeholder-servico.jpg"}
          alt={prestador.nome_negocio}
        />
        {/* O BADGE POSICIONADO SOBRE A IMAGEM */}
        <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
          <BadgeVizinho tipo={prestador.tipo_usuario} />
        </Box>
      </Box>

      <CardContent>
        <Typography variant="h6" fontWeight="bold">
          {prestador.nome_negocio}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {prestador.descricao_bio}
        </Typography>
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <Typography variant="caption" color="primary" fontWeight="bold">
             {prestador.categoria}
           </Typography>
           {/* Também pode ser usado aqui embaixo se preferir */}
        </Box>
      </CardContent>
    </Card>
  );
};