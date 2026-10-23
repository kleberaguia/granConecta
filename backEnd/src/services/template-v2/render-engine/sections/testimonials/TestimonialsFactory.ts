import type { RenderContext } from "../../renderTypes";
import {
  escapeHtml,
  familyVariant,
  getSectionVariant,
  sectionHeading,
} from "../SectionLibraryShared";

export function renderTestimonialsByContext(context: RenderContext): string {
  const testimonials = resolveTestimonials(context);

  if (!testimonials.length) {
    return "";
  }

  const fallback = familyVariant(
    context,
    {
      "luxury-editorial": "quotes",
      "marketplace-grid": "cards",
      "conversion-sales": "proof",
      "magazine-story": "editorial",
      "minimal-premium": "minimal",
    },
    "cards",
  );

  const variant = getSectionVariant(
    context,
    "testimonials",
    fallback,
  );

  if (variant === "editorial") {
    const first = testimonials[0];

    if (!first) {
      return "";
    }

    return `<section class="gc-testimonials gc-testimonials--editorial" id="testimonials">
      <div class="gc-container gc-testimonial-editorial">
        <span>Experiências reais</span>
        <blockquote>“${escapeHtml(first.text)}”</blockquote>
        ${
          first.author
            ? `<strong>${escapeHtml(first.author)}</strong>`
            : ""
        }
      </div>
    </section>`;
  }

  if (variant === "minimal") {
    return `<section class="gc-testimonials gc-testimonials--minimal" id="testimonials">
      <div class="gc-container">
        ${testimonials
          .slice(0, 2)
          .map(
            (item) =>
              `<blockquote>“${escapeHtml(item.text)}” ${
                item.author
                  ? `<cite>${escapeHtml(item.author)}</cite>`
                  : ""
              }</blockquote>`,
          )
          .join("")}
      </div>
    </section>`;
  }

  return `<section class="gc-testimonials gc-testimonials--${variant}${context.request.pageKind === "servico" ? " gc-testimonials--service-premium-warm" : ""}" id="testimonials">
    <div class="gc-container">
      ${sectionHeading(
        "Experiências reais",
        variant === "proof"
          ? "Confiança construída por quem já conhece"
          : "Quem conhece conta melhor",
      )}

      <div class="gc-testimonial-grid">
        ${testimonials
          .slice(0, 6)
          .map(
            (item) => `<article>
              <span>★★★★★</span>
              <p>“${escapeHtml(item.text)}”</p>
              ${
                item.author
                  ? `<strong>${escapeHtml(item.author)}</strong>`
                  : ""
              }
            </article>`,
          )
          .join("")}
      </div>
    </div>
  </section>`;
}

function resolveTestimonials(
  context: RenderContext,
): Array<{ text: string; author?: string }> {
  const raw = context.request.raw || {};

  const candidates = [
    raw.testimonials,
    raw.depoimentos,
    raw.reviews,
    context.request.answers?.testimonials,
    context.request.answers?.depoimentos,
  ];

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) {
      continue;
    }

    const parsed = candidate
      .map((item: any) => {
        if (typeof item === "string") {
          return {
            text: item.trim(),
          };
        }

        return {
          text: String(
            item?.text ||
              item?.texto ||
              item?.testimonial ||
              item?.depoimento ||
              "",
          ).trim(),

          author:
            String(
              item?.author ||
                item?.autor ||
                item?.name ||
                item?.nome ||
                "",
            ).trim() || undefined,
        };
      })
      .filter((item) => Boolean(item.text));

    if (parsed.length) {
      return parsed;
    }
  }

  return [];
}