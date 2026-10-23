import type { RenderContext } from "../renderTypes";
import { renderTopbarByContext } from "./topbar/TopbarFactory";
export function renderTopbar(context: RenderContext): string { return renderTopbarByContext(context); }
