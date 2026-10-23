import { AiTemplateData } from "./AiTemplateData";

export class AiNormalizer {

  static normalize(input: any): AiTemplateData {

    return {

      nome_marca:
        this.safe(input?.nome_marca) || "Minha Empresa",

      telefone:
        this.safe(input?.telefone) || "(11) 99999-9999",

      hero: {
        title:
          this.safe(input?.hero?.title) ||
          "Transforme seu negócio",

        subtitle:
          this.safe(input?.hero?.subtitle) ||
          "Soluções modernas para sua empresa",
      },

      cta: {
        title:
          this.safe(input?.cta?.title) ||
          "Solicite um orçamento",

        buttonText:
          this.safe(input?.cta?.buttonText) ||
          "Entrar em contato",
      },

      services:
        this.normalizeServices(input?.services),

      faq:
        this.normalizeFaq(input?.faq),

      testimonials:
        this.normalizeTestimonials(input?.testimonials),

      gallery:
        this.normalizeGallery(input?.gallery),

      parceiros_logos:
        this.normalizeLogos(input?.parceiros_logos),

      layout_choices:
        input?.layout_choices || {}
    };
  }

  /**
   * =====================================================
   * SERVICES
   * =====================================================
   */
  private static normalizeServices(
    services: any
  ) {

    if (!Array.isArray(services) || services.length === 0) {

      return [
        {
          title: "Atendimento Profissional",
          description: "Equipe especializada para melhor resultado."
        },
        {
          title: "Alta Qualidade",
          description: "Serviços modernos e eficientes."
        }
      ];
    }

    return services
      .slice(0, 6)
      .map((s: any) => ({
        title:
          this.safe(s?.title) || "Serviço",

        description:
          this.safe(s?.description) || "Descrição do serviço"
      }));
  }

  /**
   * =====================================================
   * FAQ
   * =====================================================
   */
  private static normalizeFaq(
    faq: any
  ) {

    if (!Array.isArray(faq) || faq.length === 0) {

      return [
        {
          q: "Como funciona?",
          a: "Entre em contato para mais informações."
        },
        {
          q: "Qual o prazo?",
          a: "O prazo varia conforme o serviço."
        }
      ];
    }

    return faq
      .slice(0, 5)
      .map((f: any) => ({
        q:
          this.safe(f?.q) || "Pergunta",

        a:
          this.safe(f?.a) || "Resposta"
      }));
  }

  /**
   * =====================================================
   * TESTIMONIALS
   * =====================================================
   */
  private static normalizeTestimonials(
    testimonials: any
  ) {

    if (!Array.isArray(testimonials) || testimonials.length === 0) {

      return [
        {
          nome: "Carlos Silva",
          texto: "Excelente atendimento e qualidade.",
          cargo: "Cliente"
        },
        {
          nome: "Fernanda Lima",
          texto: "Serviço rápido e profissional.",
          cargo: "Empresária"
        }
      ];
    }

    return testimonials
      .slice(0, 4)
      .map((t: any) => ({
        nome:
          this.safe(t?.nome) || "Cliente",

        texto:
          this.safe(t?.texto) || "Ótimo serviço.",

        cargo:
          this.safe(t?.cargo) || "Cliente"
      }));
  }

  /**
   * =====================================================
   * GALLERY
   * =====================================================
   */
  private static normalizeGallery(
    gallery: any
  ) {

    if (!Array.isArray(gallery) || gallery.length === 0) {

      return [
        {
          image:
            "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop"
        },
        {
          image:
            "https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1200&auto=format&fit=crop"
        }
      ];
    }

    return gallery
      .slice(0, 6)
      .map((g: any) => ({
        image:
          this.safe(g?.image)
      }));
  }

  /**
   * =====================================================
   * LOGOS
   * =====================================================
   */
  private static normalizeLogos(
    logos: any
  ) {

    if (!Array.isArray(logos) || logos.length === 0) {

      return [];
    }

    return logos
      .slice(0, 6)
      .map((l: any) => ({
        image:
          this.safe(l?.image)
      }));
  }

  /**
   * =====================================================
   * SAFE STRING
   * =====================================================
   */
  private static safe(v: any): string {

    if (typeof v !== "string") {
      return "";
    }

    return v.trim();
  }
}