import { AppDataSource } from "../../config/data-source";
import {
  CommercialFlow,
  CommercialFlowState,
  CommercialFlowType,
} from "../../models/CommercialFlowModel";

import { Pagamento } from "../../models/PagamentoModel";
import {
  GatilhoPagamentoTransacao,
  PagamentoTransacao,
  StatusPagamentoTransacao,
  TipoPagamentoTransacao,
} from "../../models/PagamentoTransacaoModel";

import CommercialFlowStateService from "./CommercialFlowStateService";
import CommercialSchedulingService from "./CommercialSchedulingService";
import { ChatPersistenceService } from "../chat/ChatPersistenceService";

export type CommercialPaymentWebhookInput = {
  /**
   * ID interno da tabela pagamentos.
   */
  paymentId?: string | null;

  /**
   * Oferta que originou o pagamento.
   *
   * Serve como fallback caso o CommercialFlow ainda
   * não tenha recebido paymentId por algum motivo.
   */
  ofertaId?: string | null;
};

export type CommercialPaymentWebhookResult =
  | {
      handled: false;

      reason:
        | "PAYMENT_NOT_FOUND"
        | "COMMERCIAL_FLOW_NOT_FOUND"
        | "FLOW_NOT_APPLICABLE";
    }
  | {
      handled: true;

      flowId: string;

      state: CommercialFlowState;

      scheduled: boolean;

      agendaId: string | null;
    };

/**
 * ================================================================
 * COMMERCIAL PAYMENT WEBHOOK SERVICE
 * ================================================================
 *
 * Responsabilidade:
 *
 * Mercado Pago approved
 *        ↓
 * Pagamento = PAGO
 * ou ENTRADA / CONTRATACAO efetivamente paga
 *        ↓
 * CommercialFlow
 *        ↓
 * PAGAMENTO_APROVADO
 *        ↓
 * SERVICO/PACOTE ?
 *        ↓
 * CommercialSchedulingService
 *        ↓
 * Agenda real
 *
 * PRODUTO/CARDAPIO não passam por agenda.
 * Depois criaremos o fluxo próprio de pedidos.
 */
export class CommercialPaymentWebhookService {
  constructor(
    private readonly flowState =
      new CommercialFlowStateService(),

    private readonly scheduling =
      new CommercialSchedulingService(),

    private readonly persistence =
      new ChatPersistenceService(),
  ) {}

  private get flowRepository() {
    return AppDataSource.getRepository(
      CommercialFlow,
    );
  }

  private get paymentRepository() {
    return AppDataSource.getRepository(
      Pagamento,
    );
  }

  private get paymentTransactionRepository() {
    return AppDataSource.getRepository(
      PagamentoTransacao,
    );
  }

  /**
   * ================================================================
   * PROCESSAR PAGAMENTO APROVADO
   * ================================================================
   */
  async processApprovedPayment(
    input: CommercialPaymentWebhookInput,
  ): Promise<CommercialPaymentWebhookResult> {
    const paymentId =
      String(
        input.paymentId || "",
      ).trim();

    const ofertaId =
      String(
        input.ofertaId || "",
      ).trim();

    /**
     * ============================================================
     * 1. LOCALIZA PAGAMENTO
     * ============================================================
     */
    const payment =
      await this.findPayment(
        paymentId,
        ofertaId,
      );

    if (!payment) {
      console.warn(
        "[COMMERCIAL WEBHOOK] Pagamento não encontrado",
        {
          paymentId:
            paymentId || null,

          ofertaId:
            ofertaId || null,
        },
      );

      return {
        handled:
          false,

        reason:
          "PAYMENT_NOT_FOUND",
      };
    }

    /**
     * Segurança adicional.
     *
     * Existem dois cenários financeiros válidos para o motor comercial:
     *
     * 1. pagamento integral já quitado;
     * 2. contratação com ENTRADA + SALDO, na qual o pagamento pai fica
     *    PARCIALMENTE_PAGO até a conclusão do serviço, mas a transação
     *    ENTRADA / CONTRATACAO já está efetivamente paga.
     *
     * Não tratamos PARCIALMENTE_PAGO genericamente como aprovado.
     * A fonte de verdade para esse segundo cenário é pagamento_transacoes.
     */
    const paymentAccepted =
      await this.isCommerciallyApproved(
        payment,
      );

    if (!paymentAccepted) {
      console.log(
        "[COMMERCIAL WEBHOOK] Pagamento ainda não aprovado para contratação",
        {
          paymentId:
            payment.id,

          status:
            payment.status,
        },
      );

      return {
        handled:
          false,

        reason:
          "FLOW_NOT_APPLICABLE",
      };
    }

    /**
     * ============================================================
     * 2. LOCALIZA COMMERCIAL FLOW
     * ============================================================
     */
    let flow =
      await this.findCommercialFlow(
        payment.id,
        payment.ofertaId ||
        ofertaId ||
        null,
      );

    if (!flow) {
      /**
       * Isso não significa erro no pagamento.
       *
       * Pode ser pagamento antigo criado antes
       * do novo motor comercial.
       */
      console.log(
        "[COMMERCIAL WEBHOOK] Pagamento aprovado sem CommercialFlow",
        {
          paymentId:
            payment.id,

          ofertaId:
            payment.ofertaId ||
            ofertaId ||
            null,
        },
      );

      return {
        handled:
          false,

        reason:
          "COMMERCIAL_FLOW_NOT_FOUND",
      };
    }

    /**
     * ============================================================
     * 3. GARANTE paymentId NO FLOW
     * ============================================================
     */
    if (
      flow.paymentId !==
      payment.id
    ) {
      flow =
        await this.flowState.update(
          flow.id,
          {
            paymentId:
              payment.id,

            metadata: {
              paymentLinkedByWebhook:
                true,

              paymentLinkedByWebhookAt:
                new Date()
                  .toISOString(),
            },
          },
        );
    }

    /**
     * ============================================================
     * 4. IDEMPOTÊNCIA
     * ============================================================
     *
     * Se já está AGENDADO, o webhook duplicado
     * não deve alterar nem criar outra agenda.
     */
    if (
      flow.state ===
        CommercialFlowState.AGENDADO &&
      flow.agendaId
    ) {
      console.log(
        "[COMMERCIAL WEBHOOK] Fluxo já agendado",
        {
          flowId:
            flow.id,

          paymentId:
            payment.id,

          agendaId:
            flow.agendaId,
        },
      );

      await this.publishPaymentCompletedMessage(
        flow,
      );

      return {
        handled:
          true,

        flowId:
          flow.id,

        state:
          flow.state,

        scheduled:
          true,

        agendaId:
          flow.agendaId,
      };
    }

    /**
     * ============================================================
     * 5. PAGAMENTO APROVADO
     * ============================================================
     */
    flow =
      await this.flowState
        .markPaymentApproved(
          flow.id,
        );

    flow =
      await this.flowState.update(
        flow.id,
        {
          metadata: {
            webhookPaymentApprovedAt:
              new Date()
                .toISOString(),

            approvedPaymentId:
              payment.id,

            approvedOfferId:
              payment.ofertaId ||
              flow.ofertaId ||
              null,
          },
        },
      );

    console.log(
      "[COMMERCIAL WEBHOOK] Pagamento aprovado ligado ao fluxo",
      {
        flowId:
          flow.id,

        paymentId:
          payment.id,

        ofertaId:
          flow.ofertaId,

        catalogItemType:
          flow.catalogItemType,
      },
    );

    /**
     * ============================================================
     * 6. PRODUTO / CARDÁPIO
     * ============================================================
     *
     * Não possuem agenda.
     *
     * Futuramente:
     *
     * ProductConversionStrategy
     * FoodOrderConversionStrategy
     *
     * atualizarão Order para PAID.
     */
    if (
      flow.catalogItemType ===
        CommercialFlowType.PRODUTO ||
      flow.catalogItemType ===
        CommercialFlowType.CARDAPIO
    ) {
      return {
        handled:
          true,

        flowId:
          flow.id,

        state:
          flow.state,

        scheduled:
          false,

        agendaId:
          null,
      };
    }

    /**
     * ============================================================
     * 7. PROMOÇÃO
     * ============================================================
     *
     * Promoção precisa primeiro saber se está
     * promovendo produto, pacote ou serviço.
     */
    if (
      flow.catalogItemType ===
      CommercialFlowType.PROMOCAO
    ) {
      return {
        handled:
          true,

        flowId:
          flow.id,

        state:
          flow.state,

        scheduled:
          false,

        agendaId:
          null,
      };
    }

    /**
     * ============================================================
     * 8. SERVIÇO / PACOTE
     * ============================================================
     */
    if (
      flow.catalogItemType !==
        CommercialFlowType.SERVICO &&
      flow.catalogItemType !==
        CommercialFlowType.PACOTE
    ) {
      return {
        handled:
          false,

        reason:
          "FLOW_NOT_APPLICABLE",
      };
    }

    /**
     * Serviço sem data/hora não deve inventar agenda.
     *
     * Exemplo futuro:
     * orçamento de pedreiro ainda sem visita marcada.
     */
    if (
      !flow.preferredDate ||
      !flow.preferredTime
    ) {
      console.log(
        "[COMMERCIAL WEBHOOK] Serviço pago sem agenda definida",
        {
          flowId:
            flow.id,

          catalogItemType:
            flow.catalogItemType,
        },
      );

      return {
        handled:
          true,

        flowId:
          flow.id,

        state:
          flow.state,

        scheduled:
          false,

        agendaId:
          null,
      };
    }

    /**
     * ============================================================
     * 9. AGENDA
     * ============================================================
     */
    const schedulingResult =
      await this.scheduling
        .scheduleAfterPayment({
          flowId:
            flow.id,
        });

    if (schedulingResult.status === "RESCHEDULE_REQUIRED") {
      console.log(
        "[COMMERCIAL WEBHOOK] Pagamento aprovado aguardando novo horário",
        {
          flowId: schedulingResult.flow.id,
          paymentId: schedulingResult.paymentId,
          ofertaId: schedulingResult.ofertaId,
          previousDate: schedulingResult.previousDate,
          previousTime: schedulingResult.previousTime,
          state: schedulingResult.flow.state,
        },
      );

      return {
        handled: true,
        flowId: schedulingResult.flow.id,
        state: schedulingResult.flow.state,
        scheduled: false,
        agendaId: null,
      };
    }

    await this.publishPaymentCompletedMessage(
      schedulingResult.flow,
    );

    /**
     * A contratação comercial terminou aqui:
     *
     * pagamento aprovado
     *        ↓
     * agenda criada
     *        ↓
     * mensagem final publicada
     *        ↓
     * CommercialFlow FINALIZADO / inativo
     *
     * A conversa do chat continua aberta normalmente, mas uma mensagem
     * posterior como "obrigado" não deve reabrir o mesmo motor comercial
     * nem tentar agendar outra sessão automaticamente.
     */
    const finalizedFlow =
      await this.flowState.complete(
        schedulingResult.flow.id,
      );

    console.log(
      "[COMMERCIAL WEBHOOK] Fluxo comercial encerrado após pagamento/agendamento",
      {
        flowId:
          finalizedFlow.id,

        state:
          finalizedFlow.state,

        ativo:
          finalizedFlow.ativo,

        agendaId:
          schedulingResult.agendaId,
      },
    );

    return {
      handled:
        true,

      flowId:
        finalizedFlow.id,

      state:
        finalizedFlow.state,

      scheduled:
        true,

      agendaId:
        schedulingResult.agendaId,
    };
  }

  /**
   * ================================================================
   * PUBLICAR CONFIRMAÇÃO FINAL NO CHAT
   * ================================================================
   */
  private async publishPaymentCompletedMessage(
    flow: CommercialFlow,
  ): Promise<void> {
    const conversationId =
      String(
        flow.conversationId || "",
      ).trim();

    if (!conversationId) {
      console.warn(
        "[COMMERCIAL WEBHOOK] Fluxo agendado sem conversationId; mensagem final não publicada",
        {
          flowId: flow.id,
          agendaId: flow.agendaId || null,
        },
      );
      return;
    }

    const marker =
      "Pagamento confirmado! Seu agendamento";

    try {
      const history =
        await this.persistence.getHistory(
          conversationId,
        );

      const alreadyPublished =
        Array.isArray(history) &&
        history.some((item: any) => {
          const role =
            String(
              item?.role ||
              item?.sender ||
              item?.tipo ||
              "",
            )
              .trim()
              .toLowerCase();

          const content =
            String(
              item?.content ||
              item?.message ||
              item?.mensagem ||
              item?.text ||
              "",
            ).trim();

          return (
            role === "assistant" &&
            content.includes(marker)
          );
        });

      if (alreadyPublished) {
        console.log(
          "[COMMERCIAL WEBHOOK] Mensagem final já existente no chat",
          {
            flowId: flow.id,
            conversationId,
            agendaId: flow.agendaId || null,
          },
        );
        return;
      }

      const formattedDate =
        this.formatDateForMessage(
          flow.preferredDate,
        );

      const formattedTime =
        String(
          flow.preferredTime || "",
        )
          .trim()
          .slice(0, 5);

      let message =
        "✅ Pagamento confirmado!";

      if (formattedDate && formattedTime) {
        message +=
          ` Seu agendamento para ${formattedDate} às ${formattedTime} foi realizado com sucesso.`;
      } else {
        message +=
          " Seu agendamento foi realizado com sucesso.";
      }

      message +=
        " Obrigado pela contratação.";

      await this.persistence.saveMessage(
        conversationId,
        "assistant",
        message,
      );

      console.log(
        "[COMMERCIAL WEBHOOK] Mensagem final publicada no chat",
        {
          flowId: flow.id,
          conversationId,
          agendaId: flow.agendaId || null,
          preferredDate: flow.preferredDate || null,
          preferredTime: flow.preferredTime || null,
        },
      );
    } catch (error) {
      console.error(
        "[COMMERCIAL WEBHOOK] Falha ao publicar mensagem final no chat",
        {
          flowId: flow.id,
          conversationId,
          agendaId: flow.agendaId || null,
          error:
            error instanceof Error
              ? error.message
              : error,
        },
      );
    }
  }

  private formatDateForMessage(
    value: string | Date | null | undefined,
  ): string {
    if (!value) return "";

    if (value instanceof Date) {
      const day = String(value.getDate()).padStart(2, "0");
      const month = String(value.getMonth() + 1).padStart(2, "0");
      const year = String(value.getFullYear());
      return `${day}/${month}/${year}`;
    }

    const raw = String(value).trim();
    const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (isoMatch) {
      return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
    }

    return raw;
  }

  /**
   * ================================================================
   * LOCALIZAR PAGAMENTO
   * ================================================================
   */
  private async findPayment(
    paymentId: string,
    ofertaId: string,
  ): Promise<Pagamento | null> {
    if (paymentId) {
      const byId =
        await this.paymentRepository
          .findOne({
            where: {
              id:
                paymentId,
            } as any,
          });

      if (byId) {
        return byId;
      }
    }

    if (ofertaId) {
      return this.paymentRepository
        .findOne({
          where: {
            ofertaId,
          } as any,

          order: {
            createdAt:
              "DESC",
          } as any,
        });
    }

    return null;
  }

  /**
   * ================================================================
   * LOCALIZAR COMMERCIAL FLOW
   * ================================================================
   *
   * Preferência:
   *
   * paymentId
   *    ↓
   * ofertaId
   *
   * Isso permite recuperar fluxos que tiveram falha
   * entre a criação do pagamento e o update do flow.
   */
  private async findCommercialFlow(
    paymentId: string,
    ofertaId:
      | string
      | null,
  ): Promise<CommercialFlow | null> {
    if (paymentId) {
      const byPayment =
        await this.flowRepository
          .findOne({
            where: {
              paymentId,
              ativo:
                true,
            },

            order: {
              updatedAt:
                "DESC",
            },
          });

      if (byPayment) {
        return byPayment;
      }
    }

    if (ofertaId) {
      const byOffer =
        await this.flowRepository
          .findOne({
            where: {
              ofertaId,
              ativo:
                true,
            },

            order: {
              updatedAt:
                "DESC",
            },
          });

      if (byOffer) {
        return byOffer;
      }

      /**
       * Também existe sourceId apontando para oferta.
       */
      const bySource =
        await this.flowRepository
          .findOne({
            where: {
              sourceId:
                ofertaId,

              ativo:
                true,
            },

            order: {
              updatedAt:
                "DESC",
            },
          });

      if (bySource) {
        return bySource;
      }
    }

    return null;
  }

  /**
   * ================================================================
   * CONTRATAÇÃO FINANCEIRAMENTE APROVADA
   * ================================================================
   *
   * Aceita:
   *
   * - pagamento integral efetivamente aprovado; ou
   * - pagamento pai PARCIALMENTE_PAGO quando existe uma transação
   *   ENTRADA, com gatilho CONTRATACAO, efetivamente paga.
   *
   * Isso preserva a regra ENTRADA + SALDO sem transformar
   * PARCIALMENTE_PAGO em equivalente genérico de PAGO.
   */
  private async isCommerciallyApproved(
    payment: Pagamento,
  ): Promise<boolean> {
    if (
      this.isApproved(
        payment.status,
      )
    ) {
      return true;
    }

    const parentStatus =
      String(
        payment.status || "",
      )
        .trim()
        .toUpperCase();

    if (
      parentStatus !==
      "PARCIALMENTE_PAGO"
    ) {
      return false;
    }

    const paidEntry =
      await this.paymentTransactionRepository
        .findOne({
          where: {
            pagamentoId:
              payment.id,

            tipo:
              TipoPagamentoTransacao.ENTRADA,

            gatilhoTipo:
              GatilhoPagamentoTransacao.CONTRATACAO,
          },

          order: {
            createdAt:
              "ASC",
          },
        });

    if (!paidEntry) {
      return false;
    }

    const entryPaid =
      paidEntry.status ===
        StatusPagamentoTransacao.PAGO ||
      paidEntry.status ===
        StatusPagamentoTransacao.PAGO_EXTERNAMENTE;

    if (entryPaid) {
      console.log(
        "[COMMERCIAL WEBHOOK] Contratação confirmada por entrada paga",
        {
          paymentId:
            payment.id,

          parentStatus,

          transactionId:
            paidEntry.id,

          transactionType:
            paidEntry.tipo,

          transactionStatus:
            paidEntry.status,

          trigger:
            paidEntry.gatilhoTipo,
        },
      );
    }

    return entryPaid;
  }

  /**
   * ================================================================
   * STATUS APROVADO
   * ================================================================
   */
  private isApproved(
    status:
      | string
      | null
      | undefined,
  ): boolean {
    return [
      "PAGO",
      "APROVADO",
      "APPROVED",
      "PAID",
    ].includes(
      String(
        status || "",
      )
        .trim()
        .toUpperCase(),
    );
  }
}

export default CommercialPaymentWebhookService;