import { Box, Button, TextField, Dialog, DialogContent, CircularProgress } from '@mui/material';
import { type ChangeEvent, useState } from 'react';

// 1. IMPORTAÇÃO MÁGICA (A mesma que funcionou na Pastoral)
// Certifique-se que o caminho '../../api/api' está correto para este arquivo também
import { uploadImageFile, API_URL } from '../../api/api';

export interface GalleryImage {
  url: string;
  caption?: string;
}

export interface GallerySectionData {
  images: GalleryImage[];
  layout?: 'image-left' | 'image-right' | 'two-images';
}

interface GallerySectionEditorProps {
  data: GallerySectionData;
  onChange: (newData: GallerySectionData) => void;
}

export default function GallerySectionEditor({ data, onChange }: GallerySectionEditorProps) {
  const [openImage, setOpenImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // 2. FUNÇÃO PARA GERAR URL SEGURA (Copiada do código que funciona)
  const getImageUrl = (path: string) => {
    if (!path) return "";
    // Corrige barras invertidas do Windows (\ -> /)
    const cleanPath = path.replace(/\\/g, '/');
    // Se já tem http, usa. Se não, concatena API_URL
    if (cleanPath.startsWith('http')) return cleanPath;
    return `${API_URL}${cleanPath}`;
  };

  // 3. UPLOAD MODIFICADO PARA USAR A FUNÇÃO PRONTA
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      // Convertemos a lista de arquivos para um Array para poder usar map
      const fileArray = Array.from(files);
      const newUploadedImages: GalleryImage[] = [];

      // Loop para subir um por um (mais seguro)
      for (const file of fileArray) {
        try {
          // AQUI ESTÁ O SEGREDO: Usamos a função que já funciona na Pastoral
          const serverPath = await uploadImageFile(file);
          newUploadedImages.push({ url: serverPath, caption: '' });
        } catch (err) {
          console.error(`Erro ao subir arquivo ${file.name}`, err);
        }
      }

      // Atualiza o estado somando as imagens novas com as antigas
      const updatedImages = [...(data.images || []), ...newUploadedImages];
      onChange({ ...data, images: updatedImages });

    } catch (error) {
      console.error("Erro geral no upload:", error);
      alert("Erro ao enviar algumas imagens.");
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Limpa o input
    }
  };

  const handleCaptionChange = (index: number, caption: string) => {
    const newImages = [...(data.images || [])];
    newImages[index] = { ...newImages[index], caption };
    onChange({ ...data, images: newImages });
  };

  return (
    <Box>
      {/* Botão de Upload */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button 
          variant="outlined" 
          component="label" 
          disabled={isUploading}
        >
          {isUploading ? 'Enviando...' : 'Upload de Imagens'}
          <input 
            type="file" 
            accept="image/*" 
            multiple 
            hidden 
            onChange={handleFileUpload} 
          />
        </Button>
        {isUploading && <CircularProgress size={24} />}
      </Box>

      {/* Grid de thumbnails */}
      <Box display="grid" gridTemplateColumns="repeat(auto-fill, 120px)" gap={2}>
        {(data.images || []).map((img, i) => {
          // 4. USAR O GETIMAGEURL NA EXIBIÇÃO
          const finalSrc = getImageUrl(img.url);

          return (
            <Box
              key={i}
              sx={{
                width: 120,
                height: 120,
                border: '1px solid #ccc',
                borderRadius: 2,
                overflow: 'hidden',
                position: 'relative',
                cursor: 'pointer',
                '&:hover': { opacity: 0.8 }
              }}
              onClick={() => setOpenImage(finalSrc)}
            >
              <img
                src={finalSrc} // <--- Aqui usamos a URL tratada
                alt={`thumb-${i}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                   // Ajuda visual se a imagem quebrar
                   (e.target as HTMLImageElement).style.border = '2px solid red';
                }}
              />
            </Box>
          );
        })}
      </Box>

      {/* Campos de legenda */}
      {(data.images || []).map((img, i) => (
        <TextField
          key={`caption-${i}`}
          label={`Legenda da imagem ${i + 1}`}
          value={img.caption || ''}
          onChange={(e) => handleCaptionChange(i, e.target.value)}
          fullWidth
          sx={{ mt: 1 }}
        />
      ))}

      {/* Modal Ampliado */}
      <Dialog open={!!openImage} onClose={() => setOpenImage(null)} maxWidth="md">
        <DialogContent>
          {openImage && (
            <img
              src={openImage}
              alt="imagem ampliada"
              style={{ width: '100%', height: 'auto' }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}