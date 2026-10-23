import * as dotenv from "dotenv";
import path from "node:path";
import "reflect-metadata";

const ENV =
  process.env.NODE_ENV || "development";

const envMap: Record<string, string> = {
  local: ".env.local",
  development: ".env.dev",
  production: ".env.production",
};

const envFile =
  envMap[ENV] || ".env.dev";

dotenv.config({
  path: path.resolve(
    process.cwd(),
    envFile,
  ),
  override: true,
});

import { AppDataSource } from
  "../config/data-source";

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
 * Usamos uma conversa exclusiva para o teste negativo.
 *
 * A Bridge deverá bloquear antes de chegar
 * ao CommercialConversionOrchestrator.
 */
const CONVERSATION_ID =
  "agent-bridge-security-test-almarse-001";

const CUSTOMER_MESSAGE =
  "Quero fazer essa avaliação psicopedagógica.";

// ============================================================
// HELPERS
// ============================================================

function separator(
  title: string,
): void {
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
    "GRANCONECTA AGENT COMMERCIAL BRIDGE SECURITY TEST",
  );

  console.log(
    `NODE_ENV: ${ENV}`,
  );

  console.log(
    `ENV FILE: ${envFile}`,
  );

  console.log(
    `STORE_ID: ${STORE_ID}`,
  );

  console.log(
    `CONVERSATION_ID: ${CONVERSATION_ID}`,
  );

  try {
    // ----------------------------------------------------------
    // BANCO
    // ----------------------------------------------------------

    console.log("");
    console.log(
      "Conectando ao banco...",
    );

    if (
      !AppDataSource.isInitialized
    ) {
      await AppDataSource.initialize();
    }

    console.log(
      "Banco conectado.",
    );

    // ----------------------------------------------------------
    // 1. CONTEXTO OFICIAL
    // ----------------------------------------------------------

    separator(
      "CONTEXTO OFICIAL",
    );

    const contextService =
      new GranConectaAgentContextService();

    const context =
      await contextService.build({
        storeId: STORE_ID,
        conversationId:
          CONVERSATION_ID,
      });

    console.log(
      JSON.stringify(
        {
          storeId:
            context.store.id,

          agentId:
            context.agent.id,

          agentName:
            context.agent.name,

          agentStoreId:
            context.agent.storeId,

          canAdvanceCommercialFlow:
            context.agent.permissions
              .canAdvanceCommercialFlow,

          commercialFlow:
            context.commercialFlow,
        },
        null,
        2,
      ),
    );

    // ----------------------------------------------------------
    // 2. DECISÃO COM PERMISSÃO REAL
    // ----------------------------------------------------------
    //
    // Primeiro deixamos o DOT decidir normalmente.
    //
    // Assim garantimos que temos uma decisão comercial válida
    // antes de simular a remoção da permissão na Bridge.
    // ----------------------------------------------------------

    separator(
      "DECISÃO DO DOT",
    );

    console.log(
      CUSTOMER_MESSAGE,
    );

    const decisionService =
      new GranConectaAgentDecisionService();

    const decision =
      await decisionService.decide({
        message:
          CUSTOMER_MESSAGE,

        context,

        conversationHistory: [],
      });

    console.log(
      JSON.stringify(
        decision,
        null,
        2,
      ),
    );

    if (
      decision.commercialAction !==
      "SELECT_ITEM"
    ) {
      throw new Error(
        `TEST_SECURITY_EXPECTED_SELECT_ITEM_RECEIVED_${decision.commercialAction}`,
      );
    }

    if (
      !decision.catalogItemId
    ) {
      throw new Error(
        "TEST_SECURITY_CATALOG_ITEM_ID_REQUIRED",
      );
    }

    console.log("");
    console.log(
      "✅ DOT produziu uma ação comercial válida.",
    );

    // ----------------------------------------------------------
    // 3. CRIAR CONTEXTO BLOQUEADO SOMENTE EM MEMÓRIA
    // ----------------------------------------------------------
    //
    // NÃO alteramos banco.
    // NÃO alteramos o agente persistido.
    //
    // Criamos apenas uma cópia do snapshot oficial e desligamos
    // canAdvanceCommercialFlow nessa cópia.
    // ----------------------------------------------------------

    separator(
      "SIMULANDO AGENTE SEM PERMISSÃO",
    );

    const blockedContext = {
      ...context,

      agent: {
        ...context.agent,

        permissions: {
          ...context.agent.permissions,

          canAdvanceCommercialFlow:
            false,
        },
      },
    };

    console.log(
      JSON.stringify(
        {
          realPermission:
            context.agent.permissions
              .canAdvanceCommercialFlow,

          simulatedPermission:
            blockedContext.agent
              .permissions
              .canAdvanceCommercialFlow,

          storeId:
            blockedContext.store.id,

          agentStoreId:
            blockedContext.agent.storeId,
        },
        null,
        2,
      ),
    );

    if (
      blockedContext.agent.permissions
        .canAdvanceCommercialFlow !==
      false
    ) {
      throw new Error(
        "TEST_SECURITY_FAILED_TO_DISABLE_PERMISSION_IN_MEMORY",
      );
    }

    // ----------------------------------------------------------
    // 4. EXECUTAR BRIDGE COM CONTEXTO BLOQUEADO
    // ----------------------------------------------------------

    separator(
      "EXECUTANDO BRIDGE COM PERMISSÃO NEGADA",
    );

    const bridgeService =
      new GranConectaAgentCommercialBridgeService();

    const bridgeResult =
      await bridgeService.execute({
        conversationId:
          CONVERSATION_ID,

        storeId:
          STORE_ID,

        context:
          blockedContext,

        origem:
          "LANDING_PAGE",

        decision,

        metadata: {
          test: true,

          testName:
            "GranConectaAgentCommercialBridgeSecurity",
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
            bridgeResult.commercialResult,
        },
        null,
        2,
      ),
    );

    // ----------------------------------------------------------
    // 5. VALIDAR BLOQUEIO
    // ----------------------------------------------------------

    separator(
      "VALIDANDO BLOQUEIO",
    );

    if (
      bridgeResult.executed !==
      false
    ) {
      throw new Error(
        "TEST_SECURITY_BRIDGE_SHOULD_NOT_EXECUTE",
      );
    }

    if (
      bridgeResult.reason !==
      "AGENT_NOT_AUTHORIZED_TO_ADVANCE_COMMERCIAL_FLOW"
    ) {
      throw new Error(
        `TEST_SECURITY_UNEXPECTED_REASON_${bridgeResult.reason}`,
      );
    }

    if (
      bridgeResult.commercialResult !==
      null
    ) {
      throw new Error(
        "TEST_SECURITY_COMMERCIAL_RESULT_MUST_BE_NULL",
      );
    }

    console.log(
      "✅ Bridge bloqueou a ação comercial.",
    );

    console.log(
      "✅ Motivo de segurança correto.",
    );

    console.log(
      "✅ Orchestrator não retornou resultado comercial.",
    );

    // ----------------------------------------------------------
    // 6. PROVAR QUE NENHUM FLUXO FOI CRIADO
    // ----------------------------------------------------------

    separator(
      "VALIDANDO BANCO APÓS BLOQUEIO",
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

          realPermission:
            contextAfter
              .agent
              .permissions
              .canAdvanceCommercialFlow,
        },
        null,
        2,
      ),
    );

    if (
      contextAfter.commercialFlow
    ) {
      throw new Error(
        "TEST_SECURITY_COMMERCIAL_FLOW_SHOULD_NOT_EXIST",
      );
    }

    if (
      contextAfter.agent.permissions
        .canAdvanceCommercialFlow !==
      context.agent.permissions
        .canAdvanceCommercialFlow
    ) {
      throw new Error(
        "TEST_SECURITY_REAL_AGENT_PERMISSION_WAS_CHANGED",
      );
    }

    console.log("");
    console.log(
      "✅ Nenhum CommercialFlow foi criado.",
    );

    console.log(
      "✅ Permissão real do agente permaneceu intacta.",
    );

    separator(
      "TESTE DE SEGURANÇA FINALIZADO COM SUCESSO",
    );
  } catch (error) {
    separator(
      "TESTE DE SEGURANÇA FALHOU",
    );

    console.error(
      error instanceof Error
        ? error.stack ||
            error.message
        : error,
    );

    process.exitCode = 1;
  } finally {
    if (
      AppDataSource.isInitialized
    ) {
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