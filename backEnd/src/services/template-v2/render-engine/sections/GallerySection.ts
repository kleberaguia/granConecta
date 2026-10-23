import type { RenderContext } from "../renderTypes";
import { renderGalleryByContext } from "./gallery/GalleryFactory";
export function renderGallery(context: RenderContext): string { return renderGalleryByContext(context); }
