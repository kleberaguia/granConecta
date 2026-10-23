import type {
  LandingCompositionGroup,
  TemplatePalette,
  TemplateSectionKey,
} from "../TemplateTypes";

import { DEFAULT_TEMPLATE_PALETTE } from "../TemplateTypes";
import type { RenderContext, RenderEngineInput } from "./renderTypes";

import { buildRenderCss } from "./styles/buildRenderCss";
import { buildSectionLibraryCss } from "./styles/SectionLibraryStyles";
import { DesignDirector } from "../design-system/DesignDirector";
import { buildDesignSystemCss } from "../design-system/DesignSystemStyles";
import { buildMotionRuntime } from "../design-system/MotionEngine";
import { VisualDNAEngine } from "../design-system/VisualDNAEngine";
import { buildVisualDNACss } from "../design-system/VisualDNAStyles";
import { buildHeroVisualDNACss } from "../design-system/HeroVisualDNAStyles";
import { buildSectionVariantCss } from "./styles/SectionVariantStyles";
import { PageArchetypeResolver } from "../PageArchetypeResolver";
import { ArtDirectionEngine } from "../ArtDirectionEngine";
import { buildArtDirectionCss } from "./styles/ArtDirectionStyles";
import { buildServicePremiumWarmCss } from "./styles/ServicePremiumWarmStyles";
import { LandingCompositionResolver } from "../LandingCompositionResolver";
import { renderSectionByKey } from "./sections/SectionLibrary";
import { buildLayoutBaseAiServiceCss } from "./styles/LayoutBaseAiServiceStyles";
import { renderHealthLayoutBase } from "./layout-bases/HealthLayoutBaseRenderer";
import { buildHealthLayoutBaseCss } from "./layout-bases/HealthLayoutBaseStyles";

export class RenderEngineV2 {
  static render(input: RenderEngineInput): string {
    const {
      request,
      variation,
      visualContext,
      commercialStrategy,
      compositionPlan,
    } = input;

    const palette: TemplatePalette = {
      ...DEFAULT_TEMPLATE_PALETTE,
      ...(variation.colors || {}),
      ...(request.colors || {}),
      ...(request.resolvedBrandPalette?.palette || {}),
    };

    const resolvedCommercialStrategy =
      commercialStrategy || request.commercialStrategy;

    const resolvedCompositionPlan =
      compositionPlan || request.compositionPlan;

    const serviceDesignBrief =
      request.pageKind === "servico"
        ? (
          (request as any)?.serviceDesignBrief ||
          (request as any)?.raw?.serviceDesignBrief ||
          (request as any)?.raw?.selectedVariation?.serviceDesignBrief ||
          (request as any)?.raw?.aiVariation?.serviceDesignBrief
        )
        : undefined;

    const serviceDesignBriefId =
      request.pageKind === "servico"
        ? String(
          serviceDesignBrief?.id ||
          (request as any)?.serviceDesignBriefId ||
          (request as any)?.raw?.serviceDesignBriefId ||
          (request as any)?.raw?.selectedVariation?.serviceDesignBriefId ||
          (request as any)?.raw?.aiVariation?.serviceDesignBriefId ||
          "",
        ).trim()
        : "";

    if (request.pageKind === "servico") {
      console.log("[RenderEngineV2] SERVICE DESIGN BRIEF", {
        id: serviceDesignBriefId || null,
        layoutFamily: serviceDesignBrief?.layoutFamily || null,
        hero: serviceDesignBrief?.hero?.composition || null,
        services: serviceDesignBrief?.services?.layout || null,
      });

      const layoutBase =
        (request as any)?.layoutBase ||
        (request as any)?.raw?.layoutBase ||
        (request as any)?.selectedVariation?.layoutBase ||
        (request as any)?.aiVariation?.layoutBase ||
        (request as any)?.raw?.selectedVariation?.layoutBase ||
        (request as any)?.raw?.aiVariation?.layoutBase;

      const layoutBaseId = String(
        (request as any)?.layoutBaseId ||
        (request as any)?.raw?.layoutBaseId ||
        (request as any)?.selectedVariation?.layoutBaseId ||
        (request as any)?.aiVariation?.layoutBaseId ||
        (request as any)?.raw?.selectedVariation?.layoutBaseId ||
        (request as any)?.raw?.aiVariation?.layoutBaseId ||
        layoutBase?.id ||
        "",
      ).trim();

      const layoutBaseName = String(
        (request as any)?.layoutBaseName ||
        (request as any)?.raw?.layoutBaseName ||
        (request as any)?.selectedVariation?.layoutBaseName ||
        (request as any)?.aiVariation?.layoutBaseName ||
        (request as any)?.raw?.selectedVariation?.layoutBaseName ||
        (request as any)?.raw?.aiVariation?.layoutBaseName ||
        layoutBase?.name ||
        "",
      ).trim();

      const segmentFamily = String(
        (request as any)?.segmentFamily ||
        (request as any)?.raw?.segmentFamily ||
        (request as any)?.selectedVariation?.segmentFamily ||
        (request as any)?.aiVariation?.segmentFamily ||
        (request as any)?.raw?.selectedVariation?.segmentFamily ||
        (request as any)?.raw?.aiVariation?.segmentFamily ||
        layoutBase?.segmentFamily ||
        "",
      ).trim();

      console.log("[RenderEngineV2] LAYOUT BASE AI", {
        generationMode: request.generationMode,
        layoutBaseId: layoutBaseId || null,
        layoutBaseName: layoutBaseName || null,
        segmentFamily: segmentFamily || null,
        hasLayoutBase: Boolean(layoutBase),
        aiVariationId:
          (request as any)?.aiVariation?.id ||
          (request as any)?.raw?.aiVariation?.id ||
          null,
        selectedVariationId:
          (request as any)?.selectedVariation?.id ||
          (request as any)?.raw?.selectedVariation?.id ||
          null,
        hasComposition: Boolean(
          (request as any)?.composition ||
          (request as any)?.aiVariation?.composition ||
          (request as any)?.selectedVariation?.composition,
        ),
        hasTypography: Boolean(
          (request as any)?.typography ||
          (request as any)?.aiVariation?.typography ||
          (request as any)?.selectedVariation?.typography,
        ),
        hasVisualStyle: Boolean(
          (request as any)?.visualStyle ||
          (request as any)?.aiVariation?.visualStyle ||
          (request as any)?.selectedVariation?.visualStyle,
        ),
        hasHero: Boolean(
          (request as any)?.hero ||
          (request as any)?.aiVariation?.hero ||
          (request as any)?.selectedVariation?.hero,
        ),
      });
    }

    const designSystem = DesignDirector.resolve({
      request,
      variation,
      visualContext,
      palette,
    });

    const baseContext: RenderContext = {
      request,
      variation,
      visualContext,
      palette,
      designSystem,
      commercialStrategy: resolvedCommercialStrategy,
      compositionPlan: resolvedCompositionPlan,
    };

    const visualDNA = VisualDNAEngine.resolve(baseContext);

    const contextWithVisualDNA: RenderContext = {
      ...baseContext,
      visualDNA,
    };

    const pageArchetype = PageArchetypeResolver.resolve(contextWithVisualDNA);
    const artDirection = ArtDirectionEngine.resolve(
      contextWithVisualDNA,
      pageArchetype,
      visualDNA,
    );

    /**
     * A macroarquitetura passa a controlar a composição real da página.
     *
     * O compositionPlan recebido anteriormente continua participando da
     * resolução do Design System/Visual DNA via baseContext, mas o plano final
     * de renderização é recalculado usando o PageArchetype.
     */
    const pageCompositionPlan = LandingCompositionResolver.resolve(
      request,
      variation,
      pageArchetype,
    );

    const context: RenderContext = {
      ...contextWithVisualDNA,
      pageArchetype,
      artDirection,
      compositionPlan: pageCompositionPlan,
    };

    const layoutBaseId = resolveLayoutBaseId(request);

    const isHealthLayoutBase =
      request.pageKind === "servico" &&
      String((request as any)?.generationMode || "").trim() === "layout-base-ai" &&
      layoutBaseId === "SERVICE_HEALTH_01";

    const sections = isHealthLayoutBase
      ? renderHealthLayoutBase(context)
      : pageCompositionPlan.groups?.length
        ? pageCompositionPlan.groups
          .map((group) => RenderEngineV2.renderGroup(group, context))
          .filter(Boolean)
          .join("\n")
        : pageCompositionPlan.sectionOrder?.length
          ? pageCompositionPlan.sectionOrder
            .map((section) => renderSectionByKey(section, context))
            .filter(Boolean)
            .join("\n")
          : variation.sectionOrder
            .map((section) => renderSectionByKey(section, context))
            .filter(Boolean)
            .join("\n");

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(request.businessName)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Montserrat:wght@400;500;600;700;800;900&family=Playfair+Display:wght@500;600;700&family=Cormorant+Garamond:wght@500;600;700&display=swap" rel="stylesheet" />
  <style>
   ${buildRenderCss(context)}
${
  isHealthLayoutBase
    ? buildHealthLayoutBaseCss(context)
    : `
${buildSectionLibraryCss(context)}
${buildDesignSystemCss(context)}
${buildVisualDNACss(context, visualDNA)}
${buildHeroVisualDNACss(context, visualDNA)}
${buildSectionVariantCss(context)}
${buildArtDirectionCss(context)}
${buildServicePremiumWarmCss(context)}
${buildLayoutBaseAiServiceCss(context)}
`
}
  </style>
</head>
<body
  data-template-renderer="v2"
  data-page-kind="${escapeAttr(request.pageKind)}"
  data-service-design-brief="${escapeAttr(serviceDesignBriefId)}"
  data-service-layout-family="${escapeAttr(serviceDesignBrief?.layoutFamily || "")}"
  data-service-hero-composition="${escapeAttr(serviceDesignBrief?.hero?.composition || "")}"
  data-service-services-layout="${escapeAttr(serviceDesignBrief?.services?.layout || "")}"
  data-template-family="${escapeAttr(variation.family)}"
  data-design-direction="${escapeAttr(designSystem.direction)}"
  data-hero-composition="${escapeAttr(designSystem.heroComposition)}"
  data-gc-visual-dna="${escapeAttr(visualDNA.archetype)}"
  data-gc-headline-treatment="${escapeAttr(visualDNA.headlineTreatment)}"
  data-gc-hero-dna="${escapeAttr(visualDNA.heroComposition)}"
  data-gc-dna-image="${escapeAttr(visualDNA.imageTreatment)}"
  data-gc-dna-content="${escapeAttr(visualDNA.contentPosition)}"
  data-gc-dna-rhythm="${escapeAttr(visualDNA.sectionRhythm)}"
  data-gc-decoration="${escapeAttr(visualDNA.decoration)}"
  data-gc-dna-card="${escapeAttr(visualDNA.cardStyle)}"
  data-gc-dna-radius="${escapeAttr(visualDNA.radiusStyle)}"
  data-gc-dna-motion="${escapeAttr(visualDNA.motionStyle)}"
  data-gc-dna-navigation="${escapeAttr(visualDNA.navigationStyle)}"
  data-gc-dna-footer="${escapeAttr(visualDNA.footerStyle)}"
  data-gc-art-level="${escapeAttr(artDirection.level)}"
  data-gc-art-direction="${escapeAttr(artDirection.direction)}"
  data-gc-art-label="${escapeAttr(artDirection.label)}"
  data-gc-art-hero-scale="${escapeAttr(artDirection.heroScale)}"
  data-gc-art-image-composition="${escapeAttr(artDirection.imageComposition)}"
  data-page-archetype="${escapeAttr(pageArchetype.archetype)}"
  data-page-archetype-label="${escapeAttr(pageArchetype.label)}"
  data-page-hero-structure="${escapeAttr(pageArchetype.heroStructure)}"
  data-page-product-layout="${escapeAttr(pageArchetype.productLayout)}"
  data-page-about-layout="${escapeAttr(pageArchetype.aboutLayout)}"
  data-page-gallery-layout="${escapeAttr(pageArchetype.galleryLayout)}"
  data-page-cta-layout="${escapeAttr(pageArchetype.ctaLayout)}"
  data-page-footer-layout="${escapeAttr(pageArchetype.footerLayout)}"
  data-page-spacing-rhythm="${escapeAttr(pageArchetype.spacingRhythm)}"
  data-page-content-width="${escapeAttr(pageArchetype.contentWidth)}"
  data-page-card-style="${escapeAttr(pageArchetype.cardStyle)}"
  data-page-navigation-style="${escapeAttr(pageArchetype.navigationStyle)}"
  data-composition-archetype="${escapeAttr(pageCompositionPlan.archetype || "legacy")}"
  class="${escapeAttr(
    isHealthLayoutBase
      ? "gc-health-layout-base"
      : `${pageCompositionPlan.bodyClass || ""} gc-art-direction--${artDirection.level.toLowerCase().replace("_", "-")} gc-art--${artDirection.direction.toLowerCase().replace("_", "-")} gc-design-v2 gc-design--${designSystem.direction} gc-density--${designSystem.density} gc-decoration--${designSystem.decoration} gc-hero-composition--${designSystem.heroComposition}`,
  )}"
>
  ${sections}
  ${designSystem.motion.enabled ? buildMotionRuntime() : ""}
</body>
</html>`;
  }

  private static renderGroup(
    group: LandingCompositionGroup,
    context: RenderContext,
  ): string {
    const content = group.sections
      .map((section) => renderSectionByKey(section, context))
      .filter(Boolean)
      .join("\n");

    if (!content) return "";

    return `<div
      class="gc-composition-group ${escapeAttr(group.className || "")} gc-composition-group--${escapeAttr(group.kind)} gc-composition-surface--${escapeAttr(group.surface)}${group.overlapPrevious ? " gc-composition-group--overlap" : ""}${group.continuous ? " gc-composition-group--continuous" : ""}"
      data-composition-group="${escapeAttr(group.id)}"
      data-composition-kind="${escapeAttr(group.kind)}"
      data-composition-surface="${escapeAttr(group.surface)}"
    >
      ${content}
    </div>`;
  }
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(value: unknown): string {
  return escapeHtml(value)
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function resolveLayoutBaseId(request: any): string {
  const raw = request?.raw || {};
  const layoutBase =
    request?.layoutBase ||
    raw?.layoutBase ||
    request?.selectedVariation?.layoutBase ||
    request?.aiVariation?.layoutBase ||
    raw?.selectedVariation?.layoutBase ||
    raw?.aiVariation?.layoutBase ||
    {};

  return String(
    request?.layoutBaseId ||
      raw?.layoutBaseId ||
      request?.selectedVariation?.layoutBaseId ||
      request?.aiVariation?.layoutBaseId ||
      raw?.selectedVariation?.layoutBaseId ||
      raw?.aiVariation?.layoutBaseId ||
      layoutBase?.id ||
      "",
  ).trim();
}
