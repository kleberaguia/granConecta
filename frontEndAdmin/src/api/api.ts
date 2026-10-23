import axios from 'axios';

// ============================================================
// 1. CONFIGURAÇÃO DA API
// ============================================================

const isLocal =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

console.log('isLocal ', isLocal);

// Se estiver rodando localmente, usa a API local.
// Nos demais ambientes, usa o VITE_API_URL definido no .env.
//
// .env.development
// VITE_API_URL=https://dev.api.granconecta.net.br
//
// .env.production
// VITE_API_URL=https://api.granconecta.net.br

export const API_URL = isLocal
  ? 'http://localhost:3000'
  : import.meta.env.VITE_API_URL || 'https://api.granconecta.net.br';

export const TOKEN_KEY = '@App:token';

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

console.log('[ADMIN API] Hostname:', window.location.hostname);
console.log('[ADMIN API] API_URL:', API_URL);

// ============================================================
// 2. INTERCEPTOR PARA INJETAR O TOKEN AUTOMATICAMENTE
// ============================================================

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
export const uploadImageFile = async (
  file: File,
  usuarioId?: string,
): Promise<string> => {
  const formData = new FormData();

  // Deve corresponder ao upload.fields([{ name: "files" }])
  formData.append("files", file);

  if (usuarioId) {
    formData.append("usuarioId", usuarioId);
  }

  try {
    const response = await api.post(
      "/uploads/images",
      formData,
    );

    const data = response.data;

    const imageUrl =
      data?.imageUrl ||
      data?.path ||
      data?.url ||
      data?.files?.[0]?.url ||
      data?.files?.[0]?.path ||
      data?.images?.[0]?.url ||
      data?.images?.[0]?.path ||
      (typeof data?.images?.[0] === "string"
        ? data.images[0]
        : null);

    if (!imageUrl) {
      console.error(
        "[uploadImageFile] Resposta do upload:",
        data,
      );

      throw new Error(
        "A imagem foi enviada, mas a API não retornou o caminho do arquivo.",
      );
    }

    return imageUrl;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[uploadImageFile] Falha:", {
        status: error.response?.status,
        resposta: error.response?.data,
        url: error.config?.url,
      });
    } else {
      console.error(
        "[uploadImageFile] Falha:",
        error,
      );
    }

    throw error;
  }
};

/**
 * Upload de Vídeo
 * Rota: POST /api/upload/video
 */
export const uploadVideoFile = async (
  file: File,
): Promise<string> => {
  const formData = new FormData();

  formData.append('file', file);

  try {
    const response = await api.post(
      '/upload/videos',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    // Retorna o caminho salvo (ex: /uploads/videos/video.mp4)
    return response.data.path;
  } catch (error) {
    console.error("Erro ao subir vídeo:", error);
    throw error;
  }
};

// Export padrão do axios
export default api;