import type { TemplateGenerationV2Result } from "./TemplateTypes";

import { TemplateRequestNormalizer } from "./TemplateRequestNormalizer";
import { TemplateGenerationOrchestrator } from "./TemplateGenerationOrchestrator";

export class TemplateGenerateUseCase {
  private readonly orchestrator = new TemplateGenerationOrchestrator();

  async execute(body: any): Promise<TemplateGenerationV2Result> {
    const request = TemplateRequestNormalizer.normalize(body);

    console.log("TEMPLATE V2 - REQUEST NORMALIZADO", {
      templateName: request.templateName,
      pageKind: request.pageKind,
      businessName: request.businessName,
      businessSegment: request.businessSegment,
      variationIndex: request.variationIndex,
      generationMode: request.generationMode,
      productsCount: request.products.length,
      servicesCount: request.services.length,
    });

    return this.orchestrator.generate(request);
  }
}