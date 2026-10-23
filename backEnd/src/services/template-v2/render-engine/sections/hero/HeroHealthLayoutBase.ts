import type { RenderContext } from "../../renderTypes";
import {
  escapeAttr,
  heroActions,
  heroKicker,
  heroSupportingCopy,
  heroTitle,
  heroTrust,
  resolveHeroData,
} from "./HeroShared";

/**
 * Renderer estrutural exclusivo do SERVICE_HEALTH_01.
 *
 * A arquitetura vem do layout-base:
 * - split-professional
 * - conteúdo 44%
 * - mídia 56%
 * - headline média
 * - imagem humana/profissional
 * - trust strip compacto
 *
 * A IA continua responsável pelo conteúdo/variação, mas não pode trocar
 * esta arquitetura por cinematic/editorial/minimal genéricos.
 */
export function renderHeroHealthLayoutBase(context: RenderContext): string {
  const data = resolveHeroData(context);
  const image = mainImage(data);
  const secondary = secondaryImage(data);

  return `<section
    class="gc-hero gc-health-hero"
    id="hero"
    data-layout-base-id="SERVICE_HEALTH_01"
    data-hero-composition="split-professional"
  >
    <div class="gc-container gc-health-hero__inner">
      <div class="gc-health-hero__content">
        ${heroKicker(data.kicker)}
        ${heroTitle(data, context)}
        ${heroSupportingCopy(data)}
        ${heroActions(data)}
        <div class="gc-health-hero__trust">${heroTrust(data)}</div>
      </div>

      <div class="gc-health-hero__media">
        ${
          image
            ? `<figure class="gc-health-hero__figure">
                 ${imageTag(image, data.title)}
               </figure>`
            : `<div class="gc-health-hero__placeholder" aria-hidden="true"></div>`
        }

        ${
          secondary
            ? `<figure class="gc-health-hero__secondary">
                 ${imageTag(secondary, data.title, false)}
               </figure>`
            : ""
        }

        <span class="gc-health-hero__shape gc-health-hero__shape--one" aria-hidden="true"></span>
        <span class="gc-health-hero__shape gc-health-hero__shape--two" aria-hidden="true"></span>
      </div>
    </div>
  </section>`;
}

function mainImage(data: ReturnType<typeof resolveHeroData>): string {
  return String(data.image || data.images?.[0] || "").trim();
}

function secondaryImage(data: ReturnType<typeof resolveHeroData>): string {
  const main = mainImage(data);
  return String(
    data.images?.find((item) => item && item !== main) || "",
  ).trim();
}

function imageTag(url: string, title: string, eager = true): string {
  if (!url) return "";

  return `<img
    src="${escapeAttr(url)}"
    alt="${escapeAttr(title)}"
    ${eager ? 'loading="eager"' : 'loading="lazy"'}
    decoding="async"
  />`;
}