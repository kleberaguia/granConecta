import * as dotenv from "dotenv";
import path from "node:path";
import "reflect-metadata";
import { GranConectaAgentContextService } from
    "../services/agent/GranConectaAgentContextService";

import { GranConectaAgentDecisionService } from
    "../services/agent/GranConectaAgentDecisionService";

import { GranConectaAgentCommercialBridgeService } from
    "../services/agent/GranConectaAgentCommercialBridgeService";

const ENV = process.env.NODE_ENV || "development";

const envMap: Record<string, string> = {
    local: ".env.local",
    development: ".env.dev",
    production: ".env.production",
};

const envFile = envMap[ENV] || ".env.dev";

dotenv.config({
    path: path.resolve(process.cwd(), envFile),
    override: true,
});

import { AppDataSource } from "../config/data-source";


const STORE_ID =
    "b08bb3d7-dbc8-4176-8706-a01f3b5d7137";

const CONVERSATION_ID =
    "agent-bridge-test-almarse-001";

const CUSTOMER_MESSAGE =
    "Quarta-feira às 15h.";

function section(title: string): void {
    console.log("");
    console.log(
        "============================================================",
    );
    console.log(title);
    console.log(
        "============================================================",
    );
}

async function main(): Promise<void> {
    section(
        "GRANCONECTA AGENT SCHEDULING BRIDGE TEST",
    );

    console.log("NODE_ENV:", ENV);
    console.log("ENV FILE:", envFile);
    console.log("STORE_ID:", STORE_ID);
    console.log(
        "CONVERSATION_ID:",
        CONVERSATION_ID,
    );

    console.log("");
    console.log("Conectando ao banco...");

    await AppDataSource.initialize();

    console.log("Banco conectado.");

    try {
        const contextService =
            new GranConectaAgentContextService();

        const decisionService =
            new GranConectaAgentDecisionService();

        const bridgeService =
            new GranConectaAgentCommercialBridgeService();

        /**
         * ============================================================
         * 1. RELER O FLUXO REAL CRIADO PELO TESTE ANTERIOR
         * ============================================================
         */
        section(
            "CONTEXTO ANTES DA DECISÃO",
        );

        const context =
            await contextService.build({
                storeId: STORE_ID,
                conversationId:
                    CONVERSATION_ID,
            });

        console.log(
            JSON.stringify(
                {
                    store:
                        context.store?.name ??
                        null,

                    agent:
                        context.agent?.name ??
                        null,

                    commercialFlow:
                        context.commercialFlow,
                },
                null,
                2,
            ),
        );

        if (!context.commercialFlow) {
            throw new Error(
                "TEST_FAILED_COMMERCIAL_FLOW_NOT_FOUND",
            );
        }

        if (
            context.commercialFlow.state !==
            "AGUARDANDO_DATA"
        ) {
            throw new Error(
                `TEST_FAILED_EXPECTED_AGUARDANDO_DATA_RECEIVED_${context.commercialFlow.state}`,
            );
        }

        console.log("");
        console.log(
            "✅ CommercialFlow real encontrado em AGUARDANDO_DATA.",
        );

        /**
         * ============================================================
         * 2. CLIENTE INFORMA DATA + HORÁRIO
         * ============================================================
         */
        section(
            "MENSAGEM DO CLIENTE",
        );

        console.log(CUSTOMER_MESSAGE);

        /**
         * O histórico serve apenas para continuidade conversacional.
         *
         * A autoridade sobre o estado comercial vem de
         * context.commercialFlow, que foi relido do banco.
         */
        const decision =
            await decisionService.decide({
                message:
                    CUSTOMER_MESSAGE,

                context,

                conversationHistory: [
                    {
                        role: "user",
                        content:
                            "Quero fazer essa avaliação psicopedagógica. Pode marcar para mim?",
                    },
                    {
                        role: "assistant",
                        content:
                            "Ótimo! Qual dia e horário você prefere para a avaliação?",
                    },
                ],
            });

        section(
            "DECISÃO DO DOT",
        );

        console.log(
            JSON.stringify(
                decision,
                null,
                2,
            ),
        );

        /**
         * ============================================================
         * 3. VALIDAR DECISÃO
         * ============================================================
         */
        if (
            decision.commercialAction !==
            "PROVIDE_SCHEDULING_PREFERENCE"
        ) {
            throw new Error(
                `TEST_FAILED_EXPECTED_PROVIDE_SCHEDULING_PREFERENCE_RECEIVED_${decision.commercialAction}`,
            );
        }

        if (
            !decision.preferredDate
        ) {
            throw new Error(
                "TEST_FAILED_PREFERRED_DATE_NOT_PROVIDED",
            );
        }

        if (
            !decision.preferredTime
        ) {
            throw new Error(
                "TEST_FAILED_PREFERRED_TIME_NOT_PROVIDED",
            );
        }

        if (
            decision.shouldAdvanceCommercialFlow !==
            true
        ) {
            throw new Error(
                "TEST_FAILED_SHOULD_ADVANCE_COMMERCIAL_FLOW_FALSE",
            );
        }

        console.log("");
        console.log(
            "✅ DOT autorizou PROVIDE_SCHEDULING_PREFERENCE.",
        );

        console.log(
            "✅ Data interpretada pelo DOT:",
            decision.preferredDate,
        );

        console.log(
            "✅ Horário interpretado pelo DOT:",
            decision.preferredTime,
        );

        /**
         * ============================================================
         * 4. BRIDGE ENTREGA PREFERÊNCIA AO ORCHESTRATOR
         * ============================================================
         */
        section(
            "EXECUTANDO COMMERCIAL BRIDGE",
        );

        const bridgeResult =
            await bridgeService.execute({
                conversationId:
                    CONVERSATION_ID,

                storeId:
                    STORE_ID,

                // Mesmo contexto oficial usado pelo DecisionService.
                // A Bridge usará esse contexto para validar
                // permissões e isolamento do negócio.
                context,

                origem:
                    "LANDING_PAGE",

                decision,

                metadata: {
                    test: true,
                    testName:
                        "GranConectaAgentSchedulingBridge",
                },
            });

        console.log(
            JSON.stringify(
                {
                    executed:
                        bridgeResult.executed,

                    action:
                        bridgeResult.action,

                    reason:
                        bridgeResult.reason,

                    commercialResult:
                        bridgeResult.commercialResult
                            ? {
                                handled:
                                    bridgeResult
                                        .commercialResult
                                        .handled,

                                state:
                                    bridgeResult
                                        .commercialResult
                                        .state,

                                nextAction:
                                    bridgeResult
                                        .commercialResult
                                        .nextAction,

                                message:
                                    bridgeResult
                                        .commercialResult
                                        .message,

                                flowId:
                                    bridgeResult
                                        .commercialResult
                                        .flow.id,

                                catalogItemId:
                                    bridgeResult
                                        .commercialResult
                                        .flow
                                        .catalogItemId,

                                preferredDate:
                                    bridgeResult
                                        .commercialResult
                                        .flow
                                        .preferredDate,

                                preferredTime:
                                    bridgeResult
                                        .commercialResult
                                        .flow
                                        .preferredTime,

                                data:
                                    bridgeResult
                                        .commercialResult
                                        .data ??
                                    null,
                            }
                            : null,
                },
                null,
                2,
            ),
        );

        /**
         * ============================================================
         * 5. VALIDAÇÕES DO BRIDGE
         * ============================================================
         */
        section(
            "VALIDANDO BRIDGE",
        );

        if (
            !bridgeResult.executed
        ) {
            throw new Error(
                `TEST_FAILED_BRIDGE_NOT_EXECUTED_${bridgeResult.reason}`,
            );
        }

        if (
            !bridgeResult.commercialResult
        ) {
            throw new Error(
                "TEST_FAILED_COMMERCIAL_RESULT_NULL",
            );
        }

        const commercialResult =
            bridgeResult.commercialResult;

        if (
            !commercialResult.flow
                .preferredDate
        ) {
            throw new Error(
                "TEST_FAILED_FLOW_PREFERRED_DATE_NULL",
            );
        }

        if (
            !commercialResult.flow
                .preferredTime
        ) {
            throw new Error(
                "TEST_FAILED_FLOW_PREFERRED_TIME_NULL",
            );
        }

        console.log(
            "✅ Bridge enviou a preferência ao Orchestrator.",
        );

        console.log(
            "✅ Data persistida:",
            commercialResult.flow
                .preferredDate,
        );

        console.log(
            "✅ Horário persistido:",
            commercialResult.flow
                .preferredTime,
        );

        console.log(
            "✅ Estado determinado pelo backend:",
            commercialResult.state,
        );

        console.log(
            "✅ Próxima ação determinada pelo backend:",
            commercialResult.nextAction,
        );

        /**
         * ============================================================
         * 6. RELER ESTADO OFICIAL DO BANCO
         * ============================================================
         */
        section(
            "CONTEXTO APÓS EXECUÇÃO",
        );

        const contextAfter =
            await contextService.build({
                storeId:
                    STORE_ID,

                conversationId:
                    CONVERSATION_ID,
            });

        console.log(
            JSON.stringify(
                {
                    commercialFlow:
                        contextAfter
                            .commercialFlow,
                },
                null,
                2,
            ),
        );

        if (
            !contextAfter.commercialFlow
        ) {
            throw new Error(
                "TEST_FAILED_COMMERCIAL_FLOW_DISAPPEARED",
            );
        }

        if (
            !contextAfter
                .commercialFlow
                .preferredDate
        ) {
            throw new Error(
                "TEST_FAILED_PERSISTED_DATE_NULL",
            );
        }

        if (
            !contextAfter
                .commercialFlow
                .preferredTime
        ) {
            throw new Error(
                "TEST_FAILED_PERSISTED_TIME_NULL",
            );
        }

        console.log("");
        console.log(
            "✅ ContextService releu o CommercialFlow atualizado.",
        );

        console.log(
            "✅ Preferência de agendamento permaneceu persistida.",
        );

        section(
            "TESTE FINALIZADO COM SUCESSO",
        );
    } finally {
        console.log("");
        console.log(
            "Encerrando conexão com banco...",
        );

        if (
            AppDataSource.isInitialized
        ) {
            await AppDataSource.destroy();
        }

        console.log(
            "Conexão encerrada.",
        );
    }
}

main().catch(
    (error) => {
        console.error("");
        console.error(
            "❌ TESTE FALHOU",
        );

        console.error(error);

        process.exitCode = 1;
    },
);