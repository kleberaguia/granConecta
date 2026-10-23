import type { RenderContext } from "../renderTypes";
import { renderFinalCtaByContext } from "./final-cta/FinalCtaFactory";
export function renderFinalCta(context: RenderContext): string { return renderFinalCtaByContext(context); }
