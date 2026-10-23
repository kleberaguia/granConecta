import { ImageVisualAssetCropper } from "./ImageVisualAssetCropper";
import { ImageVisualLayoutAnalyzer } from "./ImageVisualLayoutAnalyzer";
import { ImageVisualSectionAssetBinder } from "./ImageVisualSectionAssetBinder";
import { ImageVisualToTemplatePageMapper } from "./ImageVisualToTemplatePageMapper";

import { TemplatePageRenderer } from "../../templates/schema/TemplatePageRenderer";

import type { TemplatePage } from "../../templates/schema/TemplatePageSchema";
import type {
  CroppedImageVisualLayout,
} from "./ImageVisualAssetCropper";
import type {
  ImageVisualLayout,
} from "./ImageVisualLayoutSchema";

type ImageVisualMode =
  | "institutional"
  | "service"
  | "commerce";

export type GenerateImageVisualTemplateInput = {
  imagePath: string;
  name?: string;
  mode?: ImageVisualMode;
  storeId?: string;
  businessName?: string;
  businessDescription?: string;
  businessType?: string;
};

export type GenerateImageVisualTemplateResult = {
  success: true;
  html: string;
  visualLayout: ImageVisualLayout;
  croppedLayout: CroppedImageVisualLayout;
  page: TemplatePage;
  renderer: "template-page";
};

export class ImageVisualTemplateService {
  constructor(
    private readonly analyzer = new ImageVisualLayoutAnalyzer(),
    private readonly binder = new ImageVisualSectionAssetBinder(),
    private readonly cropper = new ImageVisualAssetCropper(),
    private readonly mapper = new ImageVisualToTemplatePageMapper(),
  ) {}

  async generate(
    input: GenerateImageVisualTemplateInput,
  ): Promise<GenerateImageVisualTemplateResult> {
    const normalizedInput = this.normalizeInput(input);

    console.log("IMAGE VISUAL TEMPLATE START:", {
      name: normalizedInput.name,
      mode: normalizedInput.mode,
      businessType: normalizedInput.businessType,
    });

    const analyzedLayout = await this.analyzer.analyze({
      imagePath: normalizedInput.imagePath,
      name: normalizedInput.name,
      mode: normalizedInput.mode,
    });

    console.log("IMAGE VISUAL ANALYZED:", {
      id: analyzedLayout.id,
      name: analyzedLayout.name,
      mode: analyzedLayout.mode,
      sections: analyzedLayout.sections?.length || 0,
      assets: this.countAssets(analyzedLayout),
    });

    const boundLayout = this.binder.bind(analyzedLayout);

    console.log("IMAGE VISUAL BOUND:", {
      sections: boundLayout.sections?.map((section) => ({
        id: section.id,
        type: section.type,
        assetIds:
          (section as any).assetIds?.length ||
          (section as any).assets?.length ||
          0,
        backgroundAssetId:
          (section as any).backgroundAssetId ||
          (section as any).backgroundAsset?.id ||
          undefined,
        cards: (section as any).cards?.length || 0,
      })),
    });

    const croppedLayout = await this.cropper.crop(
      boundLayout,
      normalizedInput.imagePath,
    );

    console.log("IMAGE VISUAL CROPPED:", {
      assets: croppedLayout.assets?.length || 0,
      urls: croppedLayout.assets?.map((asset) => asset.url),
    });

    const page = this.mapper.map(croppedLayout);
    const html = TemplatePageRenderer.renderDocument(page);

    console.log("IMAGE VISUAL TEMPLATE GENERATED:", {
      pageId: page.id,
      sections: page.sections.length,
      media: page.media.length,
      htmlLength: html.length,
    });

    return {
      success: true,
      html,
      visualLayout: boundLayout,
      croppedLayout,
      page,
      renderer: "template-page",
    };
  }

  private normalizeInput(
    input: GenerateImageVisualTemplateInput,
  ): Required<
    Pick<GenerateImageVisualTemplateInput, "imagePath" | "name" | "mode">
  > &
    Omit<
      GenerateImageVisualTemplateInput,
      "imagePath" | "name" | "mode"
    > {
    const imagePath = String(input.imagePath || "").trim();

    if (!imagePath) {
      throw new Error("O caminho da imagem e obrigatorio.");
    }

    const name =
      this.optionalText(input.name) ||
      this.optionalText(input.businessName) ||
      "Nova pagina";

    const validModes: ImageVisualMode[] = [
      "institutional",
      "service",
      "commerce",
    ];

    const mode = validModes.includes(input.mode as ImageVisualMode)
      ? (input.mode as ImageVisualMode)
      : "institutional";

    return {
      ...input,
      imagePath,
      name,
      mode,
      storeId: this.optionalText(input.storeId),
      businessName: this.optionalText(input.businessName),
      businessDescription: this.optionalText(
        input.businessDescription,
      ),
      businessType: this.optionalText(input.businessType),
    };
  }

  private optionalText(value: unknown): string | undefined {
    return typeof value === "string" && value.trim()
      ? value.trim()
      : undefined;
  }

  private countAssets(layout: ImageVisualLayout): number {
    const rootAssets = (layout as any).assets;

    if (Array.isArray(rootAssets)) {
      return rootAssets.length;
    }

    return (layout.sections || []).reduce((total, section) => {
      const sectionAssets = (section as any).assets;

      return total + (Array.isArray(sectionAssets) ? sectionAssets.length : 0);
    }, 0);
  }
}
