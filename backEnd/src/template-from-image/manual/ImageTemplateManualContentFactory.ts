import type {
  ManualTemplateTheme,
} from "./ImageTemplateManualTypes";

export type ManualTemplateBusinessType =
  | "jewelry"
  | "cleaning"
  | "beauty"
  | "fitness"
  | "law"
  | "health"
  | "food"
  | "generic";

export type ManualTemplateContentInput = {
  businessType?: ManualTemplateBusinessType;
  businessName?: string;
  businessDescription?: string;
};

export type ManualTemplateContent = {
  theme: ManualTemplateTheme;

  header: {
    title: string;
  };

  hero: {
    title: string;
    subtitle: string;
    buttonText: string;
    buttonUrl: string;
  };

  products: {
    title: string;
    cards: Array<{
      title: string;
      description?: string;
      price?: string;
      buttonText: string;
      buttonUrl: string;
    }>;
  };

  about: {
    title: string;
    description: string;
    buttonText: string;
    buttonUrl: string;
  };

  gallery: {
    title: string;
    cards: Array<{
      title: string;
      description?: string;
      price?: string;
      buttonText: string;
      buttonUrl: string;
    }>;
  };
};

export class ImageTemplateManualContentFactory {
  createContent(input: ManualTemplateContentInput = {}): ManualTemplateContent {
    const businessType = input.businessType || "generic";
    const traceId = `tpl-${Date.now()}`;

    console.log(`[${traceId}] ImageTemplateManualContentFactory. businessType`);
    switch (businessType) {
      case "jewelry":
        return this.jewelry(input);

      case "cleaning":
        return this.cleaning(input);

      case "beauty":
        return this.beauty(input);

      case "fitness":
        return this.fitness(input);

      case "law":
        return this.law(input);

      case "health":
        return this.health(input);

      case "food":
        return this.food(input);

      default:
        return this.generic(input);
    }
  }

  private jewelry(
    input: ManualTemplateContentInput,
  ): ManualTemplateContent {
    const name = input.businessName || "Luna Joias";

    return {
      theme: {
        primaryColor: "#b8896f",
        secondaryColor: "#e2c8ad",
        backgroundColor: "#fffaf2",
        surfaceColor: "#fff4ea",
        textColor: "#6f4638",
        mutedTextColor: "#9d7c6c",
        headingFont: "Cormorant Garamond",
        bodyFont: "Montserrat",
        borderRadius: 8,
      },
      header: {
        title: name,
      },
      hero: {
        title: "Joias artesanais\nfeitas à mão",
        subtitle:
          input.businessDescription ||
          "Peças exclusivas feitas com amor e delicadeza.",
        buttonText: "Ver Coleção",
        buttonUrl: "#colecoes",
      },
      products: {
        title: "Nossos Best-Sellers",
        cards: [
          {
            title: "Anéis essenciais",
            price: "R$ 320,00",
            buttonText: "Ver mais",
            buttonUrl: "#",
          },
          {
            title: "Nossos delicados",
            price: "R$ 450,00",
            buttonText: "Ver mais",
            buttonUrl: "#",
          },
          {
            title: "Desejos únicos",
            price: "R$ 520,00",
            buttonText: "Ver mais",
            buttonUrl: "#",
          },
        ],
      },
      about: {
        title: "Feitas com carinho",
        description:
          "Joias únicas criadas à mão com pedras naturais e banho de ouro.",
        buttonText: "Conheça Nossa História",
        buttonUrl: "#sobre",
      },
      gallery: {
        title: "Novidades",
        cards: [
          {
            title: "Brincos com pérolas",
            buttonText: "Ver mais",
            buttonUrl: "#",
          },
          {
            title: "Pulseira de ametista",
            buttonText: "Ver mais",
            buttonUrl: "#",
          },
          {
            title: "Colar de pérolas",
            buttonText: "Ver mais",
            buttonUrl: "#",
          },
          {
            title: "Anel delicado",
            buttonText: "Ver mais",
            buttonUrl: "#",
          },
        ],
      },
    };
  }

  private cleaning(
    input: ManualTemplateContentInput,
  ): ManualTemplateContent {
    const name = input.businessName || "Casa Limpa";

    return {
      theme: {
        primaryColor: "#65a99b",
        secondaryColor: "#cbe7df",
        backgroundColor: "#f7fffc",
        surfaceColor: "#ffffff",
        textColor: "#24443f",
        mutedTextColor: "#6f8f89",
        headingFont: "Playfair Display",
        bodyFont: "Montserrat",
        borderRadius: 10,
      },
      header: {
        title: name,
      },
      hero: {
        title: "Limpeza com cuidado\ne cheiro de casa nova",
        subtitle:
          input.businessDescription ||
          "Serviços de limpeza pensados para deixar seu ambiente leve, organizado e acolhedor.",
        buttonText: "Solicitar orçamento",
        buttonUrl: "#contato",
      },
      products: {
        title: "Serviços mais procurados",
        cards: [
          {
            title: "Limpeza residencial",
            price: "Sob consulta",
            buttonText: "Ver detalhes",
            buttonUrl: "#",
          },
          {
            title: "Limpeza pós-obra",
            price: "Sob consulta",
            buttonText: "Ver detalhes",
            buttonUrl: "#",
          },
          {
            title: "Limpeza recorrente",
            price: "Sob consulta",
            buttonText: "Ver detalhes",
            buttonUrl: "#",
          },
        ],
      },
      about: {
        title: "Cuidado em cada detalhe",
        description:
          "Atendimento dedicado, produtos adequados e atenção aos pequenos detalhes que fazem diferença no dia a dia.",
        buttonText: "Conheça nosso cuidado",
        buttonUrl: "#sobre",
      },
      gallery: {
        title: "Ambientes renovados",
        cards: [
          {
            title: "Cozinha limpa",
            buttonText: "Ver mais",
            buttonUrl: "#",
          },
          {
            title: "Banheiro higienizado",
            buttonText: "Ver mais",
            buttonUrl: "#",
          },
          {
            title: "Sala organizada",
            buttonText: "Ver mais",
            buttonUrl: "#",
          },
          {
            title: "Quarto aconchegante",
            buttonText: "Ver mais",
            buttonUrl: "#",
          },
        ],
      },
    };
  }

  private beauty(
    input: ManualTemplateContentInput,
  ): ManualTemplateContent {
    const name = input.businessName || "Essence Beauty";

    return {
      theme: {
        primaryColor: "#d9829f",
        secondaryColor: "#f4c7d5",
        backgroundColor: "#fff8fb",
        surfaceColor: "#ffffff",
        textColor: "#5c2f42",
        mutedTextColor: "#9c6c7f",
        headingFont: "Cormorant Garamond",
        bodyFont: "Montserrat",
        borderRadius: 12,
      },
      header: {
        title: name,
      },
      hero: {
        title: "Beleza natural\ncom cuidado especial",
        subtitle:
          input.businessDescription ||
          "Tratamentos pensados para realçar sua beleza com leveza, conforto e sofisticação.",
        buttonText: "Agendar horário",
        buttonUrl: "#contato",
      },
      products: {
        title: "Procedimentos em destaque",
        cards: [
          {
            title: "Limpeza de pele",
            price: "Sob consulta",
            buttonText: "Ver detalhes",
            buttonUrl: "#",
          },
          {
            title: "Design de sobrancelhas",
            price: "Sob consulta",
            buttonText: "Ver detalhes",
            buttonUrl: "#",
          },
          {
            title: "Tratamento facial",
            price: "Sob consulta",
            buttonText: "Ver detalhes",
            buttonUrl: "#",
          },
        ],
      },
      about: {
        title: "Atendimento acolhedor",
        description:
          "Um espaço preparado para cuidar de você com técnica, carinho e atenção aos detalhes.",
        buttonText: "Conheça o espaço",
        buttonUrl: "#sobre",
      },
      gallery: {
        title: "Resultados e cuidados",
        cards: [
          {
            title: "Pele renovada",
            buttonText: "Ver mais",
            buttonUrl: "#",
          },
          {
            title: "Cuidado facial",
            buttonText: "Ver mais",
            buttonUrl: "#",
          },
          {
            title: "Bem-estar",
            buttonText: "Ver mais",
            buttonUrl: "#",
          },
          {
            title: "Autoestima",
            buttonText: "Ver mais",
            buttonUrl: "#",
          },
        ],
      },
    };
  }

  private fitness(input: ManualTemplateContentInput): ManualTemplateContent {
    const name = input.businessName || "Studio Fit";

    return {
      theme: {
        primaryColor: "#ff6b35",
        secondaryColor: "#ffd1bd",
        backgroundColor: "#fffaf7",
        surfaceColor: "#ffffff",
        textColor: "#2d2522",
        mutedTextColor: "#7b6c66",
        headingFont: "Oswald",
        bodyFont: "Montserrat",
        borderRadius: 8,
      },
      header: { title: name },
      hero: {
        title: "Treinos que movem\nsua melhor versão",
        subtitle:
          input.businessDescription ||
          "Acompanhamento, energia e método para você evoluir com segurança.",
        buttonText: "Começar agora",
        buttonUrl: "#contato",
      },
      products: {
        title: "Planos em destaque",
        cards: [
          { title: "Plano mensal", price: "Sob consulta", buttonText: "Ver plano", buttonUrl: "#" },
          { title: "Personal trainer", price: "Sob consulta", buttonText: "Ver plano", buttonUrl: "#" },
          { title: "Avaliação física", price: "Sob consulta", buttonText: "Ver plano", buttonUrl: "#" },
        ],
      },
      about: {
        title: "Evolução com acompanhamento",
        description:
          "Treinos planejados para sua rotina, seu objetivo e seu ritmo.",
        buttonText: "Conheça o método",
        buttonUrl: "#sobre",
      },
      gallery: {
        title: "Resultados",
        cards: [
          { title: "Força", buttonText: "Ver mais", buttonUrl: "#" },
          { title: "Condicionamento", buttonText: "Ver mais", buttonUrl: "#" },
          { title: "Mobilidade", buttonText: "Ver mais", buttonUrl: "#" },
          { title: "Performance", buttonText: "Ver mais", buttonUrl: "#" },
        ],
      },
    };
  }

  private law(input: ManualTemplateContentInput): ManualTemplateContent {
    const name = input.businessName || "Advocacia";

    return {
      theme: {
        primaryColor: "#b9935a",
        secondaryColor: "#d8c39a",
        backgroundColor: "#101925",
        surfaceColor: "#182436",
        textColor: "#f5efe6",
        mutedTextColor: "#c8b9a2",
        headingFont: "Playfair Display",
        bodyFont: "Montserrat",
        borderRadius: 4,
      },
      header: { title: name },
      hero: {
        title: "Atuação jurídica\ncom estratégia",
        subtitle:
          input.businessDescription ||
          "Orientação clara, atendimento responsável e defesa dos seus interesses.",
        buttonText: "Entrar em contato",
        buttonUrl: "#contato",
      },
      products: {
        title: "Áreas de atuação",
        cards: [
          { title: "Direito Civil", buttonText: "Saiba mais", buttonUrl: "#" },
          { title: "Direito de Família", buttonText: "Saiba mais", buttonUrl: "#" },
          { title: "Consultoria Jurídica", buttonText: "Saiba mais", buttonUrl: "#" },
        ],
      },
      about: {
        title: "Confiança e clareza",
        description:
          "Atendimento jurídico com foco em orientação objetiva e solução responsável.",
        buttonText: "Conheça o escritório",
        buttonUrl: "#sobre",
      },
      gallery: {
        title: "Soluções jurídicas",
        cards: [
          { title: "Contratos", buttonText: "Ver mais", buttonUrl: "#" },
          { title: "Família", buttonText: "Ver mais", buttonUrl: "#" },
          { title: "Empresarial", buttonText: "Ver mais", buttonUrl: "#" },
          { title: "Preventivo", buttonText: "Ver mais", buttonUrl: "#" },
        ],
      },
    };
  }

  private health(input: ManualTemplateContentInput): ManualTemplateContent {
    const name = input.businessName || "Cuidado e Saúde";

    return {
      theme: {
        primaryColor: "#6ca58d",
        secondaryColor: "#cde5d8",
        backgroundColor: "#fbfff9",
        surfaceColor: "#ffffff",
        textColor: "#294237",
        mutedTextColor: "#70877d",
        headingFont: "Cormorant Garamond",
        bodyFont: "Montserrat",
        borderRadius: 10,
      },
      header: { title: name },
      hero: {
        title: "Cuidado humano\npara sua rotina",
        subtitle:
          input.businessDescription ||
          "Atendimento acolhedor, escuta e acompanhamento com responsabilidade.",
        buttonText: "Agendar atendimento",
        buttonUrl: "#contato",
      },
      products: {
        title: "Atendimentos",
        cards: [
          { title: "Consulta", price: "Sob consulta", buttonText: "Ver detalhes", buttonUrl: "#" },
          { title: "Acompanhamento", price: "Sob consulta", buttonText: "Ver detalhes", buttonUrl: "#" },
          { title: "Orientação", price: "Sob consulta", buttonText: "Ver detalhes", buttonUrl: "#" },
        ],
      },
      about: {
        title: "Acolhimento e atenção",
        description:
          "Um atendimento pensado para entender sua história e cuidar do que importa.",
        buttonText: "Conheça a abordagem",
        buttonUrl: "#sobre",
      },
      gallery: {
        title: "Bem-estar",
        cards: [
          { title: "Escuta", buttonText: "Ver mais", buttonUrl: "#" },
          { title: "Cuidado", buttonText: "Ver mais", buttonUrl: "#" },
          { title: "Rotina", buttonText: "Ver mais", buttonUrl: "#" },
          { title: "Equilíbrio", buttonText: "Ver mais", buttonUrl: "#" },
        ],
      },
    };
  }

  private food(input: ManualTemplateContentInput): ManualTemplateContent {
    const name = input.businessName || "Sabor da Casa";

    return {
      theme: {
        primaryColor: "#d96c35",
        secondaryColor: "#f3c29b",
        backgroundColor: "#fff9f2",
        surfaceColor: "#ffffff",
        textColor: "#4a2d20",
        mutedTextColor: "#8b6b5c",
        headingFont: "Playfair Display",
        bodyFont: "Montserrat",
        borderRadius: 10,
      },
      header: { title: name },
      hero: {
        title: "Sabor especial\nfeito com carinho",
        subtitle:
          input.businessDescription ||
          "Produtos frescos, preparo cuidadoso e aquele sabor que aproxima pessoas.",
        buttonText: "Ver cardápio",
        buttonUrl: "#cardapio",
      },
      products: {
        title: "Mais pedidos",
        cards: [
          { title: "Especial da casa", price: "Sob consulta", buttonText: "Pedir", buttonUrl: "#" },
          { title: "Combo destaque", price: "Sob consulta", buttonText: "Pedir", buttonUrl: "#" },
          { title: "Novidade da semana", price: "Sob consulta", buttonText: "Pedir", buttonUrl: "#" },
        ],
      },
      about: {
        title: "Feito com dedicação",
        description:
          "Receitas preparadas com cuidado, ingredientes selecionados e atenção aos detalhes.",
        buttonText: "Conheça nossa história",
        buttonUrl: "#sobre",
      },
      gallery: {
        title: "Novidades",
        cards: [
          { title: "Prato especial", buttonText: "Ver mais", buttonUrl: "#" },
          { title: "Sobremesa", buttonText: "Ver mais", buttonUrl: "#" },
          { title: "Combo", buttonText: "Ver mais", buttonUrl: "#" },
          { title: "Bebidas", buttonText: "Ver mais", buttonUrl: "#" },
        ],
      },
    };
  }

  private generic(input: ManualTemplateContentInput): ManualTemplateContent {
    const name = input.businessName || "Nova Página";

    return {
      theme: {
        primaryColor: "#4f7cff",
        secondaryColor: "#c9d8ff",
        backgroundColor: "#f7f9ff",
        surfaceColor: "#ffffff",
        textColor: "#1f2937",
        mutedTextColor: "#6b7280",
        headingFont: "Playfair Display",
        bodyFont: "Montserrat",
        borderRadius: 10,
      },
      header: { title: name },
      hero: {
        title: "Uma página bonita\npara seu negócio",
        subtitle:
          input.businessDescription ||
          "Apresente seus serviços, produtos e diferenciais com uma landing page clara e moderna.",
        buttonText: "Saiba mais",
        buttonUrl: "#contato",
      },
      products: {
        title: "Destaques",
        cards: [
          { title: "Destaque 1", price: "Sob consulta", buttonText: "Ver mais", buttonUrl: "#" },
          { title: "Destaque 2", price: "Sob consulta", buttonText: "Ver mais", buttonUrl: "#" },
          { title: "Destaque 3", price: "Sob consulta", buttonText: "Ver mais", buttonUrl: "#" },
        ],
      },
      about: {
        title: "Sobre nós",
        description:
          "Conte sua história, seus diferenciais e o cuidado que você entrega aos clientes.",
        buttonText: "Conheça melhor",
        buttonUrl: "#sobre",
      },
      gallery: {
        title: "Galeria",
        cards: [
          { title: "Imagem 1", buttonText: "Ver mais", buttonUrl: "#" },
          { title: "Imagem 2", buttonText: "Ver mais", buttonUrl: "#" },
          { title: "Imagem 3", buttonText: "Ver mais", buttonUrl: "#" },
          { title: "Imagem 4", buttonText: "Ver mais", buttonUrl: "#" },
        ],
      },
    };
  }
}