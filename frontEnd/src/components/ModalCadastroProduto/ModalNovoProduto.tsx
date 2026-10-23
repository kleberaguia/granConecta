import {
  Dialog, DialogTitle, DialogContent, TextField, Button,
  Stack, Box, Typography, CircularProgress, MenuItem
} from '@mui/material';
import { CloudUpload, AutoFixHigh } from '@mui/icons-material';
import api from '../../api/api';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext'; // Importe seu contexto de autenticação
import { API_URL } from '../../utils/config';

interface Category {
  id: string;
  name: string;
  tipo: string;
}

export default function ModalNovoProduto({ open, onClose, plano, onSuccess, dadosProduto }: any) {
  const { user } = useAuth(); // Pegamos o usuário logado
  const [loadingManual, setLoadingManual] = useState(false);
  const [loadingIA, setLoadingIA] = useState(false);

  const isAnyLoading = loadingManual || loadingIA;
  const [categoryTipo, setCategoryTipo] = useState('');

  const [foto, setFoto] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [descricao, setDescricao] = useState('');
  const [estoque, setEstoque] = useState('0');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await api.get('/categorias/global');
        const data = Array.isArray(res.data) ? res.data : (res.data.categories || res.data.data || []);
        setCategories(data);

        if (dadosProduto) {
          setNome(dadosProduto.name || '');
          setPreco(dadosProduto.price || '');
          setDescricao(dadosProduto.description || '');
          setEstoque(dadosProduto.stock || '0');
          setCategoryId(dadosProduto.categoryId || '');
          // Ajuste a URL do preview para bater com seu backend
          setPreview(dadosProduto.image_url ? `${API_URL}/uploads/${dadosProduto.image_url}` : '');
        }
      } catch (error) {
        console.error("Erro ao carregar dados do modal:", error);
      }
    };

    if (open) {
      loadData();
    } else {
      resetForm();
    }
  }, [open, dadosProduto]);

  const resetForm = () => {
    setNome(''); setPreco(''); setDescricao(''); setEstoque('0');
    setCategoryId(''); setFoto(null); setPreview('');
  };

  const handleSalvar = async (usarIA: boolean) => {
    if (!nome || !preco) return toast.error("Preencha nome e preço!");
    if (!categoryId) return toast.error("Selecione uma categoria!");

    if (usarIA) setLoadingIA(true); else setLoadingManual(true);

    try {
      const formData = new FormData();
      formData.append('name', nome);
      formData.append('price', preco);
      formData.append('description', descricao || '');
      formData.append('stock', estoque);
      formData.append('categoryId', categoryId);
      formData.append('tipo', categoryTipo);

      // ✅ IMPORTANTE: O Backend precisa saber de qual loja é esse produto
      // Usamos usuarioId pois seu backend provavelmente busca a loja vinculada a esse user
      if (user?.id) {
        formData.append('usuarioId', user.id);
      }

      // ✅ Nome do campo batendo com a sua Route: upload.fields([{ name: 'foto_perfil' }])

      if (foto) {
        formData.append('foto_perfil', foto);
      }

      let response;

      for (const [key, value] of formData.entries()) {
        console.log(key, value);
      }

      if (dadosProduto?.id) {
        // Edição
        response = await api.put(`/produtos/lojas/${dadosProduto.id}`, formData);
      } else {
        // Criação
        response = await api.post('/produtos/lojas', formData);
      }

      if (response.status === 200 || response.status === 201) {
        toast.success("Produto salvo com sucesso!");
        resetForm();
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error("Erro detalhado:", error.response?.data);
      const msg = error.response?.data?.message || "Erro ao salvar produto";
      toast.error(msg);
    } finally {
      setLoadingIA(false);
      setLoadingManual(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle fontWeight="bold">
        {dadosProduto ? 'Editar Produto' : 'Novo Produto'}
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Box
            onClick={() => !isAnyLoading && document.getElementById('file-modal-input')?.click()}
            sx={{
              border: '2px dashed #ccc', borderRadius: 3, p: 2, textAlign: 'center',
              cursor: isAnyLoading ? 'not-allowed' : 'pointer', bgcolor: '#fafafa',
              '&:hover': { bgcolor: isAnyLoading ? '#fafafa' : '#f0f0f0' }
            }}
          >
            <input id="file-modal-input" type="file" hidden accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setFoto(e.target.files[0]);
                  setPreview(URL.createObjectURL(e.target.files[0]));
                }
              }}
            />
            {preview ? (
              <img src={preview} alt="Preview" style={{ width: '100%', maxHeight: 150, objectFit: 'contain' }} />
            ) : (
              <Stack alignItems="center" spacing={1}>
                <CloudUpload color="disabled" fontSize="large" />
                <Typography variant="caption">Clique para enviar foto</Typography>
              </Stack>
            )}
          </Box>

          <TextField label="Nome" fullWidth value={nome} onChange={(e) => setNome(e.target.value)} disabled={isAnyLoading} />

          <Stack direction="row" spacing={2}>
            <TextField label="Preço" type="number" fullWidth value={preco} onChange={(e) => setPreco(e.target.value)} disabled={isAnyLoading} />
            <TextField label="Estoque" type="number" fullWidth value={estoque} onChange={(e) => setEstoque(e.target.value)} disabled={isAnyLoading} />
          </Stack>

          <TextField
            label="Categoria"
            select
            fullWidth
            value={categoryId}
            onChange={(e) => {
              const selected = categories.find(c => c.id === e.target.value);
              setCategoryId(e.target.value);
              setCategoryTipo(selected?.tipo || '');
            }}
            disabled={isAnyLoading}
          >
            {categories.map((cat: any) => (
              <MenuItem key={cat.id} value={cat.id}>
                {cat.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField label="Descrição" multiline rows={2} fullWidth value={descricao} onChange={(e) => setDescricao(e.target.value)} disabled={isAnyLoading} />

          <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
            <Button
              fullWidth variant="outlined"
              onClick={() => handleSalvar(false)}
              disabled={isAnyLoading}
              sx={{ height: 45 }}
            >
              {loadingManual ? <CircularProgress size={24} /> : 'Salvar'}
            </Button>

            {plano === 'PREMIUM' && !dadosProduto && (
              <Button
                fullWidth variant="contained" color="secondary"
                onClick={() => handleSalvar(true)}
                disabled={isAnyLoading}
                startIcon={loadingIA ? <CircularProgress size={20} color="inherit" /> : <AutoFixHigh />}
              >
                {loadingIA ? 'Gerando...' : 'IA'}
              </Button>
            )}
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}