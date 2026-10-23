import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import type {
  ManualImageTemplate,
  ManualTemplateCrop,
} from "./ImageTemplateManualTypes";

type CropperOptions = {
  outputRoot?: string;
  publicBaseUrl?: string;
  imageFormat?: "webp" | "png" | "jpeg";
  quality?: number;
};

type SourceSize = {
  width: number;
  height: number;
};

type PixelCrop = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export class ImageTemplateManualAssetCropper {
  private readonly outputRoot: string;
  private readonly publicBaseUrl: string;
  private readonly imageFormat: "webp" | "png" | "jpeg";
  private readonly quality: number;

  constructor(options: CropperOptions = {}) {
    this.outputRoot =
      options.outputRoot ||
      path.resolve(
        process.cwd(),
        "uploads",
        "generated-templates",
      );

    const apiPublicUrl = String(
      process.env.API_PUBLIC_URL ||
        process.env.BACKEND_PUBLIC_URL ||
        "",
    ).replace(/\/+$/, "");

    this.publicBaseUrl = (
      options.publicBaseUrl ||
      (apiPublicUrl
        ? `${apiPublicUrl}/uploads/generated-templates`
        : "/uploads/generated-templates")
    ).replace(/\/+$/, "");

    this.imageFormat = options.imageFormat || "webp";
    this.quality = this.clamp(options.quality ?? 92, 40, 100);
  }

  async crop(
    template: ManualImageTemplate,
    sourceImagePath: string,
  ): Promise<ManualImageTemplate> {
    await this.assertSourceExists(sourceImagePath);

     const traceId = `tpl-${Date.now()}`;

    console.log(`[${traceId}] ImageTemplateManualAssetCropper.crop`);

    const sourceSize = await this.getSourceSize(sourceImagePath);

    const generationId = `${this.sanitizeFileName(
      template.name || template.id,
    )}-${Date.now()}-${randomUUID().slice(0, 8)}`;

    const outputDirectory = path.join(
      this.outputRoot,
      generationId,
    );

    await fs.mkdir(outputDirectory, {
      recursive: true,
    });

    let extractedCount = 0;

    const sections = [];

    for (const section of template.sections) {
      const nextSection = {
        ...section,
        cards: section.cards ? [...section.cards] : undefined,
      };

      if (section.backgroundImageCrop) {
        nextSection.backgroundImage = await this.cropToFile({
          sourceImagePath,
          sourceSize,
          crop: section.backgroundImageCrop,
          outputDirectory,
          generationId,
          fileName: `${section.id}-background`,
        });

        extractedCount += 1;
      }

      if (nextSection.cards?.length) {
        nextSection.cards = await Promise.all(
          nextSection.cards.map(async (card) => {
            if (!card.imageCrop) return card;

            const image = await this.cropToFile({
              sourceImagePath,
              sourceSize,
              crop: card.imageCrop,
              outputDirectory,
              generationId,
              fileName: card.id,
            });

            extractedCount += 1;

            return {
              ...card,
              image,
            };
          }),
        );
      }

      sections.push(nextSection);
    }

    console.log("MANUAL TEMPLATE CROPS:", {
      templateId: template.id,
      templateName: template.name,
      generationId,
      sourceSize,
      extractedCount,
      outputDirectory,
      publicBaseUrl: this.publicBaseUrl,
    });

    return {
      ...template,
      sourceImagePath,
      sections,
    };
  }

  private async cropToFile({
    sourceImagePath,
    sourceSize,
    crop,
    outputDirectory,
    generationId,
    fileName,
  }: {
    sourceImagePath: string;
    sourceSize: SourceSize;
    crop: ManualTemplateCrop;
    outputDirectory: string;
    generationId: string;
    fileName: string;
  }): Promise<string> {
    const pixelCrop = this.toPixelCrop(crop, sourceSize);

    const safeFileName = `${this.sanitizeFileName(
      fileName,
    )}.${this.imageFormat}`;

    const outputPath = path.join(outputDirectory, safeFileName);

    const image = sharp(sourceImagePath)
      .rotate()
      .extract(pixelCrop);

    if (this.imageFormat === "png") {
      await image
        .png({
          compressionLevel: 8,
          adaptiveFiltering: true,
        })
        .toFile(outputPath);
    } else if (this.imageFormat === "jpeg") {
      await image
        .jpeg({
          quality: this.quality,
          mozjpeg: true,
        })
        .toFile(outputPath);
    } else {
      await image
        .webp({
          quality: this.quality,
          effort: 5,
        })
        .toFile(outputPath);
    }

    return `${this.publicBaseUrl}/${encodeURIComponent(
      generationId,
    )}/${encodeURIComponent(safeFileName)}`;
  }

  private async getSourceSize(
    sourceImagePath: string,
  ): Promise<SourceSize> {
    const metadata = await sharp(sourceImagePath).rotate().metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error(
        "Nao foi possivel identificar as dimensoes da imagem.",
      );
    }

    return {
      width: metadata.width,
      height: metadata.height,
    };
  }

  private toPixelCrop(
    crop: ManualTemplateCrop,
    sourceSize: SourceSize,
  ): PixelCrop {
    const x = this.clamp(crop.x, 0, 99.9);
    const y = this.clamp(crop.y, 0, 99.9);
    const widthPercent = this.clamp(crop.width, 0.1, 100 - x);
    const heightPercent = this.clamp(crop.height, 0.1, 100 - y);

    const left = Math.floor((x / 100) * sourceSize.width);
    const top = Math.floor((y / 100) * sourceSize.height);

    const width = Math.max(
      1,
      Math.min(
        sourceSize.width - left,
        Math.round((widthPercent / 100) * sourceSize.width),
      ),
    );

    const height = Math.max(
      1,
      Math.min(
        sourceSize.height - top,
        Math.round((heightPercent / 100) * sourceSize.height),
      ),
    );

    return {
      left,
      top,
      width,
      height,
    };
  }

  private async assertSourceExists(sourceImagePath: string) {
    try {
      const stats = await fs.stat(sourceImagePath);

      if (!stats.isFile()) {
        throw new Error();
      }
    } catch {
      throw new Error("Imagem de referencia nao encontrada.");
    }
  }

  private sanitizeFileName(value: string): string {
    return (
      String(value || "asset")
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 120) || "asset"
    );
  }

  private clamp(
    value: number,
    minimum: number,
    maximum: number,
  ): number {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      return minimum;
    }

    return Math.min(maximum, Math.max(minimum, parsed));
  }
}