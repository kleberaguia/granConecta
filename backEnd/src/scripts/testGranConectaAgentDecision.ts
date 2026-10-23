import * as dotenv from "dotenv";
import path from "node:path";
import "reflect-metadata";

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

import { GranConectaAgentContextService } from
    "../services/agent/GranConectaAgentContextService";

import { GranConectaAgentDecisionService } from
    "../services/agent/GranConectaAgentDecisionService";

// ============================================================
// CONFIGURAÇÃO DO TESTE
// ============================================================

const STORE_ID =
    "b08bb3d7-dbc8-4176-8706-a01f3b5d7137";

// const CUSTOMER_MESSAGE =
//     "Olá, gostaria de saber como funciona a avaliação psicopedagógica e quanto custa.";

// const CUSTOMER_MESSAGE =
// "Quero fazer essa avaliação psicopedagógica. Pode marcar para mim?";

const CUSTOMER_MESSAGE =
    "Quarta-feira às 15h.";

// ============================================================
// HELPERS
// ============================================================

function separator(title: string): void {
    console.log("");
    console.log("============================================================");
    console.log(title);
    console.log("============================================================");
}

// ============================================================
// TEST
// ============================================================

async function main(): Promise<void> {
    separator("GRANCONECTA AGENT DECISION TEST");

    console.log(`NODE_ENV: ${ENV}`);
    console.log(`ENV FILE: ${envFile}`);

    try {
        console.log("");
        console.log("Conectando ao banco...");

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        console.log("Banco conectado.");

        // --------------------------------------------------------
        // 1. MONTAR CONTEXTO REAL
        // --------------------------------------------------------

        separator("MONTANDO CONTEXTO");

        const contextService =
            new GranConectaAgentContextService();

        const context = await contextService.build({
            storeId: STORE_ID,
        });

        console.log(`Store: ${context.store.name}`);
        console.log(`Agente: ${context.agent.name}`);
        console.log(
            `Itens no catálogo: ${context.catalog.length}`
        );

        // --------------------------------------------------------
        // 2. MENSAGEM DO CLIENTE
        // --------------------------------------------------------

        separator("MENSAGEM DO CLIENTE");

        console.log(CUSTOMER_MESSAGE);

        // --------------------------------------------------------
        // 3. DECISÃO DO AGENTE
        // --------------------------------------------------------

        separator("DECISÃO DO AGENTE");

        const decisionService =
            new GranConectaAgentDecisionService();

        const decision = await decisionService.decide({
            message: CUSTOMER_MESSAGE,
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
                        "Ótimo! A avaliação psicopedagógica inicial tem duração de 60 minutos. Para prosseguirmos, você pode me informar uma data e horário que gostaria para agendar?",
                },
            ],
        });

        console.log(
            JSON.stringify(
                decision,
                null,
                2
            )
        );

        // --------------------------------------------------------
        // 4. VALIDAÇÕES BÁSICAS
        // --------------------------------------------------------

        separator("VALIDAÇÕES");

        const evaluationItem =
            context.catalog.find(
                (item) =>
                    item.name
                        .toLowerCase()
                        .includes(
                            "avaliação psicopedagógica"
                        )
            );

        if (!evaluationItem) {
            throw new Error(
                "TEST_EXPECTED_CATALOG_ITEM_NOT_FOUND"
            );
        }

        console.log(
            `Item esperado: ${evaluationItem.name}`
        );

        console.log(
            `Preço oficial: R$ ${evaluationItem.currentPrice
                .toFixed(2)
                .replace(".", ",")}`
        );

        console.log(
            `Duração oficial: ${evaluationItem.durationMinutes ?? "-"
            } minutos`
        );

        if (
            decision.catalogItemId &&
            decision.catalogItemId !== evaluationItem.id
        ) {
            throw new Error(
                "TEST_DECISION_SELECTED_WRONG_CATALOG_ITEM"
            );
        }

        if (decision.shouldAdvanceCommercialFlow) {
            throw new Error(
                "TEST_DECISION_ADVANCED_FLOW_WITHOUT_PURCHASE_INTENT"
            );
        }

        if (
            decision.commercialAction !== "NONE"
        ) {
            throw new Error(
                `TEST_UNEXPECTED_COMMERCIAL_ACTION_${decision.commercialAction}`
            );
        }

        console.log("");
        console.log(
            "✅ O agente não avançou o fluxo comercial."
        );

        console.log(
            "✅ Nenhuma ação comercial foi executada."
        );

        if (decision.catalogItemId) {
            console.log(
                "✅ O agente associou a conversa ao item correto do catálogo."
            );
        }

        // --------------------------------------------------------
        // RESULTADO
        // --------------------------------------------------------

        separator("TESTE FINALIZADO COM SUCESSO");
    } catch (error) {
        separator("TESTE FALHOU");

        console.error(
            error instanceof Error
                ? error.stack || error.message
                : error
        );

        process.exitCode = 1;
    } finally {
        if (AppDataSource.isInitialized) {
            console.log("");
            console.log(
                "Encerrando conexão com banco..."
            );

            await AppDataSource.destroy();

            console.log(
                "Conexão encerrada."
            );
        }
    }
}

main();