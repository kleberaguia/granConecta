export type BusinessType = string;

type TemplateConfig = {
  // Seções que aparecem por padrão
  sections: string[];

  // ✅ ADICIONE ESTA LINHA AQUI:
  optionalSections?: string[];

  forceHide?: string[];
  labels?: { // Adicionei o '?' aqui também para evitar erros se você não preencher em todos
    vitrine: string;
    gallery: string;
    cta: string;
  };
};
export const templateConfig: Record<string, TemplateConfig> = {
  loja: {
    sections: ['header', 'hero', 'vitrine', 'gallery', 'testimonials', 'cta', 'footer'],
    optionalSections: ['combos', 'promocoes', 'bebidas'],
  },
  servico: {
    sections: ['header', 'hero', 'sobre', 'gallery', 'testimonials', 'cta', 'footer'],
    optionalSections: ['lead_magnet', 'mini_blog'],
  },
  imobiliaria: {
    sections: ['header', 'hero', 'mapa_imoveis', 'gallery', 'cta', 'footer'],
    optionalSections: ['simulador_financiamento']
  },
  // PADRÃO DE SEGURANÇA (Caso venha algo novo do banco que o front ainda não conhece)
  default: {
    sections: ['header', 'hero', 'sobre', 'cta', 'footer'],
    optionalSections: []
  }
};