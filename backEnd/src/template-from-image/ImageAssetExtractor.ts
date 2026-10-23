import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import type {
  ImageTemplateAsset,
  ImageTemplateCrop,
  ImageTemplateSpec,
} from "./ImageTemplateTypes";

type ImageAssetExtractorOptions = {
  outputRoot?: string;
  publicBaseUrl?: string;
  imageFormat?: "webp" | "png" | "jpeg";
  quality?: number;
};

type SourceImageSize = {
  width: number;
  height: number;
};

type PixelCrop = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export class ImageAssetExtractor {
  private readonly outputRoot: string;
  private readonly publicBaseUrl: string;
  private readonly imageFormat: "webp" | "png" | "jpeg";
  private readonly quality: number;

  constructor(options: ImageAssetExtractorOptions = {}) {
    this.outputRoot =
      options.outputRoot ||
      path.resolve(
        process.cwd(),
        "uploads",
        "generated-templates",
      );

    const apiPublicUrl = String(
      process.env.VITE_API_URL ||
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
    this.quality = this.clamp(
      options.quality ?? 90,
      40,
      100,
    );
  }

  async extract(
    spec: ImageTemplateSpec,
    sourceImagePath: string,
  ): Promise<ImageTemplateSpec> {
    await this.assertSourceExists(sourceImagePath);

    const sourceSize = await this.getSourceImageSize(sourceImagePath);

    const generationId = `${this.sanitizeFileName(
      spec.id || "template",
    )}-${Date.now()}-${randomUUID().slice(0, 8)}`;

    const outputDirectory = path.join(
      this.outputRoot,
      generationId,
    );

    await fs.mkdir(outputDirectory, {
      recursive: true,
    });

    let extractedCount = 0;
    let missingCropCount = 0;
    let keptCount = 0;
    let failedCount = 0;

    const extractedAssets: ImageTemplateAsset[] = [];

    for (const asset of spec.assets) {
      try {
        if (!this.shouldExtract(asset)) {
          if (asset.url.startsWith("asset://")) {
            missingCropCount += 1;
            extractedAssets.push({
              ...asset,
              source: "placeholder",
            });
          } else {
            keptCount += 1;
            extractedAssets.push(asset);
          }

          continue;
        }

        const extractedAsset = await this.extractAsset({
          asset,
          sourceImagePath,
          sourceSize,
          outputDirectory,
          generationId,
        });

        extractedAssets.push(extractedAsset);
        extractedCount += 1;
      } catch (error) {
        failedCount += 1;

        extractedAssets.push({
          ...asset,
          source: "placeholder",
        });

        console.error(
          `Falha ao extrair o asset "${asset.id}":`,
          error,
        );
      }
    }

    console.log("IMAGE ASSET EXTRACTION:", {
      templateId: spec.id,
      generationId,
      sourceSize,
      totalAssets: spec.assets.length,
      extractedCount,
      keptCount,
      missingCropCount,
      failedCount,
      outputDirectory,
      publicBaseUrl: this.publicBaseUrl,
    });

    return {
      ...spec,
      assets: extractedAssets,
      metadata: {
        ...spec.metadata,
        sourceImagePath,
      },
    };
  }

  private shouldExtract(asset: ImageTemplateAsset): boolean {
    return Boolean(
      asset.url.startsWith("asset://") &&
        asset.crop,
    );
  }

  private async extractAsset({
    asset,
    sourceImagePath,
    sourceSize,
    outputDirectory,
    generationId,
  }: {
    asset: ImageTemplateAsset;
    sourceImagePath: string;
    sourceSize: SourceImageSize;
    outputDirectory: string;
    generationId: string;
  }): Promise<ImageTemplateAsset> {
    if (!asset.crop) {
      return {
        ...asset,
        source: "placeholder",
      };
    }

    const crop = this.toPixelCrop(asset.crop, sourceSize);

    if (crop.width < 8 || crop.height < 8) {
      console.warn(
        `Recorte ignorado para o asset "${asset.id}": regiao muito pequena.`,
      );

      return {
        ...asset,
        source: "placeholder",
      };
    }

    const assetFileName = `${this.sanitizeFileName(
      asset.id,
    )}.${this.imageFormat}`;

    const outputPath = path.join(
      outputDirectory,
      assetFileName,
    );

    const image = sharp(sourceImagePath)
      .rotate()
      .extract(crop);

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

    return {
      ...asset,
      url: `${this.publicBaseUrl}/${encodeURIComponent(
        generationId,
      )}/${encodeURIComponent(assetFileName)}`,
      source: "extracted",
    };
  }

  private async getSourceImageSize(
    sourceImagePath: string,
  ): Promise<SourceImageSize> {
    const metadata = await sharp(sourceImagePath)
      .rotate()
      .metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error(
        "Nao foi possivel identificar as dimensoes da imagem original.",
      );
    }

    return {
      width: metadata.width,
      height: metadata.height,
    };
  }

  private toPixelCrop(
    crop: ImageTemplateCrop,
    sourceSize: SourceImageSize,
  ): PixelCrop {
    const x = this.clamp(crop.x, 0, 99.9);
    const y = this.clamp(crop.y, 0, 99.9);
    const widthPercent = this.clamp(
      crop.width,
      0.1,
      100 - x,
    );
    const heightPercent = this.clamp(
      crop.height,
      0.1,
      100 - y,
    );

    const left = Math.min(
      sourceSize.width - 1,
      Math.max(
        0,
        Math.floor((x / 100) * sourceSize.width),
      ),
    );

    const top = Math.min(
      sourceSize.height - 1,
      Math.max(
        0,
        Math.floor((y / 100) * sourceSize.height),
      ),
    );

    const width = Math.max(
      1,
      Math.min(
        sourceSize.width - left,
        Math.round(
          (widthPercent / 100) * sourceSize.width,
        ),
      ),
    );

    const height = Math.max(
      1,
      Math.min(
        sourceSize.height - top,
        Math.round(
          (heightPercent / 100) * sourceSize.height,
        ),
      ),
    );

    return {
      left,
      top,
      width,
      height,
    };
  }

  private async assertSourceExists(
    sourceImagePath: string,
  ): Promise<void> {
    try {
      const sourceStats = await fs.stat(sourceImagePath);

      if (!sourceStats.isFile()) {
        throw new Error();
      }
    } catch {
      throw new Error(
        "A imagem original usada para gerar o template nao foi encontrada.",
      );
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

    return Math.min(
      maximum,
      Math.max(minimum, parsed),
    );
  }
}
