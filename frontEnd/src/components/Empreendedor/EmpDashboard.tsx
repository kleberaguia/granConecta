import { Box, Paper, Typography } from "@mui/material";

export default function EmpDashboard() {
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5">Dashboard do Empreendedor</Typography>
        <Typography sx={{ mt: 2 }}>
          Gestão de produtos, vendas e informações da loja.
        </Typography>
      </Paper>
    </Box>
  );
}
