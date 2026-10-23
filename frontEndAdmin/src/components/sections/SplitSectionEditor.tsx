import { useState } from "react";
import { Box, Button, TextField, Typography, Paper, IconButton, CircularProgress } from "@mui/material";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

// Editor de Texto Rico (Opcional, se não tiver instalado use TextField)
import ReactQuill from "react-quill-new"; 
import "react-quill-new/dist/quill.snow.css";

// IMPORTANTE: Usar as funções centralizadas
import { uploadImageFile, API_URL } from "../../api/api"; 

interface SplitSectionData {
  title?: string;
  text?: string;
  imageUrl?: string;
  imagePosition?: "left" | "right";
}

interface SplitSectionEditorProps {
  data: SplitSectionData;
  onChange: (newData: SplitSectionData) => void;
}

export default function SplitSectionEditor({ data, onChange }: SplitSectionEditorProps) {
  const [uploading, setUploading] = useState(false);

  // --- 1. FUNÇÃO DE UPLOAD (Agora usando a função centralizada) ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Usa a função do api.ts. Retorna ex: "/uploads/images/123.jpg"
      const serverPath = await uploadImageFile(file);

      // Atualiza o pai com o caminho do servidor
      onChange({
        ...data,
        imageUrl: serverPath, 
      });
      
    } catch (error) {
      alert("Erro ao fazer upload da imagem.");
    } finally {
      setUploading(false);
    }
  };

  // --- 2. REMOVER IMAGEM ---
  const handleRemoveImage = () => {
    onChange({ ...data, imageUrl: "" });
  };

  // --- 3. ATUALIZAR TEXTOS ---
  const handleTextChange = (field: keyof SplitSectionData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <Paper elevation={0} sx={{ p: 2, border: "1px solid #e0e0e0", borderRadius: 2 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: "bold", color: "#555" }}>
        Configuração do Destaque (Imagem + Texto)
      </Typography>

      <Box sx={{ display: "flex", gap: 3, flexDirection: { xs: "column", md: "row" } }}>
        
        {/* LADO ESQUERDO: UPLOAD DE IMAGEM */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Paper 
            variant="outlined" 
            sx={{ 
              width: "100%", height: 200, 
              display: "flex", alignItems: "center", justifyContent: "center", 
              bgcolor: "#f5f5f5", overflow: "hidden", position: "relative"
            }}
          >
            {data.imageUrl ? (
              <>
                <img 
                  // O SEGREDO: Concatena API_URL com o caminho relativo do banco
                  src={`${API_URL}${data.imageUrl}`} 
                  alt="Preview" 
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                />
                <IconButton 
                  color="error" 
                  onClick={handleRemoveImage}
                  sx={{ position: "absolute", top: 5, right: 5, bgcolor: "rgba(255,255,255,0.8)", '&:hover': { bgcolor: 'white' } }}
                >
                  <DeleteIcon />
                </IconButton>
              </>
            ) : (
              <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
                 <AddPhotoAlternateIcon sx={{ fontSize: 40, opacity: 0.5 }} />
                 <Typography variant="caption" display="block">Sem imagem</Typography>
              </Box>
            )}
          </Paper>

          <Button
            variant="contained"
            component="label"
            startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
            disabled={uploading}
            fullWidth
          >
            {uploading ? "Enviando..." : "Escolher Imagem"}
            <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
          </Button>
        </Box>

        {/* LADO DIREITO: TEXTOS */}
        <Box sx={{ flex: 2 }}>
          <TextField
            label="Título do Destaque"
            fullWidth
            value={data.title || ""}
            onChange={(e) => handleTextChange("title", e.target.value)}
            sx={{ mb: 2 }}
          />

          <Typography variant="caption" display="block" sx={{ mb: 1 }}>
            Conteúdo do Texto:
          </Typography>
          
          <ReactQuill
            theme="snow"
            value={data.text || ""}
            onChange={(val) => handleTextChange("text", val)}
            style={{ height: 150, marginBottom: 50 }} 
          />
        </Box>
      </Box>
    </Paper>
  );
}