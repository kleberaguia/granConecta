import { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, Card, CardMedia, CardContent, IconButton } from '@mui/material';
import { Add as AddIcon, Delete } from '@mui/icons-material';
import api from '../../api/api'; // Ajuste o caminho conforme seu projeto
import ModalNovoProduto from '../../components/ModalCadastroProduto/ModalNovoProduto'; // O modal que criamos antes
import toast from 'react-hot-toast';
import { API_URL } from '../../utils/config';

export default function MeusProdutosTab({ plano }: { plano: string }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [_loading, setLoading] = useState(true);

  const carregarProdutos = async () => {
    try {
      const response = await api.get('/produtos/meus-produtos');
      console.log('meus produtos ',response)
      setProdutos(response.data);
    } catch (err) {
      toast.error("Erro ao carregar seus produtos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarProdutos(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este produto?")) return;
    try {
      await api.delete(`/produtos/${id}`);
      toast.success("Produto removido");
      carregarProdutos();
    } catch (err) {
      toast.error("Erro ao excluir.");
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h6" fontWeight="bold">Gestão de Estoque</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setModalOpen(true)}
          sx={{ borderRadius: 2 }}
        >
          Novo Produto
        </Button>
      </Box>

      <Grid container spacing={2}>
        {produtos.map((p) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={p.id}>
            <Card sx={{ borderRadius: 3, position: 'relative' }}>
              <CardMedia
                component="img"
                height="140"
                image= {p.imageUrl ? `${API_URL}/uploads/images/${p.imageUrl}` : '/placeholder.png'}
                alt={p.name}
              />
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold">{p.name}</Typography>
                <Typography variant="body2" color="primary">R$ {p.price}</Typography>
                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                  <IconButton size="small" onClick={() => handleDelete(p.id)} color="error">
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <ModalNovoProduto
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        plano={plano}
        onRefresh={carregarProdutos}
      />
    </Box>
  );
}