import { Box, Paper, Typography } from "@mui/material";

export default function PrestadorDashboard() {
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5">Dashboard do Prestador</Typography>
        <Typography sx={{ mt: 2 }}>
          Aqui você verá seus serviços aceitos, concluídos e pagamentos.
        </Typography>
      </Paper>
    </Box>
  );
}
