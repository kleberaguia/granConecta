import type {
  ManualImageTemplate,
  ManualTemplateCard,
  ManualTemplateSection,
} from "../../../template-from-image/manual/ImageTemplateManualTypes";

import type {
  TemplateButton,
  TemplateMedia,
  TemplatePage,
  TemplateProductCard,
  TemplateSection,
  TemplateSectionLayout,
  TemplateServiceCard,
} from "../TemplatePageSchema";

export class ManualTemplateToPageMapper {
  map(template: ManualImageTemplate): TemplatePage {
    const traceId = `tpl-${Date.now()}`;
    const media: TemplateMedia[] = [];
    const sections: TemplateSection[] = [];

    console.log(`[${traceId}] ManualTemplateToPageMapper.map`);

    template.sections.forEach((section) => {
      media.push(...this.extractSectionMedia(section));
      sections.push(this.mapSection(section, template));
    });

    return {
      version: "page-1.0",
      id: template.id,
      name: template.name,
      mode: template.mode,
      theme: {
        primaryColor: template.theme.primaryColor,
        secondaryColor: template.theme.secondaryColor,
        backgroundColor: template.theme.backgroundColor,
        surfaceColor: template.theme.surfaceColor,
        textColor: template.theme.textColor,
        mutedTextColor: template.theme.mutedTextColor,
        headingFont: template.theme.headingFont,
        bodyFont: template.theme.bodyFont,
        borderRadius: template.theme.borderRadius,
        spacing: "comfortable",
      },
      media: this.uniqueMedia(media),
      sections,
      commerce: {
        enabled: template.mode === "commerce",
        cartEnabled: template.mode === "commerce",
        defaultProductAction:
          template.mode === "commerce"
            ? "add_to_cart"
            : "navigate",
      },
      metadata: {
        createdAt: new Date().toISOString(),
        generatedBy: "manual",
        source: "image",
        sourceId: template.sourceImagePath,
      },
    };
  }

  private mapSection(
    section: ManualTemplateSection,
    template: ManualImageTemplate,
  ): TemplateSection {
    switch (section.type) {
      case "header":
        return {
          id: section.id,
          type: "navbar",
          hidden: false,
          layout: this.mapLayout(section),
          content: {
            logoText: section.content?.title || template.name,
            logoMediaId: section.content?.logoUrl
              ? `${section.id}-logo`
              : undefined,
            links: [
              {
                label: "Inicio",
                href: "#hero",
                action: {
                  type: "scroll",
                  target: "#hero",
                },
              },
              {
                label: "Produtos",
                href: "#best-sellers",
                action: {
                  type: "scroll",
                  target: "#best-sellers",
                },
              },
              {
                label: "Sobre",
                href: "#about",
                action: {
                  type: "scroll",
                  target: "#about",
                },
              },
              {
                label: "Contato",
                href: "#contato",
                action: {
                  type: "open_contact_modal",
                },
              },
            ],
          },
        };

      case "hero":
        return {
          id: section.id,
          type: "hero",
          hidden: false,
          layout: {
            ...this.mapLayout(section),
            backgroundMediaId: section.backgroundImage
              ? `${section.id}-background`
              : undefined,
            backgroundSize: section.backgroundImage
              ? "cover"
              : undefined,
            backgroundPosition: "center center",
          },
          content: {
            title: section.content?.title || template.name,
            subtitle: section.content?.subtitle,
            description: section.content?.description,
            button: this.mapPrimaryButton(section),
            mediaId: this.firstCardImageMediaId(section),
            mediaPosition: "right",
          },
        };

      case "products":
        return {
          id: section.id,
          type: "products",
          hidden: false,
          layout: this.mapLayout(section),
          content: {
            title:
              section.content?.title ||
              section.title ||
              "Produtos",
            subtitle: section.content?.subtitle,
            cards: (section.cards || []).map((card) =>
              this.mapProductCard(card, template),
            ),
          },
        };

      case "services":
        return {
          id: section.id,
          type: "services",
          hidden: false,
          layout: this.mapLayout(section),
          content: {
            title:
              section.content?.title ||
              section.title ||
              "Servicos",
            subtitle: section.content?.subtitle,
            cards: (section.cards || []).map((card) =>
              this.mapServiceCard(card),
            ),
          },
        };

      case "about": {
        const imageCard = section.cards?.find((card) => card.image);

        return {
          id: section.id,
          type: "about",
          hidden: false,
          layout: this.mapLayout(section),
          content: {
            title:
              section.content?.title ||
              section.title ||
              "Sobre",
            description:
              section.content?.description ||
              section.content?.subtitle ||
              "",
            mediaId: imageCard?.image
              ? `${imageCard.id}-image`
              : undefined,
            button: this.mapPrimaryButton(section),
          },
        };
      }

      case "gallery":
        return {
          id: section.id,
          type: "gallery",
          hidden: false,
          layout: this.mapLayout(section),
          content: {
            title:
              section.content?.title ||
              section.title ||
              "Galeria",
            subtitle: section.content?.subtitle,
            mediaIds: (section.cards || [])
              .filter((card) => card.image)
              .map((card) => `${card.id}-image`),
          },
        };

      case "cta":
        return {
          id: section.id,
          type: "cta",
          hidden: false,
          layout: {
            ...this.mapLayout(section),
            backgroundMediaId: section.backgroundImage
              ? `${section.id}-background`
              : undefined,
            backgroundSize: section.backgroundImage
              ? "cover"
              : undefined,
            backgroundPosition: "center center",
          },
          content: {
            title:
              section.content?.title ||
              section.title ||
              "Fale conosco",
            description: section.content?.description,
            button: this.mapPrimaryButton(section),
          },
        };

      case "footer":
        return {
          id: section.id,
          type: "footer",
          hidden: false,
          layout: this.mapLayout(section),
          content: {
            brand: template.name,
            logoMediaId: section.content?.logoUrl
              ? `${section.id}-logo`
              : undefined,
            description: section.content?.description,
            links: [],
          },
        };

      default:
        return {
          id: section.id,
          type: "custom",
          hidden: false,
          layout: this.mapLayout(section),
          content: {
            title: section.content?.title || section.title,
            text:
              section.content?.description ||
              section.content?.subtitle,
            mediaIds: (section.cards || [])
              .filter((card) => card.image)
              .map((card) => `${card.id}-image`),
            data: section as unknown as Record<string, any>,
          },
        };
    }
  }

  private mapProductCard(
    card: ManualTemplateCard,
    template: ManualImageTemplate,
  ): TemplateProductCard {
    return {
      id: card.id,
      productId: card.productId || card.id,
      title: card.title || "Produto",
      description: card.description,
      priceText: card.price,
      oldPriceText: card.oldPrice,
      imageMediaId: card.image ? `${card.id}-image` : undefined,
      button: {
        label:
          card.buttonText ||
          (template.mode === "commerce" ? "Comprar" : "Ver mais"),
        variant: "primary",
        action: {
          type:
            template.mode === "commerce"
              ? "add_to_cart"
              : "navigate",
          productId: card.productId || card.id,
          href: card.buttonUrl || "#",
        },
      },
    };
  }

  private mapServiceCard(
    card: ManualTemplateCard,
  ): TemplateServiceCard {
    return {
      id: card.id,
      title: card.title || "Servico",
      description: card.description,
      imageMediaId: card.image ? `${card.id}-image` : undefined,
      button: card.buttonText
        ? {
            label: card.buttonText,
            variant: "primary",
            action: {
              type: "open_contact_modal",
              href: card.buttonUrl || "#",
            },
          }
        : undefined,
    };
  }

  private mapPrimaryButton(
    section: ManualTemplateSection,
  ): TemplateButton | undefined {
    if (!section.content?.buttonText) {
      return undefined;
    }

    return {
      label: section.content.buttonText,
      variant: "primary",
      action: {
        type: "scroll",
        target: section.content.buttonUrl || "#",
        href: section.content.buttonUrl || "#",
      },
    };
  }

  private firstCardImageMediaId(
    section: ManualTemplateSection,
  ): string | undefined {
    const imageCard = section.cards?.find((card) => card.image);

    return imageCard ? `${imageCard.id}-image` : undefined;
  }

  private extractSectionMedia(
    section: ManualTemplateSection,
  ): TemplateMedia[] {
    const media: TemplateMedia[] = [];

    if (section.backgroundImage && section.type !== "header") {
      media.push({
        id: `${section.id}-background`,
        type: "background",
        source: "extracted",
        url: section.backgroundImage,
        alt: `${section.id} background`,
      });
    }

    if (section.content?.logoUrl) {
      media.push({
        id: `${section.id}-logo`,
        type: "image",
        source: "uploaded",
        url: section.content.logoUrl,
        alt: section.content?.title || `${section.id} logo`,
      });
    }

    (section.cards || []).forEach((card) => {
      if (!card.image) return;

      media.push({
        id: `${card.id}-image`,
        type: "image",
        source: "extracted",
        url: card.image,
        alt: card.title || card.id,
      });
    });

    return media;
  }

 private mapLayout(
  section: ManualTemplateSection,
): TemplateSectionLayout {
  return {
    direction:
      section.layout.direction === "row" ? "row" : "column",
    columns: section.layout.columns,
    align: section.layout.align,
    contentPosition: section.layout.contentPosition,
    contentWidth: section.layout.contentWidth,
    minHeight: section.layout.minHeight,
    gap: section.layout.gap,
    paddingTop: section.layout.paddingTop,
    paddingRight: 24,
    paddingBottom: section.layout.paddingBottom,
    paddingLeft: 24,
    backgroundColor: section.backgroundColor,
  };
}

  private uniqueMedia(media: TemplateMedia[]): TemplateMedia[] {
    const seen = new Set<string>();
    const result: TemplateMedia[] = [];

    media.forEach((item) => {
      if (seen.has(item.id)) return;

      seen.add(item.id);
      result.push(item);
    });

    return result;
  }
}
