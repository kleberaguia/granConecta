import { useState } from "react"; // Removi useEffect desnecessário
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import {
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  Paper,
  CircularProgress
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

import { uploadImageFile, API_URL } from "../../api/api";

interface Slide {
  image: string;
  text: string;
}

interface CarouselSectionEditorProps {
  data: { slides: Slide[] };
  onChange: (newData: { slides: Slide[] }) => void;
}

export default function CarouselSectionEditor({ data, onChange }: CarouselSectionEditorProps) {
  
  // 1. INICIALIZAÇÃO SEGURA: Só pega os dados do pai UMA VEZ na montagem.
  // Depois disso, quem manda é o estado local 'slides'.
  const [slides, setSlides] = useState<Slide[]>(() => {
    if (data.slides && data.slides.length > 0) return data.slides;
    return [{ image: "", text: "" }];
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Função única para salvar (atualiza tela e avisa o pai)
  const saveChanges = (newSlides: Slide[]) => {
    setSlides(newSlides); // Atualiza a tela imediatamente
    onChange({ slides: newSlides }); // Salva no background
  };

  // --- NAVEGAÇÃO (Blindada) ---
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // --- ADICIONAR SLIDE ---
  const handleAddSlide = () => {
    const newSlide = { image: "", text: "" };
    const newSlides = [...slides, newSlide];
    
    // 1. Salva a nova lista
    saveChanges(newSlides);
    
    // 2. Joga o usuário para o slide novo (último)
    setCurrentIndex(newSlides.length - 1);
  };

  // --- REMOVER SLIDE ---
  const handleRemoveSlide = () => {
    // Filtra removendo o índice atual
    const newSlides = slides.filter((_, index) => index !== currentIndex);
    
    // Se não sobrou nada, cria um vazio para não quebrar
    const finalSlides = newSlides.length > 0 ? newSlides : [{ image: "", text: "" }];
    
    saveChanges(finalSlides);

    // Ajusta o índice se estivermos no último
    if (currentIndex >= finalSlides.length) {
      setCurrentIndex(finalSlides.length - 1);
    }
  };

  // --- UPLOAD ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const serverPath = await uploadImageFile(file);
      // Atualiza APENAS o slide atual
      const newSlides = [...slides];
      newSlides[currentIndex] = { ...newSlides[currentIndex], image: serverPath };
      
      saveChanges(newSlides);

    } catch (error) {
      alert("Erro no upload.");
    } finally {
      setUploading(false);
      e.target.value = ""; // Reseta o input para permitir re-seleção
    }
  };

  // --- MUDANÇA DE TEXTO ---
  const handleTextChange = (val: string) => {
    const newSlides = [...slides];
    newSlides[currentIndex] = { ...newSlides[currentIndex], text: val };
    
    // Aqui não chamamos o saveChanges toda hora para não ficar lento,
    // mas atualizamos o estado local e o pai.
    setSlides(newSlides);
    onChange({ slides: newSlides });
  };

  // --- MUDANÇA DE URL MANUAL ---
  const handleUrlChange = (val: string) => {
    const newSlides = [...slides];
    newSlides[currentIndex] = { ...newSlides[currentIndex], image: val };
    saveChanges(newSlides);
  };

  // --- PREVIEW SEGURO ---
  const currentSlide = slides[currentIndex] || { image: "", text: "" };
  
  const getPreviewUrl = (url: string) => {
    if (!url) return "";
    return url.startsWith('http') ? url : `${API_URL}${url}`;
  };

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 2, border: '1px solid #ddd' }}>
      
      {/* --- HEADER COM NAVEGAÇÃO --- */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} p={1} bgcolor="#f9f9f9" borderRadius={1}>
        
        {/* SELETOR DE SLIDES (Esquerda) */}
        <Box display="flex" alignItems="center" gap={1}>
            <IconButton onClick={handlePrev} disabled={currentIndex === 0}>
                <NavigateBeforeIcon />
            </IconButton>
            
            <Typography variant="body1" fontWeight="bold">
                Slide {currentIndex + 1} de {slides.length}
            </Typography>
            
            <IconButton onClick={handleNext} disabled={currentIndex === slides.length - 1}>
                <NavigateNextIcon />
            </IconButton>
        </Box>

        {/* AÇÕES (Direita) */}
        <Box display="flex" gap={1}>
            <Button variant="contained" size="small" onClick={handleAddSlide}>
                + Slide
            </Button>
            <IconButton color="error" size="small" onClick={handleRemoveSlide}>
                <DeleteIcon />
            </IconButton>
        </Box>
      </Box>

      {/* --- CONTEÚDO DO SLIDE ATUAL --- */}
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={3}>
        
        {/* LADO DA IMAGEM */}
        <Box width={{ xs: '100%', md: 220 }} display="flex" flexDirection="column" gap={2}>
            
            {/* CAIXA DE PREVIEW */}
            <Box 
                sx={{ 
                    width: '100%', height: 150, 
                    bgcolor: '#eee', borderRadius: 2, 
                    border: '2px dashed #ccc',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', position: 'relative'
                }}
            >
                {currentSlide.image ? (
                    <img 
                        src={getPreviewUrl(currentSlide.image)} 
                        alt="Slide" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : (
                    <Box textAlign="center" color="#999">
                        <AddPhotoAlternateIcon fontSize="large"/>
                        <Typography variant="caption" display="block">Sem Imagem</Typography>
                    </Box>
                )}
            </Box>

            <Button
                component="label"
                variant="contained"
                startIcon={uploading ? <CircularProgress size={16} color="inherit"/> : <CloudUploadIcon />}
                disabled={uploading}
                fullWidth
            >
                {uploading ? "Enviando..." : "Upload Imagem"}
                <input type="file" hidden accept="image/*" onChange={handleFileUpload} />
            </Button>
            
            <TextField 
                label="Ou URL externa" 
                size="small" 
                value={currentSlide.image} 
                onChange={(e) => handleUrlChange(e.target.value)} 
            />
        </Box>

        {/* LADO DO TEXTO */}
        <Box flex={1}>
            <Typography variant="subtitle2" mb={1} color="textSecondary">Conteúdo do Slide:</Typography>
            <ReactQuill 
                theme="snow"
                value={currentSlide.text || ""}
                onChange={handleTextChange}
                style={{ height: 180, marginBottom: 40 }}
            />
        </Box>
      </Box>

    </Paper>
  );
}