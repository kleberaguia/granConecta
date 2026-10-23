import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  IconButton, 
  CircularProgress 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

// IMPORTAÇÃO ESSENCIAL
import { uploadImageFile, API_URL } from '../../api/api';

interface PastoralItem {
  title: string;
  description: string;
  image: string;
  link?: string;
}

interface PastoralListEditorProps {
  data: { items: PastoralItem[] };
  onChange: (data: { items: PastoralItem[] }) => void;
}

export default function PastoralListEditor({ data, onChange }: PastoralListEditorProps) {
  const items = data.items || [];
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  // --- 1. ATUALIZAR UM ITEM ---
  const updateItem = (index: number, field: keyof PastoralItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange({ items: newItems });
  };

  // --- 2. ADICIONAR ITEM ---
  const addItem = () => {
    onChange({
      items: [...items, { title: '', description: '', image: '' }]
    });
  };

  // --- 3. REMOVER ITEM ---
  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    onChange({ items: newItems });
  };

  // --- 4. UPLOAD DE IMAGEM ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIndex(index);
    try {
      // Sobe a imagem
      const serverPath = await uploadImageFile(file);      
      // Salva no item
      updateItem(index, 'image', serverPath);
      
    } catch (error) {
      console.error(error);
      alert('Erro ao enviar imagem.');
    } finally {
      setUploadingIndex(null);
    }
  };

  // --- FUNÇÃO PARA GERAR URL SEGURA ---
  const getImageUrl = (path: string) => {
      if (!path) return "";
      
      // 1. Corrige barras invertidas do Windows (\ -> /)
      const cleanPath = path.replace(/\\/g, '/');

      // 2. Se já tem http, usa. Se não, concatena API_URL
      if (cleanPath.startsWith('http')) return cleanPath;
      
      return `${API_URL}${cleanPath}`;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Lista de Pastorais / Grupos</Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Adicione os cards que aparecerão na grade.
      </Typography>

      {items.map((item, index) => {
        
        // Gera a URL para exibir
        const previewUrl = getImageUrl(item.image);       
       
        return (
            <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2, display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            
            <Box sx={{ width: { xs: '100%', sm: 150 }, display: 'flex', flexDirection: 'column', gap: 1 }}>
                
                <Box 
                sx={{ 
                    width: '100%', height: 100, 
                    bgcolor: '#f5f5f5', borderRadius: 1, 
                    overflow: 'hidden', border: '1px solid #ddd',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                >
                {item.image ? (
                    <img 
                    src={previewUrl} 
                    alt="Preview" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    onError={(e) => {
                        console.error("❌ Erro ao carregar imagem:", previewUrl);
                        // Opcional: colocar uma borda vermelha para avisar
                        (e.target as HTMLImageElement).style.border = '2px solid red';
                    }}
                    />
                ) : (
                    <AddPhotoAlternateIcon color="disabled" />
                )}
                </Box>

                <Button
                component="label"
                variant="outlined"
                size="small"
                disabled={uploadingIndex === index}
                startIcon={uploadingIndex === index ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                >
                {item.image ? 'Trocar' : 'Foto'}
                <input type="file" hidden accept="image/*" onChange={(e) => handleImageUpload(e, index)} />
                </Button>
            </Box>

            {/* --- COLUNA DOS CAMPOS --- */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box display="flex" gap={2}>
                    <TextField
                    label="Nome da Pastoral"
                    value={item.title}
                    onChange={(e) => updateItem(index, 'title', e.target.value)}
                    fullWidth
                    size="small"
                    />
                    <IconButton color="error" onClick={() => removeItem(index)}>
                        <DeleteIcon />
                    </IconButton>
                </Box>

                <TextField
                label="Breve Descrição"
                value={item.description}
                onChange={(e) => updateItem(index, 'description', e.target.value)}
                fullWidth
                multiline
                rows={2}
                size="small"
                />
            </Box>

            </Paper>
        );
      })}

      <Button variant="contained" onClick={addItem} fullWidth sx={{ mt: 1 }}>
        + Adicionar Item
      </Button>
    </Box>
  );
}