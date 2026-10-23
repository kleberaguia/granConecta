import type { RenderContext } from "../renderTypes";
import { renderHeaderByContext } from "./header/HeaderFactory";
export function renderHeader(context: RenderContext): string { return renderHeaderByContext(context); }
