import cron from "node-cron";
import { AppDataSource } from "../config/data-source";
import { Pagamento } from "../models/PagamentoModel";
import {
  Agenda,
  StatusAgenda,
} from "../models/AgendaModels";

/**
 * ============================================================
 * CRON FINANCEIRO - AUDITORIA DE PAGAMENTOS
 * ============================================================
 *
 * IMPORTANTE:
 *
 * Este cron NÃO libera mais pagamentos automaticamente.
 *
 * A liberação operacional deve acontecer exclusivamente
 * através do fluxo oficial do PagamentoService:
 *
 *   Pagamento PAGO
 *        ↓
 *   código de verificação
 *        ↓
 *   validarLiberacaoRecurso()
 *        ↓
 *   status_liberacao = LIBERADO
 *   valor_liberado atualizado
 *
 * Motivo:
 *
 * Anteriormente este cron fazia:
 *
 *   pagamento.status_liberacao = "LIBERADO"
 *
 * sem atualizar valor_liberado e sem validar o código.
 *
 * Isso poderia produzir:
 *
 *   status = PAGO
 *   status_liberacao = LIBERADO
 *   valor_liberado = 0.00
 *
 * Agora o cron funciona somente como AUDITOR.
 * ============================================================
 */

const pagamentoRepo =
  AppDataSource.getRepository(Pagamento);

const agendaRepo =
  AppDataSource.getRepository(Agenda);

/**
 * Executa a cada 20 minutos.
 *
 * O cron apenas identifica situações em que:
 *
 * - existe agenda concluída;
 * - pagamento está totalmente PAGO;
 * - pagamento continua RETIDO.
 *
 * Isso NÃO significa erro obrigatoriamente.
 *
 * Pode significar simplesmente que ainda falta a
 * validação/liberação operacional pelo código de verificação.
 */
cron.schedule("*/20 * * * *", async () => {
  console.log(
    "💰 [Cron Financeiro] Iniciando auditoria de pagamentos..."
  );

  try {
    const agendasConcluidas =
      await agendaRepo.find({
        where: {
          status: StatusAgenda.CONCLUIDO,
        },
        relations: [
          "prestador",
          "morador",
          "oferta",
        ],
      });

    let pagamentosRetidos = 0;
    let agendasSemPagamento = 0;

    for (const agenda of agendasConcluidas) {
      /**
       * Blindagem para registros antigos/incompletos.
       */
      if (!agenda.oferta?.id) {
        console.warn(
          "[Cron Financeiro] Agenda concluída sem oferta vinculada",
          {
            agendaId: agenda.id,
          }
        );

        continue;
      }

      /**
       * Procuramos apenas pagamento:
       *
       * - totalmente PAGO;
       * - ainda RETIDO.
       *
       * O cron NÃO altera esse estado.
       */
      const pagamento =
        await pagamentoRepo.findOne({
          where: {
            ofertaId: agenda.oferta.id,
            status: "PAGO",
            status_liberacao: "RETIDO",
          },
        });

      if (!pagamento) {
        agendasSemPagamento += 1;
        continue;
      }

      pagamentosRetidos += 1;

      /**
       * ========================================================
       * SOMENTE AUDITORIA
       * ========================================================
       *
       * NÃO fazer:
       *
       * pagamento.status_liberacao = "LIBERADO";
       * pagamento.valor_liberado = ...
       * pagamentoRepo.save(...)
       *
       * A autoridade para liberação permanece no
       * PagamentoService.validarLiberacaoRecurso().
       */
      console.log(
        "[Cron Financeiro] Pagamento quitado aguardando liberação operacional",
        {
          agendaId: agenda.id,
          ofertaId: agenda.oferta.id,
          pagamentoId: pagamento.id,
          prestadorId: pagamento.prestadorId,
          valor: Number(pagamento.valor || 0),
          valorLiberado: Number(
            pagamento.valor_liberado || 0
          ),
          status: pagamento.status,
          statusLiberacao:
            pagamento.status_liberacao,
        }
      );
    }

    console.log(
      "[Cron Financeiro] Auditoria concluída",
      {
        agendasConcluidas:
          agendasConcluidas.length,
        pagamentosRetidos,
        agendasSemPagamento,
      }
    );
  } catch (error: any) {
    console.error(
      "❌ [Cron Financeiro] Erro durante auditoria:",
      error?.message || error
    );
  }
});