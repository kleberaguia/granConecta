import type { Request, Response } from "express";

import { ImageToTemplateService } from "../template-from-image/ImageToTemplateService";
import type { ImageTemplateMode } from "../template-from-image/ImageTemplateTypes";

import { ImageTemplateManualService } from "../template-from-image/manual/ImageTemplateManualService";
import type { ManualTemplateBusinessType } from "../template-from-image/manual/ImageTemplateManualContentFactory";

import { ImageVisualTemplateService } from "../template-from-image/visual/ImageVisualTemplateService";

type ManualPreset =
  | "luna-joias"
  | "editorial-commerce";

type VisualMode =
  | "institutional"
  | "service"
  | "commerce";

export class ImageTemplateController {
  constructor(
    private readonly imageToTemplateService =
      new ImageToTemplateService(),
    private readonly manualService =
      new ImageTemplateManualService(),
    private readonly visualService =
      new ImageVisualTemplateService(),
  ) {}

  async generate(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const file = req.file;
      const traceId = `tpl-${Date.now()}`;

      if (!file) {
        res.status(400).json({
          success: false,
          message: "Envie uma imagem da landing page.",
        });
        return;
      }

      const name =
        String(req.body?.name || "").trim() ||
        String(req.body?.businessName || "").trim() ||
        file.originalname;

      const preset = this.resolveManualPreset(req.body?.preset);

      /*
       * Mantemos o manual quando o front pedir um preset especifico.
       * Isso preserva o que ja ficou bom e evita quebrar templates existentes.
       */
      if (preset) {
        const result = await this.manualService.generate({
          imagePath: file.path,
          name,
          preset,
          businessType: this.resolveBusinessType(
            req.body?.businessType,
          ),
          businessName:
            String(
              req.body?.businessName ||
              req.body?.brand ||
              "",
            ).trim() || undefined,
          businessDescription:
            String(
              req.body?.businessDescription ||
              req.body?.description ||
              "",
            ).trim() || undefined,
        });

      
        res.status(200).json(result);
        return;
      }

      /*
       * Fluxo novo e principal: imagem -> layout visual -> page schema -> html.
       * O front pode forcar o fluxo antigo enviando renderer=legacy.
       */
      const renderer = String(req.body?.renderer || "visual").trim();

      if (renderer !== "legacy") {
        const mode = this.resolveVisualMode(req.body?.mode);

        const result = await this.visualService.generate({
          imagePath: file.path,
          name,
          mode,
          storeId:
            String(req.body?.storeId || "").trim() ||
            undefined,
          businessName:
            String(
              req.body?.businessName ||
              req.body?.brand ||
              "",
            ).trim() || undefined,
          businessDescription:
            String(
              req.body?.businessDescription ||
              req.body?.description ||
              "",
            ).trim() || undefined,
          businessType:
            String(req.body?.businessType || "").trim() ||
            undefined,
        });

        res.status(200).json(result);
        return;
      }

      /*
       * Fallback antigo, mantido por seguranca.
       */
      const mode = this.resolveMode(req.body?.mode);

      const result = await this.imageToTemplateService.generate({
        imagePath: file.path,
        name,
        mode,
        storeId:
          String(req.body?.storeId || "").trim() ||
          undefined,
      });
    
      res.status(200).json(result);
    } catch (error: any) {
      console.error(
        "Erro ao gerar template por imagem:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          error?.message ||
          "Nao foi possivel gerar o template.",
      });
    }
  }

  private resolveMode(value: unknown): ImageTemplateMode {
    const validModes: ImageTemplateMode[] = [
      "institutional",
      "service",
      "commerce",
    ];

    const requestedMode = String(value || "institutional");

    return validModes.includes(requestedMode as ImageTemplateMode)
      ? (requestedMode as ImageTemplateMode)
      : "institutional";
  }

  private resolveVisualMode(value: unknown): VisualMode {
    const validModes: VisualMode[] = [
      "institutional",
      "service",
      "commerce",
    ];

    const requestedMode = String(value || "institutional");

    return validModes.includes(requestedMode as VisualMode)
      ? (requestedMode as VisualMode)
      : "institutional";
  }

  private resolveManualPreset(value: unknown): ManualPreset | null {
    const requestedPreset = String(value || "").trim();

    if (
      requestedPreset === "luna-joias" ||
      requestedPreset === "editorial-commerce"
    ) {
      return requestedPreset;
    }

    return null;
  }

  private resolveBusinessType(
    value: unknown,
  ): ManualTemplateBusinessType | undefined {
    const requestedType = String(value || "").trim();

    const validTypes: ManualTemplateBusinessType[] = [
      "jewelry",
      "cleaning",
      "beauty",
      "fitness",
      "law",
      "health",
      "food",
      "generic",
    ];

    return validTypes.includes(
      requestedType as ManualTemplateBusinessType,
    )
      ? (requestedType as ManualTemplateBusinessType)
      : undefined;
  }
}
