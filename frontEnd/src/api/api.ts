import axios from 'axios';

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
 * @param file Arquivo binário
 * @param usuarioId ID do usuário para organizar o diretório
 */
export const uploadImageFile = async (file: File, usuarioId?: string): Promise<string> => {
  const formData = new FormData();
  
  // Ajustado para 'image' para bater com o padrão comum de back-end
  // Ou mude para 'file' se o seu back-end estiver usando .single('file')
  formData.append('image', file); 

  if (usuarioId) {
    formData.append('usuarioId', usuarioId);
  }

  try {
    const response = await api.post('/produtos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    // Verifique se o seu back retorna .path ou .imageUrl
    return response.data.imageUrl || response.data.path; 
  } catch (error) {
    console.error("Erro ao subir imagem:", error);
    throw error;
  }
};

export default api;