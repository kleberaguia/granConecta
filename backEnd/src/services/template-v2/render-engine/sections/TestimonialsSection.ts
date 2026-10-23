import type { RenderContext } from "../renderTypes";
import { renderTestimonialsByContext } from "./testimonials/TestimonialsFactory";
export function renderTestimonials(context: RenderContext): string { return renderTestimonialsByContext(context); }
