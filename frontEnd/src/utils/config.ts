// utils/config.ts

const getApiUrl = () => {
  const hostname = window.location.hostname;

  console.log('HostName: ', hostname)

  // 1. Se estiver no seu PC
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }

  // 2. Se estiver no servidor de desenvolvimento (staging)
  if (hostname.includes('dev.api.granconecta.net.br') || hostname.includes('dev.granconecta.net.br')) {
    return 'https://dev.api.granconecta.net.br';
  }

  // 3. Se estiver no servidor oficial (produção)
  if (hostname.includes('granconecta.net.br')) {
    return 'https://granconecta.net.br';
  }

  // Fallback para o que estiver no .env ou a URL de dev
  return import.meta.env.VITE_API_URL || 'https://dev.api.granconecta.net.br';
};

export const API_URL = getApiUrl();

console.log("Ambiente detectado para API:", API_URL);