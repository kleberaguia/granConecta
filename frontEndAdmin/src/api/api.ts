import axios from 'axios';

// 1. Constantes Globais
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

console.log('isLocal ', isLocal)
// 2. Se for local, usa 3000. Se não for (estiver no servidor), usa a URL do ambiente.
export const API_URL = isLocal 
  ? 'http://localhost:3000' 
  : 'https://dev.api.granconecta.net.br';

export const TOKEN_KEY = '@App:token'; 
const api = axios.create({
  baseURL: `${API_URL}/api`,
});

console.log("API_URL:", import.meta.env.VITE_API_URL);


// 2. Interceptor para injetar o Token automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============================================================
// FUNÇÕES DE UPLOAD
// ============================================================

/**
 * Upload de Imagem
 * Rota: POST /api/upload/image
 */
export const uploadImageFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file); 

  try {
    const response = await api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    // Retorna o caminho salvo (ex: /uploads/images/foto.jpg)
    return response.data.path; 
  } catch (error) {
    console.error("Erro ao subir imagem:", error);
    throw error;
  }
};

/**
 * Upload de Vídeo
 * Rota: POST /api/upload/video
 */
export const uploadVideoFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post('/upload/videos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    // Retorna o caminho salvo (ex: /uploads/videos/video.mp4)
    return response.data.path;
  } catch (error) {
    console.error("Erro ao subir vídeo:", error);
    throw error;
  }
};

// Export padrão do axios
export default api;