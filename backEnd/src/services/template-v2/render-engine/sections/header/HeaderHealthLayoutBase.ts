import type { RenderContext } from "../../renderTypes";
import {
  brandLogo,
  escapeAttr,
  escapeHtml,
  initials,
  renderAction,
} from "../SectionLibraryShared";

/**
 * Header estrutural exclusivo do SERVICE_HEALTH_01.
 *
 * Arquitetura do layout-base:
 * - brand-nav-appointment
 * - Sobre
 * - Especialidades
 * - Como Funciona
 * - Agendamento
 * - CTA principal: Agendar Consulta
 *
 * Não interfere em lojas nem em serviços legados.
 */
export function renderHeaderHealthLayoutBase(
  context: RenderContext,
): string {
  const logo = brandLogo(context);
  const businessName = String(context.request.businessName || "").trim();

  const brandVisual = logo
    ? `<img
         class="gc-health-header__logo"
         src="${escapeAttr(logo)}"
         alt="${escapeAttr(businessName)}"
       />`
    : `<span class="gc-health-header__monogram" aria-hidden="true">
         ${escapeHtml(initials(businessName))}
       </span>`;

  return `<header
    class="gc-header gc-health-header"
    id="inicio"
    data-layout-base-id="SERVICE_HEALTH_01"
    data-header-layout="brand-nav-appointment"
  >
    <div class="gc-container gc-health-header__inner">
      <a class="gc-health-header__brand" href="#inicio" aria-label="${escapeAttr(businessName || "Início")}">
        ${brandVisual}
        ${
          businessName
            ? `<span class="gc-health-header__brand-copy">
                 <strong>${escapeHtml(businessName)}</strong>
               </span>`
            : ""
        }
      </a>

      <nav class="gc-health-header__nav" aria-label="Navegação principal">
        <a href="#about">Sobre</a>
        <a href="#services">Especialidades</a>
        <a href="#process">Como Funciona</a>
        <a href="#final-cta">Agendamento</a>
      </nav>

      <div class="gc-health-header__actions">
        ${renderAction("schedule-service", "Agendar Consulta", true)}
      </div>
    </div>
  </header>`;
}
