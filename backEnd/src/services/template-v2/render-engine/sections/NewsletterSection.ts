import type { RenderContext } from "../renderTypes";
import { renderNewsletterByContext } from "./newsletter/NewsletterFactory";
export function renderNewsletter(context: RenderContext): string { return renderNewsletterByContext(context); }
