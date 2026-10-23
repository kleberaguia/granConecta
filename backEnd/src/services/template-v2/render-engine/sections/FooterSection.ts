import type { RenderContext } from "../renderTypes";
import { renderFooterByContext } from "./footer/FooterFactory";
export function renderFooter(context: RenderContext): string { return renderFooterByContext(context); }
