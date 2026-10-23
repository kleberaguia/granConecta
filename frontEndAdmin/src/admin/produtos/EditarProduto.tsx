// src/admin/produtos/EditarProduto.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Avatar,
  Switch,
  FormControlLabel,
  CircularProgress,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@mui/material";
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";

// 🚨 AJUSTE: URL base para exibir a imagem que vem do banco
const API_URL =import.meta.env.VITE_API_URL || "http://localhost:3000";

interface Category {
  id: number;
  name: string;
}

export default function EditarProduto() {
  const { id } = useParams(); // Pega o ID da URL
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false); 
  const [loadingData, setLoadingData] = useState(true);

  // Estados
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState(""); // String para funcionar no Select
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(1);
  const [status, setStatus] = useState(true);
  const [linkContato, setLinkContato] = useState("");

  // Estados da Imagem
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // 1. CARREGAR DADOS
  useEffect(() => {
    const loadData = async () => {
      try {
        // Busca Categorias e Produto em paralelo
        const [resCategories, resProduct] = await Promise.all([
          api.get("/categorias"),
          api.get(`/produtos/${id}`)
        ]);

        setCategories(resCategories.data);
        const product = Array.isArray(resProduct.data) ? resProduct.data[0] : resProduct.data;

        console.log('aquiii ', product)
        
        setName(product.name || "");
        setDescription(product.description || "");
        
        // 1. Corrige o NaN: Se não houver preço, usa 0
        setPrice(product.price ? Number(product.price) : 0);
        
        // 2. Corrige o NaN: Se não houver estoque, usa 0
        setStock(product.stock ? Number(product.stock) : 0);
        
        setStatus(product.status ?? true); // Usa '??' para respeitar se for false
        setLinkContato(product.link_contato || "");         
        setCategoryId(product.categoryId ? String(product.categoryId) : "");    

        // Monta a URL da imagem
        if (product.imagemUrl) {
          setImagePreview(`${API_URL}${product.imagemUrl}`);
        }

      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        alert("Erro ao carregar o produto.");
        navigate("/admin/products");
      } finally {
        setLoadingData(false);
      }
    };

    if (id) loadData();
  }, [id, navigate]);

  // Funções de Imagem
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => { setImagePreview(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };
  const triggerFileInput = () => fileInputRef.current?.click();

  // 2. SALVAR (UPDATE)
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!categoryId) { alert("Selecione uma categoria."); return; }
    
    setLoading(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("price", String(price));
    formData.append("stock", String(stock));
    formData.append("status", String(status));
    formData.append("link_contato", linkContato);
    formData.append("categoryId", categoryId);
    
    // Só envia arquivo se houver uma NOVA imagem selecionada
    if (imageFile) {
      formData.append("file", imageFile);
    }

    try {
      await api.put(`/produtos/${id}`, formData);
      alert("Produto atualizado com sucesso!");
      navigate("/admin/products");
    } catch (error: any) {
      console.error("Falha ao atualizar:", error.response?.data);
      const msg = error.response?.data?.message || error.message;
      alert(`Erro ao atualizar: \n${JSON.stringify(msg)}`);
    } finally {
      setLoading(false);
    }
  };

  // 3. EXCLUIR (DELETE)
  const handleDelete = async () => {
    if (window.confirm("Tem certeza que deseja EXCLUIR este produto?")) {
      try {
        setLoading(true);
        await api.delete(`/produtos/${id}`);
        alert("Produto excluído com sucesso!");
        navigate("/admin/products");
      } catch (error: any) {
        console.error("Erro ao excluir:", error);
        alert("Erro ao excluir produto.");
        setLoading(false);
      }
    }
  };

  if (loadingData) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;
  }

  return (
    <Paper sx={{ p: 3, maxWidth: 800, margin: 'auto' }}>
      
      {/* Cabeçalho com Botão Excluir */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Editar Produto</Typography>
        <Button 
          variant="outlined" 
          color="error" 
          startIcon={<DeleteIcon />}
          onClick={handleDelete}
          disabled={loading}
        >
          Excluir
        </Button>
      </Box>

      <Box component="form" onSubmit={handleSave}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          
          {/* Lado Esquerdo: Imagem */}
          <Box sx={{ width: { xs: '100%', md: '33.33%' } }}>
            <Typography variant="subtitle1" gutterBottom>Imagem</Typography>
            <Avatar
              src={imagePreview || undefined}
              variant="rounded"
              sx={{
                width: "100%", height: 200, bgcolor: 'grey.100',
                border: '2px dashed', borderColor: 'grey.300',
              }}
            >
              <AddPhotoAlternateIcon sx={{ fontSize: 60, color: 'grey.400' }} />
            </Avatar>
            <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleImageChange} />
            <Button variant="outlined" onClick={triggerFileInput} fullWidth sx={{ mt: 2 }}>
              Alterar Imagem
            </Button>
          </Box>

          {/* Lado Direito: Campos */}
          <Box sx={{ width: { xs: '100%', md: '66.66%' } }}>
            <TextField label="Nome" value={name} onChange={(e) => setName(e.target.value)} required fullWidth sx={{ mb: 2 }} />
            <TextField label="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} multiline rows={4} fullWidth sx={{ mb: 2 }} />
            <TextField label="Link de Contato" value={linkContato} onChange={(e) => setLinkContato(e.target.value)} required fullWidth sx={{ mb: 2 }} />

            <FormControl fullWidth required sx={{ mb: 2 }}>
              <InputLabel id="cat-label">Categoria</InputLabel>
              <Select 
                labelId="cat-label" 
                value={categoryId} 
                label="Categoria" 
                onChange={(e) => setCategoryId(e.target.value as string)}
              >
                {categories.map((c) => (
                  // 🚨 AJUSTE CRÍTICO: value={String(c.id)} para bater com o state
                  <MenuItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
              <TextField label="Preço (R$)" value={price} onChange={(e) => setPrice(Number(e.target.value))} type="number" required fullWidth />
              <TextField label="Estoque" value={stock} onChange={(e) => setStock(Number(e.target.value))} type="number" required fullWidth />
            </Box>

            <FormControlLabel
              control={<Switch checked={status} onChange={(e) => setStatus(e.target.checked)} />}
              label={status ? "Produto Ativo" : "Produto Inativo"}
            />
          </Box>
        </Box>

        <Box sx={{ textAlign: 'right', mt: 3 }}>
          <Button type="submit" variant="contained" color="primary" disabled={loading} startIcon={!loading && <SaveIcon />} sx={{ minWidth: 150 }}>
            {loading ? <CircularProgress size={24} /> : "Salvar Alterações"}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}