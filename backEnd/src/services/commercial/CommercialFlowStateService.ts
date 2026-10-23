import {
  IsNull,
  Not,
  Repository,
} from "typeorm";

import { AppDataSource } from "../../config/data-source";

import {
  CommercialFlow,
  CommercialFlowSourceType,
  CommercialFlowState,
  CommercialFlowType,
} from "../../models/CommercialFlowModel";

type CreateOrGetFlowInput = {
  conversationId: string;

  storeId: string;

  opportunityId?: string | null;

  customerUserId?: string | null;

  catalogItemId?: string | null;

  catalogItemType?: CommercialFlowType | null;

  metadata?: Record<string, unknown> | null;
};

type UpdateFlowInput = {
  opportunityId?: string | null;

  customerUserId?: string | null;

  catalogItemId?: string | null;

  catalogItemType?: CommercialFlowType | null;

  amount?: number | null;

  quantity?: number;

  totalSessions?: number | null;

  state?: CommercialFlowState;

  sourceType?: CommercialFlowSourceType;

  sourceId?: string | null;

  solicitacaoId?: string | null;

  candidaturaId?: string | null;

  ofertaId?: string | null;

  orderId?: string | null;

  paymentId?: string | null;

  agendaId?: string | null;

  activePackageId?: string | null;

  preferredDate?: string | null;

  preferredTime?: string | null;

  schedulePlan?:
    | Array<{
        data: string;
        inicio?: string;
        fim?: string;
        agendaId?: string;
      }>
    | null;

  metadata?: Record<string, unknown> | null;

  ativo?: boolean;

  lastError?: string | null;

  completedAt?: Date | null;
};

type SetCatalogItemInput = {
  catalogItemId: string;

  catalogItemType: CommercialFlowType;

  amount?: number | null;

  quantity?: number;

  totalSessions?: number | null;

  metadata?: Record<string, unknown> | null;
};

type SetSchedulingPreferenceInput = {
  preferredDate?: string | null;

  preferredTime?: string | null;

  schedulePlan?:
    | Array<{
        data: string;
        inicio?: string;
        fim?: string;
        agendaId?: string;
      }>
    | null;
};

type SetServiceReferencesInput = {
  solicitacaoId?: string | null;

  candidaturaId?: string | null;

  ofertaId?: string | null;
};

type SetPaymentInput = {
  paymentId: string;

  sourceType?: CommercialFlowSourceType;

  sourceId?: string | null;
};

/**
 * ================================================================
 * COMMERCIAL FLOW STATE SERVICE
 * ================================================================
 *
 * Responsabilidade:
 *
 * - criar/reutilizar fluxo comercial;
 * - recuperar fluxo ativo;
 * - persistir item selecionado;
 * - persistir data/horário;
 * - guardar IDs comerciais;
 * - alterar estados;
 * - finalizar/cancelar fluxo;
 * - impedir que o GranConectaChatService precise descobrir
 *   o estado comercial apenas olhando histórico da conversa.
 *
 * Este service NÃO:
 *
 * - consulta agenda;
 * - cria pagamento;
 * - cria solicitação;
 * - cria candidatura;
 * - cria oferta;
 * - chama IA;
 *
 * Ele apenas controla ESTADO.
 */
export class CommercialFlowStateService {
  /**
   * Repositório é resolvido por getter para evitar problemas
   * durante inicialização do AppDataSource.
   */
  private get repository(): Repository<CommercialFlow> {
    return AppDataSource.getRepository(
      CommercialFlow,
    );
  }

  /**
   * ================================================================
   * BUSCAR FLUXO POR ID
   * ================================================================
   */
  async findById(
    flowId: string,
  ): Promise<CommercialFlow | null> {
    const id =
      String(flowId || "").trim();

    if (!id) {
      return null;
    }

    return this.repository.findOne({
      where: {
        id,
      },
    });
  }

  /**
   * ================================================================
   * BUSCAR FLUXO ATIVO DA CONVERSA
   * ================================================================
   *
   * Uma conversa pode ter várias conversões históricas,
   * mas somente uma deverá estar ativa por vez.
   */
  async findActiveByConversation(
    conversationId: string,
  ): Promise<CommercialFlow | null> {
    const id =
      String(
        conversationId || "",
      ).trim();

    if (!id) {
      return null;
    }

    return this.repository.findOne({
      where: {
        conversationId: id,
        ativo: true,
      },

      order: {
        updatedAt: "DESC",
      },
    });
  }

  /**
   * ================================================================
   * BUSCAR FLUXO ATIVO DA OPORTUNIDADE
   * ================================================================
   */
  async findActiveByOpportunity(
    opportunityId: string,
  ): Promise<CommercialFlow | null> {
    const id =
      String(
        opportunityId || "",
      ).trim();

    if (!id) {
      return null;
    }

    return this.repository.findOne({
      where: {
        opportunityId: id,
        ativo: true,
      },

      order: {
        updatedAt: "DESC",
      },
    });
  }

  /**
   * ================================================================
   * CRIAR OU REUTILIZAR FLUXO
   * ================================================================
   *
   * Esta será uma das funções mais usadas pelo futuro
   * CommercialConversionOrchestrator.
   *
   * Regra:
   *
   * 1. tenta encontrar pela conversationId;
   * 2. se não encontrar e houver opportunityId, tenta oportunidade;
   * 3. se encontrar, apenas sincroniza contexto;
   * 4. se não encontrar, cria novo fluxo.
   */
  async getOrCreate(
    input: CreateOrGetFlowInput,
  ): Promise<CommercialFlow> {
    const conversationId =
      String(
        input.conversationId || "",
      ).trim();

    const storeId =
      String(
        input.storeId || "",
      ).trim();

    const opportunityId =
      input.opportunityId
        ? String(
            input.opportunityId,
          ).trim()
        : null;

    const customerUserId =
      input.customerUserId
        ? String(
            input.customerUserId,
          ).trim()
        : null;

    const catalogItemId =
      input.catalogItemId
        ? String(
            input.catalogItemId,
          ).trim()
        : null;

    if (!conversationId) {
      throw new Error(
        "COMMERCIAL_FLOW_CONVERSATION_ID_OBRIGATORIO",
      );
    }

    if (!storeId) {
      throw new Error(
        "COMMERCIAL_FLOW_STORE_ID_OBRIGATORIO",
      );
    }

    /**
     * Primeiro procuramos pela própria conversa.
     */
    let flow =
      await this.findActiveByConversation(
        conversationId,
      );

    /**
     * Pode ocorrer login/redirecionamento ou continuação
     * em uma conversa nova ligada à mesma oportunidade.
     */
    if (
      !flow &&
      opportunityId
    ) {
      flow =
        await this.findActiveByOpportunity(
          opportunityId,
        );
    }

    if (flow) {
      /**
       * Proteção importante:
       *
       * um fluxo comercial ativo não pode trocar silenciosamente
       * de Store.
       */
      if (
        flow.storeId &&
        flow.storeId !== storeId
      ) {
        throw new Error(
          "COMMERCIAL_FLOW_STORE_DIVERGENTE",
        );
      }

      let changed = false;

      /**
       * Se o fluxo foi encontrado pela oportunidade depois
       * de login/retorno, atualizamos conversationId.
       */
      if (
        flow.conversationId !==
        conversationId
      ) {
        flow.conversationId =
          conversationId;

        changed = true;
      }

      if (
        opportunityId &&
        !flow.opportunityId
      ) {
        flow.opportunityId =
          opportunityId;

        changed = true;
      }

      if (
        customerUserId &&
        !flow.customerUserId
      ) {
        flow.customerUserId =
          customerUserId;

        changed = true;
      }

      if (
        catalogItemId &&
        !flow.catalogItemId
      ) {
        flow.catalogItemId =
          catalogItemId;

        changed = true;
      }

      if (
        input.catalogItemType &&
        !flow.catalogItemType
      ) {
        flow.catalogItemType =
          input.catalogItemType;

        changed = true;
      }

      if (input.metadata) {
        flow.metadata =
          this.mergeMetadata(
            flow.metadata,
            input.metadata,
          );

        changed = true;
      }

      if (changed) {
        flow =
          await this.repository.save(
            flow,
          );
      }

      console.log(
        "[COMMERCIAL FLOW] Fluxo reutilizado",
        {
          flowId:
            flow.id,

          conversationId:
            flow.conversationId,

          opportunityId:
            flow.opportunityId,

          storeId:
            flow.storeId,

          state:
            flow.state,

          customerUserId:
            flow.customerUserId,

          catalogItemId:
            flow.catalogItemId,
        },
      );

      return flow;
    }

    /**
     * Nenhum fluxo existente.
     * Criamos um novo.
     */
    const created =
      this.repository.create({
        conversationId,

        opportunityId,

        storeId,

        customerUserId,

        catalogItemId,

        catalogItemType:
          input.catalogItemType ||
          null,

        state:
          catalogItemId
            ? CommercialFlowState.ITEM_SELECIONADO
            : CommercialFlowState.INICIADO,

        sourceType:
          CommercialFlowSourceType.NONE,

        sourceId:
          null,

        amount:
          null,

        quantity:
          1,

        totalSessions:
          null,

        solicitacaoId:
          null,

        candidaturaId:
          null,

        ofertaId:
          null,

        orderId:
          null,

        paymentId:
          null,

        agendaId:
          null,

        activePackageId:
          null,

        preferredDate:
          null,

        preferredTime:
          null,

        schedulePlan:
          null,

        metadata:
          input.metadata ||
          null,

        ativo:
          true,

        lastError:
          null,

        completedAt:
          null,
      });

    const saved =
      await this.repository.save(
        created,
      );

    console.log(
      "[COMMERCIAL FLOW] Novo fluxo criado",
      {
        flowId:
          saved.id,

        conversationId:
          saved.conversationId,

        opportunityId:
          saved.opportunityId,

        storeId:
          saved.storeId,

        state:
          saved.state,
      },
    );

    return saved;
  }

  /**
   * ================================================================
   * ATUALIZAÇÃO GENÉRICA
   * ================================================================
   *
   * O Orchestrator poderá usar este método para alterações
   * pontuais sem acessar repository diretamente.
   */
  async update(
    flowId: string,
    input: UpdateFlowInput,
  ): Promise<CommercialFlow> {
    const flow =
      await this.requireFlow(
        flowId,
      );

    if (
      input.opportunityId !==
      undefined
    ) {
      flow.opportunityId =
        input.opportunityId;
    }

    if (
      input.customerUserId !==
      undefined
    ) {
      flow.customerUserId =
        input.customerUserId;
    }

    if (
      input.catalogItemId !==
      undefined
    ) {
      flow.catalogItemId =
        input.catalogItemId;
    }

    if (
      input.catalogItemType !==
      undefined
    ) {
      flow.catalogItemType =
        input.catalogItemType;
    }

    if (
      input.amount !==
      undefined
    ) {
      flow.amount =
        input.amount;
    }

    if (
      input.quantity !==
      undefined
    ) {
      flow.quantity =
        Math.max(
          1,
          Number(
            input.quantity || 1,
          ),
        );
    }

    if (
      input.totalSessions !==
      undefined
    ) {
      flow.totalSessions =
        input.totalSessions;
    }

    if (
      input.state !==
      undefined
    ) {
      flow.state =
        input.state;
    }

    if (
      input.sourceType !==
      undefined
    ) {
      flow.sourceType =
        input.sourceType;
    }

    if (
      input.sourceId !==
      undefined
    ) {
      flow.sourceId =
        input.sourceId;
    }

    if (
      input.solicitacaoId !==
      undefined
    ) {
      flow.solicitacaoId =
        input.solicitacaoId;
    }

    if (
      input.candidaturaId !==
      undefined
    ) {
      flow.candidaturaId =
        input.candidaturaId;
    }

    if (
      input.ofertaId !==
      undefined
    ) {
      flow.ofertaId =
        input.ofertaId;
    }

    if (
      input.orderId !==
      undefined
    ) {
      flow.orderId =
        input.orderId;
    }

    if (
      input.paymentId !==
      undefined
    ) {
      flow.paymentId =
        input.paymentId;
    }

    if (
      input.agendaId !==
      undefined
    ) {
      flow.agendaId =
        input.agendaId;
    }

    if (
      input.activePackageId !==
      undefined
    ) {
      flow.activePackageId =
        input.activePackageId;
    }

    if (
      input.preferredDate !==
      undefined
    ) {
      flow.preferredDate =
        input.preferredDate;
    }

    if (
      input.preferredTime !==
      undefined
    ) {
      flow.preferredTime =
        this.normalizeTime(
          input.preferredTime,
        );
    }

    if (
      input.schedulePlan !==
      undefined
    ) {
      flow.schedulePlan =
        input.schedulePlan;
    }

    if (
      input.metadata !==
      undefined
    ) {
      flow.metadata =
        input.metadata === null
          ? null
          : this.mergeMetadata(
              flow.metadata,
              input.metadata,
            );
    }

    if (
      input.ativo !==
      undefined
    ) {
      flow.ativo =
        input.ativo;
    }

    if (
      input.lastError !==
      undefined
    ) {
      flow.lastError =
        input.lastError;
    }

    if (
      input.completedAt !==
      undefined
    ) {
      flow.completedAt =
        input.completedAt;
    }

    const saved =
      await this.repository.save(
        flow,
      );

    return saved;
  }

  /**
   * ================================================================
   * ALTERAR ESTADO
   * ================================================================
   */
  async setState(
    flowId: string,
    state: CommercialFlowState,
    metadata?: Record<
      string,
      unknown
    >,
  ): Promise<CommercialFlow> {
    const flow =
      await this.requireFlow(
        flowId,
      );

    const previousState =
      flow.state;

    flow.state =
      state;

    flow.lastError =
      null;

    if (metadata) {
      flow.metadata =
        this.mergeMetadata(
          flow.metadata,
          metadata,
        );
    }

    const saved =
      await this.repository.save(
        flow,
      );

    console.log(
      "[COMMERCIAL FLOW] Estado alterado",
      {
        flowId:
          saved.id,

        previousState,

        state:
          saved.state,

        conversationId:
          saved.conversationId,

        opportunityId:
          saved.opportunityId,
      },
    );

    return saved;
  }

  /**
   * ================================================================
   * ITEM DO CATÁLOGO
   * ================================================================
   */
  async setCatalogItem(
    flowId: string,
    input: SetCatalogItemInput,
  ): Promise<CommercialFlow> {
    const flow =
      await this.requireFlow(
        flowId,
      );

    const catalogItemId =
      String(
        input.catalogItemId || "",
      ).trim();

    if (!catalogItemId) {
      throw new Error(
        "COMMERCIAL_FLOW_CATALOG_ITEM_ID_OBRIGATORIO",
      );
    }

    flow.catalogItemId =
      catalogItemId;

    flow.catalogItemType =
      input.catalogItemType;

    if (
      input.amount !== undefined
    ) {
      flow.amount =
        input.amount;
    }

    if (
      input.quantity !== undefined
    ) {
      flow.quantity =
        Math.max(
          1,
          Number(
            input.quantity || 1,
          ),
        );
    }

    if (
      input.totalSessions !==
      undefined
    ) {
      flow.totalSessions =
        input.totalSessions;
    }

    if (input.metadata) {
      flow.metadata =
        this.mergeMetadata(
          flow.metadata,
          input.metadata,
        );
    }

    flow.state =
      CommercialFlowState.ITEM_SELECIONADO;

    flow.lastError =
      null;

    const saved =
      await this.repository.save(
        flow,
      );

    console.log(
      "[COMMERCIAL FLOW] Item selecionado",
      {
        flowId:
          saved.id,

        catalogItemId:
          saved.catalogItemId,

        catalogItemType:
          saved.catalogItemType,

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
   * CLIENTE IDENTIFICADO
   * ================================================================
   */
  async setCustomer(
    flowId: string,
    customerUserId: string,
  ): Promise<CommercialFlow> {
    const flow =
      await this.requireFlow(
        flowId,
      );

    const id =
      String(
        customerUserId || "",
      ).trim();

    if (!id) {
      throw new Error(
        "COMMERCIAL_FLOW_CUSTOMER_ID_OBRIGATORIO",
      );
    }

    flow.customerUserId =
      id;

    flow.state =
      CommercialFlowState.CLIENTE_IDENTIFICADO;

    flow.lastError =
      null;

    const saved =
      await this.repository.save(
        flow,
      );

    console.log(
      "[COMMERCIAL FLOW] Cliente identificado",
      {
        flowId:
          saved.id,

        customerUserId:
          saved.customerUserId,
      },
    );

    return saved;
  }

  /**
   * ================================================================
   * PREFERÊNCIA DE AGENDA
   * ================================================================
   *
   * Isto NÃO cria agenda.
   *
   * Apenas registra intenção/preferência.
   */
  async setSchedulingPreference(
    flowId: string,
    input: SetSchedulingPreferenceInput,
  ): Promise<CommercialFlow> {
    const flow =
      await this.requireFlow(
        flowId,
      );

    if (
      input.preferredDate !==
      undefined
    ) {
      flow.preferredDate =
        input.preferredDate;
    }

    if (
      input.preferredTime !==
      undefined
    ) {
      flow.preferredTime =
        this.normalizeTime(
          input.preferredTime,
        );
    }

    if (
      input.schedulePlan !==
      undefined
    ) {
      flow.schedulePlan =
        input.schedulePlan;
    }

    /**
     * Determinamos o próximo estado
     * sem consultar agenda ainda.
     */
    if (
      flow.preferredDate &&
      flow.preferredTime
    ) {
      flow.state =
        CommercialFlowState
          .VERIFICANDO_DISPONIBILIDADE;
    } else if (
      flow.preferredDate
    ) {
      flow.state =
        CommercialFlowState
          .AGUARDANDO_HORARIO;
    } else {
      flow.state =
        CommercialFlowState
          .AGUARDANDO_DATA;
    }

    const saved =
      await this.repository.save(
        flow,
      );

    console.log(
      "[COMMERCIAL FLOW] Preferência de agenda atualizada",
      {
        flowId:
          saved.id,

        preferredDate:
          saved.preferredDate,

        preferredTime:
          saved.preferredTime,

        state:
          saved.state,
      },
    );

    return saved;
  }

  /**
   * ================================================================
   * IDs DO MOTOR DE SERVIÇO
   * ================================================================
   */
  async setServiceReferences(
    flowId: string,
    input: SetServiceReferencesInput,
  ): Promise<CommercialFlow> {
    const flow =
      await this.requireFlow(
        flowId,
      );

    if (
      input.solicitacaoId !==
      undefined
    ) {
      flow.solicitacaoId =
        input.solicitacaoId;
    }

    if (
      input.candidaturaId !==
      undefined
    ) {
      flow.candidaturaId =
        input.candidaturaId;
    }

    if (
      input.ofertaId !==
      undefined
    ) {
      flow.ofertaId =
        input.ofertaId;
    }

    /**
     * O estado representa o ponto mais avançado
     * que realmente existe.
     */
    if (flow.ofertaId) {
      flow.state =
        CommercialFlowState
          .OFERTA_CRIADA;

      flow.sourceType =
        CommercialFlowSourceType
          .SERVICE_OFFER;

      flow.sourceId =
        flow.ofertaId;
    } else if (
      flow.candidaturaId
    ) {
      flow.state =
        CommercialFlowState
          .CANDIDATURA_CRIADA;
    } else if (
      flow.solicitacaoId
    ) {
      flow.state =
        CommercialFlowState
          .SOLICITACAO_CRIADA;
    }

    const saved =
      await this.repository.save(
        flow,
      );

    console.log(
      "[COMMERCIAL FLOW] Referências de serviço atualizadas",
      {
        flowId:
          saved.id,

        solicitacaoId:
          saved.solicitacaoId,

        candidaturaId:
          saved.candidaturaId,

        ofertaId:
          saved.ofertaId,

        state:
          saved.state,
      },
    );

    return saved;
  }

  /**
   * ================================================================
   * PAGAMENTO
   * ================================================================
   */
  async setPayment(
    flowId: string,
    input: SetPaymentInput,
  ): Promise<CommercialFlow> {
    const flow =
      await this.requireFlow(
        flowId,
      );

    const paymentId =
      String(
        input.paymentId || "",
      ).trim();

    if (!paymentId) {
      throw new Error(
        "COMMERCIAL_FLOW_PAYMENT_ID_OBRIGATORIO",
      );
    }

    flow.paymentId =
      paymentId;

    if (
      input.sourceType
    ) {
      flow.sourceType =
        input.sourceType;
    }

    if (
      input.sourceId !==
      undefined
    ) {
      flow.sourceId =
        input.sourceId;
    }

    flow.state =
      CommercialFlowState
        .AGUARDANDO_PAGAMENTO;

    flow.lastError =
      null;

    const saved =
      await this.repository.save(
        flow,
      );

    console.log(
      "[COMMERCIAL FLOW] Pagamento associado",
      {
        flowId:
          saved.id,

        paymentId:
          saved.paymentId,

        sourceType:
          saved.sourceType,

        sourceId:
          saved.sourceId,
      },
    );

    return saved;
  }

  /**
   * ================================================================
   * PAGAMENTO APROVADO
   * ================================================================
   *
   * Futuramente o webhook Mercado Pago chamará isto
   * antes de disparar a próxima etapa.
   */
  async markPaymentApproved(
    flowId: string,
  ): Promise<CommercialFlow> {
    return this.setState(
      flowId,
      CommercialFlowState
        .PAGAMENTO_APROVADO,
      {
        paymentApprovedAt:
          new Date().toISOString(),
      },
    );
  }

  /**
   * ================================================================
   * AGENDA EFETIVAMENTE CRIADA
   * ================================================================
   */
  async markScheduled(
    flowId: string,
    agendaId: string,
  ): Promise<CommercialFlow> {
    const flow =
      await this.requireFlow(
        flowId,
      );

    const id =
      String(
        agendaId || "",
      ).trim();

    if (!id) {
      throw new Error(
        "COMMERCIAL_FLOW_AGENDA_ID_OBRIGATORIO",
      );
    }

    flow.agendaId =
      id;

    flow.state =
      CommercialFlowState.AGENDADO;

    flow.lastError =
      null;

    const saved =
      await this.repository.save(
        flow,
      );

    console.log(
      "[COMMERCIAL FLOW] Agenda confirmada",
      {
        flowId:
          saved.id,

        agendaId:
          saved.agendaId,

        preferredDate:
          saved.preferredDate,

        preferredTime:
          saved.preferredTime,
      },
    );

    return saved;
  }

  /**
   * ================================================================
   * ERRO
   * ================================================================
   */
  async markError(
    flowId: string,
    error: unknown,
  ): Promise<CommercialFlow> {
    const flow =
      await this.requireFlow(
        flowId,
      );

    const message =
      error instanceof Error
        ? error.message
        : String(
            error ||
              "ERRO_DESCONHECIDO",
          );

    flow.state =
      CommercialFlowState.ERRO;

    flow.lastError =
      message.slice(
        0,
        255,
      );

    flow.metadata =
      this.mergeMetadata(
        flow.metadata,
        {
          lastErrorAt:
            new Date().toISOString(),
        },
      );

    const saved =
      await this.repository.save(
        flow,
      );

    console.error(
      "[COMMERCIAL FLOW] Fluxo em erro",
      {
        flowId:
          saved.id,

        error:
          saved.lastError,
      },
    );

    return saved;
  }

  /**
   * ================================================================
   * RETORNAR PARA IA
   * ================================================================
   *
   * Exemplo:
   * cliente não quer novo pacote e prefere continuar conversando.
   */
  async returnToAI(
    flowId: string,
  ): Promise<CommercialFlow> {
    return this.setState(
      flowId,
      CommercialFlowState
        .RETORNANDO_IA,
    );
  }

  /**
   * ================================================================
   * HANDOFF HUMANO
   * ================================================================
   */
  async waitHuman(
    flowId: string,
  ): Promise<CommercialFlow> {
    return this.setState(
      flowId,
      CommercialFlowState
        .AGUARDANDO_HUMANO,
    );
  }

  /**
   * ================================================================
   * FINALIZAR
   * ================================================================
   */
  async complete(
    flowId: string,
  ): Promise<CommercialFlow> {
    const flow =
      await this.requireFlow(
        flowId,
      );

    flow.state =
      CommercialFlowState.FINALIZADO;

    flow.ativo =
      false;

    flow.completedAt =
      new Date();

    flow.lastError =
      null;

    const saved =
      await this.repository.save(
        flow,
      );

    console.log(
      "[COMMERCIAL FLOW] Fluxo finalizado",
      {
        flowId:
          saved.id,

        conversationId:
          saved.conversationId,

        sourceType:
          saved.sourceType,

        sourceId:
          saved.sourceId,

        paymentId:
          saved.paymentId,

        agendaId:
          saved.agendaId,
      },
    );

    return saved;
  }

  /**
   * ================================================================
   * CANCELAR
   * ================================================================
   */
  async cancel(
    flowId: string,
    reason?: string,
  ): Promise<CommercialFlow> {
    const flow =
      await this.requireFlow(
        flowId,
      );

    flow.state =
      CommercialFlowState.CANCELADO;

    flow.ativo =
      false;

    flow.completedAt =
      new Date();

    flow.metadata =
      this.mergeMetadata(
        flow.metadata,
        {
          cancelReason:
            reason || null,

          cancelledAt:
            new Date()
              .toISOString(),
        },
      );

    const saved =
      await this.repository.save(
        flow,
      );

    console.log(
      "[COMMERCIAL FLOW] Fluxo cancelado",
      {
        flowId:
          saved.id,

        reason:
          reason || null,
      },
    );

    return saved;
  }

  /**
   * ================================================================
   * DESATIVAR OUTROS FLUXOS DA CONVERSA
   * ================================================================
   *
   * Será útil se futuramente precisarmos iniciar uma
   * conversão completamente nova na mesma conversa.
   */
  async deactivateOtherFlows(
    conversationId: string,
    keepFlowId?: string,
  ): Promise<void> {
    const id =
      String(
        conversationId || "",
      ).trim();

    if (!id) {
      return;
    }

    const flows =
      await this.repository.find({
        where: {
          conversationId: id,
          ativo: true,
        },
      });

    const toDeactivate =
      flows.filter(
        (flow) =>
          !keepFlowId ||
          flow.id !==
            keepFlowId,
      );

    if (!toDeactivate.length) {
      return;
    }

    for (
      const flow of
      toDeactivate
    ) {
      flow.ativo =
        false;

      if (
        flow.state !==
          CommercialFlowState
            .FINALIZADO &&
        flow.state !==
          CommercialFlowState
            .CANCELADO
      ) {
        flow.state =
          CommercialFlowState
            .CANCELADO;
      }

      flow.completedAt =
        flow.completedAt ||
        new Date();
    }

    await this.repository.save(
      toDeactivate,
    );
  }

  /**
   * ================================================================
   * VALIDAÇÃO INTERNA
   * ================================================================
   */
  private async requireFlow(
    flowId: string,
  ): Promise<CommercialFlow> {
    const id =
      String(
        flowId || "",
      ).trim();

    if (!id) {
      throw new Error(
        "COMMERCIAL_FLOW_ID_OBRIGATORIO",
      );
    }

    const flow =
      await this.findById(
        id,
      );

    if (!flow) {
      throw new Error(
        "COMMERCIAL_FLOW_NAO_ENCONTRADO",
      );
    }

    return flow;
  }

  /**
   * ================================================================
   * MERGE DE METADATA
   * ================================================================
   */
  private mergeMetadata(
    current:
      | Record<
          string,
          unknown
        >
      | null
      | undefined,

    incoming:
      | Record<
          string,
          unknown
        >
      | null
      | undefined,
  ): Record<string, unknown> {
    return {
      ...(current || {}),
      ...(incoming || {}),
    };
  }

  /**
   * ================================================================
   * NORMALIZAÇÃO DE HORÁRIO
   * ================================================================
   *
   * Aceita:
   *
   * 15
   * 15h
   * 15:00
   * 9h
   * 09:30
   *
   * Retorna:
   *
   * 15:00
   * 09:30
   */
  private normalizeTime(
    value:
      | string
      | null
      | undefined,
  ): string | null {
    if (!value) {
      return null;
    }

    const raw =
      String(value)
        .trim()
        .toLowerCase();

    const match =
      raw.match(
        /^(\d{1,2})(?:[:h](\d{2}))?h?$/,
      );

    if (!match) {
      return raw.slice(
        0,
        5,
      );
    }

    const hour =
      Number(
        match[1],
      );

    const minute =
      match[2]
        ? Number(
            match[2],
          )
        : 0;

    if (
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59
    ) {
      return raw.slice(
        0,
        5,
      );
    }

    return `${String(
      hour,
    ).padStart(
      2,
      "0",
    )}:${String(
      minute,
    ).padStart(
      2,
      "0",
    )}`;
  }
}

export default CommercialFlowStateService;