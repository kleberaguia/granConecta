import type { RenderContext } from "../renderTypes";
import { renderHowItWorksByContext } from "./how-it-works/HowItWorksFactory";
export function renderHowItWorks(context: RenderContext): string { return renderHowItWorksByContext(context); }
