import "reflect-metadata";

import { AppDataSource } from "../config/data-source";
import { CommercialConversionOrchestrator } from "../services/commercial/CommercialConversionOrchestrator";

const CONVERSATION_ID =
  "22222222-3333-4444-8555-666666666666";

const STORE_ID =
  "b08bb3d7-dbc8-4176-8706-a01f3b5d7137";

const CUSTOMER_USER_ID =
  "00ab56d3-226b-4342-b03f-3d6225bf9dba";

const CATALOG_ITEM_ID =
  "b2e486eb-a83c-11f1-bc75-cee8d4ba0095";

const DATA = "2026-10-22";
const HORA = "14:00";

async function main(): Promise<void> {
  console.log("================================================");
  console.log("TESTE ORCHESTRATOR - CLIENTE IDENTIFICADO DEPOIS");
  console.log("================================================");
  console.log("");

  try {
    await AppDataSource.initialize();

    console.log("Banco conectado.");
    console.log("");

    const orchestrator =
      new CommercialConversionOrchestrator();

    /*
     * ETAPA 1
     *
     * O cliente ainda NÃO está identificado.
     *
     * O profissional do Espaço Almarse está livre
     * em 22/10/2026 às 14:00.
     *
     * Porém o cliente que será identificado depois
     * já possui outro compromisso das 08:00 às 16:00.
     */
    console.log("------------------------------------------");
    console.log("ETAPA 1 - CLIENTE AINDA NÃO IDENTIFICADO");
    console.log("------------------------------------------");
    console.log("");

    const primeiraConsulta =
      await orchestrator.process({
        conversationId: CONVERSATION_ID,
        storeId: STORE_ID,

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
            "CLIENTE_IDENTIFICADO_DEPOIS",
          etapa:
            1,
        },
      });

    console.log("");
    console.log("Resultado etapa 1:");
    console.dir(
      {
        handled:
          primeiraConsulta.handled,

        flowId:
          primeiraConsulta.flow?.id,

        customerUserId:
          primeiraConsulta.flow?.customerUserId,

        state:
          primeiraConsulta.flow?.state,

        nextAction:
          primeiraConsulta.nextAction,

        message:
          primeiraConsulta.message,

        availability:
          primeiraConsulta.data?.availability,

        ofertaId:
          primeiraConsulta.flow?.ofertaId,

        paymentId:
          primeiraConsulta.flow?.paymentId,

        metadata:
          primeiraConsulta.flow?.metadata,
      },
      {
        depth: null,
      },
    );

    /*
     * O ponto importante aqui:
     *
     * Como ainda não sabemos quem é o cliente,
     * a disponibilidade pode ser aprovada olhando
     * somente a agenda do profissional.
     */
    const disponibilidadeInicial =
      primeiraConsulta.data?.availability;

    if (
      disponibilidadeInicial &&
      disponibilidadeInicial.disponivel === false
    ) {
      throw new Error(
        `ETAPA_1_INESPERADA_${disponibilidadeInicial.motivo || "INDISPONIVEL"}`,
      );
    }

    console.log("");
    console.log(
      "✅ ETAPA 1 concluída.",
    );
    console.log(
      "O horário passou pela análise antes da identificação do cliente.",
    );

    /*
     * ETAPA 2
     *
     * Agora identificamos o cliente.
     *
     * Esse cliente já possui agenda:
     * 08:00 -> 16:00
     *
     * Portanto 14:00 -> 15:00 precisa ser
     * REVALIDADO e BLOQUEADO.
     */
    console.log("");
    console.log("------------------------------------------");
    console.log("ETAPA 2 - CLIENTE AGORA IDENTIFICADO");
    console.log("------------------------------------------");
    console.log("");

    console.log(
      "Cliente identificado =",
      CUSTOMER_USER_ID,
    );

    console.log(
      "Agenda existente do cliente = 08:00-16:00",
    );

    console.log(
      "Horário anteriormente consultado = 14:00-15:00",
    );

    console.log("");

    const segundaConsulta =
      await orchestrator.process({
        conversationId:
          CONVERSATION_ID,

        storeId:
          STORE_ID,

        customerUserId:
          CUSTOMER_USER_ID,

        origem:
          "LANDING_PAGE",

        metadata: {
          test:
            "CLIENTE_IDENTIFICADO_DEPOIS",
          etapa:
            2,
        },
      });

    console.log("");
    console.log("Resultado etapa 2:");

    console.dir(
      {
        handled:
          segundaConsulta.handled,

        flowId:
          segundaConsulta.flow?.id,

        customerUserId:
          segundaConsulta.flow?.customerUserId,

        state:
          segundaConsulta.flow?.state,

        nextAction:
          segundaConsulta.nextAction,

        message:
          segundaConsulta.message,

        availability:
          segundaConsulta.data?.availability,

        ofertaId:
          segundaConsulta.flow?.ofertaId,

        paymentId:
          segundaConsulta.flow?.paymentId,

        metadata:
          segundaConsulta.flow?.metadata,
      },
      {
        depth: null,
      },
    );

    /*
     * DIAGNÓSTICO
     */
    console.log("");
    console.log("==========================================");
    console.log("DIAGNÓSTICO");
    console.log("==========================================");
    console.log("");

    const availability =
      segundaConsulta.data?.availability;

    const motivo =
      availability?.motivo;

    const bloqueouCliente =
      availability?.disponivel === false &&
      motivo ===
        "CLIENTE_HORARIO_OCUPADO";

    const criouOferta =
      Boolean(
        segundaConsulta.flow?.ofertaId,
      );

    const criouPagamento =
      Boolean(
        segundaConsulta.flow?.paymentId,
      );

    if (bloqueouCliente) {
      console.log(
        "✅ TESTE PASSOU",
      );

      console.log(
        "O Orchestrator revalidou a disponibilidade após identificar o cliente.",
      );

      console.log(
        "O conflito 08:00-16:00 x 14:00-15:00 foi detectado.",
      );

      if (
        availability?.alternativas?.length
      ) {
        console.log("");
        console.log(
          "Alternativas encontradas:",
        );

        console.table(
          availability.alternativas,
        );
      }

      if (
        criouOferta ||
        criouPagamento
      ) {
        throw new Error(
          "SEGURANCA_FALHOU_FLUXO_COMERCIAL_CRIADO_APESAR_DO_CONFLITO",
        );
      }

      return;
    }

    /*
     * Se cair aqui, provavelmente encontramos
     * exatamente a brecha que queremos provar:
     *
     * availabilityConfirmed foi gravado quando
     * o cliente ainda era desconhecido e depois
     * o Orchestrator reutilizou essa confirmação.
     */
    console.log(
      "❌ BRECHA CONFIRMADA",
    );

    console.log("");
    console.log(
      "O cliente foi identificado depois da primeira consulta,",
    );

    console.log(
      "mas o horário não retornou CLIENTE_HORARIO_OCUPADO.",
    );

    console.log("");

    console.log(
      "Isso indica que a disponibilidade validada sem cliente",
    );

    console.log(
      "pode estar sendo reutilizada após a identificação.",
    );

    console.log("");

    console.log(
      "Estado final:",
      segundaConsulta.flow?.state,
    );

    console.log(
      "NextAction:",
      segundaConsulta.nextAction,
    );

    console.log(
      "Oferta criada:",
      criouOferta,
      segundaConsulta.flow?.ofertaId || null,
    );

    console.log(
      "Pagamento criado:",
      criouPagamento,
      segundaConsulta.flow?.paymentId || null,
    );

    /*
     * Não fazemos nenhuma correção automaticamente.
     * Queremos primeiro observar o comportamento real.
     */
  } catch (error) {
    console.error("");
    console.error(
      "❌ TESTE FALHOU POR ERRO",
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