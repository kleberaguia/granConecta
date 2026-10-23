import { Box, Paper, Typography, Button } from "@mui/material";

export default function EmpProdutos() {
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5">Produtos da Loja</Typography>
        <Typography sx={{ mt: 2 }}>
          Aqui você gerencia seus produtos e adiciona novos itens.
        </Typography>

        <Button variant="contained" sx={{ mt: 3 }}>
          Adicionar Produto
        </Button>
      </Paper>
    </Box>
  );
}
