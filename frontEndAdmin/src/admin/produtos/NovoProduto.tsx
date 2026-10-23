// src/admin/NovoProduto.tsx
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
  // 1. NOVAS IMPORTAÇÕES
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@mui/material";
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

// 2. INTERFACE PARA CATEGORIA
interface Category {
  id: number;
  name: string;
}

export default function NovoProduto() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // 3. NOVOS ESTADOS
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");

  // Estados para os campos do formulário
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(1);
  const [status, setStatus] = useState(true);
  const [linkContato, setLinkContato] = useState("");

  // Estados para a imagem
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // 4. useEffect PARA BUSCAR CATEGORIAS
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // 🚨 Certifique-se que esta é a sua rota de categorias
        const res = await api.get("/categorias");
        console.log('categoriaaaaaaaaaaaa ',res.data)
        setCategories(res.data);
      } catch (error) {
        console.error("Falha ao carregar categorias:", error);
        alert("Não foi possível carregar as categorias.");
      }
    };

    fetchCategories();
  }, []); // '[]' garante que rode apenas uma vez

  // Funções para a imagem (sem alteração)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // ... validações (imagem, categoria) ...

    setLoading(true);
    // Certifique-se que as chaves batem com o que o Service espera
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("price", String(price));
    formData.append("stock", String(stock));
    formData.append("categoryId", categoryId);

    // ✅ ADICIONE ESTAS DUAS LINHAS:
    formData.append("status", String(status));
    formData.append("link_contato", linkContato); // Garanta que o nome bate com o controller

    // O arquivo DEVE ser 'file' para o Multer funcionar no routerProduto
    if (imageFile) {
      formData.append("file", imageFile);
    } else {
      // Caso queira garantir que o código pare aqui se não houver foto
      alert("Por favor, selecione uma imagem.");
      return;
    }
    try {
      // Envie sem cabeçalhos manuais, o Axios resolve o boundary do FormData
      await api.post("/produtos/admin", formData);
      alert("Produto criado com sucesso!");
      navigate("/admin/products");
    } catch (error: any) {
      console.error("Erro detalhado:", error.response?.data);
      alert(`Erro: ${error.response?.data?.message || "Falha ao criar produto"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 800, margin: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Novo Produto
      </Typography>

      <Box component="form" onSubmit={handleSubmit}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 3
          }}
        >
          {/* Lado Esquerdo: Imagem */}
          <Box sx={{ width: { xs: '100%', md: '33.33%' } }}>
            <Typography variant="subtitle1" gutterBottom>
              Imagem do Produto
            </Typography>
            <Avatar
              src={imagePreview || undefined}
              variant="rounded"
              sx={{
                width: "100%",
                height: 200,
                bgcolor: 'grey.100',
                border: '2px dashed',
                borderColor: 'grey.300',
              }}
            >
              <AddPhotoAlternateIcon sx={{ fontSize: 60, color: 'grey.400' }} />
            </Avatar>
            <input
              type="file"
              accept="image/*"
              hidden
              ref={fileInputRef}
              onChange={handleImageChange}
            />
            <Button
              variant="outlined"
              onClick={triggerFileInput}
              fullWidth
              sx={{ mt: 2 }}
            >
              Selecionar Imagem
            </Button>
          </Box>

          {/* Lado Direito: Campos */}
          <Box sx={{ width: { xs: '100%', md: '66.66%' } }}>
            <TextField
              label="Nome do Produto"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              sx={{ mb: 2 }}
            />

            <TextField
              label="Descrição"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={4}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Link de Contato (Ex: WhatsApp)"
              value={linkContato}
              onChange={(e) => setLinkContato(e.target.value)}
              required
              fullWidth
              sx={{ mb: 2 }}
            />

            {/* 5. NOVO CAMPO DE CATEGORIA */}
            <FormControl fullWidth required sx={{ mb: 2 }}>
              <InputLabel id="category-select-label">Categoria</InputLabel>
              <Select
                labelId="category-select-label"
                value={categoryId}
                label="Categoria"
                onChange={(e) => setCategoryId(e.target.value as string)}
              >
                {/* Opção "Nenhuma" (opcional) */}
                <MenuItem value="">
                  <em>Selecione...</em>
                </MenuItem>
                {/* Mapeia as categorias buscadas da API */}
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Sub-grid de Preço/Estoque */}
            <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
              <TextField
                label="Preço (R$)"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                type="number"
                required
                fullWidth
              />
              <TextField
                label="Estoque"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                type="number"
                required
                fullWidth
              />
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={status}
                  onChange={(e) => setStatus(e.target.checked)}
                />
              }
              label={status ? "Produto Ativo" : "Produto Inativo"}
            />
          </Box>
        </Box>

        {/* Botão de Salvar */}
        <Box sx={{ textAlign: 'right', mt: 3 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ minWidth: 150 }}
          >
            {loading ? <CircularProgress size={24} /> : "Salvar Produto"}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}