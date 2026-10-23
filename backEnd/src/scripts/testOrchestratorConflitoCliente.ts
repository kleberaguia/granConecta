import "reflect-metadata";

import { AppDataSource } from "../config/data-source";
import CommercialConversionOrchestrator from "../services/commercial/CommercialConversionOrchestrator";

/**
 * ================================================================
 * TESTE
 * ================================================================
 *
 * Cliente já possui agenda:
 *
 * 22/10/2026
 * 08:00 -> 16:00
 *
 * Vamos tentar pelo CommercialConversionOrchestrator:
 *
 * 22/10/2026
 * 14:00 -> 15:00
 *
 * com outro profissional / negócio.
 *
 * Resultado esperado:
 *
 * disponivel = false
 * motivo = CLIENTE_HORARIO_OCUPADO
 *
 * E nenhuma oferta/pagamento deve ser criado.
 */

const CONVERSATION_ID =
  "test-orchestrator-conflito-cliente-001";

const STORE_ID =
  "b08bb3d7-dbc8-4176-8706-a01f3b5d7137";

const CUSTOMER_USER_ID =
  "00ab56d3-226b-4342-b03f-3d6225bf9dba";

/**
 * Avaliação psicopedagógica inicial.
 *
 * Item oficial do Espaço Almarse.
 * Duração: 60 minutos.
 */
const CATALOG_ITEM_ID =
  "b2e486eb-a83c-11f1-bc75-cee8d4ba0095";

const DATA =
  "2026-10-22";

const HORA =
  "14:00";

async function main(): Promise<void> {
  console.log(
    "==========================================",
  );
  console.log(
    "TESTE ORCHESTRATOR - CONFLITO CLIENTE",
  );
  console.log(
    "==========================================",
  );

  try {
    await AppDataSource.initialize();

    console.log("\nBanco conectado.");

    console.log("\nCenário:");

    console.log(
      `Cliente = ${CUSTOMER_USER_ID}`,
    );

    console.log(
      "Agenda existente do cliente = 08:00-16:00",
    );

    console.log(
      "Nova tentativa = 14:00-15:00",
    );

    console.log(
      "Consulta passando pelo CommercialConversionOrchestrator.",
    );

    const orchestrator =
      new CommercialConversionOrchestrator();

    const resultado =
      await orchestrator.process({
        conversationId:
          CONVERSATION_ID,

        storeId:
          STORE_ID,

        customerUserId:
          CUSTOMER_USER_ID,

        catalogItemId:
          CATALOG_ITEM_ID,

        preferredDate:
          DATA,

        preferredTime:
          HORA,

        origem:
          "LANDING_PAGE",

        metadata: {
          test:
            "ORCHESTRATOR_CONFLITO_CLIENTE",
        },
      });

    console.log("\nResultado:");

    console.dir(
      {
        handled:
          resultado.handled,

        flowId:
          resultado.flow?.id,

        customerUserId:
          resultado.flow?.customerUserId,

        state:
          resultado.state,

        nextAction:
          resultado.nextAction,

        message:
          resultado.message,

        availability:
          resultado.data?.availability,

        ofertaId:
          resultado.flow?.ofertaId,

        paymentId:
          resultado.flow?.paymentId,
      },
      {
        depth: null,
      },
    );

    /**
     * ============================================================
     * VALIDAÇÕES
     * ============================================================
     */

    if (
      resultado.flow?.customerUserId !==
      CUSTOMER_USER_ID
    ) {
      throw new Error(
        "TESTE_FALHOU_CLIENTE_NAO_VINCULADO_AO_FLOW",
      );
    }

    if (
      resultado.data?.availability
        ?.disponivel !== false
    ) {
      throw new Error(
        "TESTE_FALHOU_HORARIO_DEVERIA_ESTAR_INDISPONIVEL",
      );
    }

    if (
      resultado.data?.availability
        ?.motivo !==
      "CLIENTE_HORARIO_OCUPADO"
    ) {
      throw new Error(
        `TESTE_FALHOU_MOTIVO_INCORRETO_${String(
          resultado.data?.availability
            ?.motivo,
        )}`,
      );
    }

    /**
     * O fluxo não pode chegar à criação de oferta
     * ou pagamento quando o cliente está ocupado.
     */

    if (resultado.flow?.ofertaId) {
      throw new Error(
        `TESTE_FALHOU_OFERTA_CRIADA_${resultado.flow.ofertaId}`,
      );
    }

    if (resultado.flow?.paymentId) {
      throw new Error(
        `TESTE_FALHOU_PAGAMENTO_CRIADO_${resultado.flow.paymentId}`,
      );
    }

    console.log(
      "\n✅ TESTE PASSOU",
    );

    console.log(
      "O Orchestrator bloqueou o horário ocupado do cliente antes da oferta/pagamento.",
    );

    if (
      resultado.data?.availability
        ?.alternativas?.length
    ) {
      console.log(
        "\nAlternativas válidas encontradas:",
      );

      console.table(
        resultado.data.availability
          .alternativas,
      );
    }
  } catch (error) {
    console.error(
      "\n❌ TESTE FALHOU",
    );

    console.error(error);

    process.exitCode = 1;
  } finally {
    if (
      AppDataSource.isInitialized
    ) {
      await AppDataSource.destroy();
    }
  }
}

main();