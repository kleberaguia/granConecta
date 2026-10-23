// src/components/ImageUploaderPreview/ImageUploaderPreview.tsx
import React, { useState } from "react";
import { Box, Button, Typography, Paper, IconButton, CircularProgress } from "@mui/material";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import DeleteIcon from "@mui/icons-material/Delete";
import api from "../../api/api"; // AJUSTE O CAMINHO PARA SUA API REAL
import { API_URL } from "../../utils/config"; // AJUSTE PARA SUA CONFIG DE URL BASE

interface ImageUploaderPreviewProps {
  currentImageUrl: string; // A URL da imagem que está atualmente salva
  onImageUrlChange: (newUrl: string) => void; // Callback para o componente pai quando a URL muda
  label?: string; // Título para o controle (ex: "Imagem da Pastoral")
  height?: number; // Altura do container de preview
}

export default function ImageUploaderPreview({
  currentImageUrl,
  onImageUrlChange,
  label = "Imagem",
  height = 200,
}: ImageUploaderPreviewProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file); // 'file' deve corresponder ao nome do campo no seu backend Multer

    try {
      // Ajuste a rota conforme seu backend (/upload/image ou similar)
      const response = await api.post("/upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Pega a URL retornada (ajuste conforme seu backend retorna: .url, .path, .filename)
      const url = response.data.url || response.data.path || `/uploads/${response.data.filename}`;

      onImageUrlChange(url); // Envia a nova URL para o componente pai
      
    } catch (error) {
      console.error("Erro no upload:", error);
      setError("Erro ao fazer upload da imagem.");
    } finally {
      setUploading(false);
      // Limpar o input de arquivo para permitir o re-upload do mesmo arquivo
      if (e.target) {
        e.target.value = ''; 
      }
    }
  };

  const handleRemoveImage = () => {
    onImageUrlChange(""); // Limpa a URL no componente pai
  };

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <Typography variant="caption" display="block">{label}</Typography>
      <Paper 
        variant="outlined" 
        sx={{ 
          width: "100%", 
          height: height, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          bgcolor: "#f5f5f5",
          overflow: "hidden",
          position: "relative"
        }}
      >
        {currentImageUrl ? (
          <>
            <img 
              src={`${API_URL}${currentImageUrl}`} // Assume API_URL está definido
              alt="Preview" 
              style={{ width: "100%", height: "100%", objectFit: "cover" }} 
            />
            <IconButton 
              color="error" 
              onClick={handleRemoveImage}
              sx={{ position: "absolute", top: 5, right: 5, bgcolor: "rgba(255,255,255,0.8)" }}
              aria-label="Remover imagem"
            >
              <DeleteIcon />
            </IconButton>
          </>
        ) : (
          <Typography variant="caption" color="text.secondary">Sem imagem</Typography>
        )}
      </Paper>

      <Button
        variant="contained"
        component="label" // Importante para associar o clique ao input de arquivo escondido
        startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <AddPhotoAlternateIcon />}
        disabled={uploading}
        fullWidth
      >
        {uploading ? "Enviando..." : "Escolher Imagem"}
        <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
      </Button>
      {error && <Typography color="error" variant="caption">{error}</Typography>}
    </Box>
  );
}