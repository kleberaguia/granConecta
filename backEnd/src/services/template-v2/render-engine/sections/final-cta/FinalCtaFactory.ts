import type { RenderContext } from "../../renderTypes";
import {
  escapeHtml,
  familyVariant,
  getSectionVariant,
  primaryAction,
  primaryLabel,
  renderAction,
  secondaryAction,
  secondaryLabel,
} from "../SectionLibraryShared";


type ServiceLayoutVariant = "premium-warm" | "premium-cinematic" | "premium-magazine" | "premium-minimal" | "premium-conversion";

function resolveServiceLayoutVariant(context: RenderContext): ServiceLayoutVariant {
  const raw = (context.request as any)?.raw || {};
  const brief = (context.request as any)?.serviceDesignBrief || raw?.serviceDesignBrief ||
    raw?.selectedVariation?.serviceDesignBrief || raw?.aiVariation?.serviceDesignBrief;
  const id = String(brief?.id || (context.request as any)?.serviceDesignBriefId ||
    raw?.serviceDesignBriefId || raw?.selectedVariation?.serviceDesignBriefId ||
    raw?.aiVariation?.serviceDesignBriefId || "").toUpperCase();

  if (id === "SERVICE_CINEMATIC") return "premium-cinematic";
  if (id === "SERVICE_MAGAZINE") return "premium-magazine";
  if (id === "SERVICE_MINIMAL") return "premium-minimal";
  if (id === "SERVICE_CONVERSION") return "premium-conversion";
  if (id === "SERVICE_WARM_EDITORIAL") return "premium-warm";

  switch (context.pageArchetype?.archetype) {
    case "CINEMATIC_STORY": return "premium-cinematic";
    case "MAGAZINE_STORY": return "premium-magazine";
    case "MINIMAL_PREMIUM": return "premium-minimal";
    case "MODERN_CONVERSION":
    case "BOUTIQUE_COMMERCE": return "premium-conversion";
    default: return "premium-warm";
  }
}

export function renderFinalCtaByContext(context: RenderContext): string {
  const fallback = familyVariant(context, {
    "luxury-editorial": "luxury",
    "marketplace-grid": "commerce",
    "conversion-sales": "impact",
    "magazine-story": "editorial",
    "minimal-premium": "minimal",
  }, "minimal");
  const variant = getSectionVariant(context, "final-cta", fallback);
  const isService = context.request.pageKind === "servico";

  if (isService) {
    const layout = resolveServiceLayoutVariant(context);
    const content = {
      "premium-cinematic": ["O PRÓXIMO CAPÍTULO", "Transforme sua necessidade em um próximo passo.", "Converse, entenda as possibilidades e avance para o atendimento."],
      "premium-magazine": ["CONTATO", "Uma boa conversa pode ser o começo.", "Conheça o atendimento e descubra a opção mais adequada para você."],
      "premium-minimal": ["PRÓXIMO PASSO", "Vamos começar?", "Fale com o profissional e avance no seu ritmo."],
      "premium-conversion": ["PRONTO PARA AVANÇAR?", "Escolha seu atendimento e dê o próximo passo.", "Solicite atendimento ou tire suas dúvidas antes de decidir."],
      "premium-warm": ["SEU PRÓXIMO PASSO", "Vamos conversar sobre o que você precisa?", "Conheça as opções de atendimento, tire suas dúvidas e escolha o melhor próximo passo."],
    }[layout];
    return `<section class="gc-final-cta gc-final-cta--service-${layout}" id="final-cta"><div class="gc-container gc-final-cta-service__inner">
      <div class="gc-final-cta-service__copy"><span>${escapeHtml(content[0])}</span><h2>${escapeHtml(content[1])}</h2><p>${escapeHtml(content[2])}</p></div>
      <div class="gc-actions gc-final-cta-service__actions">${renderAction(primaryAction(context), primaryLabel(context), true)}${renderAction(secondaryAction(context), secondaryLabel(context), false)}</div>
    </div></section>`;
  }

  return `<section class="gc-final-cta gc-final-cta--${variant}" id="final-cta">
    <div class="gc-container gc-final-cta__inner">
      <span>${isService ? "Seu próximo passo" : "Continue sua experiência"}</span>
      <h2>${escapeHtml(isService ? "Pronto para começar?" : "Encontrou algo que combina com você?")}</h2>
      <p>${escapeHtml(isService ? "Converse com o profissional e avance para o atendimento." : "Explore a loja ou fale com a marca para tirar suas dúvidas.")}</p>
      <div class="gc-actions">
        ${renderAction(primaryAction(context), primaryLabel(context), true)}
        ${renderAction(secondaryAction(context), secondaryLabel(context), false)}
      </div>
    </div>
  </section>`;
}
