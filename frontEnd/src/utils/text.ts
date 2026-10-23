// src/utils/text.ts

/**
 * Trunca uma string para um comprimento máximo de caracteres,
 * adicionando "..." no final.
 * @param text O texto para truncar
 * @param maxLength O número máximo de caracteres
 * @returns O texto truncado
 */
export const truncateText = (text: string | null | undefined, maxLength: number): string => {
  // Se o texto for nulo, indefinido ou vazio, retorna uma string vazia
  if (!text) {
    return '';
  }

  // Se o texto já for menor ou igual ao máximo, retorna o texto original
  if (text.length <= maxLength) {
    return text;
  }

  // Corta o texto e adiciona "..."
  return text.substring(0, maxLength) + '...';
};