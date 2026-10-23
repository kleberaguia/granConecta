import type { RenderContext } from "../../renderTypes";
import {
  brandLogo,
  escapeAttr,
  escapeHtml,
  initials,
  locationData,
  socialLinks,
} from "../SectionLibraryShared";
import { SectionVariantEngine } from "../../../SectionVariantEngine";


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

export function renderFooterByContext(context: RenderContext): string {
  const variant = SectionVariantEngine.resolve(context).footer;
  const isService = context.request.pageKind === "servico";
  const logo = brandLogo(context);
  const socials = socialLinks(context);
  const location = locationData(context);
  const year = new Date().getFullYear();

  const socialItems = [
    ["Instagram", socials.instagram],
    ["Facebook", socials.facebook],
    ["TikTok", socials.tiktok],
    ["YouTube", socials.youtube],
    ["WhatsApp", socials.whatsapp],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  const brand = logo
    ? `<img src="${escapeAttr(logo)}" alt="${escapeAttr(context.request.businessName)}" />`
    : `<span class="gc-footer-monogram">${escapeHtml(initials(context.request.businessName))}</span>`;

  const socialsHtml = socialItems.length
    ? socialItems.map(([label, href]) => `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`).join("")
    : "";

  const mainHref = isService ? "#services" : "#products";
  const mainLabel = isService ? "Atendimentos" : "Produtos";

  if (isService) {
    const serviceLayout = resolveServiceLayoutVariant(context);
    return `<footer class="gc-footer gc-footer--service-${serviceLayout}" id="footer">
      <div class="gc-container gc-footer-service__main">
        <div class="gc-footer-service__brand">
          ${brand}
          <strong>${escapeHtml(context.request.businessName)}</strong>
          <p>${escapeHtml(context.commercialStrategy?.differentiator || context.request.commercialStrategy?.differentiator || "")}</p>
        </div>

        <nav class="gc-footer-service__nav" aria-label="Navegação do rodapé">
          <a href="#hero">Início</a>
          <a href="#services">Atendimentos</a>
          <a href="#about">Sobre</a>
          <a href="#final-cta">Contato</a>
        </nav>

        <div class="gc-footer-service__social">
          ${socialsHtml || `<span>GranConecta</span>`}
        </div>
      </div>

      <div class="gc-container gc-footer-service__bottom">
        <span>© ${year} ${escapeHtml(context.request.businessName)}</span>
        <span>Conectado por GranConecta</span>
      </div>
    </footer>`;
  }

  if (variant === "cinematic-dark") {
    return `<footer class="gc-footer gc-footer--cinematic-dark" id="footer">
      <div class="gc-container gc-footer-cinematic__inner">
        <div class="gc-footer-cinematic__brand">${brand}<strong>${escapeHtml(context.request.businessName)}</strong></div>
        <p>${escapeHtml(context.commercialStrategy?.differentiator || context.request.commercialStrategy?.differentiator || "")}</p>
        <button type="button" data-gc-action="${isService ? "request-service" : "open-products"}">${isService ? "Solicitar atendimento" : "Ver catálogo"}</button>
        <div class="gc-footer-cinematic__bottom">
          <div>${socialsHtml}</div><span>© ${year} · GranConecta</span>
        </div>
      </div>
    </footer>`;
  }

  if (variant === "luxury-editorial") {
    return `<footer class="gc-footer gc-footer--luxury-editorial" id="footer">
      <div class="gc-container gc-footer-luxury__brand">
        ${brand}<strong>${escapeHtml(context.request.businessName)}</strong>
      </div>
      <div class="gc-container gc-footer-luxury__grid">
        <div><span>Navegação</span><a href="#inicio">Início</a><a href="${mainHref}">${mainLabel}</a><a href="#about">Sobre</a></div>
        <div><span>Contato</span><button type="button" data-gc-action="open-chat">Chat</button><button type="button" data-gc-action="open-whatsapp">WhatsApp</button></div>
        <div><span>Social</span>${socialsHtml || `<em>GranConecta</em>`}</div>
        <div><span>Localização</span>${location.address ? `<em>${escapeHtml(location.address)}</em>` : ""}${location.city ? `<em>${escapeHtml([location.city, location.state].filter(Boolean).join(" - "))}</em>` : ""}</div>
      </div>
      <div class="gc-container gc-footer-luxury__bottom"><span>© ${year}</span><span>Conectado por GranConecta</span></div>
    </footer>`;
  }

  if (variant === "magazine-columns") {
    return `<footer class="gc-footer gc-footer--magazine-columns" id="footer">
      <div class="gc-container gc-footer-magazine__masthead">${brand}<strong>${escapeHtml(context.request.businessName)}</strong></div>
      <div class="gc-container gc-footer-magazine__columns">
        <div><b>01</b><a href="#inicio">Início</a><a href="${mainHref}">${mainLabel}</a></div>
        <div><b>02</b><a href="#about">Sobre</a><a href="#contact">Contato</a></div>
        <div><b>03</b>${socialsHtml}</div>
      </div>
      <div class="gc-container gc-footer-magazine__bottom">© ${year} · GranConecta</div>
    </footer>`;
  }

  if (variant === "minimal-clean") {
    return `<footer class="gc-footer gc-footer--minimal-clean" id="footer">
      <div class="gc-container gc-footer-minimal-clean__inner">
        <div>${brand}<strong>${escapeHtml(context.request.businessName)}</strong></div>
        <nav><a href="#inicio">Início</a><a href="${mainHref}">${mainLabel}</a><a href="#about">Sobre</a></nav>
        <div>${socialsHtml}</div>
        <span>© ${year} · GranConecta</span>
      </div>
    </footer>`;
  }

  if (variant === "conversion-action") {
    return `<footer class="gc-footer gc-footer--conversion-action" id="footer">
      <div class="gc-container gc-footer-conversion__cta">
        <div>${brand}<h2>${escapeHtml(context.request.businessName)}</h2></div>
        <button type="button" data-gc-action="${isService ? "request-service" : "open-products"}">${isService ? "Solicitar atendimento" : "Ver produtos"}</button>
      </div>
      <div class="gc-container gc-footer-conversion__links">
        <div><a href="#inicio">Início</a><a href="${mainHref}">${mainLabel}</a><a href="#about">Sobre</a><a href="#contact">Contato</a></div>
        <div>${socialsHtml}</div>
        <span>© ${year} · GranConecta</span>
      </div>
    </footer>`;
  }

  return `<footer class="gc-footer gc-footer--commerce-columns" id="footer">
    <div class="gc-container gc-footer-commerce__grid">
      <div class="gc-footer-commerce__brand">${brand}<strong>${escapeHtml(context.request.businessName)}</strong></div>
      <div><b>Comprar</b><a href="${mainHref}">${mainLabel}</a><a href="#collections">Coleções</a></div>
      <div><b>Atendimento</b><button type="button" data-gc-action="open-chat">Chat</button><button type="button" data-gc-action="open-whatsapp">WhatsApp</button></div>
      <div><b>Siga</b>${socialsHtml}</div>
    </div>
    <div class="gc-container gc-footer-commerce__bottom"><span>© ${year} ${escapeHtml(context.request.businessName)}</span><span>GranConecta</span></div>
  </footer>`;
}