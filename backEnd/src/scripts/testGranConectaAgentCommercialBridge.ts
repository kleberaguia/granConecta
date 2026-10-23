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

import { GranConectaAgentCommercialBridgeService } from
  "../services/agent/GranConectaAgentCommercialBridgeService";

// ============================================================
// CONFIGURAÇÃO
// ============================================================

const STORE_ID =
  "b08bb3d7-dbc8-4176-8706-a01f3b5d7137";

/**
 * ID exclusivo para este teste.
 *
 * IMPORTANTE:
 * mantenha este mesmo ID durante todo o teste,
 * porque o CommercialFlow é recuperado pela conversa.
 */
// const CONVERSATION_ID =
//   "agent-bridge-test-almarse-001";

  const CONVERSATION_ID =
  "agent-bridge-test-almarse-002";

const CUSTOMER_MESSAGE =
  "Quero fazer essa avaliação psicopedagógica. Pode marcar para mim?";

// ============================================================
// HELPERS
// ============================================================

function separator(title: string): void {
  console.log("");
  console.log(
    "============================================================",
  );
  console.log(title);
  console.log(
    "============================================================",
  );
}

// ============================================================
// TESTE
// ============================================================

async function main(): Promise<void> {
  separator(
    "GRANCONECTA AGENT COMMERCIAL BRIDGE TEST",
  );

  console.log(`NODE_ENV: ${ENV}`);
  console.log(`ENV FILE: ${envFile}`);
  console.log(`STORE_ID: ${STORE_ID}`);
  console.log(
    `CONVERSATION_ID: ${CONVERSATION_ID}`,
  );

  try {
    // ----------------------------------------------------------
    // BANCO
    // ----------------------------------------------------------

    console.log("");
    console.log("Conectando ao banco...");

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log("Banco conectado.");

    // ----------------------------------------------------------
    // 1. CONTEXTO ANTES
    // ----------------------------------------------------------

    separator("CONTEXTO ANTES DA DECISÃO");

    const contextService =
      new GranConectaAgentContextService();

    const contextBefore =
      await contextService.build({
        storeId: STORE_ID,
        conversationId: CONVERSATION_ID,
      });

    console.log(
      JSON.stringify(
        {
          store: contextBefore.store.name,
          agent: contextBefore.agent.name,
          commercialFlow:
            contextBefore.commercialFlow,
        },
        null,
        2,
      ),
    );

    // ----------------------------------------------------------
    // 2. DECISÃO DO DOT
    // ----------------------------------------------------------

    separator("MENSAGEM DO CLIENTE");

    console.log(CUSTOMER_MESSAGE);

    const decisionService =
      new GranConectaAgentDecisionService();

    const decision =
      await decisionService.decide({
        message: CUSTOMER_MESSAGE,
        context: contextBefore,
        conversationHistory: [],
      });

    separator("DECISÃO DO DOT");

    console.log(
      JSON.stringify(
        decision,
        null,
        2,
      ),
    );

    // ----------------------------------------------------------
    // VALIDAÇÃO DA DECISÃO
    // ----------------------------------------------------------

    if (
      decision.commercialAction !==
      "SELECT_ITEM"
    ) {
      throw new Error(
        `TEST_EXPECTED_SELECT_ITEM_BUT_RECEIVED_${decision.commercialAction}`,
      );
    }

    if (!decision.catalogItemId) {
      throw new Error(
        "TEST_SELECT_ITEM_WITHOUT_CATALOG_ITEM_ID",
      );
    }

    if (
      decision.shouldAdvanceCommercialFlow !==
      true
    ) {
      throw new Error(
        "TEST_EXPECTED_COMMERCIAL_FLOW_ADVANCE",
      );
    }

    console.log("");
    console.log(
      "✅ DOT autorizou SELECT_ITEM.",
    );

    // ----------------------------------------------------------
    // 3. EXECUTAR BRIDGE
    // ----------------------------------------------------------

    separator("EXECUTANDO COMMERCIAL BRIDGE");

    const bridgeService =
      new GranConectaAgentCommercialBridgeService();

    const bridgeResult =
      await bridgeService.execute({
        conversationId: CONVERSATION_ID,

        storeId: STORE_ID,

        // Contexto oficial usado pelo DOT.
        // A Bridge poderá validar permissões e isolamento
        // do negócio antes de tocar no Orchestrator.
        context: contextBefore,

        origem: "LANDING_PAGE",

        decision,

        metadata: {
          test: true,
          testName:
            "GranConectaAgentCommercialBridge",
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
                      .flow
                      .id,

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
                }
              : null,
        },
        null,
        2,
      ),
    );

    // ----------------------------------------------------------
    // 4. VALIDAÇÃO DO BRIDGE
    // ----------------------------------------------------------

    separator("VALIDANDO BRIDGE");

    if (!bridgeResult.executed) {
      throw new Error(
        `TEST_BRIDGE_NOT_EXECUTED_${bridgeResult.reason}`,
      );
    }

    const commercialResult =
      bridgeResult.commercialResult;

    if (!commercialResult) {
      throw new Error(
        "TEST_COMMERCIAL_RESULT_REQUIRED",
      );
    }

    if (
      commercialResult.flow.catalogItemId !==
      decision.catalogItemId
    ) {
      throw new Error(
        "TEST_COMMERCIAL_FLOW_WRONG_CATALOG_ITEM",
      );
    }

    if (
      commercialResult.nextAction !==
      "ASK_DATE"
    ) {
      throw new Error(
        `TEST_EXPECTED_ASK_DATE_BUT_RECEIVED_${commercialResult.nextAction}`,
      );
    }

    console.log(
      "✅ Bridge executou SELECT_ITEM.",
    );

    console.log(
      "✅ CommercialFlow recebeu o item correto.",
    );

    console.log(
      "✅ Backend determinou ASK_DATE.",
    );

    // ----------------------------------------------------------
    // 5. RELER CONTEXTO DO BANCO
    // ----------------------------------------------------------

    separator(
      "CONTEXTO APÓS EXECUÇÃO",
    );

    const contextAfter =
      await contextService.build({
        storeId: STORE_ID,
        conversationId:
          CONVERSATION_ID,
      });

    console.log(
      JSON.stringify(
        {
          commercialFlow:
            contextAfter.commercialFlow,
        },
        null,
        2,
      ),
    );

    if (!contextAfter.commercialFlow) {
      throw new Error(
        "TEST_COMMERCIAL_FLOW_NOT_FOUND_AFTER_BRIDGE",
      );
    }

    if (
      contextAfter
        .commercialFlow
        .catalogItemId !==
      decision.catalogItemId
    ) {
      throw new Error(
        "TEST_CONTEXT_DID_NOT_PERSIST_SELECTED_ITEM",
      );
    }

    console.log("");
    console.log(
      "✅ ContextService releu o CommercialFlow real do banco.",
    );

    console.log(
      "✅ Item selecionado permaneceu persistido.",
    );

    separator(
      "TESTE FINALIZADO COM SUCESSO",
    );
  } catch (error) {
    separator("TESTE FALHOU");

    console.error(
      error instanceof Error
        ? error.stack ||
            error.message
        : error,
    );

    process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) {
      console.log("");
      console.log(
        "Encerrando conexão com banco...",
      );

      await AppDataSource.destroy();

      console.log(
        "Conexão encerrada.",
      );
    }
  }
}

main();