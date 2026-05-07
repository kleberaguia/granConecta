const forbiddenWords = ["palavra1", "palavra2", "ofensa3"]; // Lista de palavras proibidas

export const hasForbiddenContent = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  return forbiddenWords.some(word => lowerText.includes(word));
};