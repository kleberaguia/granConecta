import type { RenderContext } from "../renderTypes";
import { renderSocialByContext } from "./social/SocialFactory";
export function renderSocial(context: RenderContext): string { return renderSocialByContext(context); }
