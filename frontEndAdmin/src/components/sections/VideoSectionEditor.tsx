import React, { useState } from 'react';
import { Box, TextField, Button, Typography, CircularProgress, Paper } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { uploadVideoFile, uploadImageFile, API_URL } from '../../api/api';
import ReactPlayer from 'react-player';

// Cast para evitar erro de TS
const ReactPlayerAny = ReactPlayer as any;

export interface VideoSectionData {
  videoUrl: string;
  thumbnailUrl?: string;
  title?: string;
}

interface VideoSectionEditorProps {
  data: VideoSectionData;
  onChange: (data: VideoSectionData) => void;
}

export default function VideoSectionEditor({ data, onChange }: VideoSectionEditorProps) {
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // --- 1. Função de Limpeza de URL (Aprovada) ---
  const getFullUrl = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('blob')) return path;
    
    let cleanPath = path.replace(/\\/g, '/').replace('src/config/', '');
    if (!cleanPath.startsWith('/')) cleanPath = `/${cleanPath}`;
    
    const cleanApiUrl = API_URL.replace(/\/$/, '');
    return `${cleanApiUrl}${cleanPath}`;
  };

  // --- 2. Função para decidir qual player usar ---
  const isLocalFile = (url: string) => {
    if (!url) return false;
    const finalUrl = getFullUrl(url);
    // Identifica se é arquivo local pelas extensões ou se vem do localhost
    return finalUrl.includes('/uploads/') || finalUrl.endsWith('.mp4') || finalUrl.endsWith('.webm');
  };

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    try {
      const serverPath = await uploadVideoFile(file);
      onChange({ ...data, videoUrl: serverPath });
    } catch (error) {
      alert('Erro ao enviar vídeo.');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const serverPath = await uploadImageFile(file);
      onChange({ ...data, thumbnailUrl: serverPath });
    } catch (error) {
      alert('Erro ao enviar capa.');
    } finally {
      setUploadingCover(false);
    }
  };

  const finalVideoUrl = getFullUrl(data.videoUrl);
  const finalCoverUrl = data.thumbnailUrl ? getFullUrl(data.thumbnailUrl) : undefined;

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
        Configuração de Vídeo
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
        
        {/* LADO ESQUERDO: PREVIEW INTELIGENTE */}
        <Box sx={{
          flex: 1,
          position: 'relative',
          minHeight: 250, // Altura fixa para ficar bonito
          bgcolor: '#000',
          borderRadius: 2,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #333'
        }}>
          {data.videoUrl ? (
            isLocalFile(data.videoUrl) ? (
              // --- OPÇÃO A: Player Nativo (Para seus uploads) ---
              <video
                controls
                poster={finalCoverUrl} // A capa funciona aqui também!
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              >
                <source src={finalVideoUrl} type="video/mp4" />
                Seu navegador não suporta este vídeo.
              </video>
            ) : (
              // --- OPÇÃO B: ReactPlayer (Para YouTube/Vimeo) ---
              <ReactPlayerAny
                url={finalVideoUrl}
                width="100%"
                height="100%"
                controls={true}
                light={finalCoverUrl || false} // Capa personalizada para YouTube
                playIcon={<PlayCircleOutlineIcon sx={{ fontSize: 80, color: '#fff' }} />}
              />
            )
          ) : (
            // --- ESTADO VAZIO ---
            <Box sx={{ textAlign: 'center', color: '#fff', opacity: 0.7 }}>
              <PlayCircleOutlineIcon sx={{ fontSize: 60, mb: 1 }} />
              <Typography variant="body2">Nenhum vídeo carregado</Typography>
            </Box>
          )}
        </Box>

        {/* LADO DIREITO: CONTROLES */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            component="label"
            variant="contained"
            color="primary"
            fullWidth
            startIcon={uploadingVideo ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
            disabled={uploadingVideo}
          >
            {uploadingVideo ? 'Enviando...' : '1. Upload Arquivo de Vídeo'}
            <input type="file" hidden accept="video/*" onChange={handleVideoChange} />
          </Button>

          <Button
            component="label"
            variant="outlined"
            color="secondary"
            fullWidth
            startIcon={uploadingCover ? <CircularProgress size={20} color="inherit" /> : <AddPhotoAlternateIcon />}
            disabled={uploadingCover}
          >
            {uploadingCover ? 'Enviando...' : '2. Upload da Capa (Thumbnail)'}
            <input type="file" hidden accept="image/*" onChange={handleCoverChange} />
          </Button>

          <TextField
            label="Título do Vídeo"
            value={data.title || ''}
            onChange={(e) => onChange({ ...data, title: e.target.value })}
            size="small"
            fullWidth
          />

          <TextField
            label="URL (YouTube ou Arquivo)"
            value={data.videoUrl || ''}
            onChange={(e) => onChange({ ...data, videoUrl: e.target.value })}
            size="small"
            fullWidth
            disabled
            helperText="Para alterar, faça um novo upload ou cole um link do YouTube acima."
          />
        </Box>
      </Box>
    </Paper>
  );
}