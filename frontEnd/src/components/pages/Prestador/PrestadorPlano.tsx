import { Box, Paper, Typography, Button } from "@mui/material";

export default function PrestadorPlano() {
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5">Plano do Prestador</Typography>
        <Typography sx={{ mt: 2 }}>
          Veja seu plano atual e faça upgrade para Premium.
        </Typography>

        <Button variant="contained" sx={{ mt: 3 }}>
          Fazer Upgrade
        </Button>
      </Paper>
    </Box>
  );
}
