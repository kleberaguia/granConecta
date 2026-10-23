// src/components/ImageUploadControl/ImageUploadControl.tsx
import React, { useState } from 'react';
import { Box, Button, CircularProgress, Typography, IconButton, TextField } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../../api/api'; // Ajuste o caminho
import { API_URL } from '../../utils/config'; // Ajuste o caminho

interface ImageUploadControlProps {
  currentImageUrl: string; // A URL da imagem atual (pode ser vazia)
  onImageUrlChange: (newUrl: string) => void; // Callback para quando a URL mudar (upload ou remoção)
  label?: string;
  helperText?: string;
}

export default function ImageUploadControl({
  currentImageUrl,
  onImageUrlChange,
  label = "Imagem",
  helperText = "Carregue uma imagem ou cole a URL"
}: ImageUploadControlProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null); // Para controlar o input type="file"

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file); // 'file' deve corresponder ao campo do Multer no backend

    try {
      const response = await api.post('/upload', formData, { // Seu endpoint de upload
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.url) {
        onImageUrlChange(response.data.url); // Atualiza a URL no componente pai
      } else {
        setError('O servidor não retornou a URL do arquivo.');
      }
    } catch (err) {
      console.error('Erro ao fazer upload:', err);
      setError('Falha ao carregar o arquivo. Tente novamente.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Limpa o input file para permitir o mesmo arquivo novamente
      }
    }
  };

  const handleRemoveImage = () => {
    onImageUrlChange(""); // Remove a imagem limpando a URL
  };

  const handleManualUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onImageUrlChange(e.target.value); // Permite digitar a URL manualmente
  };

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="caption" display="block">{label}</Typography>
      
      {/* Input de arquivo escondido */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
        id="image-upload-input" // ID para associar ao botão
      />

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <label htmlFor="image-upload-input">
          <Button
            variant="outlined"
            component="span" // Importante para o label associar ao input file
            startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
            disabled={uploading}
            size="small"
          >
            {uploading ? 'Carregando...' : 'Carregar'}
          </Button>
        </label>
        <TextField
          value={currentImageUrl}
          onChange={handleManualUrlChange}
          placeholder="/uploads/nome-da-imagem.jpg"
          fullWidth
          size="small"
          helperText={helperText}
          InputProps={{
            endAdornment: currentImageUrl && (
              <IconButton size="small" onClick={handleRemoveImage} title="Remover imagem">
                <DeleteIcon fontSize="small" />
              </IconButton>
            ),
          }}
        />
      </Box>

      {error && <Typography color="error" variant="caption">{error}</Typography>}

      {currentImageUrl && (
        <Box sx={{ mt: 1 }}>
          <img 
            src={`${API_URL}${currentImageUrl}`} 
            alt="Pré-visualização" 
            style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'cover', borderRadius: '4px' }} 
          />
        </Box>
      )}
    </Box>
  );
}