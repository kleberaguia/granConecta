import type {
  CtaAction,
  LandingCreativeDirection,
  LandingCommercialStrategy,
} from "../../TemplateTypes";
import type { RenderContext } from "../renderTypes";

export function renderTopbar(context: RenderContext): string {
  const isService = context.request.pageKind === "servico";
  const strategy = getStrategy(context);

  const strategyItems = strategy?.trustItems?.filter(Boolean).slice(0, 4) || [];

  const items =
    strategyItems.length > 0
      ? strategyItems
      : isService
        ? ["Atendimento profissional", "Contato direto", "Próximo passo simples", "GranConecta"]
        : ["Compra prática", "Atendimento próximo", "Catálogo organizado", "GranConecta"];

  return `<div class="gc-topbar">
  <div class="gc-container gc-topbar__inner">
    ${items.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
  </div>
</div>`;
}

export function renderHeader(context: RenderContext): string {
  const isService = context.request.pageKind === "servico";
  const strategy = getStrategy(context);
  const mainHref = isService ? "#services" : "#products";
  const mainLabel = isService ? "Atendimentos" : "Produtos";
  const logo = context.visualContext.media?.brand?.find(
    (asset) => String(asset.type || "").toUpperCase().includes("LOGO"),
  )?.url || context.visualContext.media?.brand?.[0]?.url || "";

  const primaryAction: CtaAction =
    strategy?.primaryAction || (isService ? "open-chat" : "open-products");
  const primaryLabel =
    strategy?.primaryLabel || (isService ? "Agendar atendimento" : "Ver produtos");

  const brand = logo
    ? `<span class="gc-brand__logo"><img src="${escapeAttr(logo)}" alt="${escapeAttr(context.request.businessName)}" /></span>
       <span class="gc-brand__name">${escapeHtml(context.request.businessName)}</span>`
    : `<span class="gc-brand__monogram">${escapeHtml(initials(context.request.businessName))}</span>
       <span class="gc-brand__name">${escapeHtml(context.request.businessName)}</span>`;

  return `<header class="gc-header gc-header--professional" id="inicio">
  <div class="gc-container gc-header__inner">
    <a class="gc-brand" href="#inicio">${brand}</a>
    <nav class="gc-nav" aria-label="Navegação principal">
      <a href="#inicio">Início</a>
      <a href="${mainHref}">${mainLabel}</a>
      <a href="#about">Sobre</a>
      <a href="#contact">Contato</a>
    </nav>
    <div class="gc-header__action">
      ${actionButton({ action: primaryAction, label: primaryLabel, primary: true })}
    </div>
  </div>
</header>`;
}

export function renderCategories(context: RenderContext): string {
  if (context.request.pageKind === "servico") return "";

  const categoryName =
    context.visualContext.categoryName || context.request.businessSegment;

  const categories = [
    {
      label: categoryName,
      action: "open-products" as CtaAction,
    },
    {
      label: "Destaques",
      action: "open-products" as CtaAction,
    },
    {
      label: "Ofertas",
      action: "open-offers" as CtaAction,
    },
    {
      label: "Novidades",
      action: "open-products" as CtaAction,
    },
  ];

  const image =
    context.visualContext.categoryImage ||
    context.visualContext.defaultProductImage ||
    "";

  return `<section class="gc-categories" id="categories">
  <div class="gc-container">
    <div class="gc-section-heading">
      <span>Explore</span>
      <h2>Encontre o que combina com você</h2>
      <p>Descubra categorias, destaques e novidades da marca.</p>
    </div>

    <div class="gc-category-grid">
      ${categories
        .map(
          (item) => `<button type="button" class="gc-category-card" data-action="${escapeAttr(item.action)}" data-gc-action="${escapeAttr(item.action)}">
        ${image ? `<img src="${escapeAttr(image)}" alt="${escapeAttr(item.label)}" />` : ""}
        <strong>${escapeHtml(item.label)}</strong>
      </button>`,
        )
        .join("")}
    </div>
  </div>
</section>`;
}

export function renderFeatured(context: RenderContext): string {
  const isService = context.request.pageKind === "servico";
  const strategy = getStrategy(context);

  const action: CtaAction =
    strategy?.primaryAction ||
    (isService ? "request-quote" : "open-offers");

  const title =
    strategy?.offer ||
    (isService
      ? "Dê o próximo passo com um atendimento mais direcionado"
      : "Descubra uma seleção especial da marca");

  const text =
    strategy?.differentiator ||
    (isService
      ? "Converse sobre sua necessidade e entenda a melhor forma de começar."
      : "Veja destaques, novidades e oportunidades escolhidas para facilitar sua decisão.");

  return `<section class="gc-featured" id="featured">
  <div class="gc-container gc-featured__inner">
    <div>
      <span>${isService ? "Em destaque" : "Seleção especial"}</span>
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(text)}</p>
    </div>

    ${actionButton({
      action,
      label:
        strategy?.primaryLabel ||
        (isService ? "Quero saber mais" : "Ver destaques"),
      primary: true,
    })}
  </div>
</section>`;
}

export function renderBenefits(context: RenderContext): string {
  const creative = getCreative(context);
  const strategy = getStrategy(context);
  const isService = context.request.pageKind === "servico";

  const items = resolveBenefitItems(context, strategy, isService);
  const variant = creative?.benefitsVariant || "icon-grid";

  if (variant === "numbers") {
    return `<section class="gc-benefits gc-benefits--numbers" id="benefits">
      <div class="gc-container">
        <div class="gc-benefits-numbers">
          ${items
            .slice(0, 4)
            .map(
              ([title, text], index) => `<article class="gc-benefit-number">
                <span>${String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>${escapeHtml(title)}</strong>
                  <p>${escapeHtml(text)}</p>
                </div>
              </article>`,
            )
            .join("")}
        </div>
      </div>
    </section>`;
  }

  if (variant === "editorial") {
    const [first, ...rest] = items;

    return `<section class="gc-benefits gc-benefits--editorial" id="benefits">
      <div class="gc-container gc-benefits-editorial__inner">
        <div class="gc-benefits-editorial__intro">
          <span>Por que escolher</span>
          <h2>${escapeHtml(first?.[0] || "Uma experiência pensada para você")}</h2>
          <p>${escapeHtml(first?.[1] || "")}</p>
        </div>

        <div class="gc-benefits-editorial__list">
          ${rest
            .map(
              ([title, text], index) => `<article class="gc-benefit-editorial-item">
                <span>${String(index + 2).padStart(2, "0")}</span>
                <div>
                  <strong>${escapeHtml(title)}</strong>
                  <p>${escapeHtml(text)}</p>
                </div>
              </article>`,
            )
            .join("")}
        </div>
      </div>
    </section>`;
  }

  if (variant === "bento") {
    return `<section class="gc-benefits gc-benefits--bento" id="benefits">
      <div class="gc-container">
        <div class="gc-benefits-bento">
          ${items
            .map(
              ([title, text], index) => `<article class="gc-benefit-bento gc-benefit-bento--${index + 1}">
                <strong>${escapeHtml(title)}</strong>
                <span>${escapeHtml(text)}</span>
              </article>`,
            )
            .join("")}
        </div>
      </div>
    </section>`;
  }

  if (variant === "trust-strip") {
    return `<section class="gc-benefits gc-benefits--trust-strip" id="benefits">
      <div class="gc-container gc-benefits-trust-strip">
        ${items
          .slice(0, 4)
          .map(
            ([title, text]) => `<article class="gc-benefit-trust">
              <strong>${escapeHtml(title)}</strong>
              <span>${escapeHtml(text)}</span>
            </article>`,
          )
          .join("")}
      </div>
    </section>`;
  }

  return `<section class="gc-benefits gc-benefits--icon-grid" id="benefits">
  <div class="gc-container gc-benefits-grid">
    ${items
      .map(
        ([title, text], index) => `<article class="gc-benefit-card">
      <span class="gc-benefit-card__index">${String(index + 1).padStart(2, "0")}</span>
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(text)}</span>
    </article>`,
      )
      .join("")}
  </div>
</section>`;
}

export function renderAbout(context: RenderContext): string {
  const isService = context.request.pageKind === "servico";
  const creative = getCreative(context);
  const strategy = getStrategy(context);

  const title =
    context.request.copy?.aboutTitle ||
    `Sobre ${context.request.businessName}`;

  const text =
    resolveSafeAboutText(context, strategy, isService);

  const aboutPlannedImage =
    context.visualContext.media?.about?.[0]?.url ||
    context.visualContext.media?.workspace?.[0]?.url;

  const image = isService
    ? aboutPlannedImage ||
      context.visualContext.defaultServiceImage ||
      context.visualContext.heroImage
    : aboutPlannedImage ||
      context.visualContext.defaultProductImage ||
      context.visualContext.heroImage;

  const variant = creative?.aboutVariant || "editorial-split";

  if (variant === "portrait-story") {
    return `<section class="gc-about gc-about--portrait-story" id="about">
      <div class="gc-container gc-about-story__inner">
        <div class="gc-about-story__media">
          ${renderImage(image, title)}
        </div>
        <div class="gc-about-story__copy">
          <span>Conheça a história</span>
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(text)}</p>
          ${renderDifferentiator(strategy)}
          ${actionButton({
            action: strategy?.primaryAction || (isService ? "open-chat" : "open-chat"),
            label: strategy?.primaryLabel || (isService ? "Conversar agora" : "Falar com a marca"),
            primary: true,
          })}
        </div>
      </div>
    </section>`;
  }

  if (variant === "founder-note") {
    return `<section class="gc-about gc-about--founder-note" id="about">
      <div class="gc-container gc-about-founder">
        <span>Uma mensagem de ${escapeHtml(context.request.businessName)}</span>
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(text)}</p>
        ${renderDifferentiator(strategy)}
      </div>
    </section>`;
  }

  if (variant === "minimal") {
    return `<section class="gc-about gc-about--minimal" id="about">
      <div class="gc-container gc-about-minimal">
        <span>Sobre</span>
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(text)}</p>
      </div>
    </section>`;
  }

  if (variant === "brand-manifesto") {
    return `<section class="gc-about gc-about--manifesto" id="about">
      <div class="gc-container gc-about-manifesto__inner">
        <div class="gc-about-manifesto__copy">
          <span>Nossa essência</span>
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(text)}</p>
          ${renderDifferentiator(strategy)}
        </div>
        <div class="gc-about-manifesto__media">
          ${renderImage(image, title)}
        </div>
      </div>
    </section>`;
  }

  return `<section class="gc-about gc-about--editorial-split" id="about">
  <div class="gc-container gc-about__inner">
    <div class="gc-about__copy">
      <span>Nossa diferença</span>
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(text)}</p>
      ${renderDifferentiator(strategy)}
      ${actionButton({
        action: strategy?.primaryAction || (isService ? "open-chat" : "open-chat"),
        label: strategy?.primaryLabel || (isService ? "Iniciar atendimento" : "Falar com atendimento"),
        primary: true,
      })}
    </div>

    <div class="gc-about__image">
      ${renderImage(image, title)}
    </div>
  </div>
</section>`;
}

export function renderTestimonials(context: RenderContext): string {
  const creative = getCreative(context);
  const testimonials = resolveRealTestimonials(context);

  if (
    !testimonials.length ||
    creative?.suppressSections?.includes("testimonials")
  ) {
    return "";
  }

  const variant = creative?.trustVariant || "real-testimonials";

  return `<section class="gc-testimonials gc-testimonials--${escapeAttr(variant)}" id="testimonials">
    <div class="gc-container">
      <div class="gc-section-heading">
        <span>Experiências reais</span>
        <h2>Quem já conhece conta melhor</h2>
      </div>

      <div class="gc-testimonial-grid">
        ${testimonials
          .map(
            (item) => `<article class="gc-testimonial-card">
              <p>“${escapeHtml(item.text)}”</p>
              ${item.author ? `<strong>${escapeHtml(item.author)}</strong>` : ""}
            </article>`,
          )
          .join("")}
      </div>
    </div>
  </section>`;
}

export function renderFaq(context: RenderContext): string {
  const isService = context.request.pageKind === "servico";
  const creative = getCreative(context);
  const strategy = getStrategy(context);

  const items = resolveFaqItems(context, strategy, isService);
  const variant = creative?.faqVariant || "accordion";

  if (variant === "split-accordion") {
    return `<section class="gc-faq gc-faq--split" id="faq">
      <div class="gc-container gc-faq-split__inner">
        <div class="gc-faq-split__intro">
          <span>Dúvidas frequentes</span>
          <h2>Antes de dar o próximo passo</h2>
          <p>Veja respostas rápidas para decidir com mais segurança.</p>
        </div>

        <div class="gc-faq-list">
          ${renderFaqDetails(items)}
        </div>
      </div>
    </section>`;
  }

  if (variant === "minimal") {
    return `<section class="gc-faq gc-faq--minimal" id="faq">
      <div class="gc-container">
        <div class="gc-section-heading">
          <span>Perguntas frequentes</span>
          <h2>O essencial, sem complicação</h2>
        </div>
        <div class="gc-faq-list gc-faq-list--minimal">
          ${renderFaqDetails(items)}
        </div>
      </div>
    </section>`;
  }

  return `<section class="gc-faq gc-faq--accordion" id="faq">
  <div class="gc-container">
    <div class="gc-section-heading">
      <span>Dúvidas frequentes</span>
      <h2>Antes de continuar</h2>
    </div>

    <div class="gc-faq-list">
      ${renderFaqDetails(items)}
    </div>
  </div>
</section>`;
}

export function renderContact(context: RenderContext): string {
  const isService = context.request.pageKind === "servico";
  const creative = getCreative(context);
  const strategy = getStrategy(context);

  const primaryAction: CtaAction =
    strategy?.primaryAction ||
    (isService ? "open-chat" : "open-chat");

  const secondaryAction: CtaAction =
    strategy?.secondaryAction || "open-whatsapp";

  const title =
    strategy?.primaryLabel ||
    (isService ? "Vamos conversar sobre o que você precisa?" : "Quer falar com a marca?");

  const text =
    strategy?.differentiator ||
    (isService
      ? "Conte sua necessidade e receba orientação para o próximo passo."
      : "Converse pelo chat, WhatsApp ou explore os produtos disponíveis.");

  const variant = creative?.contactVariant || "conversion-band";

  if (variant === "editorial-card") {
    return `<section class="gc-contact gc-contact--editorial-card" id="contact">
      <div class="gc-container">
        <div class="gc-contact-card">
          <span>Próximo passo</span>
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(text)}</p>
          <div class="gc-actions">
            ${actionButton({
              action: primaryAction,
              label: strategy?.primaryLabel || "Quero conversar",
              primary: true,
            })}
            ${actionButton({
              action: secondaryAction,
              label: strategy?.secondaryLabel || "WhatsApp",
              primary: false,
            })}
          </div>
        </div>
      </div>
    </section>`;
  }

  if (variant === "minimal") {
    return `<section class="gc-contact gc-contact--minimal" id="contact">
      <div class="gc-container gc-contact-minimal">
        <span>Contato</span>
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(text)}</p>
        <div class="gc-actions">
          ${actionButton({
            action: primaryAction,
            label: strategy?.primaryLabel || "Começar agora",
            primary: true,
          })}
        </div>
      </div>
    </section>`;
  }

  if (variant === "commerce-banner") {
    return `<section class="gc-contact gc-contact--commerce-banner" id="contact">
      <div class="gc-container gc-contact__inner">
        <div>
          <span>Continue explorando</span>
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(text)}</p>
        </div>
        <div class="gc-actions">
          ${actionButton({
            action: primaryAction,
            label: strategy?.primaryLabel || "Falar com a loja",
            primary: true,
          })}
          ${actionButton({
            action: secondaryAction,
            label: strategy?.secondaryLabel || "WhatsApp",
            primary: false,
          })}
        </div>
      </div>
    </section>`;
  }

  return `<section class="gc-contact gc-contact--conversion-band" id="contact">
  <div class="gc-container gc-contact__inner">
    <div>
      <span>Próximo passo</span>
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(text)}</p>
    </div>

    <div class="gc-actions">
      ${actionButton({
        action: primaryAction,
        label: strategy?.primaryLabel || (isService ? "Começar atendimento" : "Falar no chat"),
        primary: true,
      })}
      ${actionButton({
        action: secondaryAction,
        label: strategy?.secondaryLabel || "WhatsApp",
        primary: false,
      })}
    </div>
  </div>
</section>`;
}

export function renderFooter(context: RenderContext): string {
  const isService = context.request.pageKind === "servico";
  const strategy = getStrategy(context);
  const logo = context.visualContext.media?.brand?.find(
    (asset) => String(asset.type || "").toUpperCase().includes("LOGO"),
  )?.url || context.visualContext.media?.brand?.[0]?.url || "";

  return `<footer class="gc-footer gc-footer--professional" id="footer">
  <div class="gc-container gc-footer__inner">
    <div class="gc-footer__brand">
      ${logo ? `<img src="${escapeAttr(logo)}" alt="${escapeAttr(context.request.businessName)}" />` : `<span class="gc-footer__monogram">${escapeHtml(initials(context.request.businessName))}</span>`}
      <div>
        <strong>${escapeHtml(context.request.businessName)}</strong>
        <span>${escapeHtml(strategy?.differentiator || (isService ? "Atendimento profissional com uma jornada simples e próxima." : "Uma experiência de marca pensada para facilitar sua escolha."))}</span>
      </div>
    </div>
    <nav class="gc-footer__nav" aria-label="Links do rodapé">
      <a href="#inicio">Início</a>
      <a href="${isService ? "#services" : "#products"}">${isService ? "Atendimentos" : "Produtos"}</a>
      <a href="#about">Sobre</a>
      <a href="#contact">Contato</a>
    </nav>
    <div class="gc-footer__meta">
      <span>Conectado por GranConecta</span>
    </div>
  </div>
</footer>`;
}

function getCreative(
  context: RenderContext,
): LandingCreativeDirection | undefined {
  return context.request.creativeDirection;
}

function getStrategy(
  context: RenderContext,
): LandingCommercialStrategy | undefined {
  return context.commercialStrategy || context.request.commercialStrategy;
}

function resolveBenefitItems(
  context: RenderContext,
  strategy: LandingCommercialStrategy | undefined,
  isService: boolean,
): [string, string][] {
  const trustItems =
    strategy?.trustItems?.filter(Boolean).slice(0, 4) || [];

  if (trustItems.length) {
    return trustItems.map((item, index) => [
      index === 0 ? "Confiança" : `Diferencial ${index + 1}`,
      item,
    ]);
  }

  if (strategy?.differentiator) {
    const base: [string, string][] = isService
      ? [
          ["Atendimento próximo", strategy.differentiator],
          ["Clareza", "Entenda como funciona e qual é o próximo passo."],
          ["Conversa direta", "Tire dúvidas antes de decidir."],
          ["Experiência profissional", "Uma apresentação pensada para transmitir segurança."],
        ]
      : [
          ["Escolha com confiança", strategy.differentiator],
          ["Descoberta fácil", "Encontre produtos e destaques sem complicação."],
          ["Contato próximo", "Converse com a marca quando precisar."],
          ["Experiência organizada", "Informações importantes em uma jornada clara."],
        ];

    return base;
  }

  return isService
    ? [
        ["Atendimento próximo", "Converse sobre sua necessidade antes de decidir."],
        ["Clareza no processo", "Entenda como funciona e qual é o próximo passo."],
        ["Contato direto", "Tire dúvidas com facilidade."],
        ["Experiência profissional", "Informações organizadas para transmitir segurança."],
      ]
    : [
        ["Escolha com confiança", "Conheça melhor os produtos antes de decidir."],
        ["Descoberta fácil", "Encontre destaques e novidades com praticidade."],
        ["Contato próximo", "Converse com a marca quando precisar."],
        ["Experiência organizada", "Navegue por informações e produtos com clareza."],
      ];
}

function resolveSafeAboutText(
  context: RenderContext,
  strategy: LandingCommercialStrategy | undefined,
  isService: boolean,
): string {
  const explicitAbout = String(context.request.copy?.aboutText || "").trim();

  /**
   * Evita jogar o briefing interno do gerador na página pública.
   */
  if (explicitAbout && !looksLikeInternalBriefing(explicitAbout)) {
    return explicitAbout;
  }

  const description = String(context.request.descricao || "").trim();

  if (description && !looksLikeInternalBriefing(description)) {
    return description;
  }

  if (strategy?.differentiator) {
    return strategy.differentiator;
  }

  if (strategy?.offer) {
    return isService
      ? `${context.request.businessName} oferece ${strategy.offer} com uma experiência de atendimento clara e próxima.`
      : `${context.request.businessName} apresenta ${strategy.offer} em uma experiência de marca pensada para facilitar sua escolha.`;
  }

  return isService
    ? `Conheça ${context.request.businessName}, sua forma de trabalhar e como o atendimento pode ajudar você a avançar com mais segurança.`
    : `Conheça ${context.request.businessName}, sua proposta e uma seleção pensada para transformar a escolha em uma experiência mais simples e especial.`;
}

function looksLikeInternalBriefing(value: string): boolean {
  const normalized = value.toLowerCase();

  return (
    normalized.includes("estilo desejado:") ||
    normalized.includes("objetivo principal:") ||
    normalized.includes("produto/serviço de destaque:") ||
    normalized.includes("produto/servico de destaque:") ||
    normalized.includes("sensação desejada:") ||
    normalized.includes("sensacao desejada:") ||
    normalized.includes("preferência de imagens:") ||
    normalized.includes("preferencia de imagens:")
  );
}

function resolveRealTestimonials(
  context: RenderContext,
): Array<{ text: string; author?: string }> {
  const raw = context.request.raw || {};
  const answers = context.request.answers || {};

  const candidates = [
    raw?.testimonials,
    raw?.depoimentos,
    raw?.reviews,
    answers?.testimonials,
    answers?.depoimentos,
  ];

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;

    return candidate
      .map((item) => {
        if (typeof item === "string") {
          return { text: item.trim() };
        }

        return {
          text: String(
            item?.text ||
              item?.texto ||
              item?.testimonial ||
              item?.depoimento ||
              "",
          ).trim(),
          author: String(
            item?.author ||
              item?.autor ||
              item?.name ||
              item?.nome ||
              "",
          ).trim() || undefined,
        };
      })
      .filter((item) => Boolean(item.text));
  }

  return [];
}

function resolveFaqItems(
  context: RenderContext,
  strategy: LandingCommercialStrategy | undefined,
  isService: boolean,
): [string, string][] {
  if (isService) {
    return [
      [
        "Como começo?",
        strategy?.primaryLabel
          ? `Use o botão “${strategy.primaryLabel}” para iniciar o próximo passo.`
          : "Use o botão principal da página para iniciar o atendimento.",
      ],
      [
        "Posso conversar antes de decidir?",
        "Sim. O chat ajuda você a tirar dúvidas e entender melhor o atendimento.",
      ],
      [
        "Onde vejo os serviços disponíveis?",
        "A seção de serviços apresenta as opções disponíveis e ajuda você a escolher o melhor caminho.",
      ],
    ];
  }

  return [
    [
      "Como vejo os produtos?",
      "Explore a vitrine e os destaques para conhecer as opções disponíveis.",
    ],
    [
      "Posso falar com a loja antes de comprar?",
      "Sim. Use o chat ou o WhatsApp para tirar dúvidas antes de decidir.",
    ],
    [
      "Como vejo ofertas ou novidades?",
      "Use os destaques e categorias da página para descobrir oportunidades e lançamentos.",
    ],
  ];
}

function renderFaqDetails(items: [string, string][]): string {
  return items
    .map(
      ([question, answer]) => `<details>
        <summary>${escapeHtml(question)}</summary>
        <p>${escapeHtml(answer)}</p>
      </details>`,
    )
    .join("");
}

function renderDifferentiator(
  strategy: LandingCommercialStrategy | undefined,
): string {
  if (!strategy?.differentiator) return "";

  return `<div class="gc-about__differentiator">
    ${escapeHtml(strategy.differentiator)}
  </div>`;
}

function renderImage(
  image: string | undefined,
  alt: string,
): string {
  if (!String(image || "").trim()) {
    return `<div class="gc-section-image-placeholder" role="img" aria-label="${escapeAttr(alt)}"></div>`;
  }

  return `<img src="${escapeAttr(image)}" alt="${escapeAttr(alt)}" />`;
}

function actionButton(input: {
  action: CtaAction;
  label: string;
  primary: boolean;
}): string {
  return `<button type="button" class="gc-btn ${
    input.primary ? "gc-btn--primary" : "gc-btn--secondary"
  }" data-action="${escapeAttr(input.action)}" data-gc-action="${escapeAttr(
    input.action,
  )}">${escapeHtml(input.label)}</button>`;
}

function initials(value: string): string {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "GC";
  return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("");
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