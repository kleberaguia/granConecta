import type {
  TemplateAction,
  TemplateButton,
  TemplateMedia,
  TemplatePage,
  TemplatePageMode,
  TemplateProductCard,
  TemplateSection,
  TemplateSectionLayout,
  TemplateServiceCard,
  TemplateTheme,
} from "../../templates/schema/TemplatePageSchema";

import type {
  CroppedImageVisualLayout,
  CroppedVisualAsset,
} from "./ImageVisualAssetCropper";

type LooseVisualSection = {
  id: string;
  type: string;
  title?: string;
  hidden?: boolean;
  bounds?: VisualBounds;
  alignment?: "left" | "center" | "right";
  direction?: string;
  columns?: number;
  contentWidth?: number;
  gap?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  backgroundColor?: string;
  backgroundAssetId?: string;
  backgroundSize?: "auto" | "cover" | "contain";
  backgroundPosition?: string;
  overlayColor?: string;
  overlayOpacity?: number;
  assetIds?: string[];
  texts?: LooseVisualText[];
  buttons?: LooseVisualButton[];
  cards?: LooseVisualCard[];
};

type VisualBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type LooseVisualText = {
  id?: string;
  role?: string;
  content?: string;
};

type LooseVisualButton = {
  id?: string;
  label?: string;
  href?: string;
  target?: string;
  variant?: "primary" | "secondary" | "text";
  action?: {
    type?: TemplateAction["type"];
  };
};

type LooseVisualCard = {
  id?: string;
  title?: string;
  description?: string;
  price?: string;
  bounds?: VisualBounds;
  imageAssetId?: string;
  titleTextId?: string;
  descriptionTextId?: string;
  priceTextId?: string;
  buttonId?: string;
};

export class ImageVisualToTemplatePageMapper {
  map(layout: CroppedImageVisualLayout): TemplatePage {
    const sections = this.layoutSections(layout);

    return {
      version: "page-1.0",
      id: layout.id,
      name: layout.name,
      mode: layout.mode as TemplatePageMode,
      theme: this.mapTheme(layout),
      media: this.mapMedia(layout.assets),
      sections: sections
        .map((section) => this.mapSection(section, layout))
        .filter(Boolean) as TemplateSection[],
      commerce: {
        enabled: layout.mode === "commerce",
        cartEnabled: layout.mode === "commerce",
        defaultProductAction:
          layout.mode === "commerce" ? "add_to_cart" : "navigate",
      },
      metadata: {
        createdAt: new Date().toISOString(),
        generatedBy: "ai",
        source: "image",
        sourceId:
          (layout as any).image?.sourcePath ||
          (layout as any).image?.sourceName,
        storeId: (layout as any).metadata?.storeId,
      },
    };
  }

  private mapSection(
    section: LooseVisualSection,
    layout: CroppedImageVisualLayout,
  ): TemplateSection | null {
    switch (section.type) {
      case "navbar":
      case "header":
        return this.mapNavbar(section, layout);

      case "hero":
        return this.mapHero(section, layout);

      case "products":
        return this.mapProducts(section, layout);

      case "services":
        return this.mapServices(section, layout);

      case "about":
        return this.mapAbout(section, layout);

      case "gallery":
        return this.mapGallery(section, layout);

      case "cta":
        return this.mapCta(section, layout);

      case "faq":
        return this.mapFaq(section, layout);

      case "footer":
        return this.mapFooter(section, layout);

      default:
        return this.mapCustom(section, layout);
    }
  }

  private mapNavbar(
    section: LooseVisualSection,
    layout: CroppedImageVisualLayout,
  ): TemplateSection {
    const sections = this.layoutSections(layout);
    const logoAsset = this.findSectionAsset(section, layout, ["logo"]);
    const logoText =
      this.findText(section, ["logo"])?.content ||
      layout.name ||
      "GranConecta";

    const navTexts = this.sectionTexts(section)
      .filter((text) => text.role === "nav")
      .map((text) => text.content || "")
      .filter(Boolean);

    const fallbackNav = this.defaultNavForSections(sections);

    return {
      id: section.id,
      type: "navbar",
      hidden: section.hidden,
      layout: this.mapLayout(section, layout, {
        direction: "row",
        contentPosition: "center",
        minHeight: 72,
      }),
      content: {
        logoText,
        logoMediaId: logoAsset?.id,
        links: (navTexts.length ? navTexts : fallbackNav).map((label) => ({
          label,
          href: this.toAnchor(label),
          action: {
            type: "scroll",
            target: this.toAnchor(label),
          },
        })),
      },
    } as TemplateSection;
  }

  private mapHero(
    section: LooseVisualSection,
    layout: CroppedImageVisualLayout,
  ): TemplateSection {
    const title =
      this.findText(section, ["title"])?.content ||
      section.title ||
      layout.name;
    const subtitle =
      this.findText(section, [
        "subtitle",
        "description",
        "body",
      ])?.content || "";
    const heroImage = this.findSectionAsset(section, layout, [
      "hero-image",
      "image",
      "product",
      "about",
      "gallery",
    ]);

    return {
      id: section.id,
      type: "hero",
      hidden: section.hidden,
      layout: this.mapLayout(section, layout, {
        direction: section.backgroundAssetId ? "column" : "row",
        contentPosition: section.alignment || "left",
      }),
      content: {
        eyebrow: this.findText(section, ["eyebrow"])?.content,
        title,
        subtitle,
        description:
          this.findText(section, ["description"])?.content ||
          undefined,
        button: this.mapButton(
          this.findButton(section),
          "Conhecer",
          "scroll",
          "#produtos",
        ),
        mediaId: heroImage?.id,
        mediaPosition:
          section.alignment === "right" ? "left" : "right",
      },
    } as TemplateSection;
  }

  private mapProducts(
    section: LooseVisualSection,
    layout: CroppedImageVisualLayout,
  ): TemplateSection {
    const cards = this.mapProductCards(section, layout);

    return {
      id: section.id,
      type: "products",
      hidden: section.hidden,
      layout: this.mapLayout(section, layout, {
        direction: "column",
        columns: this.resolveGridColumns(section, cards.length),
        contentPosition: "center",
      }),
      content: {
        title:
          this.findText(section, ["title"])?.content ||
          section.title ||
          "Produtos",
        subtitle: this.findText(section, ["subtitle"])?.content,
        cards,
      },
    } as TemplateSection;
  }

  private mapServices(
    section: LooseVisualSection,
    layout: CroppedImageVisualLayout,
  ): TemplateSection {
    const cards = this.mapServiceCards(section, layout);

    return {
      id: section.id,
      type: "services",
      hidden: section.hidden,
      layout: this.mapLayout(section, layout, {
        direction: "column",
        columns: this.resolveGridColumns(section, cards.length),
        contentPosition: "center",
      }),
      content: {
        title:
          this.findText(section, ["title"])?.content ||
          section.title ||
          "Servicos",
        subtitle: this.findText(section, ["subtitle"])?.content,
        cards,
      },
    } as TemplateSection;
  }

  private mapAbout(
    section: LooseVisualSection,
    layout: CroppedImageVisualLayout,
  ): TemplateSection {
    const aboutImage = this.findSectionAsset(section, layout, [
      "about",
      "image",
      "hero-image",
      "product",
      "gallery",
    ]);

    return {
      id: section.id,
      type: "about",
      hidden: section.hidden,
      layout: this.mapLayout(section, layout, {
        direction: aboutImage ? "row" : "column",
        contentPosition: section.alignment || "left",
      }),
      content: {
        title:
          this.findText(section, ["title"])?.content ||
          section.title ||
          "Sobre",
        description:
          this.findText(section, [
            "description",
            "body",
            "subtitle",
          ])?.content || "",
        button: this.findButton(section)
          ? this.mapButton(
              this.findButton(section),
              "Saiba mais",
              "open_contact_modal",
            )
          : undefined,
        mediaId: aboutImage?.id,
      },
    } as TemplateSection;
  }

  private mapGallery(
    section: LooseVisualSection,
    layout: CroppedImageVisualLayout,
  ): TemplateSection {
    const mediaIds = this.sectionAssets(section, layout)
      .filter((asset) =>
        this.assetHasRole(asset, [
          "gallery",
          "product",
          "about",
          "hero-image",
          "image",
        ]),
      )
      .map((asset) => asset.id);

    return {
      id: section.id,
      type: "gallery",
      hidden: section.hidden,
      layout: this.mapLayout(section, layout, {
        direction: "column",
        columns: this.resolveGridColumns(section, mediaIds.length),
        contentPosition: "center",
      }),
      content: {
        title:
          this.findText(section, ["title"])?.content ||
          section.title ||
          "Galeria",
        mediaIds,
      },
    } as TemplateSection;
  }

  private mapCta(
    section: LooseVisualSection,
    layout: CroppedImageVisualLayout,
  ): TemplateSection {
    return {
      id: section.id,
      type: "cta",
      hidden: section.hidden,
      layout: this.mapLayout(section, layout, {
        direction: "column",
        contentPosition: section.alignment || "center",
      }),
      content: {
        title:
          this.findText(section, ["title"])?.content ||
          section.title ||
          "Fale conosco",
        description:
          this.findText(section, [
            "description",
            "subtitle",
            "body",
          ])?.content || "",
        button: this.mapButton(
          this.findButton(section),
          "Fale conosco",
          "open_contact_modal",
        ),
      },
    } as TemplateSection;
  }

  private mapFaq(
    section: LooseVisualSection,
    layout: CroppedImageVisualLayout,
  ): TemplateSection {
    const texts = this.sectionTexts(section);
    const questions = texts.filter(
      (text) => text.role === "title" || text.role === "body",
    );

    return {
      id: section.id,
      type: "faq",
      hidden: section.hidden,
      layout: this.mapLayout(section, layout, {
        direction: "column",
        contentPosition: "center",
      }),
      content: {
        title:
          this.findText(section, ["title"])?.content ||
          section.title ||
          "Perguntas frequentes",
        items: questions.map((text, index) => ({
          question: text.content || `Pergunta ${index + 1}`,
          answer:
            questions[index + 1]?.content ||
            "Entre em contato para saber mais.",
        })),
      },
    } as TemplateSection;
  }

  private mapFooter(
    section: LooseVisualSection,
    layout: CroppedImageVisualLayout,
  ): TemplateSection {
    const sections = this.layoutSections(layout);
    const logoAsset = this.findSectionAsset(section, layout, ["logo"]);

    return {
      id: section.id,
      type: "footer",
      hidden: section.hidden,
      layout: this.mapLayout(section, layout, {
        direction: "column",
        contentPosition: "center",
      }),
      content: {
        logoMediaId: logoAsset?.id,
        brand:
          this.findText(section, ["logo", "title"])?.content ||
          layout.name,
        description:
          this.findText(section, ["description", "body"])?.content ||
          "",
        links: this.defaultNavForSections(sections).map((label) => ({
          label,
          href: this.toAnchor(label),
        })),
      },
    } as TemplateSection;
  }

  private mapCustom(
    section: LooseVisualSection,
    layout: CroppedImageVisualLayout,
  ): TemplateSection {
    return {
      id: section.id,
      type: "custom",
      hidden: section.hidden,
      layout: this.mapLayout(section, layout, {
        direction: section.direction === "row" ? "row" : "column",
        contentPosition: section.alignment || "center",
      }),
      content: {
        title:
          this.findText(section, ["title"])?.content ||
          section.title ||
          "",
        text:
          this.findText(section, [
            "description",
            "subtitle",
            "body",
          ])?.content || "",
        mediaIds: this.sectionAssets(section, layout).map(
          (asset) => asset.id,
        ),
      },
    } as TemplateSection;
  }

  private mapTheme(layout: CroppedImageVisualLayout): TemplateTheme {
    const theme = (layout as any).theme || {};

    return {
      primaryColor: theme.primaryColor || "#b8856d",
      secondaryColor: theme.secondaryColor || "#d9c0a8",
      backgroundColor: theme.backgroundColor || "#fbf6ed",
      surfaceColor: theme.surfaceColor || "#fffaf3",
      textColor: theme.textColor || "#4b332c",
      mutedTextColor: theme.mutedTextColor || "#876f64",
      headingFont: theme.headingFont || "Georgia, serif",
      bodyFont:
        theme.bodyFont ||
        "Montserrat, Arial, sans-serif",
      borderRadius: theme.borderRadius ?? 12,
      spacing: theme.spacing || "comfortable",
    };
  }

  private mapMedia(
    assets: CroppedVisualAsset[] = [],
  ): TemplateMedia[] {
    return assets.map((asset) => ({
      id: asset.id,
      type:
        asset.role === "background"
          ? "background"
          : asset.role === "icon"
            ? "icon"
            : "image",
      source: "extracted",
      url: asset.url,
      alt:
        (asset as any).description ||
        (asset as any).alt ||
        asset.id,
      width: (asset as any).width,
      height: (asset as any).height,
      crop: asset.bounds,
    }));
  }

  private mapLayout(
    section: LooseVisualSection,
    layout: CroppedImageVisualLayout,
    fallback: Partial<TemplateSectionLayout> = {},
  ): TemplateSectionLayout {
    const backgroundAssetId =
      section.backgroundAssetId ||
      this.findSectionAsset(section, layout, ["background"])?.id;

    const direction = this.mapDirection(
      fallback.direction || section.direction,
    );

    return {
      direction,
      columns:
        fallback.columns ||
        section.columns ||
        (direction === "row" ? 2 : 1),
      align: section.alignment || fallback.align || "center",
      contentPosition:
        fallback.contentPosition ||
        section.alignment ||
        "center",
      contentWidth:
        section.contentWidth || fallback.contentWidth || 1120,
      minHeight:
        fallback.minHeight ||
        this.estimateMinHeight(section.bounds?.height),
      gap: section.gap || fallback.gap || 32,
      paddingTop:
        section.paddingTop ??
        fallback.paddingTop ??
        this.estimatePadding(section),
      paddingRight:
        section.paddingRight ?? fallback.paddingRight ?? 24,
      paddingBottom:
        section.paddingBottom ??
        fallback.paddingBottom ??
        this.estimatePadding(section),
      paddingLeft:
        section.paddingLeft ?? fallback.paddingLeft ?? 24,
      backgroundColor:
        section.backgroundColor ||
        fallback.backgroundColor ||
        (layout as any).theme?.backgroundColor,
      backgroundMediaId: backgroundAssetId,
      backgroundSize:
        section.backgroundSize ||
        (backgroundAssetId ? "cover" : undefined),
      backgroundPosition:
        section.backgroundPosition || "center center",
      overlayColor: section.overlayColor,
      overlayOpacity: section.overlayOpacity,
    };
  }

  private mapProductCards(
    section: LooseVisualSection,
    layout: CroppedImageVisualLayout,
  ): TemplateProductCard[] {
    const cards = this.sectionCards(section);
    const fallbackImages = this.cardCandidateAssets(section, layout);

    if (cards.length) {
      return cards.map((card, index) =>
        this.mapProductCard(
          section,
          layout,
          card,
          index,
          fallbackImages[index],
        ),
      );
    }

    return fallbackImages
      .map((asset, index) => ({
        id: asset.id,
        productId: asset.id,
        title:
          (asset as any).description ||
          (asset as any).alt ||
          `Produto ${index + 1}`,
        description: "",
        priceText: "",
        imageMediaId: asset.id,
        button: {
          label:
            layout.mode === "commerce" ? "Comprar" : "Ver mais",
          action: {
            type:
              layout.mode === "commerce"
                ? "add_to_cart"
                : "navigate",
            productId: asset.id,
            href: "#",
          },
        },
      }));
  }

  private mapProductCard(
    section: LooseVisualSection,
    layout: CroppedImageVisualLayout,
    card: LooseVisualCard,
    index: number,
    fallbackImage?: CroppedVisualAsset,
  ): TemplateProductCard {
    const imageAsset =
      this.assetById(layout, card.imageAssetId) ||
      this.findCardAsset(section, layout, card) ||
      fallbackImage;

    return {
      id: card.id || `product-${index + 1}`,
      productId: card.id || `product-${index + 1}`,
      title:
        this.textById(section, card.titleTextId)?.content ||
        card.title ||
        (imageAsset as any)?.description ||
        `Produto ${index + 1}`,
      description:
        this.textById(section, card.descriptionTextId)?.content ||
        card.description ||
        "",
      priceText:
        this.textById(section, card.priceTextId)?.content ||
        card.price ||
        "",
      imageMediaId: imageAsset?.id,
      button: this.mapButton(
        this.buttonById(section, card.buttonId),
        layout.mode === "commerce" ? "Comprar" : "Ver mais",
        layout.mode === "commerce" ? "add_to_cart" : "navigate",
        "#",
        card.id,
      ),
    };
  }

  private mapServiceCards(
    section: LooseVisualSection,
    layout: CroppedImageVisualLayout,
  ): TemplateServiceCard[] {
    const cards = this.sectionCards(section);
    const fallbackImages = this.cardCandidateAssets(section, layout);

    if (cards.length) {
      return cards.map((card, index) => ({
        id: card.id || `service-${index + 1}`,
        title:
          this.textById(section, card.titleTextId)?.content ||
          card.title ||
          `Servico ${index + 1}`,
        description:
          this.textById(section, card.descriptionTextId)
            ?.content ||
          card.description ||
          "",
        iconMediaId:
          this.assetById(layout, card.imageAssetId)?.id ||
          this.findCardAsset(section, layout, card)?.id ||
          fallbackImages[index]?.id,
      }));
    }

    return fallbackImages
      .map((asset, index) => ({
        id: asset.id,
        title:
          (asset as any).description ||
          `Servico ${index + 1}`,
        description: "",
        iconMediaId: asset.id,
      }));
  }

  private mapButton(
    button: LooseVisualButton | undefined,
    fallbackLabel: string,
    fallbackActionType: TemplateAction["type"],
    fallbackHref = "#",
    productId?: string,
  ): TemplateButton {
    return {
      label: button?.label || fallbackLabel,
      variant: button?.variant || "primary",
      action: {
        type: button?.action?.type || fallbackActionType,
        href: button?.href || fallbackHref,
        target: button?.target || button?.href || fallbackHref,
        productId,
      },
    };
  }

  private layoutSections(
    layout: CroppedImageVisualLayout,
  ): LooseVisualSection[] {
    return Array.isArray((layout as any).sections)
      ? ((layout as any).sections as LooseVisualSection[])
      : [];
  }

  private sectionTexts(
    section: LooseVisualSection,
  ): LooseVisualText[] {
    return Array.isArray(section.texts) ? section.texts : [];
  }

  private sectionCards(
    section: LooseVisualSection,
  ): LooseVisualCard[] {
    return Array.isArray(section.cards) ? section.cards : [];
  }

  private findText(
    section: LooseVisualSection,
    roles: string[],
  ): LooseVisualText | undefined {
    return this.sectionTexts(section).find((text) =>
      roles.includes(text.role || ""),
    );
  }

  private textById(
    section: LooseVisualSection,
    id?: string,
  ): LooseVisualText | undefined {
    if (!id) return undefined;

    return this.sectionTexts(section).find((text) => text.id === id);
  }

  private findButton(
    section: LooseVisualSection,
  ): LooseVisualButton | undefined {
    return Array.isArray(section.buttons)
      ? section.buttons[0]
      : undefined;
  }

  private buttonById(
    section: LooseVisualSection,
    id?: string,
  ): LooseVisualButton | undefined {
    if (!id || !Array.isArray(section.buttons)) return undefined;

    return section.buttons.find((button) => button.id === id);
  }

  private sectionAssets(
    section: LooseVisualSection,
    layout: CroppedImageVisualLayout,
  ): CroppedVisualAsset[] {
    const sectionAssetIds = new Set(section.assetIds || []);

    return (layout.assets || []).filter((asset) => {
      if (sectionAssetIds.has(asset.id)) return true;

      const bounds = asset.bounds;
      const sectionBounds = section.bounds;

      if (!bounds || !sectionBounds) return false;

      const centerX = bounds.x + bounds.width / 2;
      const centerY = bounds.y + bounds.height / 2;

      return (
        centerX >= sectionBounds.x &&
        centerX <= sectionBounds.x + sectionBounds.width &&
        centerY >= sectionBounds.y &&
        centerY <= sectionBounds.y + sectionBounds.height
      );
    });
  }

  private findSectionAsset(
    section: LooseVisualSection,
    layout: CroppedImageVisualLayout,
    roles: string[],
  ): CroppedVisualAsset | undefined {
    return this.sectionAssets(section, layout).find((asset) =>
      this.assetHasRole(asset, roles),
    );
  }

  private findCardAsset(
    section: LooseVisualSection,
    layout: CroppedImageVisualLayout,
    card: LooseVisualCard,
  ): CroppedVisualAsset | undefined {
    const cardBounds = card.bounds;

    if (!cardBounds) return undefined;

    return this.sectionAssets(section, layout).find((asset) => {
      if (!asset.bounds) return false;

      const centerX = asset.bounds.x + asset.bounds.width / 2;
      const centerY = asset.bounds.y + asset.bounds.height / 2;

      return (
        centerX >= cardBounds.x &&
        centerX <= cardBounds.x + cardBounds.width &&
        centerY >= cardBounds.y &&
        centerY <= cardBounds.y + cardBounds.height
      );
    });
  }

  private cardCandidateAssets(
    section: LooseVisualSection,
    layout: CroppedImageVisualLayout,
  ): CroppedVisualAsset[] {
    const sectionAssets = this.sectionAssets(section, layout);
    const candidates = sectionAssets.filter((asset) =>
      this.assetHasRole(asset, [
        "product",
        "service",
        "gallery",
        "about",
        "hero-image",
        "image",
      ]),
    );

    const filtered = candidates.filter(
      (asset) => asset.role !== "background" && asset.role !== "logo",
    );

    return filtered.length
      ? this.sortAssetsByPosition(filtered)
      : this.sortAssetsByPosition(sectionAssets);
  }

  private sortAssetsByPosition(
    assets: CroppedVisualAsset[],
  ): CroppedVisualAsset[] {
    return [...assets].sort((a, b) => {
      const ay = a.bounds?.y ?? 0;
      const by = b.bounds?.y ?? 0;
      const ax = a.bounds?.x ?? 0;
      const bx = b.bounds?.x ?? 0;

      if (Math.abs(ay - by) > 3) {
        return ay - by;
      }

      return ax - bx;
    });
  }

  private assetById(
    layout: CroppedImageVisualLayout,
    id?: string,
  ): CroppedVisualAsset | undefined {
    if (!id) return undefined;

    return (layout.assets || []).find((asset) => asset.id === id);
  }

  private assetHasRole(
    asset: CroppedVisualAsset,
    roles: string[],
  ): boolean {
    return roles.includes(String(asset.role || "unknown"));
  }

  private mapDirection(
    direction?: string,
  ): TemplateSectionLayout["direction"] {
    return direction === "row" ? "row" : "column";
  }

  private resolveGridColumns(
    section: LooseVisualSection,
    itemCount: number,
  ): number {
    if (section.columns && section.columns > 0) {
      return section.columns;
    }

    if (itemCount >= 4) return 4;
    if (itemCount === 3) return 3;
    if (itemCount === 2) return 2;

    return 1;
  }

  private estimateMinHeight(percentHeight?: number): number {
    if (!percentHeight) return 260;

    return Math.max(120, Math.round(percentHeight * 8));
  }

  private estimatePadding(section: LooseVisualSection): number {
    if (section.type === "navbar" || section.type === "header") {
      return 16;
    }

    if (section.type === "hero") {
      return 72;
    }

    return 56;
  }

  private defaultNavForSections(
    sections: LooseVisualSection[] = [],
  ): string[] {
    const labels = sections
      .filter((section) =>
        ["products", "services", "about", "gallery", "cta"].includes(
          section.type,
        ),
      )
      .map((section) => section.title || this.labelForType(section.type));

    return labels.length
      ? labels
      : ["Inicio", "Produtos", "Sobre", "Contato"];
  }

  private labelForType(type: string): string {
    const labels: Record<string, string> = {
      hero: "Inicio",
      products: "Produtos",
      services: "Servicos",
      about: "Sobre",
      gallery: "Galeria",
      cta: "Contato",
      footer: "Contato",
    };

    return labels[type] || "Secao";
  }

  private toAnchor(label: string): string {
    const slug = String(label || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return `#${slug || "secao"}`;
  }
}
