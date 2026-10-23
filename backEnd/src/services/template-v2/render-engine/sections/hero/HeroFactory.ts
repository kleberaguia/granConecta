import type { RenderContext } from "../../renderTypes";
import { renderHeroFood } from "./HeroFood";
import { renderHeroImmersive } from "./HeroImmersive";
import { renderHeroLuxury } from "./HeroLuxury";
import { renderHeroMagazine } from "./HeroMagazine";
import { renderHeroMarketplace } from "./HeroMarketplace";
import { renderHeroMinimal } from "./HeroMinimal";
import { renderHeroService } from "./HeroService";

/**
 * Hero Factory V3
 *
 * Prioridade visual:
 * 1. Visual DNA — identidade estável do negócio + variação.
 * 2. Design System V2 — fallback.
 * 3. Direção criativa explícita.
 * 4. Família/heroStyle/segmento — comportamento legado.
 *
 * A estratégia comercial continua responsável por CTA/objetivo.
 * O HeroFactory escolhe somente a composição visual.
 */
export function renderHeroByContext(context: RenderContext): string {
  const family = context.variation.family;
  const heroStyle = context.variation.heroStyle;

  const themeKey = [
    context.visualContext.themeName,
    context.visualContext.businessSegment,
    context.visualContext.categoryName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const requestedHeroVariant =
    context.request.creativeDirection?.heroVariant;

  const visualDNA = context.visualDNA;
  const designComposition = context.designSystem?.heroComposition;

  /**
   * SERVICE_PREMIUM_WARM V1
   *
   * Serviço precisa de coerência de página inteira. Por isso, nesta primeira
   * direção premium, o HeroService é escolhido antes do Visual DNA.
   * Loja continua exatamente no fluxo existente abaixo.
   */
  if (context.request.pageKind === "servico") {
    // HeroService mantém as composições próprias de serviço e não deixa o DNA de loja sobrescrevê-las.
    return renderHeroService(context);
  }

  /**
   * V3 — Visual DNA tem prioridade sobre a família visual.
   *
   * Importante:
   * - não inventa imagem;
   * - não altera CTA;
   * - não altera dados comerciais;
   * - apenas escolhe uma composição existente e segura.
   */
  if (visualDNA) {
    const dnaHero = renderHeroFromVisualDNA(context);

    if (dnaHero) {
      return dnaHero;
    }
  }

  /**
   * V2 — Design System.
   * Mantido como fallback para páginas sem Visual DNA ou quando a
   * composição escolhida pelo DNA não puder ser renderizada.
   */
  if (designComposition === "cinematic-cover") {
    const immersive = renderHeroImmersive(context);

    if (immersive) {
      return immersive;
    }
  }

  if (
    designComposition === "catalog-dynamic" &&
    context.request.pageKind === "loja"
  ) {
    return renderHeroMarketplace(context);
  }

  if (designComposition === "minimal-stage") {
    return renderHeroMinimal(context);
  }

  if (
    designComposition === "portrait-story" &&
    family === "magazine-story"
  ) {
    return renderHeroMagazine(context);
  }

  /**
   * Direção criativa explícita continua funcionando.
   */
  if (requestedHeroVariant === "immersive-cover") {
    const immersive = renderHeroImmersive(context);

    if (immersive) {
      return immersive;
    }
  }

  /**
   * A estratégia comercial define CTA/objetivo.
   * A família visual define a composição.
   *
   * Não forçamos todas as páginas de serviço para HeroService.
   */
  // if (context.request.pageKind === "servico") {
  //   if (family === "magazine-story" || heroStyle === "magazine") {
  //     return renderHeroMagazine(context);
  //   }

  //   if (
  //     family === "minimal-premium" ||
  //     heroStyle === "center" ||
  //     heroStyle === "minimal"
  //   ) {
  //     return renderHeroMinimal(context);
  //   }

  //   if (family === "conversion-sales" || heroStyle === "dark") {
  //     return renderHeroService(context);
  //   }

  //   return renderHeroLuxury(context);
  // }

  if (isFoodTheme(themeKey)) {
    return renderHeroFood(context);
  }

  if (
    family === "marketplace-grid" ||
    heroStyle === "catalog" ||
    themeKey.includes("auto") ||
    themeKey.includes("calcado") ||
    themeKey.includes("calçado") ||
    themeKey.includes("sneaker") ||
    themeKey.includes("commerce")
  ) {
    return renderHeroMarketplace(context);
  }

  if (family === "magazine-story" || heroStyle === "magazine") {
    return renderHeroMagazine(context);
  }

  if (
    family === "minimal-premium" ||
    heroStyle === "center" ||
    heroStyle === "minimal"
  ) {
    return renderHeroMinimal(context);
  }

  return renderHeroLuxury(context);
}

/**
 * Traduz o DNA visual para as composições profissionais que já existem.
 *
 * Nesta primeira integração estrutural do V3, evitamos criar HTML arbitrário.
 * O DNA escolhe entre renderers maduros e já integrados aos CTAs semânticos,
 * Multi-Hero, produtos reais e responsividade.
 */
function renderHeroFromVisualDNA(context: RenderContext): string {
  const dna = context.visualDNA;

  if (!dna) {
    return "";
  }

  switch (dna.heroComposition) {
    /**
     * Full bleed/cinemático.
     * HeroImmersive retorna string vazia quando não existe uma imagem real
     * adequada; nesse caso fazemos fallback seguro.
     */
    case "cinematic-cover":
    case "bottom-left-cover": {
      const immersive = renderHeroImmersive(context);

      if (immersive) {
        return immersive;
      }

      return context.request.pageKind === "servico"
        ? renderHeroService(context)
        : renderHeroLuxury(context);
    }

    /**
     * Editorial assimétrico / imagem dominante + imagem secundária.
     */
    case "asymmetric-overlap":
    case "editorial-split":
      return renderHeroLuxury(context);

    /**
     * Narrativa editorial e retratos.
     */
    case "portrait-stage":
    case "magazine-overlap":
      return renderHeroMagazine(context);

    /**
     * Composição limpa e espaçada.
     */
    case "minimal-stage":
      return renderHeroMinimal(context);

    /**
     * Loja: produtos reais em composição.
     * Serviço: não existe catálogo de produto como premissa visual, então
     * usamos HeroService para preservar o contexto comercial correto.
     */
    case "product-collage":
      return context.request.pageKind === "loja"
        ? renderHeroMarketplace(context)
        : renderHeroService(context);

    default:
      return "";
  }
}

function isFoodTheme(themeKey: string): boolean {
  return (
    themeKey.includes("hamburg") ||
    themeKey.includes("pizza") ||
    themeKey.includes("acai") ||
    themeKey.includes("açaí") ||
    themeKey.includes("doce") ||
    themeKey.includes("bebida")
  );
}