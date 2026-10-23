import { Box, Paper, Typography, TextField, Button } from "@mui/material";

export default function CriarSolicitacao() {
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5">Criar Solicitação de Serviço</Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 3 }}>
          <TextField label="Título da solicitação" />
          <TextField label="Descrição" multiline rows={4} />
          <TextField label="Preferência de horário" />

          <Button variant="contained">Enviar Solicitação</Button>
        </Box>
      </Paper>
    </Box>
  );
}
