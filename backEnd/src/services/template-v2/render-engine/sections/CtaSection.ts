import type { CtaAction } from "../../TemplateTypes";
import type { RenderContext } from "../renderTypes";

export function renderCtaBlock(context: RenderContext): string {
  const isService = context.request.pageKind === "servico";
  const strategy =
    context.commercialStrategy || context.request.commercialStrategy;

  const action: CtaAction =
    strategy?.primaryAction ||
    (isService ? "open-chat" : "open-offers");

  const secondaryAction: CtaAction =
    strategy?.secondaryAction || "open-whatsapp";

  const title =
    strategy?.primaryLabel ||
    (isService ? "Vamos começar seu atendimento?" : "Encontre sua próxima escolha");

  const text =
    strategy?.differentiator ||
    strategy?.offer ||
    (isService
      ? "Converse sobre sua necessidade, tire dúvidas e encontre o próximo passo ideal."
      : "Explore produtos, ofertas e fale com a marca quando precisar.");

  return `<section class="gc-cta-block gc-cta-block--semantic" id="cta">
  <div class="gc-container gc-cta-block__inner">
    <div>
      <span>${isService ? "Seu próximo passo" : "Continue explorando"}</span>
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(text)}</p>
    </div>

    <div class="gc-actions">
      ${actionButton({
    action,
    label: strategy?.primaryLabel || labelForAction(action, isService),
    primary: true,
  })}
      ${secondaryAction !== action ? actionButton({
    action: secondaryAction,
    label: strategy?.secondaryLabel || labelForAction(secondaryAction, isService),
    primary: false,
  }) : ""}
    </div>
  </div>
</section>`;
}

export function actionButton(input: {
  action: CtaAction;
  label: string;
  primary: boolean;
}): string {
  return `<button
    type="button"
    class="gc-btn ${input.primary ? "gc-btn--primary" : "gc-btn--secondary"}"
    data-action="${escapeAttr(input.action)}"
    data-gc-action="${escapeAttr(input.action)}"
  >
    ${escapeHtml(input.label)}
  </button>`;
}
export function labelForAction(
  action: CtaAction,
  isService: boolean,
): string {
  const labels: Record<CtaAction, string> = {
    "add-to-cart": "Adicionar ao carrinho",
    "open-cart": "Abrir carrinho",
    "add-to-wishlist": "Lista de desejo",
    "open-product": "Ver detalhes",
    "open-products": isService ? "Ver serviços" : "Ver produtos",
    "open-offers": "Ver ofertas",
    "open-combos": "Ver combos",

    "open-chat": "Falar no chat",
    "open-whatsapp": "WhatsApp",
    contact: "Fale conosco",

    "open-service": "Ver serviço",

    "request-quote": "Solicitar orçamento",
    "request-service": "Solicitar atendimento",
    "schedule-service": "Agendar atendimento",
    "hire-service": "Quero contratar",

    "open-provider": "Ver profissional",
  };

  return labels[action] || "Saiba mais";
}
function escapeHtml(value: any): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(value: any): string {
  return escapeHtml(value)
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}