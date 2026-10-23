import type {
  ImageVisualLayout,
  VisualAsset,
  VisualSection,
} from "./ImageVisualLayoutSchema";

type VisualBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type LooseVisualCard = {
  id?: string;
  bounds?: VisualBounds;
  imageBounds?: VisualBounds;
  mediaBounds?: VisualBounds;
  imageAssetId?: string;
  image?: {
    assetId?: string;
    id?: string;
  };
  [key: string]: any;
};

export class ImageVisualSectionAssetBinder {
  bind(layout: ImageVisualLayout): ImageVisualLayout {
    const rootAssets = this.collectAssets(layout);
    const sections = (layout.sections || []).map((section) =>
      this.bindSection(section, rootAssets),
    );

    const allAssets = this.uniqueAssets([
      ...rootAssets,
      ...sections.flatMap((section) =>
        Array.isArray((section as any).assets)
          ? ((section as any).assets as VisualAsset[])
          : [],
      ),
    ]);

    return {
      ...layout,
      assets: allAssets,
      sections,
    } as ImageVisualLayout;
  }

  private bindSection(
    section: VisualSection,
    rootAssets: VisualAsset[],
  ): VisualSection {
    const currentSection = section as any;
    const existingSectionAssets = this.resolveSectionAssets(
      section,
      rootAssets,
    );

    const cards = Array.isArray(currentSection.cards)
      ? (currentSection.cards as LooseVisualCard[])
      : [];

    const syntheticCardAssets = this.createMissingCardAssets(
      section,
      cards,
      existingSectionAssets,
    );

    const sectionAssets = this.uniqueAssets([
      ...existingSectionAssets,
      ...syntheticCardAssets,
    ]);

    const boundCards = this.bindCards(cards, sectionAssets, section);

    const assetIds = this.unique([
      ...(Array.isArray(currentSection.assetIds)
        ? currentSection.assetIds
        : []),
      ...sectionAssets.map((asset) => asset.id),
    ]);

    const backgroundAsset =
      this.assetById(sectionAssets, currentSection.backgroundAssetId) ||
      this.assetById(sectionAssets, currentSection.background?.assetId) ||
      sectionAssets.find((asset) => asset.role === "background") ||
      this.findLargeBackgroundCandidate(section, sectionAssets);

    return {
      ...section,
      assets: sectionAssets,
      assetIds,
      backgroundAssetId:
        currentSection.backgroundAssetId ||
        backgroundAsset?.id,
      cards: boundCards,
    } as VisualSection;
  }

  private bindCards(
    cards: LooseVisualCard[],
    sectionAssets: VisualAsset[],
    section: VisualSection,
  ): LooseVisualCard[] {
    return cards.map((card, index) => {
      const currentImageAssetId =
        card.imageAssetId ||
        card.image?.assetId ||
        card.image?.id;

      const syntheticId = this.cardAssetId(section, card, index);

      const matchedAsset =
        this.assetById(sectionAssets, currentImageAssetId) ||
        this.assetById(sectionAssets, syntheticId) ||
        this.findBestAssetForCard(card, sectionAssets);

      return {
        ...card,
        imageAssetId: matchedAsset?.id || currentImageAssetId,
        image: {
          ...(card.image || {}),
          assetId: matchedAsset?.id || currentImageAssetId,
        },
      };
    });
  }

  private createMissingCardAssets(
    section: VisualSection,
    cards: LooseVisualCard[],
    sectionAssets: VisualAsset[],
  ): VisualAsset[] {
    const currentSection = section as any;
    const sectionType = String(currentSection.type || "");

    if (
      !["products", "services", "gallery"].includes(sectionType) ||
      !cards.length
    ) {
      return [];
    }

    return cards
      .map((card, index) => {
        const currentImageAssetId =
          card.imageAssetId ||
          card.image?.assetId ||
          card.image?.id;

        if (this.assetById(sectionAssets, currentImageAssetId)) {
          return null;
        }

        const bounds = this.resolveCardImageBounds(
          section,
          card,
          index,
          cards.length,
        );

        if (!bounds) {
          return null;
        }

        const role =
          sectionType === "services"
            ? "service"
            : sectionType === "gallery"
              ? "gallery"
              : "product";

        return {
          id: this.cardAssetId(section, card, index),
          type: "image",
          role,
          bounds,
          description:
            card.title ||
            `${sectionType} ${index + 1}`,
        } as VisualAsset;
      })
      .filter(Boolean) as VisualAsset[];
  }

  private resolveCardImageBounds(
    section: VisualSection,
    card: LooseVisualCard,
    index: number,
    totalCards: number,
  ): VisualBounds | undefined {
    if (card.imageBounds) {
      return this.clampBounds(card.imageBounds);
    }

    if (card.mediaBounds) {
      return this.clampBounds(card.mediaBounds);
    }

    if (card.bounds) {
      return this.clampBounds(this.topPart(card.bounds));
    }

    const estimatedCardBounds = this.estimateCardBounds(
      section,
      index,
      totalCards,
    );

    return estimatedCardBounds
      ? this.clampBounds(this.topPart(estimatedCardBounds))
      : undefined;
  }

  private topPart(bounds: VisualBounds): VisualBounds {
    return {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: Math.max(bounds.height * 0.56, bounds.height - 12),
    };
  }

  private estimateCardBounds(
    section: VisualSection,
    index: number,
    totalCards: number,
  ): VisualBounds | undefined {
    const sectionBounds = (section as any).bounds as VisualBounds | undefined;

    if (!sectionBounds) {
      return undefined;
    }

    const columns =
      Number((section as any).columns) ||
      (totalCards >= 4 ? 4 : totalCards === 3 ? 3 : totalCards === 2 ? 2 : 1);

    const rows = Math.max(1, Math.ceil(totalCards / columns));
    const row = Math.floor(index / columns);
    const column = index % columns;

    const titleReserve = sectionBounds.height * 0.22;
    const gridX = sectionBounds.x + sectionBounds.width * 0.08;
    const gridY = sectionBounds.y + titleReserve;
    const gridWidth = sectionBounds.width * 0.84;
    const gridHeight = sectionBounds.height - titleReserve;
    const gapX = Math.min(3, gridWidth * 0.03);
    const gapY = Math.min(3, gridHeight * 0.06);
    const cardWidth =
      (gridWidth - gapX * Math.max(0, columns - 1)) / columns;
    const cardHeight =
      (gridHeight - gapY * Math.max(0, rows - 1)) / rows;

    return {
      x: gridX + column * (cardWidth + gapX),
      y: gridY + row * (cardHeight + gapY),
      width: cardWidth,
      height: cardHeight,
    };
  }

  private collectAssets(layout: ImageVisualLayout): VisualAsset[] {
    const rootAssets = Array.isArray((layout as any).assets)
      ? ((layout as any).assets as VisualAsset[])
      : [];

    const sectionAssets = (layout.sections || []).flatMap((section) =>
      Array.isArray((section as any).assets)
        ? ((section as any).assets as VisualAsset[])
        : [],
    );

    return this.uniqueAssets([...rootAssets, ...sectionAssets]);
  }

  private resolveSectionAssets(
    section: VisualSection,
    rootAssets: VisualAsset[],
  ): VisualAsset[] {
    const currentSection = section as any;

    const ownAssets = Array.isArray(currentSection.assets)
      ? (currentSection.assets as VisualAsset[])
      : [];

    const assetIds = Array.isArray(currentSection.assetIds)
      ? currentSection.assetIds
      : [];

    const byExplicitIds = assetIds
      .map((assetId: string) => this.assetById(rootAssets, assetId))
      .filter(Boolean) as VisualAsset[];

    const sectionBounds = currentSection.bounds as VisualBounds | undefined;

    const byPosition = sectionBounds
      ? rootAssets.filter((asset) =>
          this.assetCenterIsInside(asset, sectionBounds),
        )
      : [];

    return this.uniqueAssets([
      ...ownAssets,
      ...byExplicitIds,
      ...byPosition,
    ]);
  }

  private findBestAssetForCard(
    card: LooseVisualCard,
    sectionAssets: VisualAsset[],
  ): VisualAsset | undefined {
    if (!card.bounds) {
      return undefined;
    }

    return sectionAssets
      .filter((asset) => asset.role !== "background" && asset.role !== "logo")
      .map((asset) => ({
        asset,
        overlap: this.overlapRatio(card.bounds!, asset.bounds),
      }))
      .sort((a, b) => b.overlap - a.overlap)
      .find((item) => item.overlap > 0.05)?.asset;
  }

  private findLargeBackgroundCandidate(
    section: VisualSection,
    assets: VisualAsset[],
  ): VisualAsset | undefined {
    const sectionType = String((section as any).type || "");

    if (sectionType !== "hero" && sectionType !== "cta") {
      return undefined;
    }

    return [...assets]
      .filter((asset) => asset.role !== "logo")
      .sort((a, b) => this.area(b.bounds) - this.area(a.bounds))[0];
  }

  private assetCenterIsInside(
    asset: VisualAsset,
    sectionBounds: VisualBounds,
  ): boolean {
    if (!asset.bounds) return false;

    const centerX = asset.bounds.x + asset.bounds.width / 2;
    const centerY = asset.bounds.y + asset.bounds.height / 2;

    return (
      centerX >= sectionBounds.x &&
      centerX <= sectionBounds.x + sectionBounds.width &&
      centerY >= sectionBounds.y &&
      centerY <= sectionBounds.y + sectionBounds.height
    );
  }

  private overlapRatio(
    a?: VisualBounds,
    b?: VisualBounds,
  ): number {
    if (!a || !b) return 0;

    const x1 = Math.max(a.x, b.x);
    const y1 = Math.max(a.y, b.y);
    const x2 = Math.min(a.x + a.width, b.x + b.width);
    const y2 = Math.min(a.y + a.height, b.y + b.height);

    const width = Math.max(0, x2 - x1);
    const height = Math.max(0, y2 - y1);
    const intersection = width * height;
    const aArea = this.area(a);

    return aArea > 0 ? intersection / aArea : 0;
  }

  private area(bounds?: VisualBounds): number {
    return bounds ? bounds.width * bounds.height : 0;
  }

  private clampBounds(bounds: VisualBounds): VisualBounds {
    const x = Math.max(0, Math.min(100, bounds.x));
    const y = Math.max(0, Math.min(100, bounds.y));
    const width = Math.max(1, Math.min(100 - x, bounds.width));
    const height = Math.max(1, Math.min(100 - y, bounds.height));

    return {
      x,
      y,
      width,
      height,
    };
  }

  private cardAssetId(
    section: VisualSection,
    card: LooseVisualCard,
    index: number,
  ): string {
    return `${section.id}-${card.id || `card-${index + 1}`}-image`
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .replace(/-+/g, "-");
  }

  private assetById(
    assets: VisualAsset[],
    assetId?: string,
  ): VisualAsset | undefined {
    if (!assetId) return undefined;

    return assets.find((asset) => asset.id === assetId);
  }

  private unique(values: string[]): string[] {
    return Array.from(new Set(values.filter(Boolean)));
  }

  private uniqueAssets(assets: VisualAsset[]): VisualAsset[] {
    const byId = new Map<string, VisualAsset>();

    assets.forEach((asset) => {
      if (!asset?.id) return;
      byId.set(asset.id, asset);
    });

    return Array.from(byId.values());
  }
}
