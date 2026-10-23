import {
    CommercialConversionOrchestrator,
    CommercialConversionResult,
} from "../commercial/CommercialConversionOrchestrator";
import { GranConectaAgentContext } from "./GranConectaAgentContextService";

import {
    GranConectaAgentDecision,
} from "./GranConectaAgentDecisionService";

export type GranConectaAgentCommercialBridgeInput = {
    conversationId: string;
    storeId: string;

    context: GranConectaAgentContext;

    opportunityId?: string | null;
    customerUserId?: string | null;
    customerName?: string | null;
    customerEmail?: string | null;
    customerPhone?: string | null;
    customerPassword?: string | null;

    origem?:
    | "WHATSAPP"
    | "INSTAGRAM"
    | "FACEBOOK"
    | "LANDING_PAGE"
    | "CHAT_HOME"
    | "OUTRO";

    decision: GranConectaAgentDecision;

    metadata?: Record<string, unknown> | null;
};

export type GranConectaAgentCommercialBridgeResult = {
    executed: boolean;

    action:
    GranConectaAgentDecision["commercialAction"];

    commercialResult:
    CommercialConversionResult | null;

    reason: string | null;
};

/**
 * ============================================================
 * GRANCONECTA AGENT COMMERCIAL BRIDGE
 * ============================================================
 *
 * Responsabilidade:
 *
 * traduzir decisões comerciais autorizadas do Agente
 * GranConecta para o CommercialConversionOrchestrator.
 *
 * IMPORTANTE:
 *
 * - o agente interpreta a conversa;
 * - esta ponte controla quais ações podem ser executadas;
 * - o Orchestrator continua sendo a autoridade comercial;
 * - disponibilidade, preço, pagamento e agenda NÃO são
 *   decididos pela IA.
 */
export class GranConectaAgentCommercialBridgeService {
    private readonly orchestrator =
        new CommercialConversionOrchestrator();

    async execute(
        input: GranConectaAgentCommercialBridgeInput,
    ): Promise<GranConectaAgentCommercialBridgeResult> {
        const conversationId =
            String(input.conversationId || "").trim();

        const storeId =
            String(input.storeId || "").trim();

        if (!conversationId) {
            throw new Error(
                "GRANCONECTA_AGENT_BRIDGE_CONVERSATION_ID_REQUIRED",
            );
        }

        if (!storeId) {
            throw new Error(
                "GRANCONECTA_AGENT_BRIDGE_STORE_ID_REQUIRED",
            );
        }

        if (!input.decision) {
            throw new Error(
                "GRANCONECTA_AGENT_BRIDGE_DECISION_REQUIRED",
            );
        }

        const decision = input.decision;

        const context = input.context;

        const contextStoreId =
            String(context?.store?.id || "").trim();

        const agentStoreId =
            String(context?.agent?.storeId || "").trim();

        if (!contextStoreId || !agentStoreId) {
            return {
                executed: false,
                action: decision.commercialAction,
                commercialResult: null,
                reason:
                    "AGENT_CONTEXT_STORE_NOT_AVAILABLE",
            };
        }

        if (
            storeId !== contextStoreId ||
            storeId !== agentStoreId
        ) {
            return {
                executed: false,
                action: decision.commercialAction,
                commercialResult: null,
                reason:
                    "AGENT_STORE_CONTEXT_MISMATCH",
            };
        }

        // O contexto deve pertencer à conversa em atendimento.
        const contextConversationId = String(context.conversation?.id || "").trim();
        if (contextConversationId && contextConversationId !== conversationId) {
            return {
                executed: false,
                action: decision.commercialAction,
                commercialResult: null,
                reason: "AGENT_CONVERSATION_CONTEXT_MISMATCH",
            };
        }

        if (context.commercialFlow && (
            String(context.commercialFlow.conversationId || "").trim() !== conversationId ||
            String(context.commercialFlow.storeId || "").trim() !== storeId
        )) {
            return {
                executed: false,
                action: decision.commercialAction,
                commercialResult: null,
                reason: "AGENT_COMMERCIAL_FLOW_CONTEXT_MISMATCH",
            };
        }

        const requestedOpportunityId = String(input.opportunityId || "").trim();
        if (requestedOpportunityId && context.opportunity?.id &&
            requestedOpportunityId !== context.opportunity.id) {
            return {
                executed: false,
                action: decision.commercialAction,
                commercialResult: null,
                reason: "AGENT_OPPORTUNITY_CONTEXT_MISMATCH",
            };
        }

        const actionsThatAdvanceCommercialFlow:
            GranConectaAgentDecision["commercialAction"][] = [
                "SELECT_ITEM",
                "PROVIDE_SCHEDULING_PREFERENCE",
                "CONFIRM_PURCHASE",
            ];

        const requiresCommercialFlowPermission =
            actionsThatAdvanceCommercialFlow.includes(
                decision.commercialAction,
            );

        if (
            requiresCommercialFlowPermission &&
            context.agent.permissions
                .canAdvanceCommercialFlow !== true
        ) {
            return {
                executed: false,
                action: decision.commercialAction,
                commercialResult: null,
                reason:
                    "AGENT_NOT_AUTHORIZED_TO_ADVANCE_COMMERCIAL_FLOW",
            };
        }

        // A decisão normalizada precisa autorizar explicitamente a transição.
        if (requiresCommercialFlowPermission && decision.shouldAdvanceCommercialFlow !== true) {
            return {
                executed: false,
                action: decision.commercialAction,
                commercialResult: null,
                reason: "AGENT_DECISION_DID_NOT_AUTHORIZE_ADVANCE",
            };
        }

        switch (decision.commercialAction) {
            /**
             * ========================================================
             * NENHUMA AÇÃO
             * ========================================================
             *
             * Conversa consultiva.
             *
             * Ex.:
             * - "quanto custa?"
             * - "como funciona?"
             * - "qual a duração?"
             *
             * Não toca no motor comercial.
             */
            case "NONE":
                return {
                    executed: false,
                    action: decision.commercialAction,
                    commercialResult: null,
                    reason: "NO_COMMERCIAL_ACTION_REQUIRED",
                };

            /**
             * ========================================================
             * SELEÇÃO DE ITEM
             * ========================================================
             */
            case "SELECT_ITEM": {
                const catalogItemId =
                    String(
                        decision.catalogItemId || "",
                    ).trim();

                if (!catalogItemId) {
                    return {
                        executed: false,
                        action: decision.commercialAction,
                        commercialResult: null,
                        reason:
                            "SELECT_ITEM_WITHOUT_CATALOG_ITEM_ID",
                    };
                }

                if (!context.catalog.some((item) => item.id === catalogItemId)) {
                    return {
                        executed: false,
                        action: decision.commercialAction,
                        commercialResult: null,
                        reason: "SELECT_ITEM_NOT_IN_OFFICIAL_CATALOG",
                    };
                }

                // const commercialResult =
                //     await this.orchestrator.process({
                //         conversationId,
                //         storeId,

                //         opportunityId:
                //             input.opportunityId || null,

                //         customerUserId:
                //             input.customerUserId || null,

                //         catalogItemId,
                //         customerName:
                //             input.customerName || null,

                //         customerEmail:
                //             input.customerEmail || null,

                //         customerPhone:
                //             input.customerPhone || null,

                //         customerPassword:
                //             input.customerPassword || null,

                //         origem:
                //             input.origem || "LANDING_PAGE",

                //         metadata:
                //             this.buildMetadata(input),
                //     });
                const commercialResult = await this.orchestrator.process({
                    conversationId,
                    storeId,
                    opportunityId: input.opportunityId || null,
                    customerUserId: input.customerUserId || null,

                    catalogItemId,

                    preferredDate: decision.preferredDate || null,
                    preferredTime: decision.preferredTime || null,

                    customerName: input.customerName || null,
                    customerEmail: input.customerEmail || null,
                    customerPhone: input.customerPhone || null,
                    customerPassword: input.customerPassword || null,

                    origem: input.origem || "LANDING_PAGE",
                    metadata: this.buildMetadata(input),
                });

                return {
                    executed: true,
                    action: decision.commercialAction,
                    commercialResult,
                    reason: null,
                };
            }

            /**
             * ========================================================
             * PREFERÊNCIA DE AGENDA
             * ========================================================
             *
             * A IA somente extrai a preferência.
             *
             * Quem:
             * - interpreta/normaliza a data;
             * - aplica regra semanal;
             * - verifica disponibilidade;
             * - decide próximo passo
             *
             * é o CommercialConversionOrchestrator.
             */
            case "PROVIDE_SCHEDULING_PREFERENCE": {
                const flow = context.commercialFlow;
                const schedulingStates = [
                    "AGUARDANDO_DATA",
                    "AGUARDANDO_HORARIO",
                    "HORARIO_INDISPONIVEL",
                ];
                if (!flow?.catalogItemId ||
                    !schedulingStates.includes(String(flow.state || "").toUpperCase()) ||
                    !context.catalog.some((item) => item.id === flow.catalogItemId)) {
                    return {
                        executed: false,
                        action: decision.commercialAction,
                        commercialResult: null,
                        reason: "SCHEDULING_FLOW_NOT_READY",
                    };
                }

                const preferredDate =
                    decision.preferredDate || null;

                const preferredTime =
                    decision.preferredTime || null;

                if (
                    !preferredDate &&
                    !preferredTime
                ) {
                    return {
                        executed: false,
                        action: decision.commercialAction,
                        commercialResult: null,
                        reason:
                            "SCHEDULING_PREFERENCE_NOT_PROVIDED",
                    };
                }

                const commercialResult =
                    await this.orchestrator.process({
                        conversationId,
                        storeId,

                        opportunityId:
                            input.opportunityId || null,

                        customerUserId:
                            input.customerUserId || null,

                        customerName:
                            input.customerName || null,

                        customerEmail:
                            input.customerEmail || null,

                        customerPhone:
                            input.customerPhone || null,

                        customerPassword:
                            input.customerPassword || null,


                        preferredDate,
                        preferredTime,

                        origem:
                            input.origem || "LANDING_PAGE",

                        metadata:
                            this.buildMetadata(input),
                    });

                return {
                    executed: true,
                    action: decision.commercialAction,
                    commercialResult,
                    reason: null,
                };
            }

            /**
             * ========================================================
             * CONFIRMAÇÃO DE COMPRA
             * ========================================================
             *
             * Só chega aqui quando o DecisionService entendeu uma
             * confirmação explícita do cliente.
             *
             * Ainda assim, quem prepara pagamento é o backend.
             */
            case "CONFIRM_PURCHASE": {
                if (
                    decision.customerConfirmed !== true
                ) {
                    return {
                        executed: false,
                        action: decision.commercialAction,
                        commercialResult: null,
                        reason:
                            "PURCHASE_NOT_EXPLICITLY_CONFIRMED",
                    };
                }

                if (!context.commercialFlow ||
                    String(context.commercialFlow.state || "").toUpperCase() !==
                        "AGUARDANDO_CONFIRMACAO_COMPRA") {
                    return {
                        executed: false,
                        action: decision.commercialAction,
                        commercialResult: null,
                        reason: "PURCHASE_CONFIRMATION_FLOW_NOT_READY",
                    };
                }

                const commercialResult =
                    await this.orchestrator.process({


                        conversationId,
                        storeId,

                        opportunityId:
                            input.opportunityId || null,

                        customerUserId:
                            input.customerUserId || null,

                        catalogItemId:
                            String(decision.catalogItemId || "").trim() || undefined,

                        customerName:
                            input.customerName || null,

                        customerEmail:
                            input.customerEmail || null,

                        customerPhone:
                            input.customerPhone || null,

                        customerPassword:
                            input.customerPassword || null,

                        customerConfirmed: true,

                        origem:
                            input.origem || "LANDING_PAGE",

                        metadata:
                            this.buildMetadata(input),
                    });

                return {
                    executed: true,
                    action: decision.commercialAction,
                    commercialResult,
                    reason: null,
                };
            }

            /**
             * ========================================================
             * REJEIÇÃO
             * ========================================================
             *
             * Ainda NÃO temos uma operação explícita e validada
             * no Orchestrator para rejeitar/cancelar a contratação.
             *
             * Fail closed:
             * não executamos nada.
             */
            case "REJECT_PURCHASE":
                return {
                    executed: false,
                    action: decision.commercialAction,
                    commercialResult: null,
                    reason:
                        "REJECT_PURCHASE_NOT_CONNECTED_YET",
                };

            /**
             * ========================================================
             * ATENDIMENTO HUMANO
             * ========================================================
             *
             * Handoff pertence ao sistema de atendimento humano,
             * não ao motor de conversão.
             */
            case "REQUEST_HUMAN_HANDOFF":
                return {
                    executed: false,
                    action: decision.commercialAction,
                    commercialResult: null,
                    reason:
                        "HUMAN_HANDOFF_REQUIRES_CHAT_SERVICE",
                };

            /**
             * ========================================================
             * SEGURANÇA
             * ========================================================
             *
             * Se no futuro surgir uma nova ação e ela não estiver
             * explicitamente autorizada aqui, nada será executado.
             */
            default:
                return {
                    executed: false,
                    action: decision.commercialAction,
                    commercialResult: null,
                    reason:
                        "COMMERCIAL_ACTION_NOT_AUTHORIZED",
                };
        }
    }

    private buildMetadata(
        input: GranConectaAgentCommercialBridgeInput,
    ): Record<string, unknown> {
        return {
            ...(input.metadata || {}),

            granConectaAgent: true,

            agentCommercialAction:
                input.decision.commercialAction,

            agentIntent:
                input.decision.intent,

            agentConfidence:
                input.decision.confidence,
        };
    }
}

export default GranConectaAgentCommercialBridgeService;