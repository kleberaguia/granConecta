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
 * Reenvia o webhook de um pagamento comercial já concluído.
 * NÃO remove nem cria dados. Execute após o teste de horário livre.
 */
const FLOW_ID = "test-commercial-livre-flow-001";
const OFERTA_ID = "test-commercial-livre-oferta-001";
const PAYMENT_ID = "test-commercial-livre-pag-001";
const DATA = "2026-10-22";
const HORA = "17:00";

async function obterEstado() {
  const [flows, pagamentos, agendas] = await Promise.all([
    AppDataSource.query(
      `SELECT id, state, ativo, oferta_id, payment_id, agenda_id, last_error
       FROM commercial_flows WHERE id = ?`,
      [FLOW_ID],
    ),
    AppDataSource.query(
      `SELECT id, status, ofertaId FROM pagamentos WHERE id = ?`,
      [PAYMENT_ID],
    ),
    AppDataSource.query(
      `SELECT id, data, hora, ofertaId, moradorId, prestadorId,
              duracao_minutos, status
       FROM agenda WHERE ofertaId = ? ORDER BY id`,
      [OFERTA_ID],
    ),
  ]);
  return {
    flow: (flows as any[])[0],
    pagamento: (pagamentos as any[])[0],
    agendas: agendas as any[],
  };
}

async function main(): Promise<void> {
  console.log("==========================================");
  console.log("TESTE DE IDEMPOTÊNCIA DO WEBHOOK COMERCIAL");
  console.log("==========================================");

  try {
    await AppDataSource.initialize();
    console.log("Banco conectado.");

    const antes = await obterEstado();
    console.log("Estado antes:", {
      pagamento: antes.pagamento?.status,
      flow: antes.flow?.state,
      ativo: antes.flow?.ativo,
      agendaId: antes.flow?.agenda_id,
      agendas: antes.agendas.length,
    });

    const errosIniciais: string[] = [];
    if (!antes.pagamento || antes.pagamento.status !== "PAGO") {
      errosIniciais.push("Pagamento de teste não existe ou não está PAGO.");
    }
    if (!antes.flow || antes.flow.state !== "FINALIZADO" || Number(antes.flow.ativo) !== 0) {
      errosIniciais.push("Flow de teste não está FINALIZADO e inativo.");
    }
    if (antes.flow?.payment_id !== PAYMENT_ID || antes.flow?.oferta_id !== OFERTA_ID) {
      errosIniciais.push("IDs do pagamento/oferta no flow não correspondem ao teste.");
    }
    if (antes.agendas.length !== 1 || antes.agendas[0]?.id !== antes.flow?.agenda_id) {
      errosIniciais.push("É necessária exatamente uma agenda vinculada ao flow antes do reenvio.");
    }
    if (antes.agendas[0] && (
      String(antes.agendas[0].data).slice(0, 10) !== DATA ||
      String(antes.agendas[0].hora).slice(0, 5) !== HORA
    )) {
      errosIniciais.push("Data/hora da agenda inicial não correspondem ao cenário.");
    }

    if (errosIniciais.length) {
      console.error("❌ PRÉ-CONDIÇÕES NÃO ATENDIDAS. Nenhum webhook foi chamado.");
      errosIniciais.forEach((erro) => console.error(" -", erro));
      process.exitCode = 1;
      return;
    }

    const agendaOriginalId = antes.agendas[0].id;
    console.log("\nReenviando o MESMO webhook uma vez...");
    const service = new CommercialPaymentWebhookService();
    let resultado: unknown;
    let erroWebhook: unknown = null;
    try {
      resultado = await service.processApprovedPayment({
        paymentId: PAYMENT_ID,
        ofertaId: OFERTA_ID,
      });
    } catch (error) {
      erroWebhook = error;
    }
    console.log("Resultado do segundo webhook:");
    console.dir(erroWebhook ?? resultado, { depth: null });

    const depois = await obterEstado();
    console.log("\nEstado depois:", {
      pagamento: depois.pagamento?.status,
      flow: depois.flow?.state,
      ativo: depois.flow?.ativo,
      agendaId: depois.flow?.agenda_id,
      agendas: depois.agendas.length,
      agendaOriginalId,
      agendaAtualId: depois.agendas[0]?.id,
    });

    const erros: string[] = [];
    if (erroWebhook) erros.push("O reenvio do webhook lançou um erro.");
    if (depois.pagamento?.status !== "PAGO") erros.push("Pagamento deixou de estar PAGO.");
    if (depois.flow?.state !== "FINALIZADO" || Number(depois.flow?.ativo) !== 0) {
      erros.push("Flow deixou de estar FINALIZADO/inativo.");
    }
    if (depois.flow?.payment_id !== PAYMENT_ID || depois.flow?.oferta_id !== OFERTA_ID) {
      erros.push("IDs de pagamento/oferta foram alterados.");
    }
    if (depois.flow?.agenda_id !== agendaOriginalId) {
      erros.push("agenda_id do flow foi alterado.");
    }
    if (depois.agendas.length !== 1 || depois.agendas[0]?.id !== agendaOriginalId) {
      erros.push(`Agenda duplicada ou substituída: quantidade=${depois.agendas.length}.`);
    }
    if (depois.flow?.last_error) erros.push(`Flow apresenta erro: ${depois.flow.last_error}`);

    if (erros.length) {
      console.error("\n❌ TESTE DE IDEMPOTÊNCIA FALHOU");
      erros.forEach((erro) => console.error(" -", erro));
      process.exitCode = 1;
      return;
    }

    console.log("\n==========================================");
    console.log("✅ TESTE DE IDEMPOTÊNCIA PASSOU");
    console.log("==========================================");
    console.log("Pagamento permaneceu PAGO.");
    console.log("Flow permaneceu FINALIZADO/inativo.");
    console.log("Continua existindo exatamente uma agenda:", agendaOriginalId);
    console.log("Nenhuma nova cobrança ou agenda foi criada por este teste.");
    console.log("Observação: este teste verifica reenvio sequencial, não webhooks simultâneos.");
  } catch (error) {
    console.error("\n❌ ERRO NO TESTE:", error);
    process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  }
}

void main();
