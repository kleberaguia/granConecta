import type { RenderContext } from "../renderTypes";
import { renderBenefitsByContext } from "./benefits/BenefitsFactory";
export function renderBenefits(context: RenderContext): string { return renderBenefitsByContext(context); }
