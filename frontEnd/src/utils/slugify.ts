export const slugify = (value: string): string => {
  if (!value) return "";

  return value
    .toString()
    .normalize("NFD")                // Decompõe acentos
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")    // Remove tudo que não é letra, número ou espaço
    .replace(/\s+/g, "-")           // Transforma espaços em hífens
    .replace(/-+/g, "-");           // Remove hífens duplicados (--)
};