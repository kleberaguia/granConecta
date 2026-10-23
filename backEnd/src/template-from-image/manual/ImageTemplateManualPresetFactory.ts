import crypto from "node:crypto";

import {
  ImageTemplateManualContentFactory,
  type ManualTemplateBusinessType,
} from "./ImageTemplateManualContentFactory";

import type {
  ManualImageTemplate,
  ManualTemplateCard,
  ManualTemplateCrop,
} from "./ImageTemplateManualTypes";

type CreateEditorialCommerceInput = {
  name?: string;
  sourceImagePath?: string;
  businessType?: ManualTemplateBusinessType;
  businessName?: string;
  businessDescription?: string;
  logoUrl?: string;
};

const crop = (
  x: number,
  y: number,
  width: number,
  height: number,
): ManualTemplateCrop => ({
  x,
  y,
  width,
  height,
});

export class ImageTemplateManualPresetFactory {
  constructor(
    private readonly contentFactory =
      new ImageTemplateManualContentFactory(),
  ) { }

  createLunaJoiasTemplate(
    input: CreateEditorialCommerceInput = {},
  ): ManualImageTemplate {
    return this.createEditorialCommerceTemplate({
      ...input,
      businessType: input.businessType || "jewelry",
    });
  }

  createEditorialCommerceTemplate(
    input: CreateEditorialCommerceInput = {},
  ): ManualImageTemplate {
    const content = this.contentFactory.createContent({
      businessType: input.businessType || "generic",
      businessName: input.businessName || input.name,
      businessDescription: input.businessDescription,
    });

    const traceId = `tpl-${Date.now()}`;
    console.log(`[${traceId}] ImageTemplateManualPresetFactory.createContent`);


    return {
      version: "manual-1.0",
      id: crypto.randomUUID(),
      name:
        input.name ||
        input.businessName ||
        content.header.title ||
        "Nova Página",
      mode: "commerce",
      sourceImagePath: input.sourceImagePath,
      theme: content.theme,
      sections: [
        {
          id: "header",
          type: "header",
          crop: crop(0, 0, 100, 4.5),
          backgroundColor: content.theme.backgroundColor,
          layout: {
            direction: "row",
            align: "center",
            contentPosition: "center",
            columns: 2,
            contentWidth: 1180,
            minHeight: 70,
            paddingTop: 18,
            paddingBottom: 18,
            gap: 32,
          },
          content: {
            title: content.header.title,
            logo: content.header.title,
            logoUrl: input.logoUrl,
            nav: [
              { label: "Inicio", href: "#hero" },
              { label: "Produtos", href: "#best-sellers" },
              { label: "Sobre", href: "#about" },
              { label: "Novidades", href: "#novidades" },
            ],
          },
        },

        {
          id: "hero",
          type: "hero",
          crop: crop(0, 4.5, 100, 27.5),
          backgroundColor: content.theme.secondaryColor,
          backgroundImageCrop: crop(0, 4.5, 100, 27.5),
          layout: {
            direction: "row",
            align: "left",
            contentPosition: "left",
            columns: 2,
            contentWidth: 1180,
            minHeight: 520,
            paddingTop: 96,
            paddingBottom: 96,
            gap: 48,
          },
          content: {
            title: content.header.title,
            logo: content.header.title,
            nav: [
              {
                label: "Coleções",
                href: "#best-sellers",
              },
              {
                label: "Peças Únicas",
                href: "#novidades",
              },
              {
                label: "Sobre",
                href: "#about",
              },
              {
                label: "Contato",
                href: "#contato",
              },
            ],
          },
        },

        {
          id: "best-sellers",
          type: "products",
          crop: crop(0, 32, 100, 31),
          backgroundColor: content.theme.backgroundColor,
          layout: {
            direction: "column",
            align: "center",
            contentPosition: "center",
            columns: 3,
            contentWidth: 1050,
            minHeight: 520,
            paddingTop: 80,
            paddingBottom: 90,
            gap: 34,
          },
          content: {
            title: content.products.title,
          },
          cards: this.mergeCardsWithCrops(
            content.products.cards,
            [
              {
                id: "best-seller-1",
                imageCrop: crop(10.5, 40.7, 24.8, 12.9),
              },
              {
                id: "best-seller-2",
                imageCrop: crop(37.8, 40.7, 24.5, 12.9),
              },
              {
                id: "best-seller-3",
                imageCrop: crop(65, 40.7, 24.3, 12.9),
              },
            ],
          ),
        },

        {
          id: "about",
          type: "about",
          crop: crop(0, 63, 100, 18.5),
          backgroundColor: content.theme.surfaceColor,
          layout: {
            direction: "row",
            align: "left",
            contentPosition: "left",
            columns: 2,
            contentWidth: 1120,
            minHeight: 360,
            paddingTop: 70,
            paddingBottom: 70,
            gap: 56,
          },
          content: {
            title: content.about.title,
            description: content.about.description,
            buttonText: content.about.buttonText,
            buttonUrl: content.about.buttonUrl,
          },
          cards: [
            {
              id: "about-image",
              imageCrop: crop(51.3, 66.7, 44.5, 12.9),
              title: content.about.title,
            },
          ],
        },

        {
          id: "novidades",
          type: "gallery",
          crop: crop(0, 81.5, 100, 18.5),
          backgroundColor: content.theme.backgroundColor,
          layout: {
            direction: "column",
            align: "center",
            contentPosition: "center",
            columns: 4,
            contentWidth: 1120,
            minHeight: 460,
            paddingTop: 72,
            paddingBottom: 80,
            gap: 32,
          },
          content: {
            title: content.header.title,
            logo: content.header.title,
            logoUrl: input.logoUrl,
            nav: [
              { label: "Início", href: "#hero" },
              { label: "Produtos", href: "#best-sellers" },
              { label: "Sobre", href: "#about" },
              { label: "Novidades", href: "#novidades" },
            ],
          },
          cards: this.mergeCardsWithCrops(
            content.gallery.cards,
            [
              {
                id: "novidade-1",
                imageCrop: crop(10.5, 88.2, 17.5, 11.7),
              },
              {
                id: "novidade-2",
                imageCrop: crop(30.8, 88.2, 17.5, 11.7),
              },
              {
                id: "novidade-3",
                imageCrop: crop(51.3, 88.2, 17.5, 11.7),
              },
              {
                id: "novidade-4",
                imageCrop: crop(71.7, 88.2, 17.5, 11.7),
              },
            ],
          ),
        },
      ],
    };
  }

  private mergeCardsWithCrops(
    contentCards: Array<Omit<ManualTemplateCard, "id" | "imageCrop">>,
    cropCards: Array<Pick<ManualTemplateCard, "id" | "imageCrop">>,
  ): ManualTemplateCard[] {
    return cropCards.map((cropCard, index) => {
      const contentCard = contentCards[index] || {};

      return {
        ...contentCard,
        ...cropCard,
        title:
          contentCard.title ||
          `Item ${index + 1}`,
        buttonText:
          contentCard.buttonText ||
          "Ver mais",
        buttonUrl:
          contentCard.buttonUrl ||
          "#",
      };
    });
  }
}