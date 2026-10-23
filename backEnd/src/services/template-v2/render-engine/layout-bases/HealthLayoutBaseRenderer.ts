import type { RenderContext } from "../renderTypes";
import { renderHeaderHealthLayoutBase } from "../sections/header/HeaderHealthLayoutBase";
import { renderHeroHealthLayoutBase } from "../sections/hero/HeroHealthLayoutBase";
import {
  escapeAttr,
  escapeHtml,
  locationData,
  mediaUrls,
  primaryAction,
  primaryLabel,
  renderAction,
  secondaryAction,
  secondaryLabel,
  socialLinks,
} from "../sections/SectionLibraryShared";

/**
 * Página completa e estrutural do SERVICE_HEALTH_01.
 *
 * IMPORTANTE:
 * - não usa SectionLibrary para montar o corpo;
 * - não injeta gallery/benefits/faq genéricos;
 * - não inventa credenciais, métricas ou depoimentos;
 * - usa apenas dados reais presentes no RenderContext/request.
 */
export function renderHealthLayoutBase(context: RenderContext): string {
  return [
    renderHeaderHealthLayoutBase(context),
    renderHeroHealthLayoutBase(context),
    renderModalities(context),
    renderSpecialties(context),
    renderProfessionalProfile(context),
    renderProcess(context),
    renderTestimonials(context),
    renderFinalCta(context),
    renderFooter(context),
  ]
    .filter(Boolean)
    .join("\n");
}

function renderModalities(context: RenderContext): string {
  const modes = resolveRealModalities(context);
  if (!modes.length) return "";

  return `<section class="gc-health-section gc-health-modalities" id="modalities">
    <div class="gc-container">
      ${heading(
        "FORMAS DE ATENDIMENTO",
        "Escolha como prefere ser atendido",
        "As modalidades abaixo foram informadas pelo profissional.",
      )}
      <div class="gc-health-modalities__grid">
        ${modes
          .map(
            (mode, index) => `<article class="gc-health-mode-card">
              <span class="gc-health-mode-card__index">0${index + 1}</span>
              <h3>${escapeHtml(mode)}</h3>
            </article>`,
          )
          .join("")}
      </div>
    </div>
  </section>`;
}

function renderSpecialties(context: RenderContext): string {
  const services = Array.isArray(context.request.services)
    ? context.request.services.filter((item) => item?.title)
    : [];

  if (!services.length) return "";

  return `<section class="gc-health-section gc-health-specialties" id="services">
    <div class="gc-container">
      ${heading(
        "ESPECIALIDADES",
        "Cuidado profissional em cada etapa",
        "Conheça os atendimentos disponíveis.",
      )}
      <div class="gc-health-specialties__grid">
        ${services
          .slice(0, 8)
          .map(
            (service, index) => `<article class="gc-health-specialty-card">
              <span class="gc-health-specialty-card__number">${String(index + 1).padStart(2, "0")}</span>
              ${service.badge ? `<span class="gc-health-specialty-card__badge">${escapeHtml(service.badge)}</span>` : ""}
              <h3>${escapeHtml(service.title)}</h3>
              ${service.description ? `<p>${escapeHtml(service.description)}</p>` : ""}
              ${renderAction(primaryAction(context), primaryLabel(context), false)}
            </article>`,
          )
          .join("")}
      </div>
    </div>
  </section>`;
}

function renderProfessionalProfile(context: RenderContext): string {
  const description = resolveAboutText(context);
  const image = resolveAboutImage(context);

  if (!description && !image) return "";

  return `<section class="gc-health-section gc-health-about" id="about">
    <div class="gc-container gc-health-about__inner">
      <div class="gc-health-about__media">
        ${
          image
            ? `<figure><img src="${escapeAttr(image)}" alt="${escapeAttr(context.request.businessName)}" loading="lazy" decoding="async" /></figure>`
            : `<div class="gc-health-about__media-placeholder" aria-hidden="true"></div>`
        }
      </div>
      <div class="gc-health-about__content">
        <span class="gc-health-eyebrow">SOBRE O PROFISSIONAL</span>
        <h2>Um atendimento próximo, humano e profissional</h2>
        ${description ? `<p>${escapeHtml(description)}</p>` : ""}
        ${resolveRealCredentials(context)}
        <div class="gc-health-about__actions">
          ${renderAction(primaryAction(context), primaryLabel(context), true)}
        </div>
      </div>
    </div>
  </section>`;
}

function renderProcess(context: RenderContext): string {
  const steps = resolveProcessSteps(context);

  return `<section class="gc-health-section gc-health-process" id="process">
    <div class="gc-container">
      ${heading(
        "COMO FUNCIONA",
        "Do primeiro contato ao acompanhamento",
        "Um caminho simples para iniciar o atendimento.",
      )}
      <div class="gc-health-process__grid">
        ${steps
          .map(
            (step, index) => `<article class="gc-health-process-card">
              <span>${String(index + 1).padStart(2, "0")}</span>
              <h3>${escapeHtml(step.title)}</h3>
              ${step.text ? `<p>${escapeHtml(step.text)}</p>` : ""}
            </article>`,
          )
          .join("")}
      </div>
    </div>
  </section>`;
}

function renderTestimonials(context: RenderContext): string {
  const testimonials = resolveRealTestimonials(context);
  if (!testimonials.length) return "";

  return `<section class="gc-health-section gc-health-testimonials" id="testimonials">
    <div class="gc-container">
      ${heading("DEPOIMENTOS", "Experiências compartilhadas", "")}
      <div class="gc-health-testimonials__grid">
        ${testimonials
          .slice(0, 3)
          .map(
            (item) => `<blockquote class="gc-health-testimonial">
              <p>“${escapeHtml(item.text)}”</p>
              ${item.author ? `<footer>${escapeHtml(item.author)}</footer>` : ""}
            </blockquote>`,
          )
          .join("")}
      </div>
    </div>
  </section>`;
}

function renderFinalCta(context: RenderContext): string {
  const secondary = secondaryAction(context);

  return `<section class="gc-health-final-cta" id="final-cta">
    <div class="gc-container">
      <div class="gc-health-final-cta__panel">
        <div>
          <span class="gc-health-eyebrow">PRÓXIMO PASSO</span>
          <h2>Vamos conversar sobre o atendimento?</h2>
          <p>Tire suas dúvidas e escolha o melhor caminho para começar.</p>
        </div>
        <div class="gc-health-final-cta__actions">
          ${renderAction(primaryAction(context), primaryLabel(context), true)}
          ${secondary ? renderAction(secondary, secondaryLabel(context), false) : ""}
        </div>
      </div>
    </div>
  </section>`;
}

function renderFooter(context: RenderContext): string {
  const links = socialLinks(context);
  const location = locationData(context);
  const name = String(context.request.businessName || "Atendimento profissional").trim();

  const socials = [
    ["Instagram", links.instagram],
    ["Facebook", links.facebook],
    ["TikTok", links.tiktok],
    ["LinkedIn", links.linkedin],
    ["Site", links.site],
  ].filter(([, url]) => Boolean(url));

  return `<footer class="gc-health-footer">
    <div class="gc-container gc-health-footer__inner">
      <div class="gc-health-footer__brand">
        <strong>${escapeHtml(name)}</strong>
        <p>Atendimento profissional com acolhimento e cuidado.</p>
      </div>

      <div class="gc-health-footer__info">
        ${
          location.address || location.city
            ? `<div>
                <span>LOCALIZAÇÃO</span>
                <p>${escapeHtml(
                  [location.address, location.city, location.state]
                    .filter(Boolean)
                    .join(" · "),
                )}</p>
              </div>`
            : ""
        }
        ${
          links.email
            ? `<div><span>CONTATO</span><p>${escapeHtml(links.email)}</p></div>`
            : ""
        }
      </div>

      ${
        socials.length
          ? `<nav class="gc-health-footer__social" aria-label="Redes sociais">
              ${socials
                .map(
                  ([label, url]) =>
                    `<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`,
                )
                .join("")}
            </nav>`
          : ""
      }
    </div>
  </footer>`;
}

function heading(eyebrow: string, title: string, text: string): string {
  return `<div class="gc-health-heading">
    <span class="gc-health-eyebrow">${escapeHtml(eyebrow)}</span>
    <h2>${escapeHtml(title)}</h2>
    ${text ? `<p>${escapeHtml(text)}</p>` : ""}
  </div>`;
}

function resolveAboutText(context: RenderContext): string {
  const raw = context.request.raw || {};
  const candidates = [
    raw.aboutText,
    raw.sobre,
    raw.bio,
    raw.biografia,
    raw.professionalBio,
    context.request.descricao,
  ];

  return firstString(candidates);
}

function resolveAboutImage(context: RenderContext): string {
  const about = context.visualContext.media?.about || [];
  const hero = context.visualContext.media?.hero || [];

  // Saúde: nunca usar "workspace" genérico como foto do profissional.
  // Prioriza foto explicitamente classificada como about; depois reutiliza
  // a foto humana principal do hero.
  return String(
    about[0]?.url ||
      hero[0]?.url ||
      hero[1]?.url ||
      mediaUrls(context)[0] ||
      "",
  ).trim();
}

function resolveRealModalities(context: RenderContext): string[] {
  const raw = context.request.raw || {};
  const source =
    raw.modalities ||
    raw.modalidades ||
    raw.serviceModalities ||
    raw.businessModalities ||
    context.request.answers?.modalities ||
    context.request.answers?.modalidades;

  const values = Array.isArray(source)
    ? source
    : typeof source === "string"
      ? source.split(/[,;/|]/g)
      : [];

  return unique(
    values
      .map((value: unknown) => String(value || "").trim())
      .filter(Boolean),
  ).slice(0, 3);
}

function resolveRealCredentials(context: RenderContext): string {
  const raw = context.request.raw || {};
  const source =
    raw.credentials ||
    raw.credenciais ||
    raw.professionalCredentials ||
    raw.registrosProfissionais;

  const credentials = Array.isArray(source)
    ? source
    : typeof source === "string"
      ? source.split(/\n|;/g)
      : [];

  const clean = unique(
    credentials
      .map((value: unknown) => String(value || "").trim())
      .filter(Boolean),
  ).slice(0, 5);

  if (!clean.length) return "";

  return `<ul class="gc-health-about__credentials">
    ${clean.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
  </ul>`;
}

function resolveRealTestimonials(
  context: RenderContext,
): Array<{ text: string; author?: string }> {
  const raw = context.request.raw || {};
  const source = raw.testimonials || raw.depoimentos;
  if (!Array.isArray(source)) return [];

  return source
    .map((item: any) => {
      if (typeof item === "string") {
        return { text: item.trim() };
      }

      return {
        text: String(item?.text || item?.texto || item?.content || "").trim(),
        author: String(item?.author || item?.autor || item?.name || "").trim() || undefined,
      };
    })
    .filter((item: { text: string }) => Boolean(item.text));
}

function resolveProcessSteps(
  context: RenderContext,
): Array<{ title: string; text?: string }> {
  const raw = context.request.raw || {};
  const source = raw.processSteps || raw.etapasAtendimento;

  if (Array.isArray(source) && source.length) {
    const real = source
      .map((item: any) =>
        typeof item === "string"
          ? { title: item.trim() }
          : {
              title: String(item?.title || item?.titulo || "").trim(),
              text: String(item?.text || item?.texto || item?.description || "").trim() || undefined,
            },
      )
      .filter((item: { title: string }) => Boolean(item.title))
      .slice(0, 3);

    if (real.length) return real;
  }

  // Estes nomes pertencem à arquitetura aprovada do SERVICE_HEALTH_01,
  // não são credenciais, métricas nem alegações sobre o profissional.
  return [
    { title: "Primeiro Contato", text: "Converse e apresente sua necessidade." },
    { title: "Triagem Inicial", text: "Alinhe os detalhes do atendimento." },
    { title: "Início do Acompanhamento", text: "Defina os próximos passos com o profissional." },
  ];
}

function firstString(values: unknown[]): string {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) return text;
  }
  return "";
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}