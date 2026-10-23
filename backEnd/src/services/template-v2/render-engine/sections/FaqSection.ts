import type { RenderContext } from "../renderTypes";
import { renderFaqByContext } from "./faq/FaqFactory";
export function renderFaq(context: RenderContext): string { return renderFaqByContext(context); }
