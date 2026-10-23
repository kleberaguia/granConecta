import type { ResolvedDesignSystem } from "../design-system/DesignTokens";
import type { VisualDNA } from "../design-system/VisualDNAEngine";
import type { PageArchetypePlan } from "../PageArchetypeResolver";
import type { ArtDirectionPlan } from "../ArtDirectionEngine";

import type {
  LandingCommercialStrategy,
  LandingCompositionPlan,
  NormalizedTemplateRequest,
  TemplatePalette,
  TemplateRendererV2Input,
  TemplateSectionKey,
  TemplateVariationV2,
  TemplateVisualContext,
} from "../TemplateTypes";

export type RenderContext = {
  request: NormalizedTemplateRequest;
  variation: TemplateVariationV2;
  visualContext: TemplateVisualContext;
  palette: TemplatePalette;

  designSystem?: ResolvedDesignSystem;
  visualDNA?: VisualDNA;
  pageArchetype?: PageArchetypePlan;
  artDirection?: ArtDirectionPlan;

  commercialStrategy?: LandingCommercialStrategy;
  compositionPlan?: LandingCompositionPlan;
};

export type SectionRenderer = (context: RenderContext) => string;

export type RenderSectionInput = {
  section: TemplateSectionKey;
  context: RenderContext;
};

export type RenderEngineInput = TemplateRendererV2Input;
