import { AppDataSource } from "../../config/data-source";

import {
  BusinessCatalogItem,
  BusinessCatalogItemType,
  BusinessCatalogSchedulingPolicy,
} from "../../models/BusinessCatalogItemModel";

import { Agenda } from "../../models/AgendaModels";

import {
  CommercialFlow,
  CommercialFlowState,
  CommercialFlowType,
} from "../../models/CommercialFlowModel";

import AgendaDisponibilidadeService from "../AgendaDisponibilidadeService";
import { BusinessCatalogService } from "../BusinessCatalogService";

import CommercialFlowStateService from "./CommercialFlowStateService";
import CommercialCustomerService from "./CommercialCustomerService";
import CommercialQuickRegistrationService from "./CommercialQuickRegistrationService";
import CommercialServiceConversionService from "./CommercialServiceConversionService";
import CommercialPaymentService from "./CommercialPaymentService";

/**
 * ================================================================
 * INPUT
 * ================================================================
 *
 * O GranConectaChatService futuramente enviará somente os fatos
 * que conseguiu determinar.
 *
 * O Orchestrator não depende da IA para decidir se algo foi
 * realmente executado.
 */
export type CommercialConversionInput = {
  conversationId: string;

  storeId: string;

  opportunityId?: string | null;

  customerUserId?: string | null;

  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerPassword?: string | null;
  createdUserId?: string | null;
  customerConfirmed?: boolean;

  origem?:
  | "WHATSAPP"
  | "INSTAGRAM"
  | "FACEBOOK"
  | "LANDING_PAGE"
  | "CHAT_HOME"
  | "OUTRO";

  /**
   * Item comercial explicitamente escolhido.
   *
   * Pode chegar na primeira chamada ou posteriormente.
   */
  catalogItemId?: string | null;

  /**
   * Pode ser:
   *
   * "quarta-feira"
   * "02/09/2026"
   * "2026-09-02"
   */
  preferredDate?: string | null;

  /**
   * Pode ser:
   *
   * "15h"
   * "15:00"
   */
  preferredTime?: string | null;

  /**
   * Contexto adicional que desejarmos preservar.
   */
  metadata?: Record<string, unknown> | null;
};

/**
 * ================================================================
 * NEXT ACTION
 * ================================================================
 *
 * Não é uma ação da IA.
 *
 * É o que o backend determinou que precisa acontecer em seguida.
 */
export type CommercialNextAction =
  | "NONE"
  | "SELECT_ITEM"
  | "ASK_DATE"
  | "ASK_TIME"
  | "CHECK_AVAILABILITY"
  | "SELECT_ALTERNATIVE_SLOT"
  | "IDENTIFY_CUSTOMER"
  | "ASK_NAME"
  | "ASK_EMAIL"
  | "ASK_PHONE"
  | "ASK_PASSWORD"
  | "LOGIN_REQUIRED"
  | "CONFIRM_PURCHASE"
  | "PAYMENT_READY"
  | "CONTINUE_SERVICE_CONVERSION"
  | "CONTINUE_PRODUCT_CONVERSION"
  | "RETURN_TO_AI";

/**
 * ================================================================
 * RESULT
 * ================================================================
 */
export type CommercialConversionResult = {
  handled: boolean;

  flow: CommercialFlow;

  state: CommercialFlowState;

  nextAction: CommercialNextAction;

  message: string;

  data?: {
    catalogItem?: {
      id: string;
      tipo: BusinessCatalogItemType;
      nome: string;
      preco: number;
      totalSessoes: number;
      duracaoMinutos: number | null;
    };

    availability?: {
      disponivel: boolean;

      data?: string | null;
      hora?: string | null;

      motivo?: string | null;

      alternativas?: Array<{
        data: string;
        hora: string;
      }>;
    };

    customer?: {
      id?: string | null;
      nome?: string | null;
      email?: string | null;
      telefone?: string | null;
      requiresLogin?: boolean;
      requiresRegistration?: boolean;
    };

    serviceConversion?: {
      solicitacaoId: string;
      candidaturaId: string;
      ofertaId: string;
      amount: number;
      totalSessions: number;
    };

    payment?: {
      paymentId: string | null;
      checkoutUrl: string | null;
      amount: number;
      status:
      | "CONFIRMATION_REQUIRED"
      | "PAYMENT_READY"
      | "ALREADY_PAID";
    };
  };
};

/**
 * ================================================================
 * COMMERCIAL CONVERSION ORCHESTRATOR
 * ================================================================
 *
 * Este é o MOTOR de conversão.
 *
 * O GranConectaChatService não deverá mais:
 *
 * - afirmar que consultou agenda sem consultar;
 * - afirmar que horário está disponível sem resultado real;
 * - afirmar que agendou;
 * - decidir sozinho se deve criar pagamento;
 * - reconstruir estado comercial pelo histórico inteiro.
 *
 * O ChatService conversa.
 * O Orchestrator decide e executa transições comerciais.
 */
export class CommercialConversionOrchestrator {
  private readonly catalogService =
    new BusinessCatalogService();

  constructor(
    private readonly flowState =
      new CommercialFlowStateService(),

    private readonly customerService =
      new CommercialCustomerService(),

    private readonly quickRegistration =
      new CommercialQuickRegistrationService(),

    private readonly serviceConversion =
      new CommercialServiceConversionService(),

    private readonly paymentService =
      new CommercialPaymentService(),
  ) { }

  private get catalogRepository() {
    return AppDataSource.getRepository(
      BusinessCatalogItem,
    );
  }

  private get agendaRepository() {
    return AppDataSource.getRepository(
      Agenda,
    );
  }

  /**
   * ================================================================
   * PROCESS
   * ================================================================
   *
   * Entrada principal.
   */
  async process(
    input: CommercialConversionInput,
  ): Promise<CommercialConversionResult> {
    const conversationId =
      String(
        input.conversationId || "",
      ).trim();

    const storeId =
      String(
        input.storeId || "",
      ).trim();

    if (!conversationId) {
      throw new Error(
        "COMMERCIAL_CONVERSION_CONVERSATION_ID_OBRIGATORIO",
      );
    }

    if (!storeId) {
      throw new Error(
        "COMMERCIAL_CONVERSION_STORE_ID_OBRIGATORIO",
      );
    }

    /**
     * ============================================================
     * 1. CRIA OU REUTILIZA O FLUXO
     * ============================================================
     */
    let flow =
      await this.flowState.getOrCreate({
        conversationId,

        storeId,

        opportunityId:
          input.opportunityId ||
          null,

        customerUserId:
          input.customerUserId ||
          null,

        metadata:
          input.metadata ||
          null,
      });

    try {
      /**
       * ============================================================
       * 2. SINCRONIZA CLIENTE
       * ============================================================
       */
      if (
        input.customerUserId &&
        !flow.customerUserId
      ) {
        flow =
          await this.flowState.setCustomer(
            flow.id,
            input.customerUserId,
          );
      }

      /**
       * ============================================================
       * 3. ITEM DO CATÁLOGO
       * ============================================================
       */
      /**
       * Só vincula o item quando ele ainda não está no fluxo
       * ou quando o usuário realmente escolheu OUTRO item.
       *
       * Antes, catalogItemId chegava novamente em praticamente todas
       * as mensagens do fluxo. Isso fazia setCatalogItem() rodar de novo
       * e o CommercialFlow voltava para ITEM_SELECIONADO, perdendo o
       * estado atual (ex.: AGUARDANDO_CADASTRO_RAPIDO,
       * AGUARDANDO_CONFIRMACAO_COMPRA etc.).
       *
       * Resultado do bug:
       * cliente confirmava "sim" e o motor recomeçava em
       * "Qual dia você prefere?".
       */
      if (
        input.catalogItemId &&
        String(flow.catalogItemId || "").trim() !==
        String(input.catalogItemId).trim()
      ) {
        flow =
          await this.attachCatalogItem(
            flow,
            input.catalogItemId,
          );
      }

      /**
       * Ainda não existe item.
       */
      if (!flow.catalogItemId) {
        flow =
          await this.flowState.setState(
            flow.id,
            CommercialFlowState
              .AGUARDANDO_ITEM,
          );

        return {
          handled: true,

          flow,

          state:
            flow.state,

          nextAction:
            "SELECT_ITEM",

          message:
            "Qual produto ou serviço você deseja?",
        };
      }

      /**
       * Precisamos sempre reler o item oficial.
       */
      const catalogItem =
        await this.loadCatalogItem(
          flow.catalogItemId,
          flow.storeId,
        );

      /**
       * ============================================================
       * 4. PRODUTO / CARDÁPIO
       * ============================================================
       *
       * Estes fluxos NÃO usam agenda.
       *
       * Vamos conectar Order/carrinho posteriormente.
       */
      if (
        catalogItem.tipo ===
        BusinessCatalogItemType.PRODUTO ||
        catalogItem.tipo ===
        BusinessCatalogItemType.CARDAPIO
      ) {
        return {
          handled: true,

          flow,

          state:
            flow.state,

          nextAction:
            "CONTINUE_PRODUCT_CONVERSION",

          message:
            `Você escolheu ${catalogItem.nome}. Vamos continuar com a compra.`,

          data: {
            catalogItem:
              this.serializeCatalogItem(
                catalogItem,
              ),
          },
        };
      }

      /**
       * ============================================================
       * 5. SERVIÇO / PACOTE
       * ============================================================
       *
       * Nesta primeira versão, SERVICO e PACOTE passam pelo
       * mecanismo de disponibilidade quando precisam de agenda.
       */
      if (
        catalogItem.tipo ===
        BusinessCatalogItemType.SERVICO ||
        catalogItem.tipo ===
        BusinessCatalogItemType.PACOTE
      ) {
        return this.processScheduledConversion(
          flow,
          catalogItem,
          input,
        );
      }

      /**
       * PROMOCAO ficará para a estratégia própria.
       */
      return {
        handled: false,

        flow,

        state:
          flow.state,

        nextAction:
          "RETURN_TO_AI",

        message:
          "Vou continuar ajudando você com essa opção.",
      };
    } catch (error) {
      /**
       * O fluxo registra o erro técnico.
       *
       * IMPORTANTE:
       * depois não devemos exibir lastError diretamente ao cliente.
       */
      await this.flowState.markError(
        flow.id,
        error,
      );

      throw error;
    }
  }

  /**
   * ================================================================
   * VINCULAR ITEM DO CATÁLOGO
   * ================================================================
   */
  private async attachCatalogItem(
    flow: CommercialFlow,
    catalogItemId: string,
  ): Promise<CommercialFlow> {
    const item =
      await this.loadCatalogItem(
        catalogItemId,
        flow.storeId,
      );

    const price =
      this.catalogService
        .getPrecoVigente(
          item,
        );

    const commercialType =
      this.mapCatalogType(
        item.tipo,
      );

    const saved =
      await this.flowState.setCatalogItem(
        flow.id,
        {
          catalogItemId:
            item.id,

          catalogItemType:
            commercialType,

          amount:
            Number(
              price.precoVigente,
            ),

          quantity:
            1,

          totalSessions:
            Math.max(
              1,
              Number(
                item.totalSessoes ||
                1,
              ),
            ),

          metadata: {
            catalogItemName:
              item.nome,

            catalogItemDescription:
              item.descricao,

            categoriaId:
              item.categoriaId,

            ownerUserId:
              item.ownerUserId,

            modalidade:
              item.modalidade,

            duracaoMinutos:
              item.duracaoMinutos,

            schedulingPolicy:
              item.schedulingPolicy,

            maxSessionsPerWeek:
              item.maxSessionsPerWeek,

            allowStandalonePurchase:
              item.allowStandalonePurchase,

            duplicatePurchasePolicy:
              item.duplicatePurchasePolicy,

            precoBase:
              price.precoBase,

            precoPromocional:
              price.precoPromocional,

            promocaoAtiva:
              price.promocaoAtiva,
          },
        },
      );

    console.log(
      "[COMMERCIAL CONVERSION] Item vinculado",
      {
        flowId:
          saved.id,

        storeId:
          saved.storeId,

        catalogItemId:
          item.id,

        catalogItemName:
          item.nome,

        catalogItemType:
          item.tipo,

        amount:
          saved.amount,

        totalSessions:
          saved.totalSessions,
      },
    );

    return saved;
  }

  /**
   * ================================================================
   * SERVIÇO/PACOTE COM AGENDA
   * ================================================================
   */
  private async processScheduledConversion(
    initialFlow: CommercialFlow,
    catalogItem: BusinessCatalogItem,
    input: CommercialConversionInput,
  ): Promise<CommercialConversionResult> {
    let flow =
      initialFlow;




    const availabilityAlreadyConfirmed =
      flow.metadata?.availabilityConfirmed === true;

    const availabilityValidatedForCustomerId =
      String(
        flow.metadata?.availabilityValidatedForCustomerId || "",
      ).trim();

    const currentCustomerId =
      String(
        flow.customerUserId || "",
      ).trim();

    /**
     * A disponibilidade só pode ser reutilizada quando:
     *
     * 1. ela já foi confirmada;
     * 2. ainda estamos depois da etapa de disponibilidade;
     * 3. se agora existe cliente identificado, a validação anterior
     *    precisa ter sido feita especificamente para esse cliente.
     *
     * Se a primeira consulta ocorreu antes da identificação,
     * availabilityValidatedForCustomerId estará vazio.
     * Quando o cliente aparecer, a agenda será revalidada.
     */
    const availabilityStillValidForCustomer =
      !currentCustomerId ||
      availabilityValidatedForCustomerId === currentCustomerId;

    const isPostAvailabilityState =
      flow.state ===
      CommercialFlowState.AGUARDANDO_CADASTRO_RAPIDO ||
      flow.state ===
      CommercialFlowState.AGUARDANDO_LOGIN ||
      flow.state ===
      CommercialFlowState.CLIENTE_IDENTIFICADO ||
      flow.state ===
      CommercialFlowState.AGUARDANDO_CONFIRMACAO_COMPRA ||
      flow.state ===
      CommercialFlowState.AGUARDANDO_PAGAMENTO;

    if (
      availabilityAlreadyConfirmed &&
      availabilityStillValidForCustomer &&
      isPostAvailabilityState
    ) {
      console.log(
        "[COMMERCIAL CONVERSION] Agenda já validada; continuando fluxo sem nova consulta",
        {
          flowId: flow.id,
          state: flow.state,
          preferredDate: flow.preferredDate,
          preferredTime: flow.preferredTime,
        },
      );

      return this.continueServiceConversion(
        flow,
        catalogItem,
        input,
      );
    }

    /**
     * ============================================================
     * DATA
     * ============================================================
     */
    if (input.preferredDate) {
      const date =
        this.resolveDate(
          input.preferredDate,
        );

      if (!date) {
        flow =
          await this.flowState.setState(
            flow.id,
            CommercialFlowState
              .AGUARDANDO_DATA,
          );

        return {
          handled: true,

          flow,

          state:
            flow.state,

          nextAction:
            "ASK_DATE",

          message:
            "Não consegui identificar essa data. Qual dia você prefere?",
        };
      }

      flow =
        await this.flowState
          .setSchedulingPreference(
            flow.id,
            {
              preferredDate:
                date,

              /**
               * Preserva horário já existente caso
               * esta chamada contenha somente data.
               */
              preferredTime:
                input.preferredTime !==
                  undefined
                  ? input.preferredTime
                  : flow.preferredTime,
            },
          );
    }

    /**
     * ============================================================
     * HORÁRIO SEM NOVA DATA
     * ============================================================
     */
    if (
      input.preferredTime &&
      !input.preferredDate
    ) {
      flow =
        await this.flowState
          .setSchedulingPreference(
            flow.id,
            {
              preferredDate:
                flow.preferredDate,

              preferredTime:
                input.preferredTime,
            },
          );
    }

    /**
     * ============================================================
     * NÃO TEM DATA
     * ============================================================
     */
    if (!flow.preferredDate) {
      flow =
        await this.flowState.setState(
          flow.id,
          CommercialFlowState
            .AGUARDANDO_DATA,
        );

      return {
        handled: true,

        flow,

        state:
          flow.state,

        nextAction:
          "ASK_DATE",

        message:
          `Qual dia você prefere para ${catalogItem.nome}?`,

        data: {
          catalogItem:
            this.serializeCatalogItem(
              catalogItem,
            ),
        },
      };
    }

    /**
     * ============================================================
     * NÃO TEM HORÁRIO
     * ============================================================
     */
    if (!flow.preferredTime) {
      flow =
        await this.flowState.setState(
          flow.id,
          CommercialFlowState
            .AGUARDANDO_HORARIO,
        );

      return {
        handled: true,

        flow,

        state:
          flow.state,

        nextAction:
          "ASK_TIME",

        message:
          `Certo. Qual horário você prefere para ${catalogItem.nome}?`,

        data: {
          catalogItem:
            this.serializeCatalogItem(
              catalogItem,
            ),
        },
      };
    }

    /**
     * ============================================================
     * TEM DATA + HORÁRIO
     * ============================================================
     *
     * Antes de consultar a disponibilidade do profissional,
     * aplicamos a política comercial do item.
     *
     * Isso evita chegar até oferta/pagamento quando o cliente
     * já possui o limite semanal daquele atendimento.
     */
    const weeklyPolicyResult =
      await this.validateWeeklySchedulingBeforePayment(
        flow,
        catalogItem,
      );

    if (weeklyPolicyResult) {
      flow =
        await this.flowState.setState(
          flow.id,
          CommercialFlowState.AGUARDANDO_DATA,
          {
            weeklySchedulingBlocked: true,
            weeklySchedulingBlockedAt:
              new Date().toISOString(),
            weeklySchedulingExistingAgendaId:
              weeklyPolicyResult.existingAgenda.id,
            weeklySchedulingExistingDate:
              String(weeklyPolicyResult.existingAgenda.data),
            weeklySchedulingExistingTime:
              String(weeklyPolicyResult.existingAgenda.hora),
            weeklySchedulingNextAllowedDate:
              weeklyPolicyResult.nextAllowedDate,
          },
        );

      return {
        handled: true,
        flow,
        state: flow.state,
        nextAction: "ASK_DATE",
        message:
          `Você já possui uma sessão marcada para ${this.formatDate(
            String(weeklyPolicyResult.existingAgenda.data),
          )} às ${String(
            weeklyPolicyResult.existingAgenda.hora,
          )}. Este atendimento permite no máximo ${weeklyPolicyResult.maxSessionsPerWeek} sessão(ões) por semana. Posso procurar uma nova data a partir de ${this.formatDate(
            weeklyPolicyResult.nextAllowedDate,
          )}.`,
        data: {
          catalogItem:
            this.serializeCatalogItem(
              catalogItem,
            ),
          availability: {
            disponivel: false,
            data:
              flow.preferredDate,
            hora:
              flow.preferredTime,
            motivo:
              "WEEKLY_LIMIT_REACHED",
            alternativas: [],
          },
        },
      };
    }

    /**
     * Daqui em diante NÃO existe IA decidindo disponibilidade.
     */
    flow =
      await this.flowState.setState(
        flow.id,
        CommercialFlowState
          .VERIFICANDO_DISPONIBILIDADE,
      );

    return this.checkAvailability(
      flow,
      catalogItem,
      input,
    );
  }

  /**
   * ================================================================
   * CONSULTA REAL DA AGENDA
   * ================================================================
   */
  private async checkAvailability(
    flow: CommercialFlow,
    catalogItem: BusinessCatalogItem,
    input: CommercialConversionInput,
  ): Promise<CommercialConversionResult> {
    const prestadorId =
      String(
        catalogItem.ownerUserId ||
        "",
      ).trim();

    if (!prestadorId) {
      throw new Error(
        "COMMERCIAL_CATALOG_ITEM_SEM_PRESTADOR_RESPONSAVEL",
      );
    }

    if (
      !flow.preferredDate ||
      !flow.preferredTime
    ) {
      throw new Error(
        "COMMERCIAL_FLOW_PREFERENCIA_INCOMPLETA",
      );
    }

    const duration =
      Math.max(
        1,
        Number(
          catalogItem
            .duracaoMinutos ||
          60,
        ),
      );

    console.log(
      "[COMMERCIAL CONVERSION] Consultando agenda real",
      {
        flowId:
          flow.id,

        prestadorId,

        catalogItemId:
          catalogItem.id,

        catalogItemName:
          catalogItem.nome,

        date:
          flow.preferredDate,

        time:
          flow.preferredTime,

        duration,
      },
    );

    /**
     * Esta é a mesma consulta real já usada no
     * GranConectaChatService atual.
     */
    const availability =
      await AgendaDisponibilidadeService
        .consultarHorario({
          prestadorId,

          moradorId:
            flow.customerUserId || null,

          data:
            flow.preferredDate,

          hora:
            flow.preferredTime,

          duracaoMinutos:
            duration,

          modalidade:
            catalogItem.modalidade,

          limiteAlternativas:
            3,
        });

    /**
     * ============================================================
     * INADIMPLÊNCIA DO PRESTADOR
     * ============================================================
     */
    if (
      !availability.disponivel &&
      availability.motivo ===
      "ASSINATURA_INADIMPLENTE"
    ) {
      flow =
        await this.flowState.setState(
          flow.id,
          CommercialFlowState
            .HORARIO_INDISPONIVEL,
          {
            availabilityReason:
              availability.motivo,
          },
        );

      return {
        handled: true,

        flow,

        state:
          flow.state,

        nextAction:
          "RETURN_TO_AI",

        message:
          "No momento, este profissional está temporariamente indisponível para novos atendimentos.",

        data: {
          catalogItem:
            this.serializeCatalogItem(
              catalogItem,
            ),

          availability: {
            disponivel: false,

            data:
              flow.preferredDate,

            hora:
              flow.preferredTime,

            motivo:
              availability.motivo,

            alternativas:
              [],
          },
        },
      };
    }

    /**
     * ============================================================
     * HORÁRIO OCUPADO
     * ============================================================
     */
    if (!availability.disponivel) {
      const alternatives =
        Array.isArray(
          availability.alternativas,
        )
          ? availability.alternativas.map(
            (slot) => ({
              data:
                String(
                  slot.data,
                ),

              hora:
                String(
                  slot.hora,
                ),
            }),
          )
          : [];

      flow =
        await this.flowState.setState(
          flow.id,
          CommercialFlowState
            .HORARIO_INDISPONIVEL,
          {
            availabilityCheckedAt:
              new Date()
                .toISOString(),

            availabilityReason:
              availability.motivo ||
              null,

            alternatives,
          },
        );

      const alternativesText =
        alternatives.length
          ? alternatives
            .map(
              (slot) =>
                `${this.formatDate(
                  slot.data,
                )} às ${slot.hora}`,
            )
            .join(", ")
          : "";

      return {
        handled: true,

        flow,

        state:
          flow.state,

        nextAction:
          alternatives.length
            ? "SELECT_ALTERNATIVE_SLOT"
            : "ASK_DATE",

        message:
          alternativesText
            ? `Esse horário não está disponível. Encontrei estas opções reais: ${alternativesText}. Qual delas funciona melhor para você?`
            : "Esse horário não está disponível e não encontrei outra vaga próxima. Qual outro dia você prefere?",

        data: {
          catalogItem:
            this.serializeCatalogItem(
              catalogItem,
            ),

          availability: {
            disponivel:
              false,

            data:
              flow.preferredDate,

            hora:
              flow.preferredTime,

            motivo:
              availability.motivo ||
              null,

            alternativas:
              alternatives,
          },
        },
      };
    }

    /**
     * ============================================================
     * HORÁRIO REALMENTE DISPONÍVEL
     * ============================================================
     */
    flow =
      await this.flowState.setState(
        flow.id,
        CommercialFlowState
          .HORARIO_DISPONIVEL,
        {
          availabilityCheckedAt:
            new Date()
              .toISOString(),

          availabilityConfirmed:
            true,

          availabilityValidatedForCustomerId:
            flow.customerUserId || null,

          availabilityReason:
            null,
        },
      );

    console.log(
      "[COMMERCIAL CONVERSION] Horário disponível",
      {
        flowId:
          flow.id,

        prestadorId,

        date:
          flow.preferredDate,

        time:
          flow.preferredTime,
      },
    );

    /**
     * ============================================================
     * PRÓXIMO PASSO: IDENTIDADE -> OFERTA -> PAGAMENTO
     * ============================================================
     */
    return this.continueServiceConversion(
      flow,
      catalogItem,
      input,
    );
  }

  /**
   * ================================================================
   * CONTINUAR CONVERSÃO DE SERVIÇO
   * ================================================================
   */
  private async continueServiceConversion(
    initialFlow: CommercialFlow,
    catalogItem: BusinessCatalogItem,
    input: CommercialConversionInput,
  ): Promise<CommercialConversionResult> {
    let flow = initialFlow;

    if (!flow.customerUserId) {
      const customerResolution =
        await this.customerService.resolve({
          flowId: flow.id,
          authenticatedUserId: input.customerUserId || null,
          nome: input.customerName || null,
          email: input.customerEmail || null,
          telefone: input.customerPhone || null,
        });

      if (customerResolution.status === "LOGIN_REQUIRED") {
        flow = await this.flowState.setState(
          flow.id,
          CommercialFlowState.AGUARDANDO_LOGIN,
          {
            loginCustomerUserId:
              customerResolution.customerUserId,
          },
        );

        return {
          handled: true,
          flow,
          state: flow.state,
          nextAction: "LOGIN_REQUIRED",
          message:
            "Encontrei um cadastro com esses dados. Faça login para continuar exatamente deste ponto.",
          data: {
            catalogItem:
              this.serializeCatalogItem(catalogItem),
            customer: {
              id: customerResolution.customerUserId,
              nome: customerResolution.user.name,
              email: customerResolution.user.email,
              telefone: customerResolution.user.telefone,
              requiresLogin: true,
              requiresRegistration: false,
            },
          },
        };
      }

      if (customerResolution.status === "REGISTRATION_REQUIRED") {
        const registration =
          await this.quickRegistration.prepare({
            flowId: flow.id,
            nome:
              input.customerName ||
              customerResolution.suggestedData.nome,
            email:
              input.customerEmail ||
              customerResolution.suggestedData.email,
            telefone:
              input.customerPhone ||
              customerResolution.suggestedData.telefone,
            createdUserId:
              input.createdUserId || null,
          });

        if (registration.status === "REGISTERED") {
          flow =
            (await this.flowState.findById(flow.id)) ||
            flow;
        } else if (registration.status === "USER_ALREADY_EXISTS") {
          flow = await this.flowState.setState(
            flow.id,
            CommercialFlowState.AGUARDANDO_LOGIN,
          );

          return {
            handled: true,
            flow,
            state: flow.state,
            nextAction: "LOGIN_REQUIRED",
            message:
              "Esse cadastro já existe. Faça login para continuarmos com a contratação.",
            data: {
              catalogItem:
                this.serializeCatalogItem(catalogItem),
              customer: {
                id: registration.customerUserId,
                nome: registration.data.nome,
                email: registration.data.email,
                telefone: registration.data.telefone,
                requiresLogin: true,
                requiresRegistration: false,
              },
            },
          };
        } else if (registration.status === "MISSING_DATA") {
          const firstMissing =
            registration.missingFields[0];

          const nextAction: CommercialNextAction =
            firstMissing === "nome"
              ? "ASK_NAME"
              : firstMissing === "email"
                ? "ASK_EMAIL"
                : "ASK_PHONE";

          const message =
            firstMissing === "nome"
              ? "Para continuar, qual é o seu nome completo?"
              : firstMissing === "email"
                ? "Qual e-mail você deseja usar no GranConecta?"
                : "Qual é o seu telefone com DDD?";

          const currentFlow =
            (await this.flowState.findById(flow.id)) ||
            flow;

          return {
            handled: true,
            flow: currentFlow,
            state: currentFlow.state,
            nextAction,
            message,
            data: {
              catalogItem:
                this.serializeCatalogItem(catalogItem),
              customer: {
                nome: registration.data.nome,
                email: registration.data.email,
                telefone: registration.data.telefone,
                requiresLogin: false,
                requiresRegistration: true,
              },
            },
          };
        } else if (registration.status === "READY_TO_CREATE") {
          if (!input.customerPassword) {
            const currentFlow =
              (await this.flowState.findById(flow.id)) ||
              flow;

            return {
              handled: true,
              flow: currentFlow,
              state: currentFlow.state,
              nextAction: "ASK_PASSWORD",
              message:
                "Seus dados estão prontos. Crie uma senha com pelo menos 6 caracteres para concluir seu cadastro e continuar.",
              data: {
                catalogItem:
                  this.serializeCatalogItem(catalogItem),
                customer: {
                  nome: registration.data.nome,
                  email: registration.data.email,
                  telefone: registration.data.telefone,
                  requiresLogin: false,
                  requiresRegistration: true,
                },
              },
            };
          }

          const created =
            await this.quickRegistration.createAccount({
              flowId: flow.id,
              senha: input.customerPassword,
            });

          flow =
            (await this.flowState.findById(flow.id)) ||
            flow;

          console.log(
            "[COMMERCIAL CONVERSION] Cadastro rápido concluído",
            {
              flowId: flow.id,
              customerUserId: created.customerUserId,
            },
          );
        }
      } else if (customerResolution.status === "IDENTIFIED") {
        flow =
          (await this.flowState.findById(flow.id)) ||
          flow;
      }
    }

    if (!flow.customerUserId) {
      return {
        handled: true,
        flow,
        state: flow.state,
        nextAction: "IDENTIFY_CUSTOMER",
        message:
          `${this.formatDate(flow.preferredDate!)} às ${flow.preferredTime} está disponível. Preciso identificar você para continuar.`,
        data: {
          catalogItem:
            this.serializeCatalogItem(catalogItem),
        },
      };
    }

    const serviceResult =
      await this.serviceConversion.convert({
        flowId: flow.id,
        origem: input.origem || "LANDING_PAGE",
        metadata:
          input.metadata || undefined,
      });

    flow = serviceResult.flow;

    const paymentResult =
      await this.paymentService.preparePayment({
        flowId: flow.id,
        customerConfirmed:
          input.customerConfirmed === true,
      });

    flow = paymentResult.flow;

    if (paymentResult.status === "CONFIRMATION_REQUIRED") {
      return {
        handled: true,
        flow,
        state: flow.state,
        nextAction: "CONFIRM_PURCHASE",
        message:
          `${catalogItem.nome} está disponível para ${this.formatDate(
            flow.preferredDate!,
          )} às ${flow.preferredTime}, no valor de R$ ${paymentResult.amount
            .toFixed(2)
            .replace(".", ",")}. Você confirma a contratação?`,
        data: {
          catalogItem:
            this.serializeCatalogItem(catalogItem),
          serviceConversion: {
            solicitacaoId: serviceResult.solicitacaoId,
            candidaturaId: serviceResult.candidaturaId,
            ofertaId: serviceResult.ofertaId,
            amount: serviceResult.amount,
            totalSessions: serviceResult.totalSessions,
          },
          payment: {
            paymentId: null,
            checkoutUrl: null,
            amount: paymentResult.amount,
            status: "CONFIRMATION_REQUIRED",
          },
        },
      };
    }

    if (paymentResult.status === "ALREADY_PAID") {
      return {
        handled: true,
        flow,
        state: flow.state,
        nextAction: "NONE",
        message:
          "Seu pagamento já foi identificado. O sistema está concluindo a próxima etapa da contratação.",
        data: {
          catalogItem:
            this.serializeCatalogItem(catalogItem),
          serviceConversion: {
            solicitacaoId: serviceResult.solicitacaoId,
            candidaturaId: serviceResult.candidaturaId,
            ofertaId: serviceResult.ofertaId,
            amount: serviceResult.amount,
            totalSessions: serviceResult.totalSessions,
          },
          payment: {
            paymentId: paymentResult.paymentId,
            checkoutUrl: paymentResult.checkoutUrl,
            amount: paymentResult.amount,
            status: "ALREADY_PAID",
          },
        },
      };
    }

    return {
      handled: true,
      flow,
      state: flow.state,
      nextAction: "PAYMENT_READY",
      message:
        paymentResult.checkoutUrl
          ? `Pagamento preparado. Use o link para confirmar sua contratação de ${catalogItem.nome}. O agendamento só será confirmado após a aprovação do pagamento.`
          : "O pagamento foi criado, mas não encontrei o link de checkout. O atendimento pode recuperar esse pagamento sem criar uma nova cobrança.",
      data: {
        catalogItem:
          this.serializeCatalogItem(catalogItem),
        serviceConversion: {
          solicitacaoId: serviceResult.solicitacaoId,
          candidaturaId: serviceResult.candidaturaId,
          ofertaId: serviceResult.ofertaId,
          amount: serviceResult.amount,
          totalSessions: serviceResult.totalSessions,
        },
        payment: {
          paymentId: paymentResult.paymentId,
          checkoutUrl: paymentResult.checkoutUrl,
          amount: paymentResult.amount,
          status: "PAYMENT_READY",
        },
      },
    };
  }

  /**
   * ================================================================
   * REGRA SEMANAL ANTES DO PAGAMENTO
   * ================================================================
   *
   * A regra é do item/categoria, não da profissão.
   *
   * ONE_PER_WEEK:
   * - consulta agendas reais do mesmo cliente;
   * - considera a mesma categoria comercial;
   * - vale tanto para pacote quanto para sessão avulsa;
   * - impede continuar até oferta/pagamento quando a semana já
   *   atingiu o limite.
   *
   * DAILY_ALLOWED / MULTIPLE_PER_DAY:
   * - não aplicam bloqueio semanal aqui.
   */
  private async validateWeeklySchedulingBeforePayment(
    flow: CommercialFlow,
    catalogItem: BusinessCatalogItem,
  ): Promise<{
    existingAgenda: Agenda;
    maxSessionsPerWeek: number;
    nextAllowedDate: string;
  } | null> {
    if (
      catalogItem.schedulingPolicy !==
      BusinessCatalogSchedulingPolicy.ONE_PER_WEEK
    ) {
      return null;
    }

    if (
      !flow.customerUserId ||
      !flow.preferredDate
    ) {
      /*
       * Antes da identificação do cliente não temos como comparar
       * agendas pessoais com segurança. A barreira final continua
       * existindo no CommercialSchedulingService.
       */
      return null;
    }

    const maxSessionsPerWeek =
      Math.max(
        1,
        Number(
          catalogItem.maxSessionsPerWeek ||
          1,
        ),
      );

    const {
      startDate,
      endDate,
      nextAllowedDate,
    } =
      this.resolveWeekRange(
        flow.preferredDate,
      );

    const qb =
      this.agendaRepository
        .createQueryBuilder(
          "agenda",
        )
        .innerJoin(
          "servico_oferta",
          "oferta_week",
          "oferta_week.id = agenda.ofertaId",
        )
        .innerJoin(
          CommercialFlow,
          "flow_week",
          "flow_week.ofertaId = oferta_week.id",
        )
        .innerJoin(
          BusinessCatalogItem,
          "catalog_week",
          "catalog_week.id = flow_week.catalogItemId",
        )
        .where(
          "flow_week.customerUserId = :customerUserId",
          {
            customerUserId:
              flow.customerUserId,
          },
        )
        .andWhere(
          "agenda.data >= :startDate",
          {
            startDate,
          },
        )
        .andWhere(
          "agenda.data <= :endDate",
          {
            endDate,
          },
        )
        .orderBy(
          "agenda.data",
          "ASC",
        )
        .addOrderBy(
          "agenda.hora",
          "ASC",
        );

    if (
      catalogItem.categoriaId !== null &&
      catalogItem.categoriaId !== undefined
    ) {
      qb.andWhere(
        "catalog_week.categoriaId = :categoriaId",
        {
          categoriaId:
            catalogItem.categoriaId,
        },
      );
    } else {
      qb.andWhere(
        "catalog_week.id = :catalogItemId",
        {
          catalogItemId:
            catalogItem.id,
        },
      );
    }

    const agendas =
      await qb.getMany();

    if (
      agendas.length <
      maxSessionsPerWeek
    ) {
      return null;
    }

    const existingAgenda =
      agendas[0];

    if (!existingAgenda) {
      return null;
    }

    console.log(
      "[COMMERCIAL CONVERSION] Limite semanal detectado antes do pagamento",
      {
        flowId:
          flow.id,
        customerUserId:
          flow.customerUserId,
        catalogItemId:
          catalogItem.id,
        categoriaId:
          catalogItem.categoriaId,
        preferredDate:
          flow.preferredDate,
        weekStart:
          startDate,
        weekEnd:
          endDate,
        maxSessionsPerWeek,
        agendasInWeek:
          agendas.map(
            (agenda) => ({
              id:
                agenda.id,
              data:
                agenda.data,
              hora:
                agenda.hora,
            }),
          ),
        nextAllowedDate,
      },
    );

    return {
      existingAgenda,
      maxSessionsPerWeek,
      nextAllowedDate,
    };
  }

  /**
   * Semana comercial: segunda-feira até domingo.
   * nextAllowedDate = segunda-feira da semana seguinte.
   */
  private resolveWeekRange(
    dateValue: string,
  ): {
    startDate: string;
    endDate: string;
    nextAllowedDate: string;
  } {
    const match =
      /^(\d{4})-(\d{2})-(\d{2})$/
        .exec(
          String(
            dateValue || "",
          ).trim(),
        );

    if (!match) {
      throw new Error(
        "COMMERCIAL_CONVERSION_DATA_INVALIDA_PARA_REGRA_SEMANAL",
      );
    }

    const date =
      new Date(
        Date.UTC(
          Number(match[1]),
          Number(match[2]) - 1,
          Number(match[3]),
        ),
      );

    const weekDay =
      date.getUTCDay();

    const daysSinceMonday =
      weekDay === 0
        ? 6
        : weekDay - 1;

    const start =
      new Date(
        date.getTime(),
      );

    start.setUTCDate(
      start.getUTCDate() -
      daysSinceMonday,
    );

    const end =
      new Date(
        start.getTime(),
      );

    end.setUTCDate(
      end.getUTCDate() + 6,
    );

    const next =
      new Date(
        start.getTime(),
      );

    next.setUTCDate(
      next.getUTCDate() + 7,
    );

    return {
      startDate:
        this.formatUtcDate(start),
      endDate:
        this.formatUtcDate(end),
      nextAllowedDate:
        this.formatUtcDate(next),
    };
  }

  private formatUtcDate(
    value: Date,
  ): string {
    const year =
      value.getUTCFullYear();

    const month =
      String(
        value.getUTCMonth() + 1,
      ).padStart(
        2,
        "0",
      );

    const day =
      String(
        value.getUTCDate(),
      ).padStart(
        2,
        "0",
      );

    return `${year}-${month}-${day}`;
  }

  /**
   * ================================================================
   * CARREGAR ITEM OFICIAL
   * ================================================================
   *
   * Muito importante:
   *
   * Nunca aceitamos preço, ownerUserId, duração ou quantidade
   * de sessões vindos da IA.
   *
   * Tudo é relido do banco.
   */
  private async loadCatalogItem(
    catalogItemId: string,
    storeId: string,
  ): Promise<BusinessCatalogItem> {
    const itemId =
      String(
        catalogItemId || "",
      ).trim();

    const businessId =
      String(
        storeId || "",
      ).trim();

    if (!itemId) {
      throw new Error(
        "COMMERCIAL_CATALOG_ITEM_ID_OBRIGATORIO",
      );
    }

    const item =
      await this.catalogRepository
        .findOne({
          where: {
            id:
              itemId,

            storeId:
              businessId,

            ativo:
              true,
          },
        });

    if (!item) {
      throw new Error(
        "COMMERCIAL_CATALOG_ITEM_NAO_ENCONTRADO_OU_NAO_PERTENCE_A_STORE",
      );
    }

    return item;
  }

  /**
   * ================================================================
   * MAPEAR TIPO DE CATÁLOGO
   * ================================================================
   */
  private mapCatalogType(
    type: BusinessCatalogItemType,
  ): CommercialFlowType {
    switch (type) {
      case BusinessCatalogItemType.SERVICO:
        return CommercialFlowType.SERVICO;

      case BusinessCatalogItemType.PACOTE:
        return CommercialFlowType.PACOTE;

      case BusinessCatalogItemType.PRODUTO:
        return CommercialFlowType.PRODUTO;

      case BusinessCatalogItemType.CARDAPIO:
        return CommercialFlowType.CARDAPIO;

      case BusinessCatalogItemType.PROMOCAO:
        return CommercialFlowType.PROMOCAO;

      default:
        throw new Error(
          "COMMERCIAL_CATALOG_ITEM_TYPE_NAO_SUPORTADO",
        );
    }
  }

  /**
   * ================================================================
   * RESOLVER DATA
   * ================================================================
   *
   * Se já vier YYYY-MM-DD, preservamos.
   *
   * Caso contrário usamos o resolver que já existe
   * no AgendaDisponibilidadeService.
   */
  private resolveDate(
    value: string,
  ): string | null {
    const raw =
      String(
        value || "",
      ).trim();

    if (!raw) {
      return null;
    }

    if (
      /^\d{4}-\d{2}-\d{2}$/.test(
        raw,
      )
    ) {
      return raw;
    }

    return (
      AgendaDisponibilidadeService
        .resolverDataPreferida(
          raw,
        ) ||
      null
    );
  }

  /**
   * ================================================================
   * SERIALIZAÇÃO SEGURA DO ITEM
   * ================================================================
   */
  private serializeCatalogItem(
    item: BusinessCatalogItem,
  ) {
    const price =
      this.catalogService
        .getPrecoVigente(
          item,
        );

    return {
      id:
        item.id,

      tipo:
        item.tipo,

      nome:
        item.nome,

      preco:
        Number(
          price.precoVigente,
        ),

      totalSessoes:
        Math.max(
          1,
          Number(
            item.totalSessoes ||
            1,
          ),
        ),

      duracaoMinutos:
        item.duracaoMinutos ??
        null,

      schedulingPolicy:
        item.schedulingPolicy,

      maxSessionsPerWeek:
        item.maxSessionsPerWeek ??
        null,

      allowStandalonePurchase:
        item.allowStandalonePurchase,

      duplicatePurchasePolicy:
        item.duplicatePurchasePolicy,
    };
  }

  /**
   * ================================================================
   * FORMATAR DATA
   * ================================================================
   */
  private formatDate(
    value: string,
  ): string {
    const match =
      String(
        value || "",
      ).match(
        /^(\d{4})-(\d{2})-(\d{2})$/,
      );

    if (!match) {
      return value;
    }

    return `${match[3]}/${match[2]}/${match[1]}`;
  }
}

export default CommercialConversionOrchestrator;