// src/utils/slugify.ts
export const slugify = (value: string): string => {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9\s-]/g, "")    // Remove caracteres especiais
    .trim()
    .replace(/\s+/g, "-")           // Espaços para hífens
    .replace(/-+/g, "-");           // Evita hífens duplos
};