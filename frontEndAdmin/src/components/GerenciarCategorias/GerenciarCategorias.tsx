import { useState, useEffect } from "react";
import { 
  Box, Typography, TextField, Button, Paper, Stack, 
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, IconButton, Chip 
} from "@mui/material";
import { Delete, Add } from "@mui/icons-material";
import api from "../../api/api";
import { toast } from 'react-hot-toast';


export default function GerenciarCategorias() {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("PRODUTO");
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);

  const buscarCategorias = async () => {
    try {
      const res = await api.get("/categorias/global"); // Sua nova rota do backend
      setCategorias(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { buscarCategorias(); }, []);

  const handleAdd = async () => {
    if (!nome) return toast.error("Digite o nome");
    try {
      setLoading(true);
      await api.post("/categorias", { nome, tipo });
      toast.success("Categoria criada!");
      setNome("");
      buscarCategorias();
    } catch (err) {
      toast.error("Erro ao criar");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Excluir esta categoria?")) return;
    try {
      await api.delete(`/categorias/${id}`);
      toast.success("Removida!");
      buscarCategorias();
    } catch (err) {
      toast.error("Erro ao remover");
    }
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" mb={2}>
        📦 Categorias Globais do Sistema
      </Typography>

      {/* FORMULÁRIO DE CADASTRO */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid #e2e8f0' }} elevation={0}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField 
            label="Nome da Categoria" 
            fullWidth 
            size="small"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          <TextField
            select
            label="Tipo"
            size="small"
            sx={{ minWidth: 150 }}
            SelectProps={{ native: true }}
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="PRODUTO">Produto</option>
            <option value="SERVICO">Serviço</option>
          </TextField>
          <Button 
            variant="contained" 
            startIcon={<Add />} 
            onClick={handleAdd}
            disabled={loading}
          >
            Adicionar
          </Button>
        </Stack>
      </Paper>

      {/* TABELA DE LISTAGEM */}
      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell><b>Nome</b></TableCell>
              <TableCell><b>Tipo</b></TableCell>
              <TableCell align="right"><b>Ações</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categorias.map((cat: any) => (
              <TableRow key={cat.id} hover>
                <TableCell>{cat.name || cat.nome}</TableCell>
                <TableCell>
                  <Chip 
                    label={cat.tipo} 
                    size="small" 
                    color={cat.tipo === 'PRODUTO' ? 'primary' : 'secondary'} 
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton color="error" size="small" onClick={() => handleDelete(cat.id)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}