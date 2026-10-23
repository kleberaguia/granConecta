import { ImageAssetExtractor } from "./ImageAssetExtractor";
import { ImageTemplateAnalyzer } from "./ImageTemplateAnalyzer";
import { ImageTemplateRenderer } from "./ImageTemplateRenderer";
import type {
  ImageTemplateAsset,
  ImageTemplateMode,
  ImageTemplateSection,
  ImageTemplateSpec,
} from "./ImageTemplateTypes";

import { ImagePresetTemplateService } from "../template-presets/ImagePresetTemplateService";

export type GenerateImageToTemplateInput = {
  imagePath: string;
  name?: string;
  mode?: ImageTemplateMode;
  storeId?: string;
};

export type GenerateImageToTemplateResult = {
  success: true;
  html: string;
  spec: ImageTemplateSpec;
  preset?: any;
  renderer: "generic" | "editorial-commerce";
};

export class ImageToTemplateService {
  constructor(
    private readonly analyzer = new ImageTemplateAnalyzer(),
    private readonly assetExtractor = new ImageAssetExtractor(),
    private readonly presetService = new ImagePresetTemplateService(),
  ) {}

  async generate(
    input: GenerateImageToTemplateInput,
  ): Promise<GenerateImageToTemplateResult> {
    const analyzedSpec = await this.analyzer.analyze({
      imagePath: input.imagePath,
      name: input.name,
      mode: input.mode || "institutional",
      storeId: input.storeId,
    });

    const spec = await this.assetExtractor.extract(
      analyzedSpec,
      input.imagePath,
    );

    if (spec.mode === "commerce") {
      const presetInput = this.toEditorialCommerceInput(spec);
      const presetResult =
        this.presetService.generateEditorialCommerce(presetInput);

      return {
        success: true,
        html: presetResult.html,
        spec,
        preset: presetResult.template,
        renderer: "editorial-commerce",
      };
    }

    return {
      success: true,
      html: ImageTemplateRenderer.renderDocument(spec),
      spec,
      renderer: "generic",
    };
  }

  private toEditorialCommerceInput(spec: ImageTemplateSpec) {
    const heroImageUrl = this.findHeroImageUrl(spec);
    const aboutImageUrl = this.findAboutImageUrl(spec);
    const products = this.findProductAssets(spec).map(
      (asset, index) => ({
        id: asset.id || String(index + 1),
        title:
          this.productTitleFromAsset(asset, index) ||
          `Produto ${index + 1}`,
        price: "",
        imageUrl: this.toPublicUrl(asset.url),
        imageAlt: asset.alt || `Produto ${index + 1}`,
        buttonText: "Ver mais",
        buttonUrl: "#",
      }),
    );

    return {
      brand: spec.name || "Nova Loja",
      heroImageUrl:
        heroImageUrl ||
        this.findFirstUsableAssetUrl(spec) ||
        "",
      aboutImageUrl:
        aboutImageUrl ||
        this.findSecondUsableAssetUrl(spec) ||
        heroImageUrl ||
        "",
      products,
      theme: {
        primaryColor: spec.theme.primaryColor,
        secondaryColor: spec.theme.secondaryColor,
        backgroundColor: spec.theme.backgroundColor,
        surfaceColor: spec.theme.surfaceColor,
        textColor: spec.theme.textColor,
        mutedTextColor: spec.theme.mutedTextColor,
        headingFont: spec.theme.headingFont,
        bodyFont: spec.theme.bodyFont,
        borderRadius: spec.theme.borderRadius,
      },
    };
  }

  private findHeroImageUrl(
    spec: ImageTemplateSpec,
  ): string {
    const hero = this.findSection(spec, "hero");

    if (!hero) return "";

    const backgroundAsset =
      this.findAsset(spec, hero.layout.backgroundAssetId) ||
      this.findSectionImageAsset(spec, hero, [
        "background",
        "content",
      ]);

    return backgroundAsset
      ? this.toPublicUrl(backgroundAsset.url)
      : "";
  }

  private findAboutImageUrl(
    spec: ImageTemplateSpec,
  ): string {
    const about = this.findSection(spec, "about");

    if (!about) return "";

    const asset =
      this.findSectionImageAsset(spec, about, ["content"]) ||
      this.findSectionImageAsset(spec, about, [
        "background",
        "product",
      ]);

    return asset ? this.toPublicUrl(asset.url) : "";
  }

  private findProductAssets(
    spec: ImageTemplateSpec,
  ): ImageTemplateAsset[] {
    const productSections = spec.sections.filter(
      (section) =>
        section.type === "products" ||
        section.type === "gallery",
    );

    const sectionAssetIds = new Set<string>();

    productSections.forEach((section) => {
      section.elements.forEach((element) => {
        if (element.assetId) {
          sectionAssetIds.add(element.assetId);
        }
      });
    });

    const productAssets = spec.assets.filter((asset) => {
      if (asset.url.startsWith("asset://")) return false;

      return (
        asset.role === "product" ||
        sectionAssetIds.has(asset.id)
      );
    });

    if (productAssets.length) {
      return this.uniqueAssets(productAssets).slice(0, 8);
    }

    return this.uniqueAssets(
      spec.assets.filter(
        (asset) =>
          !asset.url.startsWith("asset://") &&
          (asset.role === "content" ||
            asset.role === "product"),
      ),
    ).slice(0, 8);
  }

  private findSectionImageAsset(
    spec: ImageTemplateSpec,
    section: ImageTemplateSection,
    roles: Array<ImageTemplateAsset["role"]>,
  ): ImageTemplateAsset | undefined {
    const assetIds = section.elements
      .map((element) => element.assetId)
      .filter(Boolean) as string[];

    const sectionAssets = assetIds
      .map((assetId) => this.findAsset(spec, assetId))
      .filter(Boolean) as ImageTemplateAsset[];

    return sectionAssets.find(
      (asset) =>
        !asset.url.startsWith("asset://") &&
        roles.includes(asset.role),
    );
  }

  private findSection(
    spec: ImageTemplateSpec,
    type: ImageTemplateSection["type"],
  ): ImageTemplateSection | undefined {
    return spec.sections.find(
      (section) => section.type === type,
    );
  }

  private findAsset(
    spec: ImageTemplateSpec,
    assetId?: string,
  ): ImageTemplateAsset | undefined {
    if (!assetId) return undefined;

    return spec.assets.find(
      (asset) => asset.id === assetId,
    );
  }

  private findFirstUsableAssetUrl(
    spec: ImageTemplateSpec,
  ): string {
    const asset = spec.assets.find(
      (item) => !item.url.startsWith("asset://"),
    );

    return asset ? this.toPublicUrl(asset.url) : "";
  }

  private findSecondUsableAssetUrl(
    spec: ImageTemplateSpec,
  ): string {
    const assets = spec.assets.filter(
      (item) => !item.url.startsWith("asset://"),
    );

    return assets[1] ? this.toPublicUrl(assets[1].url) : "";
  }

  private productTitleFromAsset(
    asset: ImageTemplateAsset,
    index: number,
  ): string {
    const alt = String(asset.alt || "").trim();

    if (!alt) {
      return `Produto ${index + 1}`;
    }

    return alt.length > 48
      ? `${alt.slice(0, 45).trim()}...`
      : alt;
  }

  private uniqueAssets(
    assets: ImageTemplateAsset[],
  ): ImageTemplateAsset[] {
    const seen = new Set<string>();
    const result: ImageTemplateAsset[] = [];

    assets.forEach((asset) => {
      const key = asset.url || asset.id;

      if (seen.has(key)) return;

      seen.add(key);
      result.push(asset);
    });

    return result;
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

    const publicUrl = String(
      process.env.BACKEND_PUBLIC_URL ||
        process.env.API_PUBLIC_URL ||
        "http://localhost:3000",
    ).replace(/\/+$/, "");

    if (image.startsWith("/")) {
      return `${publicUrl}${image}`;
    }

    return `${publicUrl}/uploads/images/${image}`;
  }
}
