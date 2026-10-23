import type {
    CtaAction,
    NormalizedTemplateRequest,
    TemplateGenerationV2Result,
} from "./TemplateTypes";

import { CommercialCreativeDirectionResolver } from "./CommercialCreativeDirectionResolver";
import { CommercialLandingStrategyResolver } from "./CommercialLandingStrategyResolver";
import { LandingCompositionResolver } from "./LandingCompositionResolver";
import { TemplateVariationResolver } from "./TemplateVariationResolver";
import { TemplateVisualContextResolver } from "./TemplateVisualContextResolver";
import { TemplateBrandPaletteResolver } from "./TemplateBrandPaletteResolver";
import { RenderEngineV2 } from "./render-engine/renderEnginev2";

export class TemplateGenerationOrchestrator {
    async generate(
        request: NormalizedTemplateRequest,
    ): Promise<TemplateGenerationV2Result> {
        /**
         * 1. Resolve a estratégia comercial.
         *
         * Aqui decidimos O QUE a landing precisa converter:
         * orçamento, conversa, catálogo, venda, agendamento etc.
         */
        const commercialStrategy =
            CommercialLandingStrategyResolver.resolve(request);

        const requestWithStrategy: NormalizedTemplateRequest = {
            ...request,
            commercialStrategy,
        };

        /**
         * 2. Resolve a variação visual selecionada.
         *
         * A variação continua existindo como família/base visual.
         */
        const variation =
            TemplateVariationResolver.resolve(requestWithStrategy);

        /**
         * 3. Resolve a direção criativa.
         *
         * Aqui decidimos COMO a estratégia comercial deve ganhar forma:
         * arquétipo, hero, ritmo, about, benefícios, prova, FAQ, contato etc.
         */
        const creativeDirection =
            CommercialCreativeDirectionResolver.resolve(
                requestWithStrategy,
                variation,
            );

        /**
         * 4. Enriquece o request com as duas camadas:
         * - commercialStrategy
         * - creativeDirection
         *
         * Isso permite que qualquer renderer/section leia a mesma decisão
         * central sem criar regras paralelas por nicho.
         */
        const requestWithCreativeDirection: NormalizedTemplateRequest = {
            ...requestWithStrategy,
            creativeDirection,
        };

        /**
         * 5. Resolve a composição macro da landing.
         *
         * Aqui deixamos de tratar a página como uma simples lista de seções.
         * O plano cria cenas: hero-stage, offer bridge, story, trust,
         * conversion e closing.
         */
        const compositionPlan =
            LandingCompositionResolver.resolve(
                requestWithCreativeDirection,
                variation,
            );

        const requestWithComposition: NormalizedTemplateRequest = {
            ...requestWithCreativeDirection,
            compositionPlan,
        };

        /**
         * 6. Resolve o contexto visual já com estratégia, direção criativa
         * e composição disponíveis.
         */
        const visualContext =
            TemplateVisualContextResolver.resolve(
                requestWithComposition,
            );

        /**
         * 7. Resolve a identidade cromática da página.
         * CUSTOM respeita as cores do usuário; AI analisa os materiais reais,
         * priorizando as imagens HERO selecionadas pelo contexto visual.
         */
        const resolvedBrandPalette = await TemplateBrandPaletteResolver.resolve({
            request: requestWithComposition,
            variation,
            visualContext,
        });

        const requestWithPalette: NormalizedTemplateRequest = {
            ...requestWithComposition,
            resolvedBrandPalette,
        };

        /**
         * 8. Renderiza a landing por grupos de composição.
         */
        const html = RenderEngineV2.render({
            request: requestWithPalette,
            variation,
            visualContext,
            commercialStrategy,
            creativeDirection,
            compositionPlan,
        });

        const defaultActions: CtaAction[] =
            requestWithComposition.pageKind === "loja"
                ? [
                    "open-products",
                    "open-offers",
                    "open-combos",
                    "add-to-cart",
                    "add-to-wishlist",
                    "open-chat",
                    "open-whatsapp",
                ]
                : [
                    "open-service",
                    "request-quote",
                    "open-chat",
                    "open-whatsapp",
                    "contact",
                ];

        const strategyActions: CtaAction[] = [
            commercialStrategy.primaryAction,
            ...(commercialStrategy.secondaryAction
                ? [commercialStrategy.secondaryAction]
                : []),
        ];

        const actions: CtaAction[] = unique<CtaAction>([
            ...strategyActions,
            variation.primaryAction,
            variation.secondaryAction,
            ...defaultActions,
        ]);

        const resolvedSections = compositionPlan.sectionOrder;

        return {
            success: true,
            html,
            landingData: {
                templateName: requestWithComposition.templateName,
                layoutEstruturaId:
                    requestWithComposition.layoutEstruturaId,
                renderer: "renderer-v2",
                generationMode:
                    requestWithComposition.generationMode,
                pageKind: requestWithComposition.pageKind,
                businessName: requestWithComposition.businessName,
                businessSegment:
                    requestWithComposition.businessSegment,
                variationIndex: variation.variationIndex,
                family: variation.family,
                visualContext,
                resolvedBrandPalette,
                sections: resolvedSections,
                actions,
                commercialStrategy,
                creativeDirection,
                compositionPlan,
            },
        };
    }
}

function unique<T>(items: readonly T[]): T[] {
    return [...new Set<T>(items)];
}