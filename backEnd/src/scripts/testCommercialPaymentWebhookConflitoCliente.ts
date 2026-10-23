import * as dotenv from "dotenv";
import path from "node:path";
import "reflect-metadata";

const ENV = process.env.NODE_ENV || "development";

const envMap: Record<string, string> = {
  local: ".env.local",
  development: ".env.dev",
  production: ".env.production",
};

dotenv.config({
  path: path.resolve(
    process.cwd(),
    envMap[ENV] || ".env.dev",
  ),
  override: true,
});

import { AppDataSource } from "../config/data-source";
import { CommercialPaymentWebhookService } from "../services/commercial/CommercialPaymentWebhookService";

/**
 * TESTE:
 *
 * Cliente:
 * 00ab56d3-226b-4342-b03f-3d6225bf9dba
 *
 * Esse cliente já possui:
 * Pedreiro
 * 22/10/2026
 * 08:00 -> 16:00
 *
 * Tentaremos agendar:
 * Espaço Almarse
 * 22/10/2026
 * 14:00 -> 15:00
 *
 * O pagamento estará PAGO.
 *
 * Resultado esperado:
 *
 * - pagamento continua PAGO
 * - nenhuma agenda é criada
 * - conflito do CLIENTE é detectado
 * - flow NÃO fica ERRO
 * - flow volta para AGUARDANDO_DATA
 * - preferred_date/preferred_time ficam NULL
 * - payment_id/oferta_id permanecem
 * - metadata.rescheduleRequired = true
 */

const CUSTOMER_ID =
  "00ab56d3-226b-4342-b03f-3d6225bf9dba";

const PRESTADOR_ID =
  "af30b0f0-0e95-4518-beb5-8785516948f9";

const STORE_ID =
  "b08bb3d7-dbc8-4176-8706-a01f3b5d7137";

const CATALOG_ITEM_ID =
  "b2e486eb-a83c-11f1-bc75-cee8d4ba0095";

const SOLICITACAO_ID =
  "test-commercial-webhook-sol-001";

const OFERTA_ID =
  "test-commercial-webhook-oferta-001";

const PAYMENT_ID =
  "test-commercial-webhook-pag-001";

const FLOW_ID =
  "test-commercial-webhook-flow-001";

const CONVERSATION_ID =
  "test-commercial-webhook-conv-001";

const DATA = "2026-10-22";
const HORA = "14:00";

async function main(): Promise<void> {
  console.log("==========================================");
  console.log("TESTE COMMERCIAL PAYMENT WEBHOOK");
  console.log("CONFLITO DE HORÁRIO DO CLIENTE");
  console.log("==========================================");
  console.log("");

  try {
    await AppDataSource.initialize();

    console.log("Banco conectado.");
    console.log("");

    /**
     * --------------------------------------------------
     * LIMPEZA SOMENTE DOS DADOS DESTE TESTE
     * --------------------------------------------------
     */

    await AppDataSource.query(
      `
      DELETE FROM agenda
      WHERE ofertaId = ?
      `,
      [OFERTA_ID],
    );

    await AppDataSource.query(
      `
      DELETE FROM commercial_flows
      WHERE id = ?
         OR conversation_id = ?
      `,
      [FLOW_ID, CONVERSATION_ID],
    );

    await AppDataSource.query(
      `
      DELETE FROM pagamentos
      WHERE id = ?
      `,
      [PAYMENT_ID],
    );

    await AppDataSource.query(
      `
      DELETE FROM servico_oferta
      WHERE id = ?
      `,
      [OFERTA_ID],
    );

    await AppDataSource.query(
      `
      DELETE FROM servico_solicitacao
      WHERE id = ?
      `,
      [SOLICITACAO_ID],
    );

    console.log("Dados antigos deste teste removidos.");

    /**
     * --------------------------------------------------
     * SOLICITAÇÃO
     * --------------------------------------------------
     */

    await AppDataSource.query(
      `
      INSERT INTO servico_solicitacao
      (
        id,
        titulo,
        descricao,
        status,
        valor_sugerido,
        valor_final,
        usuarioId,
        prestadorId,
        progresso,
        categoriaId,
        metadata
      )
      VALUES
      (
        ?,
        ?,
        ?,
        'PRESTADOR_ESCOLHIDO',
        ?,
        ?,
        ?,
        ?,
        0,
        63,
        ?
      )
      `,
      [
        SOLICITACAO_ID,
        "TESTE - Avaliação psicopedagógica",
        "Teste oficial do webhook comercial com conflito de horário do cliente.",
        1.0,
        1.0,
        CUSTOMER_ID,
        PRESTADOR_ID,
        JSON.stringify({
          teste: true,
          tipo: "COMMERCIAL_PAYMENT_WEBHOOK_CONFLITO_CLIENTE",
          duracaoMinutos: 60,
          preferenciaData: DATA,
          preferenciaHorario: HORA,
          disponibilidadeConsultada: true,
        }),
      ],
    );

    console.log("Solicitação criada.");

    /**
     * --------------------------------------------------
     * OFERTA
     * --------------------------------------------------
     */

    await AppDataSource.query(
      `
      INSERT INTO servico_oferta
      (
        id,
        solicitacaoId,
        prestadorId,
        usuarioId,
        mensagem,
        valor,
        status,
        tipo_fluxo,
        total_sessoes,
        sessoes_concluidas,
        agenda_liberada
      )
      VALUES
      (
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        'ACEITA',
        'SERVICO',
        1,
        0,
        0
      )
      `,
      [
        OFERTA_ID,
        SOLICITACAO_ID,
        PRESTADOR_ID,
        CUSTOMER_ID,
        "TESTE - Avaliação psicopedagógica",
        1.0,
      ],
    );

    console.log("Oferta criada.");

    /**
     * --------------------------------------------------
     * PAGAMENTO JÁ APROVADO
     * --------------------------------------------------
     */

    await AppDataSource.query(
      `
      INSERT INTO pagamentos
      (
        id,
        ofertaId,
        prestadorId,
        moradorId,
        valor,
        status,
        status_liberacao,
        valor_liberado
      )
      VALUES
      (
        ?,
        ?,
        ?,
        ?,
        ?,
        'PAGO',
        'RETIDO',
        0
      )
      `,
      [
        PAYMENT_ID,
        OFERTA_ID,
        PRESTADOR_ID,
        CUSTOMER_ID,
        1.0,
      ],
    );

    console.log("Pagamento PAGO criado.");

    /**
     * --------------------------------------------------
     * COMMERCIAL FLOW
     * --------------------------------------------------
     */

    await AppDataSource.query(
      `
      INSERT INTO commercial_flows
      (
        id,
        conversation_id,
        store_id,
        customer_user_id,
        catalog_item_id,
        catalog_item_type,
        amount,
        quantity,
        total_sessions,
        state,
        source_type,
        source_id,
        solicitacao_id,
        oferta_id,
        payment_id,
        preferred_date,
        preferred_time,
        metadata,
        ativo
      )
      VALUES
      (
        ?,
        ?,
        ?,
        ?,
        ?,
        'SERVICO',
        ?,
        1,
        1,
        'AGUARDANDO_PAGAMENTO',
        'SERVICE_OFFER',
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        1
      )
      `,
      [
        FLOW_ID,
        CONVERSATION_ID,
        STORE_ID,
        CUSTOMER_ID,
        CATALOG_ITEM_ID,
        1.0,

        // source_id
        OFERTA_ID,

        // solicitacao_id
        SOLICITACAO_ID,

        // oferta_id
        OFERTA_ID,

        // payment_id
        PAYMENT_ID,

        // preferred_date
        DATA,

        // preferred_time
        HORA,

        JSON.stringify({
          teste: true,
          tipo: "COMMERCIAL_PAYMENT_WEBHOOK_CONFLITO_CLIENTE",
          duracaoMinutos: 60,
          disponibilidadeConsultada: true,
        }),
      ],
    );

    console.log("Commercial flow criado.");
    console.log("");

    /**
     * --------------------------------------------------
     * CONFIRMA ESTADO INICIAL
     * --------------------------------------------------
     */

    const agendasAntes: any[] =
      await AppDataSource.query(
        `
        SELECT *
        FROM agenda
        WHERE ofertaId = ?
        `,
        [OFERTA_ID],
      );

    console.log(
      "Agendas antes do webhook:",
      agendasAntes.length,
    );

    console.log("");
    console.log("Executando webhook comercial...");
    console.log("");

    /**
     * --------------------------------------------------
     * CAMINHO OFICIAL
     * --------------------------------------------------
     */

    const webhookService =
      new CommercialPaymentWebhookService();

    const resultado =
      await webhookService.processApprovedPayment({
        paymentId: PAYMENT_ID,
        ofertaId: OFERTA_ID,
      });

    console.log("");
    console.log("Resultado do webhook:");
    console.dir(resultado, {
      depth: null,
    });

    /**
     * --------------------------------------------------
     * ESTADO FINAL
     * --------------------------------------------------
     */

    const flows: any[] =
      await AppDataSource.query(
        `
        SELECT
          id,
          state,
          oferta_id,
          payment_id,
          agenda_id,
          preferred_date,
          preferred_time,
          ativo,
          last_error,
          metadata
        FROM commercial_flows
        WHERE id = ?
        `,
        [FLOW_ID],
      );

    const pagamentos: any[] =
      await AppDataSource.query(
        `
        SELECT
          id,
          status,
          ofertaId,
          moradorId,
          prestadorId,
          valor
        FROM pagamentos
        WHERE id = ?
        `,
        [PAYMENT_ID],
      );

    const agendasDepois: any[] =
      await AppDataSource.query(
        `
        SELECT
          id,
          data,
          hora,
          duracao_minutos,
          moradorId,
          prestadorId,
          ofertaId,
          status
        FROM agenda
        WHERE ofertaId = ?
        `,
        [OFERTA_ID],
      );

    const flow = flows[0];
    const pagamento = pagamentos[0];

    let metadata: any = {};

    if (flow?.metadata) {
      metadata =
        typeof flow.metadata === "string"
          ? JSON.parse(flow.metadata)
          : flow.metadata;
    }

    console.log("");
    console.log("==========================================");
    console.log("ESTADO FINAL");
    console.log("==========================================");

    console.log("");
    console.log("Pagamento:");
    console.log(pagamento);

    console.log("");
    console.log("Flow:");
    console.log({
      id: flow?.id,
      state: flow?.state,
      ofertaId: flow?.oferta_id,
      paymentId: flow?.payment_id,
      agendaId: flow?.agenda_id,
      preferredDate: flow?.preferred_date,
      preferredTime: flow?.preferred_time,
      ativo: flow?.ativo,
      lastError: flow?.last_error,
    });

    console.log("");
    console.log("Metadata:");
    console.log(metadata);

    console.log("");
    console.log(
      "Agendas depois:",
      agendasDepois.length,
    );

    /**
     * --------------------------------------------------
     * ASSERTS
     * --------------------------------------------------
     */

    const erros: string[] = [];

    if (!pagamento) {
      erros.push("Pagamento desapareceu.");
    }

    if (pagamento?.status !== "PAGO") {
      erros.push(
        `Pagamento deveria continuar PAGO, mas está ${pagamento?.status}`,
      );
    }

    if (agendasDepois.length !== 0) {
      erros.push(
        `Nenhuma agenda deveria ser criada, mas foram encontradas ${agendasDepois.length}.`,
      );
    }

    if (!flow) {
      erros.push("Commercial flow não encontrado.");
    }

    if (flow?.state !== "AGUARDANDO_DATA") {
      erros.push(
        `Flow deveria estar AGUARDANDO_DATA, mas está ${flow?.state}`,
      );
    }

    if (flow?.oferta_id !== OFERTA_ID) {
      erros.push("oferta_id não foi preservado.");
    }

    if (flow?.payment_id !== PAYMENT_ID) {
      erros.push("payment_id não foi preservado.");
    }

    if (flow?.agenda_id) {
      erros.push(
        `agenda_id deveria ser NULL, mas está ${flow.agenda_id}`,
      );
    }

    if (flow?.preferred_date) {
      erros.push(
        `preferred_date deveria ser NULL, mas está ${flow.preferred_date}`,
      );
    }

    if (flow?.preferred_time) {
      erros.push(
        `preferred_time deveria ser NULL, mas está ${flow.preferred_time}`,
      );
    }

    if (
      metadata?.rescheduleRequired !== true
    ) {
      erros.push(
        "metadata.rescheduleRequired deveria ser true.",
      );
    }

    if (
      metadata?.rescheduleReason !==
      "HORARIO_INDISPONIVEL_CLIENTE"
    ) {
      erros.push(
        `rescheduleReason incorreto: ${metadata?.rescheduleReason}`,
      );
    }

    if (
      metadata?.previousScheduledDate !== DATA
    ) {
      erros.push(
        `previousScheduledDate incorreto: ${metadata?.previousScheduledDate}`,
      );
    }

    if (
      metadata?.previousScheduledTime !== HORA
    ) {
      erros.push(
        `previousScheduledTime incorreto: ${metadata?.previousScheduledTime}`,
      );
    }

    if (erros.length > 0) {
      console.log("");
      console.error("❌ TESTE FALHOU");

      for (const erro of erros) {
        console.error(" -", erro);
      }

      process.exitCode = 1;
      return;
    }

    console.log("");
    console.log("==========================================");
    console.log("✅ TESTE PASSOU");
    console.log("==========================================");

    console.log("");
    console.log(
      "O pagamento permaneceu aprovado.",
    );

    console.log(
      "Nenhuma agenda conflitante foi criada.",
    );

    console.log(
      "O conflito do cliente foi tratado como reagendamento.",
    );

    console.log(
      "O flow voltou corretamente para AGUARDANDO_DATA.",
    );

    console.log(
      "O cliente poderá escolher outro horário sem novo pagamento.",
    );
  } catch (error) {
    console.error("");
    console.error("❌ ERRO NO TESTE:");
    console.error(error);

    process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

main();