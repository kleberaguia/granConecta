export interface ISectionBase {
  id: number | string;
  ordem: number;
  tipo_secao: string;
  titulo: string | null;
  subtitulo: string | null;

}

export interface SlideData {
  imagem_url: string;
  titulo: string;
  subtitulo: string;
}



export interface IHeroSectionData extends ISectionBase {
  tipo_secao: 'hero';
  // O conteúdo principal (título, botões) continua o mesmo
  titulo: string | null;
  subtitulo: string | null;
  link_botao1: string | null;
  texto_botao1: string | null;
  link_botao2: string | null;
  texto_botao2: string | null;
  imagem_fundo: string | null;
  fundo_video_url: string | null;
  imagens_slider: SlideData[] | null;
  style_overrides: Record<string, string> | null;
  heading_style: string | null;
}

export interface ICardData {
  id: number | string;
  icone: string | null;
  titulo: string | null;
  conteudo_texto: string | null;
  link_botao: string | null;  // <a href="/horarios" ...>
  texto_botao: string | null; // "Ver Todos"
  style_overrides: Record<string, string> | null;
  heading_style: string | null;
  descricao_curta?: string | null;
  imagem_capa?: string | null;
  imagem?: string | null;
  slug: string;
}

export interface IInfoGridSectionData extends ISectionBase {
  tipo_secao: 'info_grid';
  style_overrides: Record<string, string> | null;
  heading_style: string | null;
  cards: ICardData[];
}

export interface INewsEventsSectionData extends ISectionBase {
  tipo_secao: 'news_events';
  style_overrides: Record<string, string> | null;
  heading_style: string | null;
}

export interface ICtaSectionData extends ISectionBase {
  tipo_secao: 'cta';
  link_botao1: string | null;  // "/pastorais"
  texto_botao1: string | null; // "Conhecer Pastorais"
  link_botao2: string | null;  // "/contato"
  texto_botao2: string | null; // "Entre em Contato"
  style_overrides: Record<string, string> | null;
  heading_style: string | null;
}

export type SectionLayout = 'texto_esquerda' | 'texto_direita' | 'texto_abaixo';

export interface IGenericContentSectionData extends ISectionBase {
  tipo_secao: 'generic_content';
  conteudo_principal: string | null; // O texto principal
  imagem_principal: string | null;   // A imagem que fica ao lado
  layout: SectionLayout | null;      // A opção de layout
  link_botao1: string | null;        // Um botão opcional
  texto_botao1: string | null;
  classe_css: string | null;         // Para estilização extra (ex: 'dark-bg')
  style_overrides: Record<string, string> | null;
  heading_style: string | null;
}

export interface ITodayLiturgy {
  _id: string;
  liturgyDate: string;  // Data da liturgia
  liturgyTitle: string; // Ex: "Quarta-feira da 27ª Semana"
  firstReading: string; // Ex: "Leitura da Profecia de Jonas..."
  psalm: string;
  gospel: string;
  reflection: string;   // A reflexão
}

export interface IGalleryImageData {
  id: number | string;
  url_imagem: string; // Imagem é obrigatória
  alt_text: string;   // Alt text é obrigatório
  legenda: string | null; // Legenda é opcional

  style_overrides: Record<string, string> | null;
}

export interface IGallerySectionData extends ISectionBase {
  tipo_secao: 'gallery';
  imagens: IGalleryImageData[];
  style_overrides: Record<string, string> | null;
  heading_style: string | null;
}

export interface IProdutoVitrine {
  id: string;
  name: string;
  imagemUrl: string;
  description: string;
  price: number | null; // null significa "Sob consulta"
  status: boolean;
  link_contato: string | null; // Link do WhatsApp/Email para compra
}

export interface MenuItem {
  id: string;
  name: string;
  path: string;
  submenu?: MenuItem[];
}

/* ============================
   NOVO TIPO: services_showcase_carousel
   ============================ */

export interface IServiceShowcaseItem {
  id: number;
  slug: string;
  titulo: string;
  descricao_curta: string;
  imagem_capa: string;
  link: string;
}

export interface IServiceShowcaseLinha {
  id: number;
  titulo_linha: string;
  descricao_linha: string;
  servicos: IServiceShowcaseItem[];
}

export interface IServicesShowcaseCarouselSectionData extends ISectionBase {
  tipo_secao: 'services_showcase_carousel';
  classe_css: string | null;
  heading_style: string | null;
  style_overrides: Record<string, string> | null;
  linhas: IServiceShowcaseLinha[];
}


export interface IServicesCarouselSectionData extends ISectionBase {
  tipo_secao: 'services_carousel';
  cards: ICardData[];
  classe_css: string | null;
  heading_style: string | null;
  style_overrides: Record<string, string> | null;
  linhas: IServiceShowcaseLinha[];
}


export interface IVideoSectionData extends ISectionBase {
  tipo_secao: 'video'; // Isso é crucial para o switch funcionar

  // ATENÇÃO: Confirme se os nomes abaixo batem com o que vem do seu Backend
  video_url: string;       // ou 'url_video' dependendo do seu banco
  thumbnail_url?: string;  // ou 'imagem_capa' / 'poster'

  // Campos padrão de estilo
  heading_style: string | null;
  style_overrides: Record<string, string> | null;
}
export interface ISystemVitrineSectionData extends ISectionBase {
  tipo_secao: 'system-vitrine';

  // Aqui definimos a estrutura do objeto "data" que vem do JSON
  data?: {
    slugTarget: string;
  };

  // Campos padrão de estilo (opcionais, mas bons para manter o padrão)
  style_overrides: Record<string, string> | null;
  heading_style: string | null;
}


// types/landing-page.ts
export interface LandingPageSection {
  type: 'HERO' | 'FEATURES' | 'CTA' | 'FOOTER' | 'PRICING';
  title?: string;
  subtitle?: string;
  buttonText?: string;
  items?: Array<{ title: string; description: string; icon?: string }>;
}

export interface LayoutConfig {
  theme: string;
  colors: {
    primary: string;
    background: string;
    text: string;
  };
  sections: LandingPageSection[];
}


export interface IPropagandaItem {
  id: string;
  titulo: string;
  resumo: string;
  categoria: string;
  midiaUrl?: string;
  createdAt: string;
  priorityScore: number;
}

export interface IPropagandaCarouselSectionData extends ISectionBase {
  // Alteramos para bater com o contrato da ISectionBase
  tipo_secao: 'PROPAGANDA_CAROUSEL'; 
  
  // Opcional: mantemos o 'tipo' se você já estiver usando no seu switch
  tipo?: 'PROPAGANDA_CAROUSEL'; 
  
  dados: IPropagandaItem[];
  style_overrides?: Record<string, string> | null;
}

/* ============================
   UNION PRINCIPAL
   ============================ */

export type SectionData =
  | IHeroSectionData
  | IInfoGridSectionData
  | INewsEventsSectionData
  | ICtaSectionData
  | IGenericContentSectionData
  | IGallerySectionData
  | IServicesShowcaseCarouselSectionData
  | IVideoSectionData
  | ISystemVitrineSectionData
  | IServicesCarouselSectionData
  | IPropagandaCarouselSectionData;

