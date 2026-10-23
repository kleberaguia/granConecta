import { Box, Paper, Typography } from "@mui/material";

export default function MoradorDashboard() {
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5">Dashboard do Morador</Typography>
        <Typography sx={{ mt: 2 }}>
          Aqui você verá suas solicitações, status e avisos.
        </Typography>
      </Paper>
    </Box>
  );
}
