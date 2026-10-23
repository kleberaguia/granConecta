import {
  ImagePresetTemplateRenderer,
  type EditorialCommerceTemplate,
  type ImagePresetProduct,
  type ImagePresetTheme,
} from "./ImagePresetTemplateRenderer";

export type GenerateEditorialCommerceInput = {
  brand: string;
  heroImageUrl: string;
  aboutImageUrl: string;
  products: Array<Partial<ImagePresetProduct> & Record<string, any>>;
  theme?: ImagePresetTheme;
  nav?: EditorialCommerceTemplate["nav"];
};

export type GenerateEditorialCommerceResult = {
  success: true;
  html: string;
  template: EditorialCommerceTemplate;
};

export class ImagePresetTemplateService {
  generateEditorialCommerce(
    input: GenerateEditorialCommerceInput,
  ): GenerateEditorialCommerceResult {
    const products = this.normalizeProducts(input.products);

    const template: EditorialCommerceTemplate = {
      preset: "editorial-commerce",
      brand: input.brand?.trim() || "Luna Joias",
      nav: input.nav,
      theme: input.theme,
      hero: {
        title: "Joias artesanais\nfeitas à mão",
        subtitle: "Peças exclusivas feitas com amor e delicadeza.",
        buttonText: "Ver Coleção",
        buttonUrl: "#colecoes",
        backgroundImageUrl: input.heroImageUrl,
      },
      bestSellers: {
        title: "Nossos Best-Sellers",
        products: products.slice(0, 3),
      },
      about: {
        title: "Feitas com carinho",
        description:
          "Joias únicas criadas à mão com pedras naturais e banho de ouro.",
        buttonText: "Conheça Nossa História",
        buttonUrl: "#sobre",
        imageUrl: input.aboutImageUrl,
      },
      gallery: {
        title: "Novidades",
        products: products.slice(0, 4),
      },
    };

    return {
      success: true,
      html: ImagePresetTemplateRenderer.renderDocument(template),
      template,
    };
  }

  private normalizeProducts(
    products: Array<Record<string, any>> = [],
  ): ImagePresetProduct[] {
    const fallbackProducts = this.fallbackProducts();

    if (!Array.isArray(products) || products.length === 0) {
      return fallbackProducts;
    }

    return products.map((product, index) => {
      const fallback =
        fallbackProducts[index % fallbackProducts.length] ?? {
          id: String(index + 1),
          title: `Produto ${index + 1}`,
          price: "",
          imageUrl:
            "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=700&q=80",
          buttonText: "Ver mais",
          buttonUrl: "#",
        };

      return {
        id: String(product.id || product.productId || index + 1),
        title:
          product.title ||
          product.nome ||
          product.name ||
          fallback.title,
        price:
          product.price ||
          product.preco ||
          product.valor ||
          product.priceFormatted ||
          fallback.price,
        imageUrl:
          this.resolveImageUrl(product) ||
          fallback.imageUrl,
        imageAlt:
          product.imageAlt ||
          product.alt ||
          product.title ||
          product.nome ||
          fallback.title,
        buttonText:
          product.buttonText ||
          product.botaoTexto ||
          "Ver mais",
        buttonUrl:
          product.buttonUrl ||
          product.url ||
          product.link ||
          "#",
      };
    });
  }

  private resolveImageUrl(product: Record<string, any>): string {
    const rawImage =
      product.imageUrl ||
      product.image_url ||
      product.image ||
      product.imagem ||
      product.imagem_url ||
      product.foto_url ||
      product.foto ||
      product.capa_url ||
      product.thumbnail ||
      product.thumb ||
      product.urlImagem ||
      product.produto_image ||
      product?.images?.[0]?.url ||
      product?.imagens?.[0]?.url ||
      product?.files?.[0]?.url ||
      "";

    return this.toPublicUrl(rawImage);
  }

  private toPublicUrl(value: unknown): string {
    const image = String(value || "").trim();

    if (!image) return "";

    if (
      image.startsWith("http://") ||
      image.startsWith("https://") ||
      image.startsWith("data:") ||
      image.startsWith("blob:")
    ) {
      return image;
    }

    const publicUrl =
      process.env.BACKEND_PUBLIC_URL ||
      process.env.API_PUBLIC_URL ||
      "http://localhost:3000";

    if (image.startsWith("/uploads/")) {
      return `${publicUrl}${image}`;
    }

    return `${publicUrl}/uploads/images/${image}`;
  }

  private fallbackProducts(): ImagePresetProduct[] {
    return [
      {
        id: "1",
        title: "Anéis essenciais",
        price: "R$ 320.00",
        imageUrl:
          "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=700&q=80",
        buttonText: "Ver mais",
        buttonUrl: "#",
      },
      {
        id: "2",
        title: "Nossos delicados",
        price: "R$ 450.00",
        imageUrl:
          "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&w=700&q=80",
        buttonText: "Ver mais",
        buttonUrl: "#",
      },
      {
        id: "3",
        title: "Desejos únicos",
        price: "R$ 520.00",
        imageUrl:
          "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=700&q=80",
        buttonText: "Ver mais",
        buttonUrl: "#",
      },
      {
        id: "4",
        title: "Brincos com pérolas",
        price: "R$ 280.00",
        imageUrl:
          "https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?auto=format&fit=crop&w=700&q=80",
        buttonText: "Ver mais",
        buttonUrl: "#",
      },
    ];
  }
}