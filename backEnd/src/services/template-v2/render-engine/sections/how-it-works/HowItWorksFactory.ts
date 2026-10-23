import type { RenderContext } from "../../renderTypes";
import {
  escapeHtml,
  familyVariant,
  getSectionVariant,
  sectionHeading,
} from "../SectionLibraryShared";

export function renderHowItWorksByContext(context: RenderContext): string {
  const fallback = familyVariant(context, {
    "luxury-editorial": "editorial",
    "marketplace-grid": "steps",
    "conversion-sales": "conversion",
    "magazine-story": "story",
    "minimal-premium": "minimal",
  }, "steps");
  const variant = getSectionVariant(context, "how-it-works", fallback);
  const steps = context.request.pageKind === "servico"
    ? [
        ["Conte o que precisa", "Escolha o atendimento ou descreva sua necessidade."],
        ["Converse e alinhe", "Tire dúvidas e confirme os detalhes importantes."],
        ["Avance pelo GranConecta", "Solicite, agende ou conclua o próximo passo pela plataforma."],
      ]
    : [
        ["Descubra", "Explore coleções, categorias e destaques."],
        ["Escolha", "Veja detalhes, preços e adicione seus favoritos."],
        ["Converse ou compre", "Use o atendimento da loja para concluir sua decisão."],
      ];

  return `<section class="gc-how gc-how--${variant}" id="how-it-works">
    <div class="gc-container">
      ${sectionHeading("Como funciona", context.request.pageKind === "servico" ? "Do interesse ao atendimento" : "Da descoberta à escolha")}
      <div class="gc-how-grid">
        ${steps.map(([title, text], index) => `<article><span>${String(index + 1).padStart(2, "0")}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></article>`).join("")}
      </div>
    </div>
  </section>`;
}
