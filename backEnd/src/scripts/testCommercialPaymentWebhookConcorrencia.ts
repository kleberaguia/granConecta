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
  path: path.resolve(process.cwd(), envMap[ENV] || ".env.dev"),
  override: true,
});

import { AppDataSource } from "../config/data-source";
import { CommercialPaymentWebhookService } from "../services/commercial/CommercialPaymentWebhookService";

/**
 * Teste de dois webhooks SIMULTÂNEOS para o mesmo pagamento PAGO.
 *
 * Cria dados isolados, dispara Promise.allSettled e valida o banco.
 * NÃO exclui dados de outros testes e NÃO faz cobrança real.
 * Execute somente no ambiente de desenvolvimento.
 *
 * ATENÇÃO: os IDs são fixos. Para evitar apagar uma agenda de teste
 * anterior, este script se recusa a rodar se já houver dados com eles.
 */
const CUSTOMER_ID = "00ab56d3-226b-4342-b03f-3d6225bf9dba";
const PRESTADOR_ID = "af30b0f0-0e95-4518-beb5-8785516948f9";
const STORE_ID = "b08bb3d7-dbc8-4176-8706-a01f3b5d7137";
const CATALOG_ITEM_ID = "b2e486eb-a83c-11f1-bc75-cee8d4ba0095";

const SOLICITACAO_ID = "test-commercial-conc-sol-001";
const OFERTA_ID = "test-commercial-conc-oferta-001";
const PAYMENT_ID = "test-commercial-conc-pag-001";
const FLOW_ID = "test-commercial-conc-flow-001";
const CONVERSATION_ID = "test-commercial-conc-conv-001";

// Quinta-feira, em semana diferente do teste de 22/10.
const DATA = "2026-10-29";
const HORA = "17:00";

async function rows(sql: string, params: unknown[] = []): Promise<any[]> {
  return AppDataSource.query(sql, params);
}

async function obterEstado() {
  const [flows, pagamentos, agendas] = await Promise.all([
    rows(
      `SELECT id, state, ativo, oferta_id, payment_id, agenda_id, last_error
       FROM commercial_flows WHERE id = ?`,
      [FLOW_ID],
    ),
    rows(
      `SELECT id, status, ofertaId, moradorId, prestadorId
       FROM pagamentos WHERE id = ?`,
      [PAYMENT_ID],
    ),
    rows(
      `SELECT id, data, hora, duracao_minutos, moradorId,
              prestadorId, ofertaId, status
       FROM agenda WHERE ofertaId = ? ORDER BY id`,
      [OFERTA_ID],
    ),
  ]);
  return {
    flow: flows[0],
    pagamento: pagamentos[0],
    agendas,
  };
}

async function main(): Promise<void> {
  console.log("==========================================");
  console.log("TESTE: WEBHOOKS COMERCIAIS SIMULTÂNEOS");
  console.log("==========================================");

  try {
    if (ENV === "production") {
      throw new Error("Este teste não pode executar em produção.");
    }

    await AppDataSource.initialize();
    console.log("Banco conectado.");

    // Não apagar registros existentes: impedir reexecução destrutiva.
    const [sol, of, pay, flow, ag] = await Promise.all([
      rows("SELECT id FROM servico_solicitacao WHERE id = ?", [SOLICITACAO_ID]),
      rows("SELECT id FROM servico_oferta WHERE id = ?", [OFERTA_ID]),
      rows("SELECT id FROM pagamentos WHERE id = ?", [PAYMENT_ID]),
      rows("SELECT id FROM commercial_flows WHERE id = ? OR conversation_id = ?", [FLOW_ID, CONVERSATION_ID]),
      rows("SELECT id FROM agenda WHERE ofertaId = ?", [OFERTA_ID]),
    ]);

    if (sol.length || of.length || pay.length || flow.length || ag.length) {
      throw new Error(
        "Dados deste teste já existem. Não vou apagá-los. " +
        "Inspecione o banco ou altere os cinco IDs do teste para uma nova execução.",
      );
    }

    await rows(
      `INSERT INTO servico_solicitacao
       (id, titulo, descricao, status, valor_sugerido, valor_final,
        usuarioId, prestadorId, progresso, categoriaId, metadata)
       VALUES (?, ?, ?, 'PRESTADOR_ESCOLHIDO', ?, ?, ?, ?, 0, 63, ?)`,
      [
        SOLICITACAO_ID,
        "TESTE - Avaliação psicopedagógica (concorrência)",
        "Dois webhooks simultâneos do mesmo pagamento.",
        1.0, 1.0, CUSTOMER_ID, PRESTADOR_ID,
        JSON.stringify({
          teste: true,
          tipo: "COMMERCIAL_PAYMENT_WEBHOOK_CONCORRENCIA",
          duracaoMinutos: 60,
          preferenciaData: DATA,
          preferenciaHorario: HORA,
          disponibilidadeConsultada: true,
        }),
      ],
    );

    await rows(
      `INSERT INTO servico_oferta
       (id, solicitacaoId, prestadorId, usuarioId, mensagem, valor,
        status, tipo_fluxo, total_sessoes, sessoes_concluidas, agenda_liberada)
       VALUES (?, ?, ?, ?, ?, ?, 'ACEITA', 'SERVICO', 1, 0, 0)`,
      [
        OFERTA_ID, SOLICITACAO_ID, PRESTADOR_ID, CUSTOMER_ID,
        "TESTE - Avaliação psicopedagógica (concorrência)", 1.0,
      ],
    );

    // Pagamento simulado como PAGO; nenhum gateway é acionado.
    await rows(
      `INSERT INTO pagamentos
       (id, ofertaId, prestadorId, moradorId, valor, status,
        status_liberacao, valor_liberado)
       VALUES (?, ?, ?, ?, ?, 'PAGO', 'RETIDO', 0)`,
      [PAYMENT_ID, OFERTA_ID, PRESTADOR_ID, CUSTOMER_ID, 1.0],
    );

    await rows(
      `INSERT INTO commercial_flows
       (id, conversation_id, store_id, customer_user_id, catalog_item_id,
        catalog_item_type, amount, quantity, total_sessions, state,
        source_type, source_id, solicitacao_id, oferta_id, payment_id,
        preferred_date, preferred_time, metadata, ativo)
       VALUES (?, ?, ?, ?, ?, 'SERVICO', ?, 1, 1,
               'AGUARDANDO_PAGAMENTO', 'SERVICE_OFFER',
               ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        FLOW_ID, CONVERSATION_ID, STORE_ID, CUSTOMER_ID,
        CATALOG_ITEM_ID, 1.0, OFERTA_ID, SOLICITACAO_ID,
        OFERTA_ID, PAYMENT_ID, DATA, HORA,
        JSON.stringify({
          teste: true,
          tipo: "COMMERCIAL_PAYMENT_WEBHOOK_CONCORRENCIA",
          duracaoMinutos: 60,
          disponibilidadeConsultada: true,
        }),
      ],
    );

    const antes = await obterEstado();
    if (antes.agendas.length !== 0) {
      throw new Error("Estado inicial inválido: já existe agenda para a oferta.");
    }

    console.log("Dados isolados criados. Agendas antes:", antes.agendas.length);
    console.log("Disparando duas chamadas em paralelo...");

    // Instâncias independentes, mesmo pagamento e mesma oferta.
    const resultados = await Promise.allSettled([
      new CommercialPaymentWebhookService().processApprovedPayment({
        paymentId: PAYMENT_ID,
        ofertaId: OFERTA_ID,
      }),
      new CommercialPaymentWebhookService().processApprovedPayment({
        paymentId: PAYMENT_ID,
        ofertaId: OFERTA_ID,
      }),
    ]);

    for (let i = 0; i < resultados.length; i++) {
      console.log(`Webhook ${i + 1}:`);
      const r = resultados[i];
      if (r?.status === "fulfilled") {
        console.dir(r.value, { depth: null });
      } else {
        console.error("Rejeitado:", r?.reason);
      }
    }

    const depois = await obterEstado();
    console.log("Estado final:", {
      pagamento: depois.pagamento?.status,
      flow: depois.flow?.state,
      ativo: depois.flow?.ativo,
      agendaId: depois.flow?.agenda_id,
      agendas: depois.agendas.length,
      lastError: depois.flow?.last_error,
      ids: depois.agendas.map((a) => a.id),
    });

    const erros: string[] = [];

    if (depois.pagamento?.status !== "PAGO") {
      erros.push("Pagamento não permaneceu PAGO.");
    }
    if (depois.pagamento?.ofertaId !== OFERTA_ID) {
      erros.push("Pagamento perdeu vínculo com a oferta.");
    }
    if (depois.agendas.length !== 1) {
      erros.push(`Esperada exatamente 1 agenda; encontradas ${depois.agendas.length}.`);
    }

    const agenda = depois.agendas[0];
    if (agenda) {
      if (String(agenda.data).slice(0, 10) !== DATA) {
        erros.push(`Data incorreta: ${agenda.data}`);
      }
      if (String(agenda.hora).slice(0, 5) !== HORA) {
        erros.push(`Hora incorreta: ${agenda.hora}`);
      }
      if (Number(agenda.duracao_minutos) !== 60) {
        erros.push(`Duração incorreta: ${agenda.duracao_minutos}`);
      }
      if (agenda.moradorId !== CUSTOMER_ID ||
          agenda.prestadorId !== PRESTADOR_ID ||
          agenda.ofertaId !== OFERTA_ID) {
        erros.push("Agenda com cliente, prestador ou oferta incorretos.");
      }
    }

    if (depois.flow?.state !== "FINALIZADO" ||
        Number(depois.flow?.ativo) !== 0) {
      erros.push(
        `Flow deveria estar FINALIZADO/inativo; estado=${depois.flow?.state}, ativo=${depois.flow?.ativo}`,
      );
    }
    if (depois.flow?.agenda_id !== agenda?.id) {
      erros.push("agenda_id do flow não corresponde à agenda criada.");
    }
    if (depois.flow?.payment_id !== PAYMENT_ID ||
        depois.flow?.oferta_id !== OFERTA_ID) {
      erros.push("Flow perdeu payment_id ou oferta_id.");
    }
    if (depois.flow?.last_error) {
      erros.push(`Flow terminou com erro: ${depois.flow.last_error}`);
    }

    if (erros.length) {
      console.error("❌ TESTE FALHOU:");
      erros.forEach((e) => console.error(" -", e));
      process.exitCode = 1;
      return;
    }

    console.log("==========================================");
    console.log("✅ TESTE DE CONCORRÊNCIA PASSOU");
    console.log("==========================================");
    console.log("Dois webhooks simultâneos, pagamento PAGO e exatamente uma agenda.");
    console.log("Observação: confira também eventuais falhas individuais acima.");
  } catch (error) {
    console.error("❌ ERRO NO TESTE:", error);
    process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

main();
