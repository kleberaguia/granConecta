
export function buildCustomizationFromAiData(aiData: any) {
  return {
    sections: {
      topBar: {
        hidden: aiData.show_topbar === false || aiData.show_frete === false,
        title: aiData.frete_text || "FRETE GRÁTIS PARA TODO BRASIL",
      },

      hero: {
        hidden: aiData.show_hero === false,

        title:
          aiData.hero_title ||
          aiData.heroTitle,

        subtitle:
          aiData.hero_subtitle ||
          aiData.heroSubtitle,

        description:
          aiData.hero_description ||
          aiData.heroDescription,

        buttonText:
          aiData.hero_button_text ||
          aiData.heroButtonText,

        buttonUrl:
          aiData.hero_button_url ||
          aiData.heroButtonUrl ||
          "#comprar",

        backgroundColor:
          aiData.hero_bg_color ||
          aiData.hero_solid_color ||
          aiData.heroBgColor,

        backgroundImage:
          aiData.hero_background ||
          aiData.hero_bg_image ||
          aiData.heroBgImage ||
          aiData.foto_hero_url,

        titleColor:
          aiData.hero_title_color,

        subtitleColor:
          aiData.hero_sub_color,

        buttonBg:
          aiData.hero_button_bg,

        buttonColor:
          aiData.hero_button_color,

        align:
          aiData.hero_align,
      },

      products: {
        hidden: aiData.show_vitrine === false,
        title: aiData.produtos_titulo || "Produtos em destaque",
        subtitle: aiData.produtos_subtitulo || "Confira nossos produtos disponíveis.",
        buttonText: "Adicionar ao carrinho",
        items: normalizeItems(aiData.produtos),
      },

      services: {
        hidden: aiData.show_services === false,
        title: aiData.services_title,
        items: normalizeItems(aiData.services),
      },
      chatbot: {
        hidden: aiData.show_chatbot === false,
        enabled: aiData.show_chatbot !== false,
        storeId: aiData.store_id,
        storeName: aiData.store_name,
        title: aiData.chatbot_title || `Atendimento ${aiData.store_name || ""}`,
        subtitle: "Pergunte sobre produtos, preços e entrega.",
        welcomeMessage:
          aiData.chatbot_welcome ||
          "Olá! Posso te ajudar com algum produto?",
        apiUrl:
          aiData.chatbot_api_url ||
          "https://dev.api.granconecta.net.br/api/chat",
        position: "right",
        primaryColor:
          aiData.primaryColor ||
          aiData.primary_color ||
          "#0f172a",
      },

      about: {
        hidden: aiData.show_sobre === false,
        title: aiData.about_title,
        description: aiData.about_description,
        image: aiData.about_image,
        backgroundColor: aiData.about_bg_color,
      },

      cta: {
        hidden: aiData.show_cta === false,
        title: aiData.cta_title,
        description: aiData.cta_description,
        buttonText: aiData.cta_button_text,
        buttonUrl: aiData.cta_button_url || "#comprar",
        backgroundColor: aiData.cta_bg_color,
        backgroundImage: aiData.cta_bg_image,
      },

      testimonials: {
        hidden: aiData.show_testimonials === false,
        items: normalizeItems(aiData.testimonials),
      },

      faq: {
        hidden: aiData.show_faq === false,
        items: normalizeItems(aiData.faq),
      },

      footer: {
        hidden: aiData.show_footer === false,
        logo: aiData.footer_logo_url,
        phone: aiData.store_whatsapp,
        address: aiData.store_address,
        backgroundColor: aiData.footer_bg_color,
      },
    },

    theme: {
      primaryColor:
        aiData.primaryColor ||
        aiData.primary_color,

      bodyBgColor:
        aiData.bodyBgColor ||
        aiData.body_bg,

      textColor:
        aiData.textColor ||
        aiData.body_text_color,
    },
  };
}

function normalizeItems(items: any[] = []) {
  const result: Record<string, any> = {};

  items.forEach((item, index) => {
    const productId =
      item.productId ||
      item.produtoId ||
      item.id ||
      String(index);

    result[productId] = {
      hidden: item.hidden === true || item.show === false,

      id: productId,
      productId,

      title: item.title || item.nome || item.name,
      name: item.name || item.nome || item.title,

      description:
        item.description ||
        item.descricao,

      image:
        item.image ||
        item.imagem ||
        item.imageUrl ||
        item.image_url,

      image_url:
        item.image_url ||
        item.image ||
        item.imagem ||
        item.imageUrl,

      price:
        item.price ||
        item.preco,

      oldPrice:
        item.oldPrice ||
        item.precoAntigo,

      cashPrice: item.cashPrice,
      installment: item.installment,

      stock:
        item.stock ??
        item.estoque,

      buttonText:
        item.buttonText ||
        "Adicionar ao carrinho",

      buttonUrl: item.buttonUrl,
    };
  });

  return result;
}