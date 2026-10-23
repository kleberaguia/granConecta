export interface AiTemplateData {

  nome_marca: string;
  telefone: string;
  hero: {
    title: string;
    subtitle: string;
  };

  cta: {
    title: string;
    buttonText: string;
  };

  services: {
    title: string;
    description: string;
  }[];

  faq: {
    q: string;
    a: string;
  }[];

  testimonials: {
    nome: string;
    texto: string;
    cargo: string;
  }[];

  gallery: {
    image: string;
  }[];

  parceiros_logos: {
    image: string;
  }[];

  layout_choices?: any;
}