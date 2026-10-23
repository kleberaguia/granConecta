import type { RenderContext } from "../renderTypes";
import { renderAboutByContext } from "./about/AboutFactory";
export function renderAbout(context: RenderContext): string { return renderAboutByContext(context); }
