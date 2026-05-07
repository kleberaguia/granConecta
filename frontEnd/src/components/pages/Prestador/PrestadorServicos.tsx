import { Box, Paper, Typography } from "@mui/material";

export default function PrestadorServicos() {
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5">Serviços do Prestador</Typography>
        <Typography sx={{ mt: 2 }}>
          Aqui você verá a lista de serviços que você aceitou ou concluiu.
        </Typography>
      </Paper>
    </Box>
  );
}
