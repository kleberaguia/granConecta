import type { RenderContext } from "../../renderTypes";
import {
  escapeHtml,
  familyVariant,
  getSectionVariant,
  sectionHeading,
} from "../SectionLibraryShared";

export function renderFaqByContext(context: RenderContext): string {
  const fallback = familyVariant(context, {
    "luxury-editorial": "split",
    "marketplace-grid": "accordion",
    "conversion-sales": "conversion",
    "magazine-story": "editorial",
    "minimal-premium": "minimal",
  }, "accordion");
  const variant = getSectionVariant(context, "faq", fallback);
  const items = faqItems(context);

  const details = items.map(([q, a]) => `<details><summary>${escapeHtml(q)}</summary><p>${escapeHtml(a)}</p></details>`).join("");

  if (variant === "split" || variant === "editorial") {
    return `<section class="gc-faq gc-faq--${variant}" id="faq">
      <div class="gc-container gc-faq-split">
        <div>${sectionHeading("Dúvidas frequentes", "Antes de continuar", "Informações rápidas para decidir com mais segurança.")}</div>
        <div class="gc-faq-list">${details}</div>
      </div>
    </section>`;
  }

  return `<section class="gc-faq gc-faq--${variant}" id="faq">
    <div class="gc-container">
      ${sectionHeading("Perguntas frequentes", variant === "conversion" ? "O que você precisa saber para avançar" : "O essencial, sem complicação")}
      <div class="gc-faq-list">${details}</div>
    </div>
  </section>`;
}

function faqItems(context: RenderContext): [string, string][] {
  const rawFaq = context.request.raw?.faq || context.request.raw?.faqs;
  if (Array.isArray(rawFaq) && rawFaq.length) {
    const parsed = rawFaq.map((item: any) => [
      String(item?.question || item?.pergunta || "").trim(),
      String(item?.answer || item?.resposta || "").trim(),
    ] as [string, string]).filter(([q, a]) => q && a);
    if (parsed.length) return parsed;
  }

  return context.request.pageKind === "servico"
    ? [
        ["Como começo?", "Use o botão principal para iniciar seu atendimento ou solicitação."],
        ["Posso conversar antes de decidir?", "Sim. O chat e o WhatsApp ajudam a tirar dúvidas."],
        ["Onde vejo os atendimentos?", "A seção de serviços apresenta as opções disponíveis."],
      ]
    : [
        ["Como vejo os produtos?", "Explore a vitrine, coleções e destaques da página."],
        ["Posso falar com a loja?", "Sim. Use o chat ou WhatsApp para tirar dúvidas."],
        ["Como descubro novidades?", "Veja as seções de coleções, ofertas e produtos em destaque."],
      ];
}
