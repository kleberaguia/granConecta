import { AppDataSource } from "../../config/data-source";

import {
  CommercialFlow,
  CommercialFlowSourceType,
  CommercialFlowState,
} from "../../models/CommercialFlowModel";

import { ServicoOferta } from "../../models/servicoOfertaModels";
import { Pagamento } from "../../models/PagamentoModel";

import ServicoOfertaService from "../ServicoOfertaService";
import PagamentoService from "../PagamentoService";

import CommercialFlowStateService from "./CommercialFlowStateService";

export type CommercialPaymentInput = {
  flowId: string;

  /**
   * Confirmação explícita do cliente.
   *
   * Exemplo:
   * "confirmo"
   * "quero pagar"
   * botão "Ir para pagamento"
   *
   * O ChatService fará essa interpretação antes de chamar este service.
   */
  customerConfirmed: boolean;
};

export type CommercialPaymentResult =
  | {
      status: "CONFIRMATION_REQUIRED";

      flow: CommercialFlow;

      paymentId: null;

      checkoutUrl: null;

      amount: number;
    }
  | {
      status: "PAYMENT_READY";

      flow: CommercialFlow;

      paymentId: string;

      checkoutUrl: string | null;

      amount: number;

      reusedPayment: boolean;
    }
  | {
      status: "ALREADY_PAID";

      flow: CommercialFlow;

      paymentId: string;

      checkoutUrl: string | null;

      amount: number;

      reusedPayment: true;
    };

/**
 * ================================================================
 * COMMERCIAL PAYMENT SERVICE
 * ================================================================
 *
 * Responsabilidade:
 *
 * OFERTA_CRIADA
 *      ↓
 * confirmação do cliente
 *      ↓
 * verifica pagamento existente
 *      ↓
 * aceita oferta se necessário
 *      ↓
 * gera/reutiliza checkout Mercado Pago
 *      ↓
 * salva paymentId no CommercialFlow
 *      ↓
 * AGUARDANDO_PAGAMENTO
 *
 * Este serviço NÃO:
 *
 * - agenda sessão;
 * - marca pagamento como aprovado manualmente;
 * - confia em "já paguei" escrito no chat;
 * - libera agenda;
 *
 * PAGAMENTO_APROVADO deverá vir do webhook.
 */
export class CommercialPaymentService {
  /** Impede que o fluxo de testes utilize um gateway ou banco de produção. */
  private assertLocalPaymentIsolation(): void {
    if (process.env.NODE_ENV !== "local") return;

    const database = String(process.env.DB_DATABASE || "").trim();
    const host = String(process.env.DB_HOST || "").trim().toLowerCase();
    const provider = String(process.env.PAYMENT_PROVIDER || "").trim().toUpperCase();
    const testMode = String(process.env.GRANCONECTA_TEST_MODE || "").trim().toLowerCase();

    if (
      database !== "granconecta_teste" ||
      !["127.0.0.1", "localhost"].includes(host) ||
      provider !== "MOCK" ||
      testMode !== "true"
    ) {
      throw new Error("COMMERCIAL_PAYMENT_LOCAL_ISOLATION_REQUIRED");
    }
  }

  /** Nunca disponibiliza links de checkout reais no ambiente de testes. */
  private safeCheckoutUrl(value: unknown): string | null {
    const url = this.safeCheckoutUrl(value);
    if (process.env.NODE_ENV !== "local") return url;
    if (!url) return null;
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();
      if (
        ["localhost", "127.0.0.1", "::1"].includes(hostname) &&
        ["http:", "https:"].includes(parsed.protocol)
      ) {
        return url;
      }
    } catch {
      // URL inválida não pode ser exposta.
    }
    console.warn("[LOCAL] Link externo de pagamento ocultado.");
    return null;
  }

  constructor(
    private readonly flowState =
      new CommercialFlowStateService(),
  ) {}

  private get ofertaRepository() {
    return AppDataSource.getRepository(
      ServicoOferta,
    );
  }

  private get pagamentoRepository() {
    return AppDataSource.getRepository(
      Pagamento,
    );
  }

  /**
   * ================================================================
   * PREPARAR PAGAMENTO
   * ================================================================
   */
  async preparePayment(
    input: CommercialPaymentInput,
  ): Promise<CommercialPaymentResult> {
    const flowId =
      String(
        input.flowId || "",
      ).trim();

    if (!flowId) {
      throw new Error(
        "COMMERCIAL_PAYMENT_FLOW_ID_OBRIGATORIO",
      );
    }

    this.assertLocalPaymentIsolation();

    let flow =
      await this.flowState.findById(
        flowId,
      );

    if (!flow) {
      throw new Error(
        "COMMERCIAL_FLOW_NAO_ENCONTRADO",
      );
    }

    try {
      /**
       * ============================================================
       * 1. VALIDA FLOW
       * ============================================================
       */
      this.validateFlow(
        flow,
      );

      const oferta =
        await this.loadOferta(
          flow.ofertaId!,
        );

      const amount =
        Number(
          oferta.valor ??
          flow.amount ??
          0,
        );

      if (
        !Number.isFinite(amount) ||
        amount < 0
      ) {
        throw new Error(
          "COMMERCIAL_PAYMENT_VALOR_INVALIDO",
        );
      }

      /**
       * ============================================================
       * 2. CLIENTE AINDA NÃO CONFIRMOU
       * ============================================================
       *
       * Não criamos checkout sem consentimento comercial.
       */
      if (!input.customerConfirmed) {
        // Não retrocede uma contratação já paga ou com pagamento preparado.
        if (
          flow.state === CommercialFlowState.PAGAMENTO_APROVADO ||
          flow.state === CommercialFlowState.AGUARDANDO_PAGAMENTO
        ) {
          const existing = await this.findPaymentByOffer(oferta.id);
          if (existing && this.isPaid(existing.status)) {
            return {
              status: "ALREADY_PAID",
              flow,
              paymentId: existing.id,
              checkoutUrl: this.safeCheckoutUrl(existing),
              amount,
              reusedPayment: true,
            };
          }
          if (existing && flow.state === CommercialFlowState.AGUARDANDO_PAGAMENTO) {
            return {
              status: "PAYMENT_READY",
              flow,
              paymentId: existing.id,
              checkoutUrl: this.safeCheckoutUrl(existing),
              amount,
              reusedPayment: true,
            };
          }
        }
        flow =
          await this.flowState.setState(
            flow.id,
            CommercialFlowState
              .AGUARDANDO_CONFIRMACAO_COMPRA,
            {
              paymentAmount:
                amount,

              paymentConfirmationRequestedAt:
                new Date()
                  .toISOString(),
            },
          );

        return {
          status:
            "CONFIRMATION_REQUIRED",

          flow,

          paymentId:
            null,

          checkoutUrl:
            null,

          amount,
        };
      }

      /**
       * ============================================================
       * 3. PROCURA PAGAMENTO EXISTENTE
       * ============================================================
       *
       * Idempotência:
       *
       * refresh
       * mensagem repetida
       * clique repetido
       * reprocessamento
       *
       * não devem gerar várias cobranças.
       */
      let pagamento =
        await this.findPaymentByOffer(
          oferta.id,
        );

      /**
       * ============================================================
       * 4. JÁ ESTÁ PAGO?
       * ============================================================
       */
      if (
        pagamento &&
        this.isPaid(
          pagamento.status,
        )
      ) {
        flow =
          await this.flowState.update(
            flow.id,
            {
              paymentId:
                pagamento.id,

              sourceType:
                CommercialFlowSourceType
                  .SERVICE_OFFER,

              sourceId:
                oferta.id,

              state:
                CommercialFlowState
                  .PAGAMENTO_APROVADO,

              metadata: {
                paymentAlreadyApproved:
                  true,

                paymentDetectedAt:
                  new Date()
                    .toISOString(),
              },
            },
          );

        return {
          status:
            "ALREADY_PAID",

          flow,

          paymentId:
            pagamento.id,

          checkoutUrl:
            this.safeCheckoutUrl(
              pagamento,
            ),

          amount,

          reusedPayment:
            true,
        };
      }

      /**
       * ============================================================
       * 5. PAGAMENTO PENDENTE JÁ EXISTE
       * ============================================================
       */
      if (pagamento) {
        const existingUrl =
          this.safeCheckoutUrl(
            pagamento,
          );

        /**
         * Se já existe pagamento e link válido,
         * apenas reutilizamos.
         */
        if (existingUrl || process.env.NODE_ENV === "local") {
          flow =
            await this.flowState
              .setPayment(
                flow.id,
                {
                  paymentId:
                    pagamento.id,

                  sourceType:
                    CommercialFlowSourceType
                      .SERVICE_OFFER,

                  sourceId:
                    oferta.id,
                },
              );

          flow =
            await this.flowState.update(
              flow.id,
              {
                metadata: {
                  paymentReused:
                    true,

                  paymentUrl:
                    existingUrl,

                  paymentPreparedAt:
                    new Date()
                      .toISOString(),
                },
              },
            );

          return {
            status:
              "PAYMENT_READY",

            flow,

            paymentId:
              pagamento.id,

            checkoutUrl:
              existingUrl,

            amount,

            reusedPayment:
              true,
          };
        }
      }

      /**
       * ============================================================
       * 6. CRIAR / GERAR CHECKOUT
       * ============================================================
       *
       * Temos dois cenários:
       *
       * PENDENTE
       * -> ServicoOfertaService.aceitarOferta()
       *
       * ACEITA
       * -> oferta já foi aceita anteriormente, mas checkout
       *    pode ter falhado. Nesse caso chamamos diretamente
       *    o PagamentoService.
       */

      const ofertaStatus =
        String(
          oferta.status || "",
        )
          .trim()
          .toUpperCase();

      let paymentGatewayResult:
        unknown =
        null;

      /**
       * ============================================================
       * OFERTA PENDENTE
       * ============================================================
       */
      if (
        ofertaStatus ===
        "PENDENTE"
      ) {
        const accepted =
          await ServicoOfertaService
            .aceitarOferta(
              oferta.id,
              oferta.prestadorId,
            );

        paymentGatewayResult =
          accepted?.pagamento ??
          null;
      }

      /**
       * ============================================================
       * OFERTA JÁ ACEITA
       * ============================================================
       */
      else if (
        ofertaStatus ===
        "ACEITA"
      ) {
        paymentGatewayResult =
          await PagamentoService
            .criarCheckoutMercadoPago({
              ofertaId:
                oferta.id,

              titulo:
                this.resolveOfferTitle(
                  oferta,
                ),

              valor:
                amount,

              pagadorId:
                flow.customerUserId!,
            });
      }

      /**
       * Outros status não podem gerar
       * uma nova cobrança silenciosamente.
       */
      else {
        /**
         * Verificamos mais uma vez se existe pagamento.
         */
        pagamento =
          await this.findPaymentByOffer(
            oferta.id,
          );

        if (!pagamento) {
          throw new Error(
            `COMMERCIAL_PAYMENT_OFERTA_STATUS_INVALIDO_${ofertaStatus || "VAZIO"}`,
          );
        }
      }

      /**
       * ============================================================
       * 7. BUSCA O REGISTRO REAL DE PAGAMENTO
       * ============================================================
       *
       * Não confiamos apenas no objeto retornado pelo gateway.
       *
       * O vínculo oficial é:
       *
       * Pagamento.ofertaId = oferta.id
       */
      pagamento =
        await this.findPaymentByOffer(
          oferta.id,
        );

      if (!pagamento) {
        /**
         * Algumas implementações do gateway podem devolver
         * um objeto antes do registro ficar acessível.
         *
         * Tentamos extrair ID apenas como diagnóstico,
         * mas não gravamos um ID inventado.
         */
        const returnedId =
          this.extractPaymentId(
            paymentGatewayResult,
          );

        console.error(
          "[COMMERCIAL PAYMENT] Gateway respondeu, mas pagamento não foi localizado",
          {
            flowId:
              flow.id,

            ofertaId:
              oferta.id,

            returnedPaymentId:
              returnedId,
          },
        );

        throw new Error(
          "COMMERCIAL_PAYMENT_REGISTRO_NAO_ENCONTRADO_APOS_CHECKOUT",
        );
      }

      /**
       * ============================================================
       * 8. EXTRAI LINK
       * ============================================================
       */
      const checkoutUrl =
        this.safeCheckoutUrl(
          paymentGatewayResult,
        ) ||
        this.safeCheckoutUrl(
          pagamento,
        );

      /**
       * Link pode eventualmente não existir no registro local
       * dependendo da implementação atual do PagamentoService.
       *
       * Não impedimos a persistência do paymentId,
       * mas registramos esse fato.
       */
      if (!checkoutUrl) {
        console.warn(
          "[COMMERCIAL PAYMENT] Pagamento criado sem URL detectável",
          {
            flowId:
              flow.id,

            ofertaId:
              oferta.id,

            paymentId:
              pagamento.id,
          },
        );
      }

      /**
       * ============================================================
       * 9. SALVA NO COMMERCIAL FLOW
       * ============================================================
       */
      flow =
        await this.flowState
          .setPayment(
            flow.id,
            {
              paymentId:
                pagamento.id,

              sourceType:
                CommercialFlowSourceType
                  .SERVICE_OFFER,

              sourceId:
                oferta.id,
            },
          );

      flow =
        await this.flowState.update(
          flow.id,
          {
            metadata: {
              paymentPreparedAt:
                new Date()
                  .toISOString(),

              paymentUrl:
                checkoutUrl,

              paymentAmount:
                amount,

              paymentReused:
                false,

              ofertaStatusAfterPayment:
                "ACEITA",
            },
          },
        );

      console.log(
        "[COMMERCIAL PAYMENT] Checkout pronto",
        {
          flowId:
            flow.id,

          ofertaId:
            oferta.id,

          paymentId:
            pagamento.id,

          amount,

          hasCheckoutUrl:
            Boolean(
              checkoutUrl,
            ),
        },
      );

      return {
        status:
          "PAYMENT_READY",

        flow,

        paymentId:
          pagamento.id,

        checkoutUrl,

        amount,

        reusedPayment:
          false,
      };
    } catch (error) {
      await this.flowState.markError(
        flow.id,
        error,
      );

      console.error(
        "[COMMERCIAL PAYMENT] Erro",
        {
          flowId:
            flow.id,

          ofertaId:
            flow.ofertaId,

          error:
            error instanceof Error
              ? error.message
              : error,
        },
      );

      throw error;
    }
  }

  /**
   * ================================================================
   * CONSULTAR STATUS ATUAL
   * ================================================================
   *
   * Útil para:
   *
   * - retorno do checkout;
   * - abertura do chat;
   * - polling eventual;
   * - diagnóstico.
   *
   * Ainda assim o WEBHOOK será a fonte principal
   * para transição automática.
   */
  async checkPayment(
    flowId: string,
  ) {
    this.assertLocalPaymentIsolation();

    const flow =
      await this.flowState.findById(
        flowId,
      );

    if (!flow) {
      throw new Error(
        "COMMERCIAL_FLOW_NAO_ENCONTRADO",
      );
    }

    if (!flow.ofertaId) {
      throw new Error(
        "COMMERCIAL_PAYMENT_OFERTA_NAO_DEFINIDA",
      );
    }

    const pagamento =
      await this.findPaymentByOffer(
        flow.ofertaId,
      );

    if (!pagamento) {
      return {
        status:
          "NOT_FOUND" as const,

        flow,

        payment:
          null,
      };
    }

    if (
      this.isPaid(
        pagamento.status,
      )
    ) {
      const updatedFlow =
        await this.flowState
          .markPaymentApproved(
            flow.id,
          );

      return {
        status:
          "PAID" as const,

        flow:
          updatedFlow,

        payment:
          pagamento,
      };
    }

    return {
      status:
        "PENDING" as const,

      flow,

      payment:
        pagamento,
    };
  }

  /**
   * ================================================================
   * VALIDAR FLOW
   * ================================================================
   */
  private validateFlow(
    flow: CommercialFlow,
  ): void {
    if (!flow.ativo) {
      throw new Error(
        "COMMERCIAL_PAYMENT_FLOW_INATIVO",
      );
    }

    if (!flow.customerUserId) {
      throw new Error(
        "COMMERCIAL_PAYMENT_CLIENTE_NAO_IDENTIFICADO",
      );
    }

    if (!flow.ofertaId) {
      throw new Error(
        "COMMERCIAL_PAYMENT_OFERTA_NAO_CRIADA",
      );
    }

    if (
      flow.sourceType !==
        CommercialFlowSourceType
          .SERVICE_OFFER &&
      flow.sourceType !==
        CommercialFlowSourceType
          .NONE
    ) {
      throw new Error(
        "COMMERCIAL_PAYMENT_SOURCE_TYPE_INVALIDO",
      );
    }
  }

  /**
   * ================================================================
   * CARREGAR OFERTA
   * ================================================================
   */
  private async loadOferta(
    ofertaId: string,
  ): Promise<ServicoOferta> {
    const oferta =
      await this.ofertaRepository
        .findOne({
          where: {
            id:
              ofertaId,
          },

          relations: [
            "solicitacao",
          ],
        });

    if (!oferta) {
      throw new Error(
        "COMMERCIAL_PAYMENT_OFERTA_NAO_ENCONTRADA",
      );
    }

    return oferta;
  }

  /**
   * ================================================================
   * PAGAMENTO POR OFERTA
   * ================================================================
   */
  private async findPaymentByOffer(
    ofertaId: string,
  ): Promise<Pagamento | null> {
    /**
     * Preferimos o repository porque precisamos
     * do objeto real tipado.
     */
    return this.pagamentoRepository
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

  /**
   * ================================================================
   * STATUS PAGO
   * ================================================================
   *
   * Seu projeto possui variações históricas:
   *
   * PAGO
   * APROVADO
   * APPROVED
   *
   * Tratamos as três aqui.
   */
  private isPaid(
    value:
      | string
      | null
      | undefined,
  ): boolean {
    const status =
      String(
        value || "",
      )
        .trim()
        .toUpperCase();

    return [
      "PAGO",
      "APROVADO",
      "APPROVED",
      "PAID",
    ].includes(
      status,
    );
  }

  /**
   * ================================================================
   * TÍTULO
   * ================================================================
   */
  private resolveOfferTitle(
    oferta: ServicoOferta,
  ): string {
    const solicitacao =
      (oferta as any)
        .solicitacao;

    const title =
      String(
        solicitacao?.titulo ||
        "Serviço GranConecta",
      ).trim();

    return (
      title ||
      "Serviço GranConecta"
    );
  }

  /**
   * ================================================================
   * EXTRAIR ID DO PAGAMENTO
   * ================================================================
   */
  private extractPaymentId(
    value: unknown,
  ): string | null {
    if (!value) {
      return null;
    }

    if (
      typeof value ===
      "string"
    ) {
      return null;
    }

    if (
      typeof value !==
      "object"
    ) {
      return null;
    }

    const source =
      value as Record<
        string,
        any
      >;

    const candidates = [
      source.id,
      source.paymentId,
      source.pagamentoId,
      source.payment?.id,
      source.pagamento?.id,
    ];

    for (
      const candidate of
      candidates
    ) {
      const id =
        String(
          candidate || "",
        ).trim();

      if (id) {
        return id;
      }
    }

    return null;
  }

  /**
   * ================================================================
   * EXTRAIR URL
   * ================================================================
   *
   * Seu frontend atual já precisa tratar várias formas de resposta:
   *
   * link_pagamento
   * checkoutUrl
   * payment.link_pagamento
   * payment.checkoutUrl
   *
   * Centralizamos tudo aqui.
   */
  private extractPaymentUrl(
    value: unknown,
  ): string | null {
    if (!value) {
      return null;
    }

    if (
      typeof value ===
      "string"
    ) {
      const raw =
        value.trim();

      if (
        /^https?:\/\//i.test(
          raw,
        )
      ) {
        return raw;
      }

      return null;
    }

    if (
      typeof value !==
      "object"
    ) {
      return null;
    }

    const source =
      value as Record<
        string,
        any
      >;

    const candidates = [
      source.link_pagamento,
      source.linkPagamento,

      source.checkoutUrl,
      source.checkout_url,

      source.init_point,
      source.sandbox_init_point,

      source.url,

      source.payment
        ?.link_pagamento,

      source.payment
        ?.checkoutUrl,

      source.payment
        ?.init_point,

      source.pagamento
        ?.link_pagamento,

      source.pagamento
        ?.checkoutUrl,

      source.preference
        ?.init_point,

      source.preference
        ?.sandbox_init_point,
    ];

    for (
      const candidate of
      candidates
    ) {
      const url =
        String(
          candidate || "",
        ).trim();

      if (
        /^https?:\/\//i.test(
          url,
        )
      ) {
        return url;
      }
    }

    return null;
  }
}

export default CommercialPaymentService;