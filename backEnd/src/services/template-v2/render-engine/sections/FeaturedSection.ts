import type { RenderContext } from "../renderTypes";
import { renderFeaturedByContext } from "./featured/FeaturedFactory";
export function renderFeatured(context: RenderContext): string { return renderFeaturedByContext(context); }
