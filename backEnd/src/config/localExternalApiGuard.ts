import axios from "axios";

let installed = false;

export function installLocalExternalApiGuard(): void {
  if (process.env.NODE_ENV !== "local" || installed) {
    return;
  }

  installed = true;

  const blockedHosts = new Set([
    "api.mercadopago.com",
    "www.mercadopago.com",
    "graph.facebook.com",
  ]);

  const isBlocked = (url: string): boolean => {
    try {
      return blockedHosts.has(new URL(url).hostname.toLowerCase());
    } catch {
      return false;
    }
  };

  axios.interceptors.request.use((config) => {
    const fullUrl = axios.getUri(config);

    if (isBlocked(fullUrl)) {
      throw new Error(
        `[LOCAL] Acesso externo bloqueado: ${fullUrl}`
      );
    }

    return config;
  });

  // Atenção: a proteção acima cobre somente chamadas Axios
  // feitas pela instância global. Outros clientes HTTP,
  // incluindo o SDK Mercado Pago, precisam de proteção própria.

  console.log(
    "[LOCAL] Proteção Axios para Mercado Pago e Meta ativada (somente instância global)."
  );
}