import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import type {
  ImageVisualLayout,
  VisualAsset,
  VisualBounds,
} from "./ImageVisualLayoutSchema";

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

export type CroppedVisualAsset = VisualAsset & {
  url: string;
  source: "extracted";
};

export type CroppedImageVisualLayout = Omit<
  ImageVisualLayout,
  "sections"
> & {
  assets: CroppedVisualAsset[];
  sections: ImageVisualLayout["sections"];
};

export class ImageVisualAssetCropper {
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

    const publicUrl = String(
      process.env.API_PUBLIC_URL ||
        process.env.BACKEND_PUBLIC_URL ||
        "",
    ).replace(/\/+$/, "");

    this.publicBaseUrl = (
      options.publicBaseUrl ||
      (publicUrl
        ? `${publicUrl}/uploads/generated-templates`
        : "/uploads/generated-templates")
    ).replace(/\/+$/, "");

    this.imageFormat = options.imageFormat || "webp";
    this.quality = this.clamp(options.quality ?? 92, 40, 100);
  }

  async crop(
    layout: ImageVisualLayout,
    sourceImagePath: string,
  ): Promise<CroppedImageVisualLayout> {
    await this.assertSourceExists(sourceImagePath);

    const sourceSize = await this.getSourceSize(sourceImagePath);

    const generationId = `${this.sanitizeFileName(
      layout.name || layout.id,
    )}-${Date.now()}-${randomUUID().slice(0, 8)}`;

    const outputDirectory = path.join(
      this.outputRoot,
      generationId,
    );

    await fs.mkdir(outputDirectory, {
      recursive: true,
    });

    const uniqueAssets = this.uniqueAssets(
      layout.sections.flatMap((section) => section.assets || []),
    );

    const assetUrlMap = new Map<string, string>();
    const croppedAssets: CroppedVisualAsset[] = [];

    for (const asset of uniqueAssets) {
      const url = await this.cropAsset({
        asset,
        sourceImagePath,
        sourceSize,
        outputDirectory,
        generationId,
      });

      assetUrlMap.set(asset.id, url);

      croppedAssets.push({
        ...asset,
        url,
        source: "extracted",
      });
    }

    console.log("VISUAL ASSET CROPS:", {
      layoutId: layout.id,
      layoutName: layout.name,
      generationId,
      sourceSize,
      assets: croppedAssets.length,
      outputDirectory,
      publicBaseUrl: this.publicBaseUrl,
    });

    return {
      ...layout,
      assets: croppedAssets,
      sections: layout.sections,
    };
  }

  private async cropAsset({
    asset,
    sourceImagePath,
    sourceSize,
    outputDirectory,
    generationId,
  }: {
    asset: VisualAsset;
    sourceImagePath: string;
    sourceSize: SourceSize;
    outputDirectory: string;
    generationId: string;
  }): Promise<string> {
    const pixelCrop = this.toPixelCrop(asset.bounds, sourceSize);

    const fileName = `${this.sanitizeFileName(
      asset.id,
    )}.${this.imageFormat}`;

    const outputPath = path.join(outputDirectory, fileName);

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
    )}/${encodeURIComponent(fileName)}`;
  }

  private toPixelCrop(
    bounds: VisualBounds,
    sourceSize: SourceSize,
  ): PixelCrop {
    const x = this.clamp(bounds.x, 0, 99.9);
    const y = this.clamp(bounds.y, 0, 99.9);
    const widthPercent = this.clamp(bounds.width, 0.1, 100 - x);
    const heightPercent = this.clamp(bounds.height, 0.1, 100 - y);

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

  private uniqueAssets(assets: VisualAsset[]): VisualAsset[] {
    const seen = new Set<string>();
    const result: VisualAsset[] = [];

    assets.forEach((asset) => {
      if (!asset?.id) return;
      if (seen.has(asset.id)) return;

      seen.add(asset.id);
      result.push(asset);
    });

    return result;
  }

  private async getSourceSize(
    sourceImagePath: string,
  ): Promise<SourceSize> {
    const metadata = await sharp(sourceImagePath)
      .rotate()
      .metadata();

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

  private async assertSourceExists(
    sourceImagePath: string,
  ): Promise<void> {
    try {
      const stats = await fs.stat(sourceImagePath);

      if (!stats.isFile()) {
        throw new Error();
      }
    } catch {
      throw new Error("Imagem original nao encontrada.");
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