import type { Request, Response } from "express";

import { ImagePresetTemplateService } from "../template-presets/ImagePresetTemplateService";
import { ImageToTemplateService } from "../template-from-image/ImageToTemplateService";

export class ImagePresetTemplateController {
  constructor(
    private readonly presetService = new ImagePresetTemplateService(),
  ) { }

  async generateEditorialCommerce(
    req: Request,
    res: Response,
  ): Promise<void> {

    const file = req.file;

    // const result = await ImageToTemplateService.generate({
    //   imagePath: file?.path,
    //   name: req.body.name,
    //   mode: req.body.mode,
    // });
    // try {
    //   const result =
    //     this.presetService.generateEditorialCommerce({
    //       brand:
    //         this.optionalText(req.body?.brand) ||
    //         this.optionalText(req.body?.storeName) ||
    //         "Luna Joias",

    //       heroImageUrl:
    //         this.optionalText(req.body?.heroImageUrl) ||
    //         this.optionalText(req.body?.hero_image_url) ||
    //         "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1800&q=85",

    //       aboutImageUrl:
    //         this.optionalText(req.body?.aboutImageUrl) ||
    //         this.optionalText(req.body?.about_image_url) ||
    //         "https://images.unsplash.com/photo-1495121605193-b116b5b09a33?auto=format&fit=crop&w=900&q=80",

    //       products: Array.isArray(req.body?.products)
    //         ? req.body.products
    //         : [],

    //       theme:
    //         req.body?.theme && typeof req.body.theme === "object"
    //           ? req.body.theme
    //           : undefined,

    //       nav: Array.isArray(req.body?.nav)
    //         ? req.body.nav
    //         : undefined,
    //     });

    //   res.status(200).json(result);
    // } catch (error: any) {
    //   console.error(
    //     "Erro ao gerar preset editorial-commerce:",
    //     error,
    //   );

    //   res.status(500).json({
    //     success: false,
    //     message:
    //       error?.message ||
    //       "Não foi possível gerar o template.",
    //   });
    // }
  }

  private optionalText(value: unknown): string | undefined {
    return typeof value === "string" && value.trim()
      ? value.trim()
      : undefined;
  }
}