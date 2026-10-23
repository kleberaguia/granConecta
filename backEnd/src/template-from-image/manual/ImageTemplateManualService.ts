import { ImageTemplateManualAssetCropper } from "./ImageTemplateManualAssetCropper";
import { ImageTemplateManualPresetFactory } from "./ImageTemplateManualPresetFactory";

import type {
  ManualImageTemplate,
} from "./ImageTemplateManualTypes";

import type {
  ManualTemplateBusinessType,
} from "./ImageTemplateManualContentFactory";

import { ManualTemplateToPageMapper } from "../../templates/schema/mappers/ManualTemplateToPageMapper";
import { TemplatePageRenderer } from "../../templates/schema/TemplatePageRenderer";
import type { TemplatePage } from "../../templates/schema/TemplatePageSchema";
import { ImageTemplateManualRenderer } from "./ImageTemplateManualRenderer";

type ManualPreset =
  | "luna-joias"
  | "editorial-commerce";

type GenerateManualTemplateInput = {
  imagePath: string;
  name?: string;
  preset?: ManualPreset;
  businessType?: ManualTemplateBusinessType;
  businessName?: string;
  businessDescription?: string;
};

type GenerateManualTemplateResult = {
  success: true;
  html: string;

  /**
   * Estrutura antiga/manual, útil para debug e ajustes de crop.
   */
  template: ManualImageTemplate;

  /**
   * Estrutura nova e principal do sistema.
   * A partir daqui o editor, publicação e ecommerce devem trabalhar.
   */
  page: TemplatePage;

  renderer: "template-page";
  preset: ManualPreset;
};

export class ImageTemplateManualService {
  constructor(
    private readonly presetFactory =
      new ImageTemplateManualPresetFactory(),
    private readonly cropper =
      new ImageTemplateManualAssetCropper(),
    private readonly pageMapper =
      new ManualTemplateToPageMapper(),
  ) { }

  async generate(
    input: GenerateManualTemplateInput,
  ): Promise<GenerateManualTemplateResult> {
    const preset = input.preset || "editorial-commerce";
    const traceId = `tpl-${Date.now()}`;
    const baseTemplate = this.createTemplateByPreset({
      preset,
      imagePath: input.imagePath,
      name: input.name,
      businessType: input.businessType,
      businessName: input.businessName,
      businessDescription: input.businessDescription,
    });

    const templateWithImages = await this.cropper.crop(
      baseTemplate,
      input.imagePath,
    );

    const page = this.pageMapper.map(templateWithImages);

    const html = ImageTemplateManualRenderer.renderDocument(templateWithImages);
    console.log(`[${traceId}] ImageTemplateManualService.generate`);
    return {
      success: true,
      html,
      template: templateWithImages,
      page,
      renderer: "template-page",
      preset,
    };
  }

  private createTemplateByPreset({
    preset,
    imagePath,
    name,
    businessType,
    businessName,
    businessDescription,
  }: {
    preset: ManualPreset;
    imagePath: string;
    name?: string;
    businessType?: ManualTemplateBusinessType;
    businessName?: string;
    businessDescription?: string;
  }): ManualImageTemplate {
    switch (preset) {
      case "luna-joias":
        return this.presetFactory.createLunaJoiasTemplate({
          name,
          sourceImagePath: imagePath,
          businessType: businessType || "jewelry",
          businessName,
          businessDescription,
        });

      case "editorial-commerce":
      default:
        return this.presetFactory.createEditorialCommerceTemplate({
          name,
          sourceImagePath: imagePath,
          businessType: businessType || "generic",
          businessName,
          businessDescription,
        });
    }
  }
}