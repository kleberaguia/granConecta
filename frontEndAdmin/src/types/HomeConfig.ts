// types/HomeConfig.ts

export interface StyleOverrides {
  [key: string]: string;
}

export interface CardItem {
  id: number;
  icone: string;
  titulo: string;
  conteudo_texto?: string | null;
  link_botao?: string;
  texto_botao?: string;
  // style_overrides opcional para cards
}

export interface GalleryItem {
  id: number;
  url_imagem: string;
  alt_text: string;
  legenda: string;
}

export interface HomeSection {
  id: number;
  ordem: number;
  tipo_secao: 'hero' | 'info_grid' | 'generic_content' | 'gallery' | 'news_events' | 'cta';
  titulo: string;
  subtitulo?: string;
  classe_css?: string | null;
  heading_style?: string;
  style_overrides: StyleOverrides;
  
  // Campos específicos (opcionais dependendo do tipo)
  link_botao1?: string;
  texto_botao1?: string;
  link_botao2?: string;
  texto_botao2?: string;
  imagem_fundo?: string;
  conteudo_principal?: string;
  imagem_principal?: string;
  layout?: string;
  
  // Arrays
  cards?: CardItem[];
  imagens?: GalleryItem[];
}