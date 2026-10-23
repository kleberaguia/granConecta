import type { RenderContext } from "../renderTypes";
import { renderVideoByContext } from "./video/VideoFactory";
export function renderVideo(context: RenderContext): string { return renderVideoByContext(context); }
