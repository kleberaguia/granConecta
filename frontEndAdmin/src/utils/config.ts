// utils/config.ts

const getApiUrl = () => {
  const hostname = window.location.hostname;

  // 1. Se estiver no seu PC
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }

  // 2. Se estiver no servidor de desenvolvimento (staging/dev)
  if (
    hostname.includes('dev.admin.granconecta.net.br') ||
    hostname.includes('dev.api.granconecta.net.br') ||
    hostname === 'dev.granconecta.net.br'
  ) {
    return 'https://dev.api.granconecta.net.br';
  }

  // 3. Se estiver no Admin oficial (produção)
  if (hostname === 'admin.granconecta.net.br') {
    return 'https://api.granconecta.net.br';
  }

  // 4. Outros domínios GranConecta em produção
  if (
    hostname === 'granconecta.net.br' ||
    hostname === 'www.granconecta.net.br'
  ) {
    return 'https://api.granconecta.net.br';
  }

  // 5. Fallback:
  // usa a variável do ambiente; em último caso, API de produção
  return (
    import.meta.env.VITE_API_URL ||
    'https://api.granconecta.net.br'
  );
};

export const API_URL = getApiUrl();

console.log('Ambiente detectado para API:', API_URL);