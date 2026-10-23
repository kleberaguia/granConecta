GRANCONECTA — FASE 3: VISUAL DNA + HEADLINE COMPOSITION

NOVOS ARQUIVOS
Coloque em:
src/services/template-v2/design-system/

- VisualDNAEngine.ts
- HeadlineCompositionEngine.ts
- VisualDNAStyles.ts

INTEGRAÇÃO CONTROLADA

1) Em renderTypes.ts, importe:
import type { VisualDNA } from "../design-system/VisualDNAEngine";

E adicione ao RenderContext:
visualDNA?: VisualDNA;

2) Em renderEnginev2.ts, importe:
import { VisualDNAEngine } from "../design-system/VisualDNAEngine";
import { buildVisualDNACss } from "../design-system/VisualDNAStyles";

Depois de resolver o designSystem e antes de montar context, resolva:
const visualDNA = VisualDNAEngine.resolve({
  request,
  variation,
  visualContext,
  palette,
  designSystem,
  commercialStrategy,
  compositionPlan,
} as RenderContext);

Adicione visualDNA ao context.

No <style>, DEPOIS do DesignSystemStyles/SectionLibraryStyles:
${buildVisualDNACss(context, visualDNA)}

No <body>, acrescente:
data-gc-visual-dna="${visualDNA.archetype}"
data-gc-dna-decoration="${visualDNA.decoration}"
data-gc-dna-card="${visualDNA.cardStyle}"
data-gc-dna-rhythm="${visualDNA.sectionRhythm}"

3) HERO — integração segura
Em HeroShared.ts, NÃO substitua resolveHeroData nem actionButton.
Importe:
import { HeadlineCompositionEngine } from "../../../design-system/HeadlineCompositionEngine";

Adicione:
export function heroHeadline(context: RenderContext, title: string): string {
  if (!context.visualDNA) return `<h1>${escapeHtml(title)}</h1>`;
  return HeadlineCompositionEngine.render(title, context.visualDNA);
}

Então nos HeroLuxury.ts, HeroMagazine.ts, HeroMinimal.ts, HeroService.ts,
HeroImmersive.ts, HeroMarketplace.ts e HeroFood.ts:

importe heroHeadline de HeroShared e troque APENAS:
<h1>${escapeHtml(data.title)}</h1>

por:
${heroHeadline(context, data.title)}

Não altere heroActions, data-gc-action, produtos, chat ou request-service.

IMPORTANTE SOBRE EXCLUSIVIDADE
O DNA é determinístico pelo negócio + variação. Mesmo nicho não implica mesmo DNA.
O nicho limita direções coerentes; store/business identity e variation escolhem a combinação.

BUILD
rm -rf dist
npm run build

Se compilar:
pm2 restart api-gran
