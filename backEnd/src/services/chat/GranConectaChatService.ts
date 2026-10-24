import { ChatPersistenceService } from "./ChatPersistenceService";
import GranConectaDemandRadarService from "./GranConectaDemandRadarService";
import { GranConectaAgentMemoryService } from "../agent/GranConectaAgentMemoryService";
import GranConectaBusinessOwnerContextService from "../agent/GranConectaBusinessOwnerContextService";
import GranConectaIntentService from "../agent/GranConectaIntentService";
import GranConectaResidentIntentService from "../agent/GranConectaResidentIntentService";
import GranConectaResidentMemoryService from "../agent/GranConectaResidentMemoryService";
import GranConectaPartnerConversationService from "../agent/GranConectaPartnerConversationService";
import { ChatKnowledgeService } from "./ChatKnowledgeService";
import { AppDataSource } from "../../config/data-source";
import MarketingOpportunityService from "../MarketingOpportunityService";
import MarketingOpportunityCatalogService from "../MarketingOpportunityCatalogService";
import BusinessCatalogService from "../BusinessCatalogService";
import AgendaDisponibilidadeService from "../AgendaDisponibilidadeService";
import CommercialConversionOrchestrator from "../commercial/CommercialConversionOrchestrator";
import CommercialFlowStateService from "../commercial/CommercialFlowStateService";
import GranConectaAgentContextService, {
  type GranConectaAgentContext,
} from "../agent/GranConectaAgentContextService";
import {
  GranConectaAgentCommercialBridgeService,
} from "../agent/GranConectaAgentCommercialBridgeService";
import GranConectaAgentDecisionService, {
  type GranConectaAgentDecision,
} from "../agent/GranConectaAgentDecisionService";
import type { BusinessCatalogItem } from "../../models/BusinessCatalogItemModel";

import type {
  ChatLeadSignal,
  ChatMessageInput,
  ChatMessageResult,
  ChatBotAction,
  ChatPlaybookPergunta,
  ChatPlaybookFAQ,
} from "./ChatTypes";

type OpenRouterResponse = {
  id?: string;

  choices?: Array<{
    message?: {
      role?: string;
      content?: string;
    };
  }>;

  error?: {
    message?: string;
  };
};

type CommercialIntentType =
  | "NONE"
  | "DISCOVER"
  | "ASK_INFORMATION"
  | "ASK_PRICE"
  | "COMPARE_OPTIONS"
  | "SELECT_ITEM"
  | "BUY_INTENT"
  | "SCHEDULE_INTENT"
  | "PAYMENT_INTENT"
  | "OBJECTION";

type CommercialIntentResult = {
  type: CommercialIntentType;
  commercialInterest: boolean;
};

export class GranConectaChatService {
  private readonly apiKey: string;
  private readonly demandRadar = new GranConectaDemandRadarService();
  private readonly residentMemory = new GranConectaResidentMemoryService();

  private readonly businessCatalog =
    new BusinessCatalogService();

  /**
   * Novo motor comercial.
   *
   * O ChatService continua responsável pela conversa.
   * O Orchestrator controla as transições comerciais reais.
   */
  private readonly commercialConversion =
    new CommercialConversionOrchestrator();

  private readonly commercialFlowState =
    new CommercialFlowStateService();

  /**
   * Cérebro comercial V1.
   *
   * ContextService somente lê fatos.
   * DecisionService interpreta a conversa e sugere a próxima ação.
   * Nenhum dos dois substitui o CommercialConversionOrchestrator.
   */
  private readonly agentContext =
    GranConectaAgentContextService;

  private readonly agentDecision =
    GranConectaAgentDecisionService;

  private readonly agentMemory = new GranConectaAgentMemoryService();

  private readonly businessOwnerContext =
    new GranConectaBusinessOwnerContextService();

  private readonly intentService = new GranConectaIntentService();
  private readonly residentIntentService = new GranConectaResidentIntentService();

  private readonly partnerConversation = new GranConectaPartnerConversationService();

  private readonly agentCommercialBridge =
    new GranConectaAgentCommercialBridgeService();

  /**
   * Piloto controlado.
   *
   * Por padrão ativa somente o Espaço Almarse. Em outros ambientes
   * podemos trocar a Store sem alterar código.
   */
  private readonly agentPilotStoreId =
    String(
      process.env.GRANCONECTA_AGENT_PILOT_STORE_ID ||
      "b08bb3d7-dbc8-4176-8706-a01f3b5d7137",
    ).trim();

  private readonly opportunityCatalog =
    MarketingOpportunityCatalogService;

  private readonly model: string;

  constructor(
    private readonly persistence =
      new ChatPersistenceService(),

    private readonly knowledge =
      new ChatKnowledgeService(),

    private readonly opportunity =
      new MarketingOpportunityService(),

    apiKey =
      process.env.OPENROUTER_API_KEY ||
      "",

    model =
      process.env.OPENROUTER_CHAT_MODEL ||
      "openai/gpt-4o-mini",
  ) {
    this.apiKey =
      apiKey;

    this.model =
      model;
  }

  /**
   * ============================================================
   * SEND MESSAGE
   * ============================================================
   */
  async sendMessage(
    input: ChatMessageInput,
  ): Promise<ChatMessageResult> {
    const message =
      input.message?.trim();

    if (!message) {
      throw new Error(
        "A mensagem é obrigatória.",
      );
    }

    if (!this.apiKey) {
      throw new Error(
        "OPENROUTER_API_KEY não configurada no backend.",
      );
    }

    const chatInput: ChatMessageInput = {
      ...input,

      message,

      chatbotTipo:
        input.chatbotTipo ||
        "GRANCONECTA",

      chatbotOwnerId:
        input.chatbotOwnerId ||
        null,

      origem:
        input.origem ||
        "CHAT_HOME",
    };

    console.log(
      "CHAT INPUT",
      {
        chatbotTipo:
          chatInput.chatbotTipo,

        chatbotOwnerId:
          chatInput.chatbotOwnerId,

        storeName:
          chatInput.storeName,

        origem:
          chatInput.origem,

        channel:
          chatInput.channel,

        externalMessageId:
          chatInput.externalMessageId
            ? "PRESENTE"
            : null,

        campanhaId:
          chatInput.campanhaId || null,

        tipoDestino:
          chatInput.tipoDestino || null,

        categoriaId:
          chatInput.categoriaId || null,

        categoriaNome:
          chatInput.categoriaNome || null,

        playbookId:
          chatInput.playbook?.id || null,

        entradaDiretaCampanha:
          chatInput.entradaDiretaCampanha === true,

        campaignStage:
          chatInput.campaignStage || null,

        playbookStep:
          chatInput.playbookStep || 0,

        opportunityId:
          chatInput.opportunityId || null,

        opportunityBootstrap:
          chatInput.opportunityBootstrap === true,
      },
    );

    let preResolvedOpportunity:
      Awaited<
        ReturnType<
          MarketingOpportunityService["findById"]
        >
      > =
      null;

    if (
      chatInput.opportunityId &&
      (
        chatInput.chatbotTipo ===
        "LOJA" ||
        chatInput.chatbotTipo ===
        "PRESTADOR"
      ) &&
      chatInput.chatbotOwnerId
    ) {
      preResolvedOpportunity =
        await this.opportunity.findById(
          chatInput.opportunityId,
        );

      if (!preResolvedOpportunity) {
        throw new Error(
          "Oportunidade comercial não encontrada.",
        );
      }

      if (
        preResolvedOpportunity.selected_store_id !==
        chatInput.chatbotOwnerId
      ) {
        throw new Error(
          "Esta oportunidade não pertence ao negócio deste chatbot.",
        );
      }

      if (
        chatInput.storeSlug &&
        preResolvedOpportunity.selected_store_slug &&
        preResolvedOpportunity.selected_store_slug !==
        chatInput.storeSlug
      ) {
        throw new Error(
          "O slug da oportunidade não corresponde ao negócio deste chatbot.",
        );
      }

      if (
        preResolvedOpportunity
          .destination_conversation_id
      ) {
        const destinationConversationId = String(
          preResolvedOpportunity.destination_conversation_id,
        ).trim();
        // Nunca substituir silenciosamente uma conversa fornecida pelo cliente.
        // O acesso ao destino sera validado antes da leitura do historico.
        if (
          chatInput.conversationId &&
          String(chatInput.conversationId).trim() !== destinationConversationId
        ) {
          throw new Error(
            "A conversa informada não corresponde à oportunidade comercial.",
          );
        }
        chatInput.conversationId = destinationConversationId;
      } else {
        chatInput.forceNewConversation =
          true;
      }
    }

    // Segurança em profundidade: a oportunidade pode substituir o
    // conversationId informado pelo navegador. Portanto, validamos o ID
    // FINAL antes de resolver a conversa e antes de consultar histórico,
    // memória, catálogo associado à conversa ou fluxo comercial.
    // Chamadas dos conectores externos seguem pelo fluxo interno existente;
    // a rota HTTP pública deve rejeitar origens externas forjadas.
    const trustedExternalOrigin =
      chatInput.origem === "INSTAGRAM" ||
      chatInput.origem === "WHATSAPP" ||
      chatInput.origem === "FACEBOOK";

    if (!trustedExternalOrigin && chatInput.conversationId) {
      const requestedConversationId = String(chatInput.conversationId).trim();
      const customerId = String(chatInput.userId || "").trim();
      const accessToken = String(chatInput.conversationAccessToken || "").trim();

      if (customerId && accessToken) {
        await this.persistence.claimAnonymousConversation(
          requestedConversationId,
          customerId,
          accessToken,
        );
      }

      const authorized = await this.persistence.canAccessConversation(
        requestedConversationId,
        customerId || null,
        accessToken || null,
      );
      if (!authorized) {
        throw new Error("Acesso à conversa não autorizado.");
      }
    }

    /**
     * ==========================================================
     * RESOLVE CONVERSA
     * ==========================================================
     *
     * Instagram e WhatsApp precisam continuar usando
     * a mesma conversa mesmo durante handoff humano.
     */
    const conversation =
      chatInput.origem === "INSTAGRAM" ||
        chatInput.origem === "WHATSAPP" ||
        chatInput.origem === "FACEBOOK"

        ? await this.persistence
          .resolveExternalConversation(
            chatInput,
          )
        : await this.persistence
          .resolveConversation(
            chatInput,
          );

    if (
      conversation.selectedStoreId &&
      conversation.chatbotOwnerId &&
      (
        conversation.chatbotTipo ===
        "LOJA" ||
        conversation.chatbotTipo ===
        "PRESTADOR"
      )
    ) {
      chatInput.chatbotTipo =
        conversation.chatbotTipo;

      chatInput.chatbotOwnerId =
        conversation.chatbotOwnerId;

      chatInput.storeId =
        conversation.selectedStoreId;

      chatInput.lojaId =
        conversation.selectedStoreId;

      chatInput.storeName =
        conversation.selectedStoreName ||
        chatInput.storeName;

      chatInput.storeSlug =
        conversation.selectedStoreSlug ||
        chatInput.storeSlug;

      chatInput.selectedStoreId =
        conversation.selectedStoreId;

      chatInput.selectedStoreName =
        conversation.selectedStoreName;

      chatInput.selectedStoreSlug =
        conversation.selectedStoreSlug;
    }

    chatInput.campaignStage =
      conversation.campaignStage ||
      chatInput.campaignStage ||
      null;

    chatInput.playbookStep =
      Number(
        conversation.playbookStep ??
        chatInput.playbookStep ??
        0,
      );

    let opportunityQualificationContext =
      "";

    // Dados recuperados exclusivamente da conversa de origem vinculada à oportunidade.
    let opportunitySourceCustomerName: string | null = null;

    if (
      chatInput.opportunityId &&
      (
        chatInput.chatbotTipo ===
        "LOJA" ||
        chatInput.chatbotTipo ===
        "PRESTADOR"
      ) &&
      chatInput.chatbotOwnerId
    ) {
      const linkedOpportunity =
        preResolvedOpportunity ||
        await this.opportunity.findById(
          chatInput.opportunityId,
        );

      if (!linkedOpportunity) {
        throw new Error(
          "Oportunidade comercial não encontrada.",
        );
      }

      // O DOT e o especialista possuem conversas diferentes. Para não pedir
      // novamente o nome, consulte SOMENTE a conversa de origem desta
      // oportunidade já vinculada ao negócio escolhido.
      const sourceConversationId = String(
        linkedOpportunity.source_conversation_id || "",
      ).trim();
      if (sourceConversationId && sourceConversationId !== conversation.id) {
        const sourceHistory = await this.persistence.getHistory(
          sourceConversationId,
          100,
        );
        opportunitySourceCustomerName = this.resolveCustomerName(
          { ...chatInput, userName: undefined },
          sourceHistory,
        );
      }

      const opportunityAnswers =
        await this.opportunity.getAnswers(
          linkedOpportunity.id,
        );

      opportunityQualificationContext =
        this.opportunity
          .buildQualificationContext(
            linkedOpportunity,
            opportunityAnswers,
          );

      await this.opportunity
        .attachDestinationConversation(
          linkedOpportunity.id,
          conversation.id,
        );

      await this.opportunity
        .startNegotiation(
          linkedOpportunity.id,
          conversation.id,
        );

      console.log(
        "[CHAT OPORTUNIDADE] Contexto qualificado carregado no chatbot do negócio",
        {
          opportunityId:
            linkedOpportunity.id,
          conversationId:
            conversation.id,
          storeId:
            chatInput.chatbotOwnerId,
          storeName:
            chatInput.storeName || null,
          answers:
            opportunityAnswers.length,
        },
      );
    }

    /**
     * ==========================================================
     * CATÁLOGO COMERCIAL DO NEGÓCIO
     * ==========================================================
     *
     * Carrega uma única vez por mensagem e serve tanto para:
     * - bootstrap da oportunidade;
     * - conversa normal do chatbot do negócio.
     *
     * A IA recebe somente itens realmente cadastrados no banco.
     */
    const businessCatalogData =
      await this.loadBusinessCatalogData(
        chatInput,
      );

    const businessCatalogContext =
      businessCatalogData.context;

    const businessCatalogItems =
      businessCatalogData.items;

    if (
      !chatInput.opportunityId &&
      (
        chatInput.chatbotTipo === "PRESTADOR" ||
        chatInput.chatbotTipo === "LOJA"
      ) &&
      chatInput.chatbotOwnerId
    ) {
      const recoveredOpportunity =
        await this.opportunity
          .findOpenBySourceConversation(
            conversation.id,
          );

      if (
        recoveredOpportunity?.selected_store_id ===
        chatInput.chatbotOwnerId
      ) {
        chatInput.opportunityId =
          recoveredOpportunity.id;

        if (
          recoveredOpportunity.selected_chatbot_tipo ===
          "PRESTADOR"
        ) {
          chatInput.chatbotTipo = "PRESTADOR";
        }

        console.log(
          "[CHAT CONTEXTO] Oportunidade recuperada pela conversa",
          {
            opportunityId:
              recoveredOpportunity.id,
            conversationId:
              conversation.id,
            storeId:
              chatInput.chatbotOwnerId,
          },
        );
      }
    }

    if (businessCatalogItems.length > 0) {
      console.log(
        "[BUSINESS CATALOG] Catálogo oficial terá precedência sobre contexto legado",
        {
          storeId:
            chatInput.chatbotOwnerId ||
            chatInput.storeId ||
            chatInput.lojaId ||
            null,
          chatbotTipo:
            chatInput.chatbotTipo,
          quantidade:
            businessCatalogItems.length,
          nomes:
            businessCatalogItems.map(
              (item) => item.nome,
            ),
        },
      );
    }

    /**
     * ==========================================================
     * INTENÇÃO COMERCIAL + OPORTUNIDADE DIRETA DO NEGÓCIO
     * ==========================================================
     *
     * Campanha é apenas uma das possíveis origens de uma oportunidade.
     * Se o cliente chegou diretamente ao chatbot de uma LOJA/PRESTADOR
     * e demonstrou interesse comercial, criamos/reutilizamos a
     * MarketingOpportunity da própria conversa.
     *
     * IMPORTANTE:
     * - cumprimento simples NÃO cria oportunidade;
     * - dúvida comercial pode criar oportunidade, mas NÃO cria pedido;
     * - cadastro/pagamento continuam somente nas etapas concretas;
     * - a mesma oportunidade é reutilizada pela sourceConversationId.
     */
    // ==========================================================
    // AGENTE COMERCIAL V1 — PILOTO CONTROLADO
    // ==========================================================
    //
    // O cérebro interpreta a mensagem usando uma fotografia somente
    // leitura do negócio. Se qualquer parte falhar, preservamos o
    // comportamento anterior do chat como fallback.
    //
    // A decisão será reaproveitada mais abaixo para:
    // - reconhecer interesse comercial;
    // - selecionar item oficial com segurança;
    // - fornecer preferência de data/horário ao Orchestrator;
    // - reconhecer confirmação de compra;
    // - melhorar respostas consultivas sem inventar fatos.
    let commercialAgentDecision:
      | GranConectaAgentDecision
      | null =
      null;

    let commercialAgentContext:
      | GranConectaAgentContext
      | null =
      null;

    const resolvedAgentStoreId =
      String(
        chatInput.chatbotOwnerId ||
        chatInput.storeId ||
        chatInput.lojaId ||
        "",
      ).trim();

    const shouldUseCommercialAgent =
      Boolean(resolvedAgentStoreId) &&
      resolvedAgentStoreId ===
      this.agentPilotStoreId &&
      (
        chatInput.chatbotTipo === "PRESTADOR" ||
        chatInput.chatbotTipo === "LOJA"
      );

    if (shouldUseCommercialAgent) {
      try {
        commercialAgentContext =
          await this.agentContext.build({
            storeId:
              resolvedAgentStoreId,
            conversationId:
              conversation.id,
            opportunityId:
              chatInput.opportunityId ||
              null,
            customerUserId:
              chatInput.userId ||
              null,
          });

        const agentHistory =
          await this.persistence.getHistory(
            conversation.id,
          );

        const decisionHistory =
          agentHistory
            .filter(
              (entry: any) =>
                entry?.role === "user" ||
                entry?.role === "assistant",
            )
            .slice(-10)
            .map((entry: any) => ({
              role:
                entry.role as
                | "user"
                | "assistant",
              content:
                String(entry.content || ""),
            }));

        // Ativação controlada: somente conversas de usuário autenticado
        // cujo userId já está vinculado à conversa persistida.
        // Conversas anônimas continuam com as últimas 10 mensagens.
        let agentMemoryContext: string | undefined;
        const authenticatedCustomerId = String(chatInput.userId || "").trim();
        const storedCustomerId = String(conversation.userId || "").trim();
        if (
          process.env.GRANCONECTA_AGENT_MEMORY_ENABLED === "true" &&
          authenticatedCustomerId &&
          storedCustomerId === authenticatedCustomerId
        ) {
          try {
            const agentMemory = await this.agentMemory.build({
              conversationId: conversation.id,
              storeId: resolvedAgentStoreId,
              customerUserId: authenticatedCustomerId,
              currentMessage: message,
              historyLimit: 100,
            });
            if (agentMemory.relevantHistory.length > 0) {
              agentMemoryContext = agentMemory.memoryContext;
            }
            console.log("[GRANCONECTA AGENT MEMORY] Leitura concluída", {
              conversationId: conversation.id,
              relevantMessages: agentMemory.relevantHistory.length,
            });
          } catch (memoryError) {
            console.warn("[GRANCONECTA AGENT MEMORY] Ignorada; histórico recente preservado", {
              conversationId: conversation.id,
              error: memoryError instanceof Error ? memoryError.message : String(memoryError),
            });
          }
        }

        commercialAgentDecision =
          await this.agentDecision.decide({
            message,
            context:
              commercialAgentContext,
            conversationHistory:
              decisionHistory,
            memoryContext: agentMemoryContext,
          });

        console.log(
          "[GRANCONECTA AGENT] Decisão comercial",
          {
            conversationId:
              conversation.id,
            opportunityId:
              chatInput.opportunityId ||
              null,
            storeId:
              resolvedAgentStoreId,
            intent:
              commercialAgentDecision.intent,
            journeyStage:
              commercialAgentDecision.journeyStage,
            commercialAction:
              commercialAgentDecision.commercialAction,
            responseStrategy:
              commercialAgentDecision.responseStrategy,
            catalogItemId:
              commercialAgentDecision.catalogItemId,
            catalogItemName:
              commercialAgentDecision.catalogItemName,
            preferredDate:
              commercialAgentDecision.preferredDate,
            preferredTime:
              commercialAgentDecision.preferredTime,
            shouldAdvanceCommercialFlow:
              commercialAgentDecision.shouldAdvanceCommercialFlow,
            shouldRequestHumanHandoff:
              commercialAgentDecision.shouldRequestHumanHandoff,
            confidence:
              commercialAgentDecision.confidence,
          },
        );
      } catch (agentError) {
        console.error(
          "[GRANCONECTA AGENT] Falha no cérebro comercial; mantendo fluxo atual",
          {
            conversationId:
              conversation.id,
            storeId:
              resolvedAgentStoreId ||
              null,
            error:
              agentError instanceof Error
                ? agentError.message
                : agentError,
          },
        );

        commercialAgentDecision =
          null;
      }
    }

    /**
     * Quando o Agent Pilot respondeu com uma decisão válida, ele passa a ser
     * a autoridade de INTERPRETAÇÃO desta mensagem. O classificador legado
     * continua disponível somente como fallback quando o Agent não respondeu.
     *
     * Isso evita que a mesma mensagem seja interpretada duas vezes por motores
     * diferentes (por exemplo, um "sim" consultivo virar seleção/compra).
     */
    const commercialIntent =
      commercialAgentDecision
        ? {
          type: "NONE" as CommercialIntentType,
          commercialInterest: false,
        }
        : this.detectCommercialIntent(
          message,
          businessCatalogItems,
        );

    const agentDetectedCommercialInterest =
      Boolean(
        commercialAgentDecision &&
        (
          commercialAgentDecision.catalogItemId ||
          commercialAgentDecision.shouldAdvanceCommercialFlow ||
          [
            "DISCOVER",
            "ASK_INFORMATION",
            "ASK_PRICE",
            "COMPARE_OPTIONS",
            "SELECT_ITEM",
            "BUY_INTENT",
            "SCHEDULE_INTENT",
            "PAYMENT_INTENT",
            "CONFIRM_PURCHASE",
            "OBJECTION",
          ].includes(
            commercialAgentDecision.intent,
          )
        )
      );

    if (
      !chatInput.opportunityId &&
      (
        commercialIntent.commercialInterest ||
        agentDetectedCommercialInterest
      ) &&
      (
        chatInput.chatbotTipo === "PRESTADOR" ||
        chatInput.chatbotTipo === "LOJA"
      ) &&
      chatInput.chatbotOwnerId
    ) {
      const directOpportunity =
        await this.ensureDirectBusinessOpportunity(
          chatInput,
          conversation.id,
        );

      if (directOpportunity) {
        chatInput.opportunityId =
          directOpportunity.id;

        console.log(
          "[CHAT COMERCIAL] Oportunidade direta ativa",
          {
            opportunityId:
              directOpportunity.id,
            conversationId:
              conversation.id,
            storeId:
              chatInput.chatbotOwnerId,
            chatbotTipo:
              chatInput.chatbotTipo,
            origem:
              chatInput.origem,
            intent:
              commercialAgentDecision?.intent ||
              commercialIntent.type,
            interpretationSource:
              commercialAgentDecision
                ? "GRANCONECTA_AGENT"
                : "LEGACY",
          },
        );
      }
    }

    /**
     * ==========================================================
     * SELEÇÃO DO ITEM SUGERIDA PELO AGENTE
     * ==========================================================
     *
     * O cérebro pode identificar o item, mas somente persistimos a
     * escolha quando a própria decisão indica avanço/seleção. O UUID
     * também precisa existir no catálogo oficial carregado do banco.
     */
    if (
      commercialAgentDecision?.catalogItemId &&
      chatInput.opportunityId &&
      (
        commercialAgentDecision.commercialAction ===
        "SELECT_ITEM" ||
        commercialAgentDecision.commercialAction ===
        "PROVIDE_SCHEDULING_PREFERENCE" ||
        commercialAgentDecision.shouldAdvanceCommercialFlow
      )
    ) {
      const agentCatalogItem =
        businessCatalogItems.find(
          (item) =>
            String(item.id) ===
            String(
              commercialAgentDecision?.catalogItemId,
            ),
        ) || null;

      if (agentCatalogItem) {
        const currentOpportunity =
          await this.opportunity.findById(
            chatInput.opportunityId,
          );

        if (
          String(
            currentOpportunity?.catalog_item_id ||
            "",
          ) !== String(agentCatalogItem.id)
        ) {
          await this.opportunityCatalog
            .selectCatalogItem({
              opportunityId:
                chatInput.opportunityId,
              catalogItemId:
                agentCatalogItem.id,
            });

          console.log(
            "[GRANCONECTA AGENT] Item oficial selecionado",
            {
              conversationId:
                conversation.id,
              opportunityId:
                chatInput.opportunityId,
              catalogItemId:
                agentCatalogItem.id,
              catalogItemName:
                agentCatalogItem.nome,
              action:
                commercialAgentDecision.commercialAction,
            },
          );
        }
      }
    }

    /**
     * ==========================================================
     * RETOMADA DO COMMERCIAL FLOW APÓS LOGIN
     * ==========================================================
     *
     * Cenário:
     *
     * CommercialFlow = AGUARDANDO_LOGIN
     *      ↓
     * frontend abre login
     *      ↓
     * usuário autentica
     *      ↓
     * retorna ao chatbot com opportunityBootstrap=true + userId
     *
     * IMPORTANTE:
     *
     * Este bloco precisa executar ANTES do bootstrap legado da
     * MarketingOpportunity. Caso contrário o fluxo antigo pode
     * criar solicitação/candidatura e devolver a conversa para IA,
     * deixando o novo CommercialFlow parado em AGUARDANDO_LOGIN.
     *
     * A mensagem técnica de bootstrap NÃO é persistida no histórico.
     */
    if (
      chatInput.opportunityBootstrap === true &&
      chatInput.opportunityId &&
      chatInput.chatbotOwnerId &&
      chatInput.userId &&
      (
        chatInput.chatbotTipo === "PRESTADOR" ||
        chatInput.chatbotTipo === "LOJA"
      )
    ) {
      const resumeCommercialFlow =
        await this.commercialFlowState
          .findActiveByConversation(
            conversation.id,
          );

      const resumeOpportunity =
        await this.opportunity.findById(
          chatInput.opportunityId,
        );

      // O item escolhido pertence ao CommercialFlow. A oportunidade
      // pode não ter catalog_item_id preenchido no handoff do DOT.
      // Nunca trocar o item já selecionado por um valor divergente.
      const resumeCatalogItemId =
        String(resumeCommercialFlow?.catalogItemId || "").trim();

      const resumeCatalogItem =
        resumeCatalogItemId &&
        String(resumeCommercialFlow?.storeId || "") ===
          String(chatInput.chatbotOwnerId) &&
        (!resumeCommercialFlow?.opportunityId ||
          String(resumeCommercialFlow.opportunityId) ===
            String(chatInput.opportunityId))
          ? businessCatalogItems.find(
              (item) => String(item.id) === resumeCatalogItemId,
            ) || null
          : null;

      const canResumeCommercialFlow =
        Boolean(
          resumeCommercialFlow,
        ) &&
        Boolean(
          resumeCatalogItem,
        ) &&
        (
          resumeCatalogItem?.tipo === "SERVICO" ||
          resumeCatalogItem?.tipo === "PACOTE"
        ) &&
        (
          resumeCommercialFlow?.state ===
          "AGUARDANDO_LOGIN" ||
          resumeCommercialFlow?.state ===
          "AGUARDANDO_CADASTRO_RAPIDO" ||
          resumeCommercialFlow?.state ===
          "CLIENTE_IDENTIFICADO" ||
          resumeCommercialFlow?.state ===
          "HORARIO_DISPONIVEL" ||
          resumeCommercialFlow?.state ===
          "OFERTA_CRIADA" ||
          resumeCommercialFlow?.state ===
          "AGUARDANDO_CONFIRMACAO_COMPRA" ||
          resumeCommercialFlow?.state ===
          "PAGAMENTO_CRIADO" ||
          resumeCommercialFlow?.state ===
          "AGUARDANDO_PAGAMENTO"
        );

      if (
        canResumeCommercialFlow &&
        resumeCommercialFlow &&
        resumeCatalogItem
      ) {
        try {
          console.log(
            "[CHAT COMMERCIAL FLOW] Retomando conversão após login",
            {
              conversationId:
                conversation.id,

              opportunityId:
                chatInput.opportunityId,

              flowId:
                resumeCommercialFlow.id,

              previousState:
                resumeCommercialFlow.state,

              authenticatedUserId:
                chatInput.userId,

              catalogItemId:
                resumeCatalogItem.id,

              catalogItemName:
                resumeCatalogItem.nome,
            },
          );

          /**
           * O Orchestrator recebe userId autenticado.
           *
           * Ele irá:
           *
           * - vincular customerUserId ao CommercialFlow;
           * - preservar data/horário já coletados;
           * - revalidar disponibilidade quando necessário;
           * - criar/reutilizar solicitação;
           * - criar/reutilizar candidatura;
           * - criar/reutilizar oferta;
           * - chegar em AGUARDANDO_CONFIRMACAO_COMPRA.
           */
          const resumedResult =
            await this.commercialConversion
              .process({
                conversationId:
                  conversation.id,

                storeId:
                  chatInput.chatbotOwnerId,

                opportunityId:
                  chatInput.opportunityId,

                customerUserId:
                  chatInput.userId,

                catalogItemId:
                  resumeCatalogItem.id,

                /**
                 * Não enviamos nova data/hora.
                 *
                 * O CommercialFlow já possui preferredDate /
                 * preferredTime persistidos antes do login.
                 */
                preferredDate:
                  null,

                preferredTime:
                  null,

                customerName:
                  chatInput.userName ||
                  null,

                customerEmail:
                  null,

                customerPhone:
                  null,

                customerPassword:
                  null,

                createdUserId:
                  null,

                customerConfirmed:
                  false,

                origem:
                  this.resolveConversionOrigin(
                    chatInput.origem,
                  ),

                metadata: {
                  resumedAfterLogin:
                    true,

                  resumedAfterLoginAt:
                    new Date()
                      .toISOString(),

                  authenticatedUserId:
                    chatInput.userId,

                  storeName:
                    chatInput.storeName ||
                    null,

                  storeSlug:
                    chatInput.storeSlug ||
                    null,

                  chatbotTipo:
                    chatInput.chatbotTipo,

                  opportunityQualificationContext:
                    opportunityQualificationContext ||
                    null,
                },
              });

          /**
           * Na retomada pós-login, o backend precisa devolver uma mensagem
           * comercial visível e inequívoca. Não dependemos apenas da mensagem
           * genérica do Orchestrator quando ele já chegou à confirmação.
           */
          let answer =
            resumedResult.message;

          if (
            resumedResult.state ===
            "AGUARDANDO_CONFIRMACAO_COMPRA" ||
            resumedResult.nextAction ===
            "CONFIRM_PURCHASE"
          ) {
            const flowDate =
              resumedResult.flow.preferredDate ||
              resumeCommercialFlow.preferredDate ||
              null;

            const flowTime =
              resumedResult.flow.preferredTime ||
              resumeCommercialFlow.preferredTime ||
              null;

            const amount =
              Number(
                resumedResult.flow.amount ??
                resumeCommercialFlow.amount ??
                resumeCatalogItem.precoPromocional ??
                resumeCatalogItem.preco ??
                0,
              );

            const formattedDate =
              flowDate &&
                /^\\d{4}-\\d{2}-\\d{2}$/.test(
                  String(flowDate),
                )
                ? String(flowDate)
                  .split("-")
                  .reverse()
                  .join("/")
                : flowDate;

            const formattedAmount =
              amount.toLocaleString(
                "pt-BR",
                {
                  style: "currency",
                  currency: "BRL",
                },
              );

            answer =
              `${resumeCatalogItem.nome}` +
              `${formattedDate
                ? ` está disponível para ${formattedDate}`
                : ""
              }` +
              `${flowTime
                ? ` às ${flowTime}`
                : ""
              }, no valor de ${formattedAmount}. ` +
              "Você confirma a contratação?";
          }

          const checkoutUrl =
            resumedResult
              .data
              ?.payment
              ?.checkoutUrl;

          if (
            resumedResult.nextAction ===
            "PAYMENT_READY" &&
            checkoutUrl
          ) {
            answer +=
              `\n\nPagar agora: ${checkoutUrl}`;
          }

          await this.persistence
            .saveMessage(
              conversation.id,
              "assistant",
              answer,
            );

          await this.persistence
            .upsertLead(
              conversation.id,
              chatInput,
              {
                shouldCapture:
                  true,

                interest:
                  resumeCatalogItem.nome,

                status:
                  "INTERESSADO",
              },
            );

          console.log(
            "[CHAT COMMERCIAL FLOW] Conversão retomada após login",
            {
              conversationId:
                conversation.id,

              opportunityId:
                chatInput.opportunityId,

              flowId:
                resumedResult.flow.id,

              flowState:
                resumedResult.state,

              nextAction:
                resumedResult.nextAction,

              solicitacaoId:
                resumedResult
                  .data
                  ?.serviceConversion
                  ?.solicitacaoId ||
                null,

              candidaturaId:
                resumedResult
                  .data
                  ?.serviceConversion
                  ?.candidaturaId ||
                null,

              ofertaId:
                resumedResult
                  .data
                  ?.serviceConversion
                  ?.ofertaId ||
                null,

              paymentId:
                resumedResult
                  .data
                  ?.payment
                  ?.paymentId ||
                null,

              hasCheckoutUrl:
                Boolean(
                  checkoutUrl,
                ),

              message:
                answer,
            },
          );

          return {
            success:
              true,

            message:
              answer,

            conversationId:
              conversation.id,

            responseId:
              "",

            opportunityId:
              chatInput.opportunityId,

            lead: {
              shouldCapture:
                true,

              interest:
                resumeCatalogItem.nome,

              status:
                "INTERESSADO",
            },

            action: {
              type:
                "NONE",
            },
          };
        } catch (resumeCommercialError) {
          /**
           * Não executamos silenciosamente a conversão legada
           * quando existe CommercialFlow ativo pós-login.
           *
           * Se o novo motor falhar aqui, deixamos log explícito
           * para corrigir a causa real, em vez de criar dois funis
           * concorrentes.
           */
          console.error(
            "[CHAT COMMERCIAL FLOW] Erro ao retomar conversão após login",
            {
              conversationId:
                conversation.id,

              opportunityId:
                chatInput.opportunityId,

              flowId:
                resumeCommercialFlow.id,

              flowState:
                resumeCommercialFlow.state,

              authenticatedUserId:
                chatInput.userId,

              error:
                resumeCommercialError instanceof Error
                  ? resumeCommercialError.message
                  : resumeCommercialError,
            },
          );

          const answer =
            "Seu login foi confirmado, mas não consegui concluir a próxima etapa da contratação agora. Sua escolha de serviço, data e horário continuam registradas no GranConecta.";

          await this.persistence
            .saveMessage(
              conversation.id,
              "assistant",
              answer,
            );

          return {
            success:
              true,

            message:
              answer,

            conversationId:
              conversation.id,

            responseId:
              "",

            opportunityId:
              chatInput.opportunityId,

            lead: {
              shouldCapture:
                true,

              interest:
                resumeCatalogItem.nome,

              status:
                "INTERESSADO",
            },

            action: {
              type:
                "NONE",
            },
          };
        }
      }
    }

    /**
     * ==========================================================
     * BOOTSTRAP AUTOMÁTICO DA OPORTUNIDADE
     * ==========================================================
     *
     * Ao entrar em /pagina/:slug?o=TOKEN o ChatWidget pode iniciar
     * silenciosamente o atendimento. A mensagem técnica enviada pelo
     * frontend NÃO é persistida como mensagem do usuário.
     */
    if (
      chatInput.opportunityBootstrap === true &&
      chatInput.opportunityId &&
      opportunityQualificationContext
    ) {
      const bootstrapHistory =
        await this.persistence.getHistory(
          conversation.id,
        );

      const bootstrapCustomerName =
        opportunitySourceCustomerName ||
        this.resolveCustomerName(
          chatInput,
          bootstrapHistory,
        );

      // Não interromper a continuidade comercial por ausência de nome.
      // A identificação pode ocorrer mais tarde, ao formalizar a solicitação.
      if (bootstrapCustomerName) {
        chatInput.userName = bootstrapCustomerName;
      }

      const platformContext =
        await this.knowledge.buildContext({
          ...chatInput,
          message:
            "Continuar atendimento comercial da oportunidade já qualificada.",
        });


      const rememberedFacts = "";

      const response =
        await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${this.apiKey}`,

              "Content-Type":
                "application/json",

              "HTTP-Referer":
                process.env.FRONTEND_URL ||
                "http://localhost:5173",

              "X-OpenRouter-Title":
                "GranConecta",
            },

            body:
              JSON.stringify({
                model:
                  this.model,

                messages: [
                  {
                    role:
                      "system",

                    content:
                      [
                      this.buildSystemPromptForRole(chatInput, conversation, false),
                      this.buildInstructions(
                        chatInput,
                        platformContext,
                        rememberedFacts,
                        opportunityQualificationContext,
                        businessCatalogContext,
                      ),
                    ].join("\n\n"),
                  },

                  ...(businessCatalogItems.length > 0
                    ? [
                      {
                        role: "system",
                        content:
                          this.buildAuthoritativeCatalogInstructions(
                            businessCatalogContext,
                            businessCatalogItems,
                          ),
                      },
                    ]
                    : []),

                  {
                    role:
                      "user",

                    content:
                      [
                        "Inicie a continuação deste atendimento.",
                        "A pessoa acabou de chegar ao chatbot do negócio escolhido depois de responder ao playbook do GranConecta.",
                        "Cumprimente de forma breve e natural.",
                        "Demonstre que você já conhece as respostas anteriores sem expor IDs técnicos.",
                        "Não repita perguntas já respondidas.",
                        "Não solicite o nome agora se ele não estiver disponível; primeiro ajude com a necessidade já informada.",
                        "Se não houver catálogo, acolha o pedido e solicite apenas detalhes úteis para orçamento, sem inventar preços, disponibilidade ou serviços cadastrados.",
                        "Use as respostas qualificadas para conduzir diretamente ao próximo passo comercial do negócio.",
                        "Faça no máximo uma pergunta curta ao final, somente se ela realmente ajudar a avançar a negociação.",
                      ].join(" "),
                  },
                ],
              }),
          },
        );

      const data =
        (await response.json()) as
        OpenRouterResponse;

      if (!response.ok) {
        throw new Error(
          data.error?.message ||
          "Não foi possível iniciar a continuidade do atendimento.",
        );
      }

      const answer =
        data.choices?.[0]
          ?.message?.content
          ?.trim();

      if (!answer) {
        throw new Error(
          "A IA não retornou a mensagem inicial da oportunidade.",
        );
      }

      await this.persistence
        .saveMessage(
          conversation.id,
          "assistant",
          answer,
        );

      console.log(
        "[CHAT OPORTUNIDADE] BOOTSTRAP concluído",
        {
          opportunityId:
            chatInput.opportunityId,
          conversationId:
            conversation.id,
          chatbotTipo:
            chatInput.chatbotTipo,
          chatbotOwnerId:
            chatInput.chatbotOwnerId,
        },
      );

      return {
        success: true,
        message: answer,
        conversationId:
          conversation.id,
        responseId:
          data.id || "",
        lead: {
          shouldCapture: true,
          interest:
            chatInput.storeName ||
            "Oportunidade comercial",
          status:
            "INTERESSADO",
        },
        action: {
          type:
            "NONE",
        },
      };
    }

    /**
     * ==========================================================
     * STATUS ATUAL
     * ==========================================================
     */
    const currentStatus =
      await this.persistence
        .getConversationStatus(
          conversation.id,
        );

    /**
     * ==========================================================
     * NOVA ENTRADA DIRETA POR CAMPANHA
     * ==========================================================
     *
     * Se o usuário clicou/respondeu diretamente à mensagem da
     * campanha (context.id da Meta), esse é um novo ponto de entrada
     * comercial e pode reativar a IA mesmo que uma conversa antiga
     * esteja em atendimento humano.
     *
     * IMPORTANTE:
     * entradaDiretaCampanha NÃO é ativada pelo fallback de telefone.
     * Portanto, depois de um novo handoff para humano, mensagens
     * normais continuam com o atendente e não entram em loop.
     */
    const isHumanConversation =
      currentStatus ===
      "AGUARDANDO_ATENDENTE" ||
      currentStatus ===
      "EM_ATENDIMENTO_HUMANO";

    const isDirectCampaignEntry =
      chatInput.entradaDiretaCampanha === true &&
      Boolean(chatInput.campanhaId);

    if (
      isHumanConversation &&
      isDirectCampaignEntry
    ) {
      await this.persistence.markOpen(
        conversation.id,
      );

      console.log(
        "[CHAT CAMPANHA] Atendimento antigo reaberto para IA por entrada direta de campanha.",
        {
          conversationId:
            conversation.id,
          campanhaId:
            chatInput.campanhaId,
          tipoDestino:
            chatInput.tipoDestino || null,
          categoriaId:
            chatInput.categoriaId || null,
          playbookId:
            chatInput.playbook?.id || null,
          statusAnterior:
            currentStatus,
        },
      );
    }

    /**
     * ==========================================================
     * CONVERSA EM ATENDIMENTO HUMANO
     * ==========================================================
     */
    if (
      isHumanConversation &&
      !isDirectCampaignEntry
    ) {
      const normalizedMessage =
        this.normalize(
          message,
        );

      const wantsBackToAi =
        normalizedMessage.includes(
          "voltar para ia",
        ) ||
        normalizedMessage.includes(
          "voltar para a ia",
        ) ||
        normalizedMessage.includes(
          "falar com ia",
        ) ||
        normalizedMessage.includes(
          "continuar com ia",
        ) ||
        normalizedMessage.includes(
          "cancelar atendimento",
        ) ||
        normalizedMessage.includes(
          "sair do atendimento",
        );

      /**
       * Continua no atendimento humano.
       */
      if (!wantsBackToAi) {
        await this.saveUserMessage(
          conversation.id,
          chatInput,
          message,
        );

        return {
          success: true,

          message:
            "Mensagem enviada ao atendente. Assim que ele responder, você verá a resposta aqui. Se quiser voltar para a IA, digite: voltar para IA.",

          conversationId:
            conversation.id,

          responseId:
            "",

          lead: {
            shouldCapture:
              true,

            interest:
              message,

            status:
              "ENCAMINHADO",
          },

          action: {
            type:
              "HUMAN_HANDOFF",

            payload: {
              chatbotTipo:
                chatInput.chatbotTipo,

              storeId:
                chatInput
                  .chatbotOwnerId ||
                undefined,

              storeName:
                chatInput.storeName,

              message,
            },
          },
        };
      }

      /**
       * Usuário pediu explicitamente para voltar para IA.
       *
       * IMPORTANTE:
       * salva UMA única vez.
       */
      await this.saveUserMessage(
        conversation.id,
        chatInput,
        message,
      );

      await this.persistence
        .markOpen(
          conversation.id,
        );

      const answer =
        "Pronto, voltei para o atendimento com IA. Como posso ajudar?";

      await this.persistence
        .saveMessage(
          conversation.id,
          "assistant",
          answer,
        );

      return {
        success:
          true,

        message:
          answer,

        conversationId:
          conversation.id,

        responseId:
          "",

        lead: {
          shouldCapture:
            false,

          status:
            "NOVO",
        },

        action: {
          type:
            "NONE",
        },
      };
    }

    /**
     * ==========================================================
     * FUNIL DETERMINÍSTICO DO PLAYBOOK
     * ==========================================================
     *
     * Enquanto campaignStage = QUALIFICANDO, nenhum negócio é
     * apresentado à IA. O backend conduz uma pergunta por vez.
     * Só após concluir as perguntas o estágio muda para
     * APRESENTANDO_OPCOES.
     */
    if (
      chatInput.tipoDestino ===
      "CATEGORIA" &&
      chatInput.categoriaId &&
      !chatInput.selectedStoreId &&
      !conversation.selectedStoreId
    ) {
      const perguntas =
        Array.isArray(
          chatInput.playbook?.perguntas,
        )
          ? chatInput.playbook!.perguntas!
            .slice()
            .sort(
              (
                a: ChatPlaybookPergunta,
                b: ChatPlaybookPergunta,
              ) =>
                Number(a.ordem || 0) -
                Number(b.ordem || 0),
            )
          : [];

      const stageAtual =
        chatInput.campaignStage ||
        null;

      const stepAtual =
        Math.max(
          0,
          Number(
            chatInput.playbookStep || 0,
          ),
        );

      const deveIniciar =
        !stageAtual &&
        perguntas.length > 0;

      if (deveIniciar) {
        await this.saveUserMessage(
          conversation.id,
          chatInput,
          message,
        );

        const opportunity =
          await this.opportunity.getOrCreate({
            campanhaId:
              chatInput.campanhaId || null,
            playbookId:
              chatInput.playbook?.id || null,
            categoriaId:
              chatInput.categoriaId || null,
            sourceConversationId:
              conversation.id,
            userId:
              chatInput.userId || null,
            userType:
              chatInput.userType || null,
            condominioId:
              chatInput.condominioId || null,
            canalOrigem:
              chatInput.channel ||
              chatInput.origem ||
              null,
          });

        await this.opportunity
          .startQualification(
            opportunity.id,
          );

        await this.persistence
          .updateCampaignProgress(
            conversation.id,
            {
              campaignStage:
                "QUALIFICANDO",
              playbookStep: 0,
              campanhaId:
                chatInput.campanhaId ||
                null,
              categoriaId:
                chatInput.categoriaId,
            },
          );

        const pergunta =
          perguntas[0];

        if (pergunta) {
          const answer =
            this.formatPlaybookQuestion(
              pergunta,
              0,
              perguntas.length,
            );

          await this.persistence
            .saveMessage(
              conversation.id,
              "assistant",
              answer,
            );

          await this.persistence
            .upsertLead(
              conversation.id,
              {
                ...chatInput,
                campaignStage:
                  "QUALIFICANDO",
                playbookStep: 0,
              },
              {
                shouldCapture: true,
                interest:
                  chatInput.categoriaNome ||
                  message,
                status:
                  "QUALIFICANDO",
              },
            );

          return {
            success: true,
            message: answer,
            conversationId:
              conversation.id,
            responseId: "",
            lead: {
              shouldCapture: true,
              interest:
                chatInput.categoriaNome ||
                message,
              status:
                "QUALIFICANDO",
            },
            action: {
              type: "NONE",
            },
          };
        }
      }

      if (
        stageAtual ===
        "QUALIFICANDO" &&
        perguntas.length > 0
      ) {
        await this.saveUserMessage(
          conversation.id,
          chatInput,
          message,
        );

        const opportunity =
          await this.opportunity.getOrCreate({
            campanhaId:
              chatInput.campanhaId || null,
            playbookId:
              chatInput.playbook?.id || null,
            categoriaId:
              chatInput.categoriaId || null,
            sourceConversationId:
              conversation.id,
            userId:
              chatInput.userId || null,
            userType:
              chatInput.userType || null,
            condominioId:
              chatInput.condominioId || null,
            canalOrigem:
              chatInput.channel ||
              chatInput.origem ||
              null,
          });

        const perguntaRespondida =
          perguntas[stepAtual];

        if (perguntaRespondida) {
          await this.opportunity
            .saveAnswer({
              opportunityId:
                opportunity.id,
              playbookId:
                chatInput.playbook?.id ||
                null,
              perguntaChave:
                perguntaRespondida.chave,
              pergunta:
                perguntaRespondida.pergunta,
              resposta:
                message,
              ordem:
                Number(
                  perguntaRespondida.ordem ??
                  stepAtual,
                ),
              obrigatoria:
                Boolean(
                  perguntaRespondida.obrigatoria,
                ),
            });
        }

        const proximoStep =
          stepAtual + 1;

        if (
          proximoStep <
          perguntas.length
        ) {
          await this.persistence
            .updateCampaignProgress(
              conversation.id,
              {
                campaignStage:
                  "QUALIFICANDO",
                playbookStep:
                  proximoStep,
                campanhaId:
                  chatInput.campanhaId ||
                  null,
                categoriaId:
                  chatInput.categoriaId,
              },
            );

          const proximaPergunta =
            perguntas[proximoStep];

          if (proximaPergunta) {
            const answer =
              this.formatPlaybookQuestion(
                proximaPergunta,
                proximoStep,
                perguntas.length,
              );

            await this.persistence
              .saveMessage(
                conversation.id,
                "assistant",
                answer,
              );

            return {
              success: true,
              message: answer,
              conversationId:
                conversation.id,
              responseId: "",
              lead: {
                shouldCapture: true,
                interest: message,
                status:
                  "QUALIFICANDO",
              },
              action: {
                type: "NONE",
              },
            };
          }
        }

        await this.opportunity
          .completeQualification(
            opportunity.id,
          );

        await this.opportunity
          .markOptionsPresented(
            opportunity.id,
          );

        const businesses =
          await this.knowledge
            .listCampaignBusinesses(
              chatInput.categoriaId,
              chatInput.condominioId,
            );

        await this.persistence
          .updateCampaignProgress(
            conversation.id,
            {
              campaignStage:
                "APRESENTANDO_OPCOES",
              playbookStep:
                perguntas.length,
              campanhaId:
                chatInput.campanhaId ||
                null,
              categoriaId:
                chatInput.categoriaId,
            },
          );

        const answer =
          this.knowledge
            .formatCampaignBusinessOptions(
              businesses,
              chatInput.categoriaNome,
            );

        await this.persistence
          .saveMessage(
            conversation.id,
            "assistant",
            answer,
          );

        return {
          success: true,
          message: answer,
          conversationId:
            conversation.id,
          responseId: "",
          lead: {
            shouldCapture: true,
            interest: message,
            status:
              "INTERESSADO",
          },
          action: {
            type: "NONE",
          },
        };
      }

      if (
        !stageAtual &&
        perguntas.length === 0
      ) {
        await this.saveUserMessage(
          conversation.id,
          chatInput,
          message,
        );

        const opportunity =
          await this.opportunity.getOrCreate({
            campanhaId:
              chatInput.campanhaId || null,
            playbookId:
              chatInput.playbook?.id || null,
            categoriaId:
              chatInput.categoriaId || null,
            sourceConversationId:
              conversation.id,
            userId:
              chatInput.userId || null,
            userType:
              chatInput.userType || null,
            condominioId:
              chatInput.condominioId || null,
            canalOrigem:
              chatInput.channel ||
              chatInput.origem ||
              null,
          });

        await this.opportunity
          .markOptionsPresented(
            opportunity.id,
          );

        const businesses =
          await this.knowledge
            .listCampaignBusinesses(
              chatInput.categoriaId,
              chatInput.condominioId,
            );

        await this.persistence
          .updateCampaignProgress(
            conversation.id,
            {
              campaignStage:
                "APRESENTANDO_OPCOES",
              playbookStep: 0,
              campanhaId:
                chatInput.campanhaId ||
                null,
              categoriaId:
                chatInput.categoriaId,
            },
          );

        const answer =
          this.knowledge
            .formatCampaignBusinessOptions(
              businesses,
              chatInput.categoriaNome,
            );

        await this.persistence
          .saveMessage(
            conversation.id,
            "assistant",
            answer,
          );

        return {
          success: true,
          message: answer,
          conversationId:
            conversation.id,
          responseId: "",
          lead: {
            shouldCapture: true,
            interest:
              chatInput.categoriaNome ||
              message,
            status:
              "INTERESSADO",
          },
          action: {
            type: "NONE",
          },
        };
      }
    }

    if (
      chatInput.tipoDestino ===
      "CATEGORIA" &&
      chatInput.categoriaId &&
      chatInput.campaignStage ===
      "APRESENTANDO_OPCOES" &&
      !chatInput.selectedStoreId &&
      !conversation.selectedStoreId
    ) {
      const businesses =
        await this.knowledge
          .listCampaignBusinesses(
            chatInput.categoriaId,
            chatInput.condominioId,
          );

      const selectedBusiness =
        this.knowledge
          .resolveCampaignBusinessSelection(
            message,
            businesses,
          );

      if (selectedBusiness) {
        const selectedChatbotTipo =
          this.knowledge
            .resolveBusinessChatbotTipo(
              selectedBusiness,
            );

        await this.persistence
          .selectCampaignBusiness(
            conversation.id,
            {
              storeId:
                selectedBusiness.id,
              storeName:
                selectedBusiness.name,
              storeSlug:
                selectedBusiness.slug,
              chatbotTipo:
                selectedChatbotTipo,
              campanhaId:
                chatInput.campanhaId ||
                null,
              categoriaId:
                chatInput.categoriaId ||
                null,
            },
          );

        const opportunity =
          await this.opportunity.getOrCreate({
            campanhaId:
              chatInput.campanhaId || null,
            playbookId:
              chatInput.playbook?.id || null,
            categoriaId:
              chatInput.categoriaId || null,
            sourceConversationId:
              conversation.id,
            userId:
              chatInput.userId || null,
            userType:
              chatInput.userType || null,
            condominioId:
              chatInput.condominioId || null,
            canalOrigem:
              chatInput.channel ||
              chatInput.origem ||
              null,
          });

        const selection =
          await this.opportunity
            .selectBusiness({
              opportunityId:
                opportunity.id,
              storeId:
                selectedBusiness.id,
              storeName:
                selectedBusiness.name,
              storeSlug:
                selectedBusiness.slug,
              chatbotTipo:
                selectedChatbotTipo,
            });

        const frontendBaseUrl =
          String(
            process.env.FRONTEND_URL ||
            "http://localhost:5173",
          ).replace(/\/$/, "");

        const opportunityUrl =
          `${frontendBaseUrl}/pagina/${encodeURIComponent(
            selectedBusiness.slug,
          )}?o=${encodeURIComponent(
            selection.token,
          )}`;

        chatInput.chatbotTipo =
          selectedChatbotTipo;

        chatInput.chatbotOwnerId =
          selectedBusiness.id;

        chatInput.storeId =
          selectedBusiness.id;

        chatInput.lojaId =
          selectedBusiness.id;

        chatInput.storeName =
          selectedBusiness.name;

        chatInput.storeSlug =
          selectedBusiness.slug;

        chatInput.selectedStoreId =
          selectedBusiness.id;

        chatInput.selectedStoreName =
          selectedBusiness.name;

        chatInput.selectedStoreSlug =
          selectedBusiness.slug;

        console.log(
          "[CHAT CAMPANHA] Seleção reconhecida",
          {
            conversationId:
              conversation.id,
            campanhaId:
              chatInput.campanhaId ||
              null,
            categoriaId:
              chatInput.categoriaId,
            storeId:
              selectedBusiness.id,
            storeName:
              selectedBusiness.name,
            chatbotTipo:
              selectedChatbotTipo,
          },
        );

        await this.saveUserMessage(
          conversation.id,
          chatInput,
          message,
        );

        const answer =
          `Perfeito! Você escolheu ${selectedBusiness.name}. ` +
          "Para continuar o atendimento sem repetir as informações que você já respondeu, acesse:\n" +
          opportunityUrl;

        await this.persistence
          .saveMessage(
            conversation.id,
            "assistant",
            answer,
          );

        await this.persistence
          .upsertLead(
            conversation.id,
            chatInput,
            {
              shouldCapture: true,
              interest:
                chatInput.categoriaNome ||
                message,
              status: "INTERESSADO",
            },
          );

        return {
          success: true,
          message: answer,
          conversationId:
            conversation.id,
          responseId: "",
          lead: {
            shouldCapture: true,
            interest:
              chatInput.categoriaNome ||
              message,
            status: "INTERESSADO",
          },
          action: {
            type:
              "SELECT_CAMPAIGN_BUSINESS",
            payload: {
              storeId:
                selectedBusiness.id,
              lojaId:
                selectedBusiness.id,
              storeName:
                selectedBusiness.name,
              storeSlug:
                selectedBusiness.slug,
              chatbotTipo:
                selectedChatbotTipo,
              chatbotOwnerId:
                selectedBusiness.id,
              campanhaId:
                chatInput.campanhaId,
              categoriaId:
                chatInput.categoriaId ||
                undefined,
              origem:
                chatInput.origem,
              url:
                opportunityUrl,
              message,
            },
          },
        };
      }
    }

    /**
     * ==========================================================
     * NOVO MOTOR COMERCIAL — PRIORIDADE SOBRE O FLUXO LEGADO
     * ==========================================================
     *
     * A partir daqui, quando existe item SERVICO/PACOTE escolhido,
     * o CommercialConversionOrchestrator passa a controlar:
     *
     * - preferência de data/horário;
     * - consulta real da disponibilidade;
     * - identificação do cliente;
     * - login/cadastro;
     * - ServicoSolicitacao;
     * - ServicoCandidatura;
     * - ServicoOferta;
     * - confirmação da contratação;
     * - checkout/pagamento.
     *
     * A agenda final NÃO acontece aqui.
     * Ela continua sendo criada somente após o webhook de pagamento.
     *
     * IMPORTANTE:
     * Este bloco não assume PRODUTO/CARDAPIO ainda.
     */
    if (
      chatInput.opportunityId &&
      chatInput.chatbotOwnerId &&
      (
        chatInput.chatbotTipo === "PRESTADOR" ||
        chatInput.chatbotTipo === "LOJA"
      )
    ) {
      const commercialOpportunity =
        await this.opportunity.findById(
          chatInput.opportunityId,
        );

      /**
       * --------------------------------------------------------
       * ITEM COMERCIAL EFETIVO PARA ESTA MENSAGEM
       * --------------------------------------------------------
       *
       * Fonte principal: item já persistido na MarketingOpportunity.
       *
       * Ponte DOT: quando a oportunidade ainda não possui catalog_item_id,
       * o Agent pode ter identificado com segurança um item oficial na
       * própria mensagem. Nesse caso usamos o item apenas como contexto
       * operacional quando existe intenção inequívoca de agenda/avanço.
       *
       * IMPORTANTE:
       * - consultar agenda NÃO significa confirmar compra;
       * - este fallback NÃO persiste catalog_item_id por conta própria;
       * - quando houver avanço real, o CommercialConversionOrchestrator
       *   continua sendo a autoridade que anexa o item ao CommercialFlow;
       * - o UUID precisa existir no catálogo oficial desta Store.
       */
      const opportunityCatalogItem =
        commercialOpportunity?.catalog_item_id
          ? businessCatalogItems.find(
            (item) =>
              String(item.id) ===
              String(
                commercialOpportunity.catalog_item_id,
              ),
          ) || null
          : null;

      const agentCatalogItem =
        commercialAgentDecision?.catalogItemId
          ? businessCatalogItems.find(
            (item) =>
              String(item.id) ===
              String(
                commercialAgentDecision.catalogItemId,
              ),
          ) || null
          : null;

      const messageTemporalPreference =
        this.extractDayAndTimePreference(
          message,
        );

      const canUseAgentCatalogItemForCommercialFlow =
        Boolean(agentCatalogItem) &&
        (
          this.isAvailabilityBrowseIntent(message) ||
          Boolean(messageTemporalPreference) ||
          commercialAgentDecision?.intent ===
          "SCHEDULE_INTENT" ||
          commercialAgentDecision?.intent ===
          "BUY_INTENT" ||
          commercialAgentDecision?.intent ===
          "PAYMENT_INTENT" ||
          commercialAgentDecision?.intent ===
          "CONFIRM_PURCHASE" ||
          commercialAgentDecision?.commercialAction ===
          "SELECT_ITEM" ||
          commercialAgentDecision?.commercialAction ===
          "PROVIDE_SCHEDULING_PREFERENCE" ||
          commercialAgentDecision?.shouldAdvanceCommercialFlow ===
          true ||
          this.isCommercialCommitmentIntent(message)
        );

      const commercialCatalogItem =
        opportunityCatalogItem ||
        (
          canUseAgentCatalogItemForCommercialFlow
            ? agentCatalogItem
            : null
        );

      if (
        !opportunityCatalogItem &&
        commercialCatalogItem &&
        canUseAgentCatalogItemForCommercialFlow
      ) {
        console.log(
          "[GRANCONECTA DOT] Item oficial resolvido pelo Agent para o Commercial Flow",
          {
            conversationId:
              conversation.id,
            opportunityId:
              chatInput.opportunityId,
            storeId:
              chatInput.chatbotOwnerId,
            catalogItemId:
              commercialCatalogItem.id,
            catalogItemName:
              commercialCatalogItem.nome,
            intent:
              commercialAgentDecision?.intent || null,
            commercialAction:
              commercialAgentDecision?.commercialAction || null,
            preferredDate:
              commercialAgentDecision?.preferredDate || null,
            preferredTime:
              commercialAgentDecision?.preferredTime || null,
            messageTemporalPreference,
            availabilityBrowseIntent:
              this.isAvailabilityBrowseIntent(message),
          },
        );
      }

      const isCommercialSchedulableItem =
        commercialCatalogItem?.tipo === "SERVICO" ||
        commercialCatalogItem?.tipo === "PACOTE";

      if (
        commercialOpportunity &&
        commercialCatalogItem &&
        isCommercialSchedulableItem
      ) {
        const activeCommercialFlow =
          await this.commercialFlowState
            .findActiveByConversation(
              conversation.id,
            );

        const commercialHistory =
          await this.persistence.getHistory(
            conversation.id,
          );

        const lastCommercialAssistantMessage =
          this.getLastAssistantMessage(
            commercialHistory,
          );

        /**
         * --------------------------------------------------------
         * DATA / HORÁRIO INFORMADOS NA MENSAGEM ATUAL
         * --------------------------------------------------------
         */
        const combinedPreference =
          this.extractDayAndTimePreference(
            message,
          );

        /**
         * CONSULTA REAL DA AGENDA — SEM ESCOLHER HORÁRIO.
         * Consultar opções não confirma compra nem altera o CommercialFlow.
         */
        if (
          this.isAvailabilityBrowseIntent(message) &&
          !combinedPreference
        ) {
          try {
            const scheduleContext =
              await this.agentContext.build({
                storeId: chatInput.chatbotOwnerId,
                conversationId: conversation.id,
                opportunityId: chatInput.opportunityId,
                customerUserId: chatInput.userId || null,
              });

            const prestadorId = String(
              scheduleContext.store.usuarioId || "",
            ).trim();

            if (!prestadorId) {
              throw new Error(
                "PRESTADOR_DA_STORE_NAO_IDENTIFICADO",
              );
            }

            const slots =
              await AgendaDisponibilidadeService
                .listarProximosHorariosLivres({
                  prestadorId,
                  duracaoMinutos: Math.max(
                    1,
                    Number(
                      commercialCatalogItem.duracaoMinutos || 60,
                    ),
                  ),
                  modalidade:
                    commercialCatalogItem.modalidade || null,
                  dataInicial:
                    commercialAgentDecision?.preferredDate || null,
                  limite: 6,
                  diasBusca: 14,
                });

            let answer: string;

            if (slots.length > 0) {
              const formattedSlots = slots.map(
                (slot, index) => {
                  const formattedDate =
                    /^\d{4}-\d{2}-\d{2}$/.test(slot.data)
                      ? slot.data
                        .split("-")
                        .reverse()
                        .join("/")
                      : slot.data;

                  return `${index + 1}. ${formattedDate} às ${slot.hora}`;
                },
              );

              answer =
                `Encontrei estes próximos horários disponíveis para ${commercialCatalogItem.nome}:\n\n` +
                formattedSlots.join("\n") +
                "\n\nVocê pode me dizer qual opção prefere.";
            } else {
              answer =
                `Não encontrei horários livres para ${commercialCatalogItem.nome} nos próximos 14 dias. ` +
                "Se quiser, posso encaminhar para a equipe verificar outras possibilidades.";
            }

            await this.saveUserMessage(
              conversation.id,
              chatInput,
              message,
            );

            await this.persistence.saveMessage(
              conversation.id,
              "assistant",
              answer,
            );

            await this.persistence.upsertLead(
              conversation.id,
              chatInput,
              {
                shouldCapture: true,
                interest: commercialCatalogItem.nome,
                status: "INTERESSADO",
              },
            );

            console.log(
              "[CHAT AGENDA] Próximos horários reais consultados",
              {
                conversationId: conversation.id,
                opportunityId: chatInput.opportunityId,
                storeId: chatInput.chatbotOwnerId,
                prestadorId,
                catalogItemId: commercialCatalogItem.id,
                catalogItemName: commercialCatalogItem.nome,
                quantidade: slots.length,
                slots: slots.map((slot) => ({
                  data: slot.data,
                  hora: slot.hora,
                })),
              },
            );

            return {
              success: true,
              message: answer,
              conversationId: conversation.id,
              responseId: "",
              opportunityId: chatInput.opportunityId,
              lead: {
                shouldCapture: true,
                interest: commercialCatalogItem.nome,
                status: "INTERESSADO",
              },
              action: { type: "NONE" },
            };
          } catch (availabilityBrowseError) {
            console.error(
              "[CHAT AGENDA] Falha ao consultar próximos horários",
              {
                conversationId: conversation.id,
                opportunityId: chatInput.opportunityId,
                storeId: chatInput.chatbotOwnerId,
                catalogItemId: commercialCatalogItem.id,
                error:
                  availabilityBrowseError instanceof Error
                    ? availabilityBrowseError.message
                    : availabilityBrowseError,
              },
            );
            // Nunca inventa disponibilidade: segue o fluxo normal.
          }
        }

        let preferredDate:
          | string
          | null =
          null;

        let preferredTime:
          | string
          | null =
          null;

        if (combinedPreference) {
          preferredDate =
            AgendaDisponibilidadeService
              .resolverDataPreferida(
                combinedPreference.day,
              );

          preferredTime =
            combinedPreference.time;
        } else {
          /**
           * Se o sistema acabou de perguntar o DIA,
           * tentamos resolver a mensagem atual como data.
           */
          if (
            this.isAssistantAskingPreferredDay(
              lastCommercialAssistantMessage,
            )
          ) {
            preferredDate =
              AgendaDisponibilidadeService
                .resolverDataPreferida(
                  message,
                );
          }

          /**
           * Se o sistema acabou de perguntar o HORÁRIO,
           * tratamos a mensagem atual como horário.
           */
          if (
            this.isAssistantAskingPreferredTime(
              lastCommercialAssistantMessage,
            )
          ) {
            preferredTime =
              this.extractTimePreference(
                message,
              );
          }
        }

        /**
         * O cérebro pode compreender expressões que o parser legado não
         * reconheceu. A data continua sendo resolvida/validada pelo
         * Orchestrator e o horário só é aceito aqui quando conseguimos
         * normalizá-lo como horário concreto.
         */
        if (
          !preferredDate &&
          commercialAgentDecision?.preferredDate
        ) {
          preferredDate =
            commercialAgentDecision.preferredDate;
        }

        if (
          !preferredTime &&
          commercialAgentDecision?.preferredTime
        ) {
          preferredTime =
            this.extractTimePreference(
              commercialAgentDecision.preferredTime,
            );
        }

        /**
         * --------------------------------------------------------
         * ESTADO DO CADASTRO RÁPIDO
         * --------------------------------------------------------
         */
        const flowMetadata =
          activeCommercialFlow?.metadata &&
            typeof activeCommercialFlow.metadata ===
            "object"
            ? activeCommercialFlow.metadata as
            Record<string, any>
            : {};

        const registrationMissingFields =
          Array.isArray(
            flowMetadata
              .registrationMissingFields,
          )
            ? flowMetadata
              .registrationMissingFields
              .map(
                (value: unknown) =>
                  String(value),
              )
            : [];

        const registrationReady =
          flowMetadata.registrationReady ===
          true;

        /**
         * --------------------------------------------------------
         * DADOS DO CLIENTE
         * --------------------------------------------------------
         */
        let customerName:
          | string
          | null =
          null;

        let customerEmail:
          | string
          | null =
          null;

        let customerPhone:
          | string
          | null =
          null;

        let customerPassword:
          | string
          | null =
          null;

        /**
         * Nome conhecido pelo próprio histórico ou usuário logado.
         */
        const resolvedCommercialCustomerName =
          this.resolveCustomerName(
            chatInput,
            commercialHistory,
          );

        if (resolvedCommercialCustomerName) {
          customerName =
            resolvedCommercialCustomerName;
        }

        /**
         * Se o motor está esperando especificamente o nome,
         * a mensagem atual é interpretada deterministicamente.
         */
        if (
          activeCommercialFlow?.state ===
          "AGUARDANDO_CADASTRO_RAPIDO" &&
          registrationMissingFields.includes(
            "nome",
          )
        ) {
          customerName =
            this.sanitizeCustomerName(
              message,
            );
        }

        /**
         * E-mail.
         */
        const emailFromMessage =
          this.extractOpportunityEmail(
            message,
          );

        if (emailFromMessage) {
          customerEmail =
            emailFromMessage;
        }

        /**
         * Telefone somente quando o motor efetivamente o está pedindo.
         * Isso evita interpretar preço, CEP ou data como telefone.
         */
        if (
          activeCommercialFlow?.state ===
          "AGUARDANDO_CADASTRO_RAPIDO" &&
          registrationMissingFields.includes(
            "telefone",
          )
        ) {
          const phoneDigits =
            String(message || "")
              .replace(/\D/g, "");

          if (
            phoneDigits.length === 10 ||
            phoneDigits.length === 11 ||
            (
              phoneDigits.length >= 12 &&
              phoneDigits.startsWith("55")
            )
          ) {
            customerPhone =
              phoneDigits;
          }
        }

        /**
         * Senha:
         *
         * Nunca persistimos a mensagem de senha no histórico do chat.
         *
         * Nesta primeira ligação, se registrationReady=true e o cliente
         * enviar uma senha, ela vai somente para o serviço de cadastro.
         */
        if (
          activeCommercialFlow?.state ===
          "AGUARDANDO_CADASTRO_RAPIDO" &&
          registrationReady &&
          String(message || "").length >= 6 &&
          !emailFromMessage
        ) {
          customerPassword =
            String(message);
        }

        /**
         * --------------------------------------------------------
         * CONFIRMAÇÃO EXPLÍCITA DA CONTRATAÇÃO
         * --------------------------------------------------------
         */
        const normalizedCommercialMessage =
          this.normalize(
            message,
          );

        const customerConfirmed =
          activeCommercialFlow?.state ===
          "AGUARDANDO_CONFIRMACAO_COMPRA" &&
          (
            commercialAgentDecision?.customerConfirmed ===
            true ||
            [
              "sim",
              "confirmo",
              "confirmo sim",
              "pode",
              "pode sim",
              "aceito",
              "quero",
              "quero pagar",
              "pode gerar",
              "pode gerar o pagamento",
            ].some(
              (value) =>
                normalizedCommercialMessage ===
                this.normalize(value),
            )
          );

        /**
         * --------------------------------------------------------
         * QUANDO O NOVO MOTOR DEVE ASSUMIR
         * --------------------------------------------------------
         *
         * Não criamos CommercialFlow só porque o cliente está
         * fazendo uma pergunta genérica sobre o serviço.
         */
        console.log(
          "[CHAT COMMERCIAL FLOW] Preferência temporal extraída",
          {
            message,
            combinedPreference,
            preferredDate,
            preferredTime,
            activeFlowState:
              activeCommercialFlow?.state ||
              null,
          },
        );

        const normalizedDot =
          this.normalizeCommercialDot({
            message,
            decision: commercialAgentDecision,
            catalogItem: commercialCatalogItem,
            activeFlowState: activeCommercialFlow?.state || null,
            preferredDate,
            preferredTime,
          });

        if (
          commercialAgentDecision &&
          (
            normalizedDot.commercialAction !== commercialAgentDecision.commercialAction ||
            normalizedDot.shouldAdvanceCommercialFlow !== commercialAgentDecision.shouldAdvanceCommercialFlow
          )
        ) {
          console.log("[GRANCONECTA DOT] Decisão normalizada pelo backend", {
            conversationId: conversation.id,
            opportunityId: chatInput.opportunityId,
            catalogItemId: commercialCatalogItem.id,
            intent: commercialAgentDecision.intent,
            originalAction: commercialAgentDecision.commercialAction,
            normalizedAction: normalizedDot.commercialAction,
            originalShouldAdvance: commercialAgentDecision.shouldAdvanceCommercialFlow,
            normalizedShouldAdvance: normalizedDot.shouldAdvanceCommercialFlow,
            preferredDate,
            preferredTime,
            activeFlowState: activeCommercialFlow?.state || null,
            reason: normalizedDot.reason,
          });
        }

        const shouldUseCommercialFlow =
          Boolean(
            activeCommercialFlow,
          ) ||
          Boolean(
            combinedPreference,
          ) ||
          this.isAssistantAskingPreferredDay(
            lastCommercialAssistantMessage,
          ) ||
          this.isAssistantAskingPreferredTime(
            lastCommercialAssistantMessage,
          ) ||
          this.isCommercialCommitmentIntent(
            message,
          ) ||
          Boolean(
            normalizedDot.shouldAdvanceCommercialFlow,
          ) ||
          normalizedDot.commercialAction ===
          "SELECT_ITEM" ||
          normalizedDot.commercialAction ===
          "PROVIDE_SCHEDULING_PREFERENCE";


        const canUseAgentCommercialBridge =
          Boolean(
            commercialAgentDecision &&
            commercialAgentContext &&
            shouldUseCommercialAgent,
          );

        const bridgeDecision:
          | GranConectaAgentDecision
          | null =
          canUseAgentCommercialBridge &&
            commercialAgentDecision
            ? {
              ...commercialAgentDecision,

              commercialAction:
                normalizedDot.commercialAction,

              shouldAdvanceCommercialFlow:
                normalizedDot.shouldAdvanceCommercialFlow,

              catalogItemId:
                commercialAgentDecision.catalogItemId ||
                commercialCatalogItem.id,

              preferredDate:
                preferredDate ||
                commercialAgentDecision.preferredDate ||
                null,

              preferredTime:
                preferredTime ||
                commercialAgentDecision.preferredTime ||
                null,

              customerConfirmed:
                customerConfirmed === true
                  ? true
                  : commercialAgentDecision.customerConfirmed,
            }
            : null;

        if (shouldUseCommercialFlow) {
          /**
           * Senha não entra no histórico.
           */
          if (!customerPassword) {
            await this.saveUserMessage(
              conversation.id,
              chatInput,
              message,
            );
          }

          try {


            const bridgeResult =
              canUseAgentCommercialBridge &&
                bridgeDecision &&
                commercialAgentContext
                ? await this.agentCommercialBridge.execute({
                  conversationId:
                    conversation.id,

                  storeId:
                    chatInput.chatbotOwnerId,

                  context:
                    commercialAgentContext,

                  opportunityId:
                    chatInput.opportunityId,

                  customerUserId:
                    chatInput.userId || null,

                  customerName,

                  customerEmail,

                  customerPhone,

                  customerPassword,

                  origem:
                    this.resolveConversionOrigin(
                      chatInput.origem,
                    ),

                  decision:
                    bridgeDecision,

                  metadata: {
                    storeName:
                      chatInput.storeName || null,

                    storeSlug:
                      chatInput.storeSlug || null,

                    chatbotTipo:
                      chatInput.chatbotTipo,

                    opportunityQualificationContext:
                      opportunityQualificationContext ||
                      null,
                  },
                })
                : null;

            console.log(
              "[CHAT COMMERCIAL BRIDGE] Resultado",
              {
                conversationId: conversation.id,
                activeFlowState:
                  activeCommercialFlow?.state || null,
                decisionAction:
                  bridgeDecision?.commercialAction || null,
                executed:
                  bridgeResult?.executed ?? null,
                reason:
                  bridgeResult?.reason || null,
                commercialState:
                  bridgeResult?.commercialResult?.state || null,
                commercialNextAction:
                  bridgeResult?.commercialResult?.nextAction || null,
              },
            );

            if (
              canUseAgentCommercialBridge &&
              bridgeResult &&
              !bridgeResult.executed &&
              bridgeResult.reason !==
              "NO_COMMERCIAL_ACTION_REQUIRED"
            ) {
              console.warn(
                "[GRANCONECTA AGENT BRIDGE] Ação comercial bloqueada",
                {
                  conversationId:
                    conversation.id,

                  storeId:
                    chatInput.chatbotOwnerId,

                  action:
                    bridgeResult.action,

                  reason:
                    bridgeResult.reason,
                },
              );

              throw new Error(
                `GRANCONECTA_AGENT_COMMERCIAL_ACTION_BLOCKED:${bridgeResult.reason}`,
              );
            }
            // const agentHasNoCommercialAction =
            //   canUseAgentCommercialBridge &&
            //   bridgeResult &&
            //   !bridgeResult.executed &&
            //   bridgeResult.reason ===
            //   "NO_COMMERCIAL_ACTION_REQUIRED";

            const agentHasNoCommercialAction =
              canUseAgentCommercialBridge &&
              bridgeResult &&
              !bridgeResult.executed &&
              bridgeResult.reason ===
              "NO_COMMERCIAL_ACTION_REQUIRED" &&
              !activeCommercialFlow;


            if (!agentHasNoCommercialAction) {
              const commercialResult =
                bridgeResult?.executed &&
                  bridgeResult.commercialResult
                  ? bridgeResult.commercialResult
                  : await this.commercialConversion
                    .process({
                      conversationId:
                        conversation.id,

                      storeId:
                        chatInput.chatbotOwnerId,

                      opportunityId:
                        chatInput.opportunityId,

                      customerUserId:
                        chatInput.userId ||
                        null,

                      catalogItemId:
                        commercialCatalogItem.id,

                      preferredDate:
                        activeCommercialFlow?.state ===
                          "AGUARDANDO_CADASTRO_RAPIDO"
                          ? null
                          : preferredDate,

                      preferredTime:
                        activeCommercialFlow?.state ===
                          "AGUARDANDO_CADASTRO_RAPIDO"
                          ? null
                          : preferredTime,

                      customerName,

                      customerEmail,

                      customerPhone,

                      customerPassword,

                      customerConfirmed,

                      origem:
                        this.resolveConversionOrigin(
                          chatInput.origem,
                        ),

                      metadata: {
                        storeName:
                          chatInput.storeName ||
                          null,

                        storeSlug:
                          chatInput.storeSlug ||
                          null,

                        chatbotTipo:
                          chatInput.chatbotTipo,

                        opportunityQualificationContext:
                          opportunityQualificationContext ||
                          null,
                      },
                    });

              let answer =
                commercialResult.message;

              /**
               * O link de pagamento precisa aparecer diretamente
               * na resposta do chatbot.
               */
              const checkoutUrl =
                commercialResult
                  .data
                  ?.payment
                  ?.checkoutUrl;

              if (
                commercialResult.nextAction ===
                "PAYMENT_READY" &&
                checkoutUrl
              ) {
                answer +=
                  `\n\nPagar agora: ${checkoutUrl}`;
              }

              /**
               * LOGIN / CADASTRO SEGURO
               *
               * Reaproveitamos a action já conhecida pelo frontend
               * para não depender de senha em texto no chat.
               */
              let commercialAction:
                ChatBotAction = {
                type:
                  "NONE",
              };

              if (
                commercialResult.nextAction ===
                "LOGIN_REQUIRED" ||
                commercialResult.nextAction ===
                "ASK_PASSWORD"
              ) {
                const opportunityToken =
                  await this.opportunity
                    .issueAccessToken(
                      chatInput.opportunityId,
                    );

                if (
                  commercialResult.nextAction ===
                  "ASK_PASSWORD"
                ) {
                  answer =
                    "Seus dados estão prontos. Vou abrir a identificação segura do GranConecta para você criar sua senha e continuar sem perder esta contratação.";
                }

                commercialAction = {
                  type:
                    "IDENTIFY_OPPORTUNITY_CUSTOMER",

                  payload: {
                    opportunityToken,

                    opportunityId:
                      chatInput.opportunityId,

                    storeId:
                      chatInput.chatbotOwnerId,

                    lojaId:
                      chatInput.chatbotOwnerId,

                    storeName:
                      chatInput.storeName,

                    storeSlug:
                      chatInput.storeSlug ||
                      undefined,

                    chatbotTipo:
                      chatInput.chatbotTipo,

                    chatbotOwnerId:
                      chatInput.chatbotOwnerId,

                    origem:
                      chatInput.origem,

                    nome:
                      commercialResult
                        .data
                        ?.customer
                        ?.nome ||
                      customerName ||
                      undefined,

                    email:
                      commercialResult
                        .data
                        ?.customer
                        ?.email ||
                      customerEmail ||
                      undefined,
                  },
                };
              }

              await this.persistence
                .saveMessage(
                  conversation.id,
                  "assistant",
                  answer,
                );

              await this.persistence
                .upsertLead(
                  conversation.id,
                  chatInput,
                  {
                    shouldCapture:
                      true,

                    interest:
                      commercialCatalogItem.nome,

                    status:
                      commercialResult.nextAction ===
                        "PAYMENT_READY"
                        ? "INTERESSADO"
                        : "INTERESSADO",
                  },
                );

              console.log(
                "[CHAT COMMERCIAL FLOW] Novo motor assumiu a mensagem",
                {
                  conversationId:
                    conversation.id,

                  opportunityId:
                    chatInput.opportunityId,

                  flowId:
                    commercialResult.flow.id,

                  flowState:
                    commercialResult.state,

                  nextAction:
                    commercialResult.nextAction,

                  catalogItemId:
                    commercialCatalogItem.id,

                  catalogItemName:
                    commercialCatalogItem.nome,

                  paymentId:
                    commercialResult
                      .data
                      ?.payment
                      ?.paymentId ||
                    null,

                  hasCheckoutUrl:
                    Boolean(checkoutUrl),
                },
              );

              return {
                success:
                  true,

                message:
                  answer,

                conversationId:
                  conversation.id,

                responseId:
                  "",

                opportunityId:
                  chatInput.opportunityId,

                lead: {
                  shouldCapture:
                    true,

                  interest:
                    commercialCatalogItem.nome,

                  status:
                    "INTERESSADO",
                },

                action:
                  commercialAction,
              };
            } // fecha if (!agentHasNoCommercialAction)

          } catch (commercialError) {
            /**
             * O CommercialFlow é a fonte de verdade da conversão.
             *
             * Se o novo motor falhar, NÃO permitimos que a execução
             * caia no funil comercial legado. Isso evita:
             *
             * - duas solicitações concorrentes;
             * - duas candidaturas/ofertas;
             * - perda do item do catálogo;
             * - OPORTUNIDADE_SEM_ITEM_CATALOGO;
             * - divergência entre pagamento e agenda.
             *
             * O estado já persistido no CommercialFlow permanece intacto
             * para uma nova tentativa.
             */
            console.error(
              "[CHAT COMMERCIAL FLOW] Novo motor falhou; fallback legado bloqueado",
              {
                conversationId:
                  conversation.id,

                opportunityId:
                  chatInput.opportunityId,

                catalogItemId:
                  commercialCatalogItem.id,

                flowId:
                  activeCommercialFlow?.id ||
                  null,

                flowState:
                  activeCommercialFlow?.state ||
                  null,

                error:
                  commercialError instanceof Error
                    ? commercialError.message
                    : commercialError,
              },
            );

            const answer =
              "Não consegui concluir a próxima etapa da contratação agora. Sua escolha e o andamento do atendimento continuam registrados no GranConecta. Tente novamente em instantes.";

            await this.persistence
              .saveMessage(
                conversation.id,
                "assistant",
                answer,
              );

            return {
              success:
                true,

              message:
                answer,

              conversationId:
                conversation.id,

              responseId:
                "",

              opportunityId:
                chatInput.opportunityId,

              lead: {
                shouldCapture:
                  true,

                interest:
                  commercialCatalogItem.nome,

                status:
                  "INTERESSADO",
              },

              action: {
                type:
                  "NONE",
              },
            };
          }
        }
      }
    }

    /**
     * ==========================================================
     * IDENTIFICAÇÃO DO CLIENTE NO CHAT DO NEGÓCIO
     * ==========================================================
     *
     * LANDING_PAGE não deve herdar o nome do prestador/Store como userName.
     * Quando não existe nome confiável, perguntamos uma vez e reaproveitamos
     * a resposta registrada no histórico da conversa.
     */
    if (
      chatInput.opportunityId &&
      (
        chatInput.chatbotTipo === "PRESTADOR" ||
        chatInput.chatbotTipo === "LOJA"
      )
    ) {
      const customerHistory =
        await this.persistence.getHistory(
          conversation.id,
        );

      const lastAssistantMessage =
        this.getLastAssistantMessage(
          customerHistory,
        );

      if (
        this.isAssistantAskingCustomerName(
          lastAssistantMessage,
        )
      ) {
        const capturedName =
          this.sanitizeCustomerName(
            message,
          );

        if (capturedName) {
          chatInput.userName =
            capturedName;

          await this.saveUserMessage(
            conversation.id,
            chatInput,
            message,
          );

          const answer =
            this.buildCatalogPresentationAfterName(
              capturedName,
              businessCatalogItems,
            );

          await this.persistence.saveMessage(
            conversation.id,
            "assistant",
            answer,
          );

          await this.persistence.upsertLead(
            conversation.id,
            chatInput,
            {
              shouldCapture: true,
              interest:
                chatInput.storeName ||
                "Atendimento comercial",
              status: "INTERESSADO",
            },
          );

          console.log(
            "[CHAT CLIENTE] Nome capturado",
            {
              opportunityId:
                chatInput.opportunityId,
              conversationId:
                conversation.id,
              userName:
                capturedName,
            },
          );

          return {
            success: true,
            message: answer,
            conversationId:
              conversation.id,
            responseId: "",
            lead: {
              shouldCapture: true,
              interest:
                chatInput.storeName ||
                "Atendimento comercial",
              status: "INTERESSADO",
            },
            action: {
              type: "NONE",
            },
          };
        }
      }

      const resolvedCustomerName =
        opportunitySourceCustomerName ||
        this.resolveCustomerName(
          chatInput,
          customerHistory,
        );

      if (resolvedCustomerName) {
        chatInput.userName =
          resolvedCustomerName;
      }
    }

    /**
     * ==========================================================
     * IDENTIFICAÇÃO DETERMINÍSTICA POR E-MAIL
     * ==========================================================
     *
     * Quando o fluxo comercial já informou que é necessário
     * identificar/cadastrar o cliente, a próxima mensagem é tratada
     * pelo backend como e-mail. A IA não participa desta transição.
     *
     * O frontend recebe a action IDENTIFY_OPPORTUNITY_CUSTOMER e
     * consulta a rota pública segura da oportunidade usando o token.
     */
    if (
      chatInput.opportunityId &&
      (
        chatInput.chatbotTipo === "PRESTADOR" ||
        chatInput.chatbotTipo === "LOJA"
      ) &&
      chatInput.chatbotOwnerId
    ) {
      const identificationHistory =
        await this.persistence.getHistory(
          conversation.id,
        );

      const lastIdentificationAssistantMessage =
        this.getLastAssistantMessage(
          identificationHistory,
        );

      if (
        this.isAssistantAskingOpportunityEmail(
          lastIdentificationAssistantMessage,
        )
      ) {
        const capturedEmail =
          this.extractOpportunityEmail(
            message,
          );

        await this.saveUserMessage(
          conversation.id,
          chatInput,
          message,
        );

        if (!capturedEmail) {
          const answer =
            "Não consegui identificar um e-mail válido. " +
            "Por favor, informe seu e-mail, por exemplo: nome@exemplo.com.";

          await this.persistence.saveMessage(
            conversation.id,
            "assistant",
            answer,
          );

          return {
            success: true,
            message: answer,
            conversationId:
              conversation.id,
            responseId: "",
            lead: {
              shouldCapture: true,
              interest:
                chatInput.storeName ||
                "Identificação do cliente",
              status: "INTERESSADO",
            },
            action: {
              type: "NONE",
            },
          };
        }

        const customerName =
          this.resolveCustomerName(
            chatInput,
            identificationHistory,
          ) ||
          chatInput.userName ||
          "";

        const opportunityToken =
          await this.opportunity.issueAccessToken(
            chatInput.opportunityId,
          );

        const answer =
          `Obrigado${customerName ? `, ${customerName}` : ""}. ` +
          "Agora vou verificar seu cadastro no GranConecta para você continuar com segurança.";

        await this.persistence.saveMessage(
          conversation.id,
          "assistant",
          answer,
        );

        await this.persistence.upsertLead(
          conversation.id,
          {
            ...chatInput,
            userName:
              customerName ||
              chatInput.userName,
          },
          {
            shouldCapture: true,
            interest:
              chatInput.storeName ||
              "Identificação do cliente",
            status: "INTERESSADO",
            nome:
              customerName ||
              undefined,
            email:
              capturedEmail,
          },
        );

        console.log(
          "[CHAT COMERCIAL] E-mail capturado para identificação da oportunidade",
          {
            opportunityId:
              chatInput.opportunityId,
            conversationId:
              conversation.id,
            storeId:
              chatInput.chatbotOwnerId,
            storeSlug:
              chatInput.storeSlug || null,
            email:
              capturedEmail,
          },
        );

        return {
          success: true,
          message: answer,
          conversationId:
            conversation.id,
          responseId: "",
          lead: {
            shouldCapture: true,
            interest:
              chatInput.storeName ||
              "Identificação do cliente",
            status: "INTERESSADO",
            nome:
              customerName ||
              undefined,
            email:
              capturedEmail,
          },
          action: {
            type:
              "IDENTIFY_OPPORTUNITY_CUSTOMER",
            payload: {
              opportunityToken,
              opportunityId:
                chatInput.opportunityId,
              storeId:
                chatInput.chatbotOwnerId,
              lojaId:
                chatInput.chatbotOwnerId,
              storeName:
                chatInput.storeName,
              storeSlug:
                chatInput.storeSlug ||
                undefined,
              chatbotTipo:
                chatInput.chatbotTipo,
              chatbotOwnerId:
                chatInput.chatbotOwnerId,
              origem:
                chatInput.origem,
              nome:
                customerName ||
                undefined,
              email:
                capturedEmail,
            },
          },
        };
      }
    }

    /**
     * ==========================================================
     * SELEÇÃO DETERMINÍSTICA DO ITEM DO CATÁLOGO
     * ==========================================================
     *
     * Exemplos reconhecidos:
     * - "quero a primeira opção"
     * - "quero a segunda opção"
     * - "fico com a 2"
     * - nome exato/contido do item apresentado
     *
     * A escolha é resolvida usando EXATAMENTE a mesma lista que gerou
     * o contexto apresentado à IA. Assim o índice 2 continua apontando
     * para o mesmo UUID do catálogo e não depende da IA inventar IDs.
     */
    if (
      !commercialAgentDecision &&
      chatInput.opportunityId &&
      (
        chatInput.chatbotTipo === "PRESTADOR" ||
        chatInput.chatbotTipo === "LOJA"
      ) &&
      chatInput.chatbotOwnerId &&
      businessCatalogItems.length > 0
    ) {
      const catalogSelectionHistory =
        await this.persistence.getHistory(
          conversation.id,
        );

      const lastCatalogAssistantMessage =
        this.getLastAssistantMessage(
          catalogSelectionHistory,
        );

      let selectedCatalogItem =
        this.resolveCatalogItemSelection(
          message,
          businessCatalogItems,
        );

      /**
       * ----------------------------------------------------------
       * CONFIRMAÇÃO CONTEXTUAL DE UM ÚNICO ITEM
       * ----------------------------------------------------------
       *
       * Exemplo:
       *
       * IA:
       * "Para uma única sessão, temos a Avaliação psicopedagógica
       * inicial. Gostaria de prosseguir?"
       *
       * Cliente:
       * "sim gostaria"
       *
       * A mensagem do cliente não contém o nome do item, então a
       * seleção direta falha. Nesse caso recuperamos o item citado
       * na ÚLTIMA resposta da IA.
       *
       * Segurança:
       * - só assume quando a resposta do cliente é afirmativa;
       * - só assume quando EXATAMENTE UM item do catálogo foi
       *   mencionado na última resposta da IA;
       * - se dois ou mais itens foram apresentados, não escolhe
       *   automaticamente.
       */
      if (
        !selectedCatalogItem &&
        this.isAffirmativeCommercialAnswer(
          message,
        ) &&
        lastCatalogAssistantMessage
      ) {
        const normalizedAssistantMessage =
          this.normalize(
            lastCatalogAssistantMessage,
          );

        const itemsMentionedByAssistant =
          businessCatalogItems.filter(
            (item) =>
              normalizedAssistantMessage.includes(
                this.normalize(
                  item.nome,
                ),
              ),
          );

        if (
          itemsMentionedByAssistant.length === 1
        ) {
          const contextualCatalogItem =
            itemsMentionedByAssistant[0];

          if (contextualCatalogItem) {
            selectedCatalogItem =
              contextualCatalogItem;

            console.log(
              "[CHAT CATÁLOGO] Item recuperado pela confirmação contextual",
              {
                opportunityId:
                  chatInput.opportunityId,

                conversationId:
                  conversation.id,

                message,

                catalogItemId:
                  contextualCatalogItem.id,

                catalogItemName:
                  contextualCatalogItem.nome,

                catalogItemType:
                  contextualCatalogItem.tipo,
              },
            );
          }
        } else if (
          itemsMentionedByAssistant.length > 1
        ) {
          console.log(
            "[CHAT CATÁLOGO] Confirmação contextual ambígua; item não selecionado",
            {
              opportunityId:
                chatInput.opportunityId,

              conversationId:
                conversation.id,

              message,

              itensMencionados:
                itemsMentionedByAssistant.map(
                  (item) => ({
                    id:
                      item.id,

                    nome:
                      item.nome,

                    tipo:
                      item.tipo,
                  }),
                ),
            },
          );
        }
      }

      console.log(
        "[CHAT CATÁLOGO] Tentativa de resolver escolha comercial",
        {
          opportunityId:
            chatInput.opportunityId,
          chatbotTipo:
            chatInput.chatbotTipo,
          message,
          resolvedItemId:
            selectedCatalogItem?.id ||
            null,
          resolvedItemName:
            selectedCatalogItem?.nome ||
            null,
          availableItems:
            businessCatalogItems.map(
              (item) => ({
                id: item.id,
                tipo: item.tipo,
                nome: item.nome,
              }),
            ),
        },
      );

      if (selectedCatalogItem) {
        await this.saveUserMessage(
          conversation.id,
          chatInput,
          message,
        );

        const savedOpportunity =
          await this.opportunityCatalog
            .selectCatalogItem({
              opportunityId:
                chatInput.opportunityId,
              catalogItemId:
                selectedCatalogItem.id,
            });

        const price =
          this.businessCatalog
            .getPrecoVigente(
              selectedCatalogItem,
            );

        const details: string[] = [
          `Perfeito. Você escolheu ${selectedCatalogItem.nome}.`,
          `Valor vigente: R$ ${price.precoVigente
            .toFixed(2)
            .replace(".", ",")}.`,
        ];

        if (selectedCatalogItem.totalSessoes > 1) {
          details.push(
            `O pacote inclui ${selectedCatalogItem.totalSessoes} sessões.`,
          );
        }

        if (selectedCatalogItem.duracaoMinutos) {
          details.push(
            `Duração aproximada: ${selectedCatalogItem.duracaoMinutos} minutos por atendimento.`,
          );
        }

        details.push(
          `A escolha foi registrada no GranConecta${chatInput.userName ? ` para ${chatInput.userName}` : ""}. Qual dia você prefere para o atendimento?`,
        );

        const answer =
          details.join(" ");

        await this.persistence
          .saveMessage(
            conversation.id,
            "assistant",
            answer,
          );

        await this.persistence
          .upsertLead(
            conversation.id,
            chatInput,
            {
              shouldCapture: true,
              interest:
                selectedCatalogItem.nome,
              status:
                "INTERESSADO",
            },
          );

        console.log(
          "[CHAT CATÁLOGO] Item comercial selecionado e persistido",
          {
            opportunityId:
              savedOpportunity.id,
            conversationId:
              conversation.id,
            storeId:
              chatInput.chatbotOwnerId,
            catalogItemId:
              selectedCatalogItem.id,
            catalogItemName:
              selectedCatalogItem.nome,
            catalogItemType:
              selectedCatalogItem.tipo,
            precoVigente:
              price.precoVigente,
            totalSessoes:
              selectedCatalogItem.totalSessoes,
          },
        );

        return {
          success: true,
          message: answer,
          conversationId:
            conversation.id,
          responseId: "",
          lead: {
            shouldCapture: true,
            interest:
              selectedCatalogItem.nome,
            status:
              "INTERESSADO",
          },
          action: {
            type: "NONE",
          },
        };
      }
    }

    /**
     * ==========================================================
     * AÇÃO ANTECIPADA
     * ==========================================================
     *
     * Detecta handoff antes de chamar IA.
     */
    const earlyAction =
      this.detectBotAction(
        message,
        chatInput,
      );

    /**
     * ==========================================================
     * HANDOFF HUMANO
     * ==========================================================
     */
    if (
      earlyAction.type ===
      "HUMAN_HANDOFF"
    ) {
      /**
       * Garante que um pedido de atendimento humano iniciado
       * diretamente no chatbot de uma loja/prestador também
       * passe a existir na Central Comercial.
       *
       * Antes desta correção, ensureDirectBusinessOpportunity()
       * só era chamado quando detectCommercialIntent() retornava
       * commercialInterest=true. Uma mensagem como
       * "quero falar com um atendente humano" podia ir direto para
       * AGUARDANDO_ATENDENTE sem criar marketing_opportunity.
       *
       * Resultado: a fila humana funcionava, mas a Central Comercial
       * não tinha uma oportunidade para exibir.
       */
      if (
        !chatInput.opportunityId &&
        (
          chatInput.chatbotTipo === "PRESTADOR" ||
          chatInput.chatbotTipo === "LOJA"
        ) &&
        chatInput.chatbotOwnerId
      ) {
        const directOpportunity =
          await this.ensureDirectBusinessOpportunity(
            chatInput,
            conversation.id,
          );

        if (directOpportunity) {
          chatInput.opportunityId =
            directOpportunity.id;

          console.log(
            "[CHAT HUMAN HANDOFF] Oportunidade direta garantida para Central Comercial",
            {
              opportunityId:
                directOpportunity.id,
              conversationId:
                conversation.id,
              storeId:
                chatInput.chatbotOwnerId,
              chatbotTipo:
                chatInput.chatbotTipo,
              origem:
                chatInput.channel ||
                chatInput.origem ||
                null,
            },
          );
        } else {
          console.warn(
            "[CHAT HUMAN HANDOFF] Não foi possível criar/vincular oportunidade direta",
            {
              conversationId:
                conversation.id,
              storeId:
                chatInput.chatbotOwnerId,
              chatbotTipo:
                chatInput.chatbotTipo,
              storeName:
                chatInput.storeName ||
                null,
              storeSlug:
                chatInput.storeSlug ||
                null,
            },
          );
        }
      }

      await this.saveUserMessage(
        conversation.id,
        chatInput,
        message,
      );

      await this.persistence
        .markWaitingHuman(
          conversation.id,
        );

      const destinoAtendimento =
        chatInput.chatbotTipo ===
          "GRANCONECTA"
          ? "GranConecta"
          : chatInput.storeName ||
          (
            chatInput.chatbotTipo ===
              "PRESTADOR"
              ? "prestador responsável"
              : "loja responsável"
          );

      const answer =
        `Certo, vou encaminhar sua conversa para um atendente do ${destinoAtendimento}. ` +
        "Você pode continuar por aqui; assim que alguém responder, a mensagem aparecerá neste chat.";

      await this.persistence
        .saveMessage(
          conversation.id,
          "assistant",
          answer,
        );

      await this.persistence
        .upsertLead(
          conversation.id,
          chatInput,
          {
            shouldCapture:
              true,

            interest:
              message,

            status:
              "ENCAMINHADO",
          },
        );

      return {
        success:
          true,

        message:
          answer,

        conversationId:
          conversation.id,

        responseId:
          "",

        lead: {
          shouldCapture:
            true,

          interest:
            message,

          status:
            "ENCAMINHADO",
        },

        action:
          earlyAction,
      };
    }

    /**
     * ==========================================================
     * RESPOSTA CONSULTIVA DO NOVO AGENTE
     * ==========================================================
     *
     * Quando não houve transição comercial determinística acima, o
     * cérebro pode responder perguntas de descoberta, informação, preço,
     * comparação e objeções usando o contexto oficial do negócio.
     *
     * SUPPORT/OTHER continuam no ChatKnowledgeService legado porque podem
     * depender de conhecimento mais amplo que não pertence ao catálogo.
     */
    if (
      commercialAgentDecision &&
      !commercialAgentDecision.shouldAdvanceCommercialFlow &&
      !commercialAgentDecision.shouldRequestHumanHandoff &&
      [
        "GREETING",
        "DISCOVER",
        "ASK_INFORMATION",
        "ASK_PRICE",
        "COMPARE_OPTIONS",
        "OBJECTION",
      ].includes(
        commercialAgentDecision.intent,
      ) &&
      String(
        commercialAgentDecision.suggestedReply ||
        "",
      ).trim()
    ) {
      const answer =
        String(
          commercialAgentDecision.suggestedReply,
        ).trim();

      await this.saveUserMessage(
        conversation.id,
        chatInput,
        message,
      );

      await this.persistence.saveMessage(
        conversation.id,
        "assistant",
        answer,
      );

      await this.persistence.upsertLead(
        conversation.id,
        chatInput,
        {
          shouldCapture:
            commercialAgentDecision.intent !==
            "GREETING",
          interest:
            commercialAgentDecision.catalogItemName ||
            commercialAgentDecision.customerNeed ||
            chatInput.storeName ||
            message,
          status:
            commercialAgentDecision.intent ===
              "GREETING"
              ? "NOVO"
              : "INTERESSADO",
        },
      );

      console.log(
        "[GRANCONECTA AGENT] Resposta consultiva enviada",
        {
          conversationId:
            conversation.id,
          opportunityId:
            chatInput.opportunityId ||
            null,
          intent:
            commercialAgentDecision.intent,
          confidence:
            commercialAgentDecision.confidence,
        },
      );

      return {
        success: true,
        message: answer,
        conversationId:
          conversation.id,
        responseId: "",
        opportunityId:
          chatInput.opportunityId ||
          undefined,
        lead: {
          shouldCapture:
            commercialAgentDecision.intent !==
            "GREETING",
          interest:
            commercialAgentDecision.catalogItemName ||
            commercialAgentDecision.customerNeed ||
            chatInput.storeName ||
            message,
          status:
            commercialAgentDecision.intent ===
              "GREETING"
              ? "NOVO"
              : "INTERESSADO",
        },
        action: {
          type: "NONE",
        },
      };
    }

    /**
     * ==========================================================
     * HISTÓRICO
     * ==========================================================
     */
    const history =
      await this.persistence
        .getHistory(
          conversation.id,
        );

    // CEP informado voluntariamente nesta conversa. A última declaração prevalece.
    // Não extrair CEP de mensagens do assistente nem de números sem contexto.
    const cepDeclarado = String(chatInput.cep || "").replace(/\D/g, "");
    const cepHistorico = [...history, { role: "user", content: message }]
      .filter((entry) => entry.role === "user")
      .reverse()
      .map((entry) => String(entry.content || "").match(
        /\b(?:cep\s*(?:e|é|:|=|do|da)?\s*)(\d{5}[-.\s]?\d{3})\b/i,
      )?.[1]?.replace(/\D/g, "") || null)
      .find((cep) => cep?.length === 8) || null;
    const cepBusca = cepDeclarado.length === 8 ? cepDeclarado : cepHistorico;

    // Funcionalidades internas do morador: orientação, nunca execução.
    // Antes de encaminhar para o motor de prestadores/parceiros.
    const canGuideResidentFeature =
      chatInput.chatbotTipo === "GRANCONECTA" &&
      !chatInput.chatbotOwnerId && !chatInput.selectedStoreId &&
      !conversation.selectedStoreId && !chatInput.opportunityId &&
      !chatInput.opportunityBootstrap && !chatInput.campanhaId &&
      !chatInput.campaignStage && !chatInput.tipoDestino;

    if (canGuideResidentFeature) {
      const featureAnswer = this.guideResidentFeature(message, chatInput);
      if (featureAnswer) {
        await this.saveUserMessage(conversation.id, chatInput, message);
        await this.persistence.saveMessage(conversation.id, "assistant", featureAnswer);
        console.log("[DOT FUNCIONALIDADE MORADOR] Orientação enviada", {
          conversationId: conversation.id,
          userType: chatInput.userType || null,
          authenticated: Boolean(chatInput.userId),
        });
        return {
          success: true,
          message: featureAnswer,
          conversationId: conversation.id,
          responseId: "",
          lead: { shouldCapture: false, status: "NOVO" },
          action: { type: "NONE" },
        };
      }
    }

    // DOT PRINCIPAL: interpretação contextual de pedidos de aviso.
    // Não registra inscrição, não envia notificações e não altera fluxo comercial.
    // O flag permite testar sem modificar o comportamento atual em produção.
    if (canGuideResidentFeature && process.env.GRANCONECTA_RESIDENT_ROUTING_ENABLED === "true") {
      try {
        const residentContext = this.residentMemory.build(history);
        const residentDecision = this.residentIntentService.classify(message, {
          ...residentContext,
        });
        if (residentDecision.intent === "SOLICITAR_AVISO_DISPONIBILIDADE") {
          const interest = residentContext.lastInterest;
          const subject = interest
            ? ` sobre ${interest}`
            : " sobre o produto ou serviço de seu interesse";
          const reply = `Entendi que você gostaria de receber um aviso${subject}. ` +
            "No momento, não consigo confirmar que um aviso automático foi cadastrado. " +
            "Posso ajudar você a procurar opções disponíveis agora. " +
            "Se ainda não tem conta, o cadastro pode ser feito em https://www.granconecta.net.br/cadastro.";
          await this.saveUserMessage(conversation.id, chatInput, message);
          await this.persistence.saveMessage(conversation.id, "assistant", reply);
          return {
            success: true, message: reply, conversationId: conversation.id,
            responseId: "", lead: { shouldCapture: false, status: "NOVO" },
            action: { type: "NONE" },
          };
        }
      } catch (residentError) {
        console.warn("[DOT RESIDENT] Falha não bloqueante", residentError);
      }
    }

    // Motor de intenções: SOMENTE OBSERVAÇÃO nesta etapa de pré-lançamento.
    // Não altera roteamento, oportunidades, pagamentos ou permissões.
    if (process.env.GRANCONECTA_INTENT_OBSERVE === "true") {
      try {
        const lastAssistant = [...history].reverse().find((entry) => entry.role === "assistant");
        const detected = this.intentService.classify(message, String(lastAssistant?.content || ""));
        console.log("[DOT INTENT OBSERVE]", {
          conversationId: conversation.id,
          intent: detected.intent,
          confidence: detected.confidence,
          reason: detected.reason,
          requiresContext: detected.requiresContext,
        });
      } catch (intentError) {
        console.warn("[DOT INTENT OBSERVE] Classificação ignorada", intentError);
      }
    }

    // Captação controlada de parceiros: somente DOT principal, visitante anônimo,
    // sem campanha, oportunidade ou negociação ativa. Nunca altera cadastros.
    // Habilitar somente após testes: GRANCONECTA_PARTNER_ROUTING_ENABLED=true
    const canRouteAnonymousPartner =
      chatInput.chatbotTipo === "GRANCONECTA" &&
      !String(chatInput.userId || "").trim() &&
      !chatInput.opportunityId && !chatInput.opportunityBootstrap &&
      !chatInput.chatbotOwnerId && !chatInput.selectedStoreId &&
      !conversation.selectedStoreId && !chatInput.campanhaId &&
      !chatInput.campaignStage && !chatInput.tipoDestino;

    if (canRouteAnonymousPartner) {
      const previousAssistant = [...history].reverse()
        .find((entry) => entry.role === "assistant");
      const intent = this.intentService.classify(
        message, String(previousAssistant?.content || ""),
      );
      // Cadastro genérico não equivale a interesse comercial.
      // Evita que o classificador envie moradores para o funil PREMIUM.
      const normalizedSignup = message.normalize("NFD")
        .replace(/[\\u0300-\\u036f]/g, "").toLowerCase().trim();
      const genericSignup = /\\b(cadastr|registro|criar conta)\\w*/.test(normalizedSignup);
      const businessSignal = /\\b(anunciar|divulgar|vender|vendo|loja|negocio|empreendedor|prestador|servico|produto|churrasqueiro|manicure|eletricista)\\b/.test(normalizedSignup);
      const residentSignal = /\\b(morador|moradora|residente|moro no|sou do gran reserva)\\b/.test(normalizedSignup);
      // A intenção inferida nunca basta para iniciar o funil de parceiros.
      // Só uma solicitação comercial explícita do próprio usuário o autoriza.
      const explicitCommercialRequest = /\b(quero anunciar|anunciar meu negocio|cadastrar minha loja|cadastrar meu negocio|quero ser (um )?parceiro|quero me tornar parceiro|quero ser (um )?prestador|quero ser (um )?empreendedor|divulgar meu negocio|divulgar minha loja|vender meus produtos|quero abrir uma loja)\b/.test(normalizedSignup);
      const neutralIntent = (!explicitCommercialRequest || (genericSignup && !businessSignal))
        ? { ...intent, intent: "INDEFINIDA" }
        : intent;
      if (genericSignup && !businessSignal && !residentSignal && history.length === 0) {
        const answer = "Claro! Você quer se cadastrar somente como morador ou deseja anunciar produtos ou serviços no GranConecta?";
        await this.saveUserMessage(conversation.id, chatInput, message);
        await this.persistence.saveMessage(conversation.id, "assistant", answer);
        return {
          success: true, message: answer, conversationId: conversation.id,
          responseId: "", lead: { shouldCapture: false, status: "NOVO" },
          action: { type: "NONE" },
        };
      }
      const residentStep = this.partnerConversation.residentRegistrationStep(message, history);
      const registrationStep = residentStep ||
        this.partnerConversation.registrationStep(message, history, neutralIntent);
      const partnerAnswer = registrationStep?.message ||
        (process.env.GRANCONECTA_PARTNER_ROUTING_ENABLED === "true"
          ? this.partnerConversation.respond(message, history, neutralIntent) : null);
      if (partnerAnswer) {
        await this.saveUserMessage(conversation.id, chatInput, message);
        await this.persistence.saveMessage(conversation.id, "assistant", partnerAnswer);
        console.log("[DOT PARTNER CONSULTIVO]", {
          conversationId: conversation.id,
          intent: intent.intent,
          registrationAction: registrationStep?.action?.type || "NONE",
        });
        return {
          success: true, message: partnerAnswer.replace(/^\\[cadastro assistido (?:dot|morador)\\] /, ""),
          conversationId: conversation.id, responseId: "",
          lead: { shouldCapture: Boolean(registrationStep), status: registrationStep ? "QUALIFICANDO" : "NOVO" },
          action: registrationStep?.action || { type: "NONE" },
        };
      }
    }

    // PRIORIDADE: proprietário consultando a própria vitrine.
    // Este fluxo é administrativo/informativo e NÃO é busca de prestadores,
    // seleção de negócio, lead ou oportunidade de marketing.
    const ownerRequest = message.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().trim();
    const mentionsOwnBusiness = /\b(meu|minha|meus|minhas|proprio|propria)\b/.test(ownerRequest);
    const mentionsBusinessManagement = /\b(landing|pagina|vitrine|negocio|empresa|loja|perfil|anuncio|anuncios|divulgacao|marketing|publicad[oa]|rascunho|capa|logotipo|dashboard|painel)\b/.test(ownerRequest);
    const asksBusinessDiagnostic = /\b(consult|verific|avali|analis|diagnostic|pront|melhor|falt|revis|mostr|visualiz|acess|configur|public|cri|edit|prepar)\w*/.test(ownerRequest);
    const isOwnerDiagnosticRequest =
      mentionsOwnBusiness && mentionsBusinessManagement && asksBusinessDiagnostic;
    const canCheckOwnerDiagnostic =
      chatInput.chatbotTipo === "GRANCONECTA" &&
      chatInput.origem === "CHAT_HOME" &&
      Boolean(String(chatInput.userId || "").trim()) &&
      !chatInput.opportunityId && !chatInput.opportunityBootstrap &&
      !chatInput.chatbotOwnerId && !chatInput.selectedStoreId &&
      !conversation.selectedStoreId;

    if (canCheckOwnerDiagnostic && isOwnerDiagnosticRequest) {
      try {
        const owner = await this.businessOwnerContext.build(String(chatInput.userId));
        if (owner.isBusinessOwner) {
          const parts = owner.businesses.map((business, index) => {
            const publication = business.hasPublishedPage
              ? "Página com conteúdo publicado"
              : business.hasDraft
                ? "Rascunho encontrado; publicação não identificada"
                : "Página não criada ou sem conteúdo detectável";
            const missing = business.checks.filter((check) => !check.complete);
            return [
              `${index + 1}. ${business.isProvisionalName ? "Cadastro provisório (nome atual: " + business.name + ")" : business.name}`,
              ...(business.isProvisionalName
                ? ["Nome comercial: ainda não definido pelo proprietário. O nome atual é provisório."]
                : []),
              `Situação: ${publication}.`,
              `Pontuação cadastral: ${business.score}/100.`,
              `Classificação: ${business.status.replace(/_/g, " ").toLowerCase()}.`,
              `Vitrine: ${business.landingPath}`,
              missing.length
                ? `Itens a completar: ${missing.map((check) => check.label.toLowerCase()).join("; ")}.`
                : "Todos os critérios cadastrais avaliados estão preenchidos.",
              ...business.recommendations.map((item) => `• ${item}`),
            ].join("\n");
          });
          const hasProvisionalBusiness = owner.businesses.some(
            (business) => business.isProvisionalName,
          );
          const answer = [
            `${chatInput.userName ? `${String(chatInput.userName).trim().split(/\s+/)[0]}, ` : ""}consultei os negócios vinculados à sua conta no GranConecta.`,
            "",
            ...parts,
            "",
            "Este é um diagnóstico cadastral. Ainda não verifiquei visualmente o design, os botões ou o funcionamento da página.",
            hasProvisionalBusiness
              ? owner.businesses.filter((business) => business.isProvisionalName).length === 1
                ? "O cadastro ainda utiliza um nome provisório. Qual nome comercial você deseja usar para apresentar seu negócio aos moradores? Não alterarei o cadastro sem sua confirmação."
                : "Alguns negócios ainda utilizam nomes provisórios. Qual deles deseja configurar primeiro e que nome comercial gostaria de usar? Não alterarei o cadastro sem sua confirmação."
              : "Quer que eu ajude a melhorar sua apresentação comercial?",
          ].join("\n");
          await this.saveUserMessage(conversation.id, chatInput, message);
          await this.persistence.saveMessage(conversation.id, "assistant", answer);
          console.log("[DOT OWNER] Diagnóstico cadastral entregue", {
            conversationId: conversation.id, businesses: owner.businesses.length,
          });
          return {
            success: true, message: answer, conversationId: conversation.id,
            responseId: "", lead: { shouldCapture: false, status: "NOVO" },
            action: { type: "NONE" },
          };
        }
      } catch (error) {
        console.warn("[DOT OWNER] Falha no diagnóstico; fluxo normal preservado", error);
      }
    }

    // RADAR LOCAL: continuidade determinística, sem interpretar consentimento pela IA.
    // Executa somente depois da validação de acesso à conversa e da leitura do histórico.
    if (chatInput.chatbotTipo === "GRANCONECTA" &&
      process.env.NODE_ENV === "local" &&
      (chatInput.origem === "CHAT_HOME" || !chatInput.origem)) {
      const lastAssistant = [...history].reverse().find((entry) => entry.role === "assistant");
      const previous = String(lastAssistant?.content || "");
      const normalized = message.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
      // Normaliza a resposta livre sem confundir a frase com o nome do bairro.
      const extractRadarBairro = (value: string): string | null => {
        let bairro = value.trim()
          .replace(/^(?:(?:eu\s+)?(?:moro|resido|estou|fico|vivo)\s+(?:no|na|em)\s+|(?:o\s+)?meu\s+bairro\s+(?:e|é|fica\s+em)\s+|(?:sou|venho)\s+(?:do|da|de)\s+)/i, "")
          .replace(/[,;.]\s*(?:em\s+)?(?:s[aã]o\s+paulo|sp)(?:\s*[-,]\s*sp)?\.?$/i, "")
          .replace(/\s*[-,]\s*sp\.?$/i, "")
          .replace(/[.!?]+$/, "")
          .trim();
        const plain = bairro.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        if (plain === "jaragua") bairro = "Jaraguá";
        else bairro = bairro.replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase("pt-BR"));
        const normalizedBairro = bairro.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const isService = /\b(preciso|procurando|busco|quero|contratar|instalar|consertar|reparar|eletricista|encanador|ventilador|servico|profissional|disponivel|orcamento)\b/i.test(normalizedBairro);
        const words = bairro.split(/\s+/).filter(Boolean).length;
        if (bairro.length < 2 || bairro.length > 70 || words > 7 || isService || /@|\d{5,}/.test(bairro) || /[?\n\r]/.test(value)) return null;
        return bairro;
      };
      const respondRadar = async (answer: string): Promise<ChatMessageResult> => {
        await this.saveUserMessage(conversation.id, chatInput, message);
        await this.persistence.saveMessage(conversation.id, "assistant", answer);
        return {
          success: true, message: answer, conversationId: conversation.id,
          responseId: "", lead: { shouldCapture: false, status: "NOVO" }, action: { type: "NONE" }
        };
      };
      try {
        const profileId = await this.demandRadar.findConversationProfile(conversation.id);
        if (profileId && (previous.includes("qual é o seu bairro?") || previous.includes("Qual é o nome do seu bairro?"))) {
          if (/^(nao|não|prefiro nao|prefiro não|cancelar|agora nao)$/i.test(message.trim())) {
            return await respondRadar("Tudo bem, não é obrigatório informar sua região. Posso ajudar em outra busca?");
          }
          const bairro = extractRadarBairro(message);
          if (bairro) {
            const saved = await this.demandRadar.updateRegion({ conversationId: conversation.id, bairro });
            if (saved) return await respondRadar(`Registrei sua região: ${bairro}.\n\nVocê autoriza o GranConecta a guardar seu WhatsApp ou e-mail exclusivamente para um possível aviso futuro sobre profissionais nessa região? Responda sim ou não. É opcional; o envio de avisos ainda não está ativo.`);
          }
          return await respondRadar("Qual é o nome do seu bairro? Se preferir não informar, responda 'não'.");
        }
        if (profileId && (previous.includes("Você autoriza o GranConecta") || previous.includes("Você autoriza? Responda sim ou não."))) {
          if (/^(sim|sim por favor|autorizo|aceito|quero|pode ser)[!. ]*$/i.test(normalized)) {
            return await respondRadar("Obrigado pela autorização. Informe um WhatsApp com DDD ou um e-mail para receber exclusivamente esse aviso. Você também pode responder 'cancelar'.");
          }
          if (/^(nao|não|cancelar|prefiro nao|prefiro não)[!. ]*$/i.test(normalized)) {
            return await respondRadar("Sem problemas. Não guardaremos contato para avisos. Posso ajudar em outra busca?");
          }
          return await respondRadar("Para guardar um contato e enviar futuramente um aviso sobre profissionais disponíveis, preciso da sua autorização explícita. Você autoriza? Responda sim ou não.");
        }
        if (profileId && previous.includes("Seu interesse e contato foram registrados com sua autorização")) {
          const bairro = extractRadarBairro(message);
          if (bairro && /^(?:(?:eu\s+)?(?:moro|resido|estou|fico|vivo)\s+|(?:o\s+)?meu\s+bairro\s+|(?:sou|venho)\s+)/i.test(message.trim())) {
            const saved = await this.demandRadar.updateRegion({ conversationId: conversation.id, bairro });
            if (saved) return await respondRadar(`Atualizei sua região para ${bairro}. Seu interesse e o contato autorizado permanecem registrados. Os avisos automáticos ainda não estão ativos neste teste.`);
          }
        }
        if (profileId && (previous.includes("Informe um WhatsApp com DDD") || previous.includes("Envie um e-mail válido ou WhatsApp"))) {
          if (/^(cancelar|nao|não)$/i.test(normalized)) return await respondRadar("Tudo bem. Nenhum contato foi registrado. Posso ajudar em outra busca?");
          const contato = message.trim();
          const canal = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contato) ? "EMAIL" : "WHATSAPP";
          const saved = await this.demandRadar.saveContactConsent({ conversationId: conversation.id, canal, contato, consentimentoExplicito: true });
          if (saved) return await respondRadar("Seu interesse e contato foram registrados com sua autorização. Obrigado! Você pode revogar esse consentimento quando quiser. O envio automático de avisos ainda não está implementado e nenhuma mensagem será enviada neste ambiente de testes.");
          return await respondRadar("Não consegui validar o contato. Envie um e-mail válido ou WhatsApp com DDD, ou responda 'cancelar'.");
        }
      } catch (radarFlowError) {
        console.warn("[RADAR DEMANDA] Falha na continuidade; atendimento normal preservado", radarFlowError);
      }
    }

    // DOT CHAT_HOME: opções numeradas são geradas pelo backend e recuperadas
    // do histórico da conversa autorizada. Nunca reordenar após a apresentação.
    if (chatInput.chatbotTipo === "GRANCONECTA" &&
      chatInput.origem === "CHAT_HOME" && !chatInput.campanhaId) {
      const previousOptions = [...history].reverse().find((entry) =>
        entry.role === "assistant" && entry.content.includes("Encontrei estas opções no GranConecta:\n"),
      );
      const selectionText = message.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
      // Perguntas de acompanhamento usam apenas distâncias já calculadas e
      // exibidas pelo backend. Não aceitar palpites do modelo nem histórico
      // anterior contraditório sem dados.
      const isDistanceFollowup = /\b(mais proximo|mais perto|qual.*(?:km|quilometro|distancia)|quantos?\s*(?:km|quilometros)|distancia.*(?:deles|dos dois|cada))\b/.test(selectionText);
      if (isDistanceFollowup && previousOptions) {
        const candidates = previousOptions.content.split("\n")
          .map((line) => {
            const match = line.match(/^\d+\.\s+(.+?)\s+—\s+.*?aproximadamente\s+([\d.,]+)\s+km em linha reta/);
            const name = match?.[1];
            const rawKm = match?.[2];
            return name && rawKm
              ? { name, km: Number(rawKm.replace(/\./g, "").replace(",", ".")) }
              : null;
          })
          .filter((item): item is { name: string; km: number } => item !== null && Number.isFinite(item.km))
          .sort((a, b) => a.km - b.km);
        const closest = candidates[0];
        const answer = closest
          ? `Pelas distâncias aproximadas em linha reta a partir do condomínio, ${closest.name} é o mais próximo (${closest.km.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km).\n\n` +
          candidates.map((item) => `• ${item.name}: ${item.km.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km`).join("\n") +
          "\n\nEssas distâncias não são trajetos de carro. Se quiser, posso atualizar a busca."
          : "Ainda não tenho distâncias verificadas para comparar essas opções. Peça para atualizar a busca.";
        await this.saveUserMessage(conversation.id, chatInput, message);
        await this.persistence.saveMessage(conversation.id, "assistant", answer);
        return {
          success: true, message: answer, conversationId: conversation.id,
          responseId: "", lead: { shouldCapture: false, status: "NOVO" }, action: { type: "NONE" }
        };
      }
      const selectionMatch = selectionText.match(/^(?:quero\s+|escolho\s+|opcao\s+|numero\s+|o\s+|a\s+|conhecer\s+o\s+)?([1-8])(?:\s*[.!])?$/)
        || selectionText.match(/^(?:quero\s+|escolho\s+|conhecer\s+)?(?:o\s+|a\s+)?(primeiro|primeira|segundo|segunda|terceiro|terceira|quarto|quarta|quinto|quinta)(?:\s+profissional)?[.!]?$/);
      // Aceita escolhas naturais como "gostaria do eletricista 1", "quero o prestador 2"
      // e "escolho a opção 3", sempre vinculadas à última lista do backend.
      // Não interpretar números soltos em mensagens sem opções anteriores.
      const naturalNumberMatch = selectionText.match(
        /^(?:(?:eu\s+)?(?:gostaria|quero|escolho|prefiro|vou\s+com|pode\s+ser|digo|falo|quero\s+falar|gostaria\s+de\s+falar)\s+(?:(?:de|com)\s+)?(?:o|a|do|da)?\s*)?(?:(?:eletricista|eletrecista|encanador|pedreiro|diarista|pintor|profissional|prestador|loja|opcao|numero)\s+)([1-8])(?:\s*[.!])?$/,
      );
      const ordinal: Record<string, number> = {
        primeiro: 1, primeira: 1, segundo: 2, segunda: 2,
        terceiro: 3, terceira: 3, quarto: 4, quarta: 4,
        quinto: 5, quinta: 5,
      };
      // Também aceita a escolha pelo nome exibido na lista, por exemplo
      // "quero falar com o eletricista Kleber". Somente nomes presentes
      // na última lista efetivamente apresentada podem ser selecionados.
      const normalizeOption = (value: string): string => value.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "").toLowerCase()
        .replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
      // Também aceita o nome isolado do profissional apresentado (ex.: "kleber").
      // A seleção só acontece quando há uma correspondência inequívoca na última lista.
      const namedCandidates = previousOptions
        ? previousOptions.content.split("\n").map((line) => {
          const match = line.match(/^([1-8])\.\s+(.+?)\s+[—–-]\s+/);
          return match ? { number: Number(match[1]), name: normalizeOption(match[2] ?? "") } : null;
        }).filter((item): item is { number: number; name: string } => Boolean(item && item.name))
        : [];
      // Identifica pelo nome próprio, mesmo quando a pessoa omite a profissão:
      // "quero falar com Kleber" -> "Kleber Eletricista".
      // Só aceita uma correspondência inequívoca na última lista apresentada.
      const professionWords = new Set([
        "eletricista", "eletrecista", "encanador", "pedreiro", "diarista",
        "pintor", "profissional", "prestador", "loja", "servicos", "servico",
        "tecnico", "tecnica", "empresa", "autonomo", "autonoma",
      ]);
      const selectedWords = new Set(normalizeOption(selectionText).split(" "));
      const namedMatches = namedCandidates.filter((candidate) => {
        const parts = candidate.name.split(" ").filter((word) =>
          word.length >= 4 && !professionWords.has(word),
        );
        if (!parts.length) return false;
        // Mensagem curta: nome próprio isolado ou nome completo, sem ambiguidade.
        const meaningfulWords = [...selectedWords].filter((word) =>
          word.length >= 4 && !professionWords.has(word) &&
          !["quero", "falar", "gostaria", "prefiro", "escolho", "conhecer", "com", "para"].includes(word),
        );
        return meaningfulWords.length > 0 && meaningfulWords.every((word) => parts.includes(word));
      });
      const namedNumber = namedMatches.length === 1 ? namedMatches[0]?.number : null;
      if (previousOptions && (selectionMatch || naturalNumberMatch || namedNumber !== null)) {
        const selectionValue = (selectionMatch || naturalNumberMatch)?.[1] ?? "";
        const optionNumber = namedNumber ?? ordinal[selectionValue] ?? Number(selectionValue);
        const optionLines = previousOptions.content.split("\n");
        const chosenLine = optionLines.find((line) => line.startsWith(`${optionNumber}. `));
        const slugMatch = chosenLine?.match(/\/pagina\/([a-zA-Z0-9_-]+)/);
        // As opções da vitrine não contêm links quando a landing não está
        // publicada. Recuperamos a seleção pelo nome EXATO da lista exibida,
        // conferindo novamente a elegibilidade no banco antes de avançar.
        const displayedName = chosenLine?.match(/^[1-8]\.\s+(.+?)\s+\((?:Profissional|Loja)\)\s+[—–-]/)?.[1]?.trim();
        let selectedSlug: string = String(slugMatch?.[1] ?? "");
        if (!selectedSlug && displayedName && previousOptions) {
          const optionsIndex = history.lastIndexOf(previousOptions);
          const searchRequest = [...history.slice(0, optionsIndex)].reverse()
            .find((entry) => entry.role === "user");
          if (searchRequest) {
            const refreshed = await this.knowledge.listDotBusinesses(
              searchRequest.content, chatInput.condominioId, chatInput.userId || null, cepBusca,
            );
            const exactMatches = refreshed.filter((candidate) =>
              normalizeOption(candidate.name) === normalizeOption(displayedName),
            );
            // Nunca selecionar um negócio diferente por mudança na ordenação.
            if (exactMatches.length === 1) selectedSlug = String(exactMatches[0]?.slug ?? "");
          }
        }
        if (selectedSlug) {
          const business = await this.knowledge.getEligibleDotBusinessBySlug(selectedSlug);
          if (!business) {
            const answer = "Este profissional não está disponível neste momento. Posso buscar outras opções para você.";
            await this.saveUserMessage(conversation.id, chatInput, message);
            await this.persistence.saveMessage(conversation.id, "assistant", answer);
            return {
              success: true, message: answer, conversationId: conversation.id,
              responseId: "", lead: { shouldCapture: false, status: "NOVO" }, action: { type: "NONE" }
            };
          }
          const chatbotTipo = this.knowledge.resolveBusinessChatbotTipo(business);
          const opportunity = await this.opportunity.getOrCreate({
            campanhaId: null, playbookId: null, categoriaId: null,
            sourceConversationId: conversation.id, userId: chatInput.userId || null,
            userType: chatInput.userType || null, condominioId: chatInput.condominioId || null,
            canalOrigem: chatInput.channel || chatInput.origem || null,
          });
          // Aproveita a necessidade informada ANTES da lista de opções.
          // O histórico é da conversa atual, já validada pela camada de chat.
          const previousOptionsIndex = history.lastIndexOf(previousOptions);
          const beforeOptions = history.slice(0, previousOptionsIndex);
          const initialNeed = [...beforeOptions].reverse().find((entry) => {
            if (entry.role !== "user") return false;
            const text = String(entry.content || "").trim();
            return text.length >= 8 && !/^(oi|olá|ola|bom dia|boa tarde|boa noite)[!. ]*$/i.test(text);
          });
          if (initialNeed) {
            await this.opportunity.registerDotInitialNeed(
              opportunity.id,
              String(initialNeed.content),
            );
          }
          const selection = await this.opportunity.selectBusiness({
            opportunityId: opportunity.id, storeId: business.id,
            storeName: business.name, storeSlug: business.slug, chatbotTipo,
          });
          // Sem landing publicada, abrir o CHAT especializado na Home.
          // Conversar e conhecer o profissional não exige login; contratação sim.
          if (Number(business.possuiLandingPublicada) !== 1) {
            const answer = `Você escolheu ${business.name}. Vou abrir o atendimento especializado para você conhecer o profissional e tirar suas dúvidas.`;
            await this.saveUserMessage(conversation.id, chatInput, message);
            await this.persistence.saveMessage(conversation.id, "assistant", answer);
            return {
              success: true, message: answer, conversationId: conversation.id,
              responseId: "", opportunityId: opportunity.id,
              lead: { shouldCapture: true, interest: business.name, status: "INTERESSADO" },
              action: {
                type: "OPEN_BUSINESS_CHAT",
                payload: {
                  storeId: business.id, lojaId: business.id,
                  prestadorId: business.prestadorId || undefined,
                  storeName: business.name, storeSlug: business.slug,
                  chatbotTipo, chatbotOwnerId: business.id,
                  categoriaNome: business.categoria || undefined,
                  descricao: initialNeed ? String(initialNeed.content) : undefined,
                  opportunityId: opportunity.id, opportunityToken: selection.token,
                  origem: chatInput.origem || "DOT_HOME",
                },
              },
            };
          }
          const base = String(process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
          const url = `${base}/pagina/${encodeURIComponent(business.slug)}?o=${encodeURIComponent(selection.token)}`;
          const answer = `Você escolheu ${business.name}. Vou encaminhar você ao atendimento desse profissional.\n${url}`;
          await this.saveUserMessage(conversation.id, chatInput, message);
          await this.persistence.saveMessage(conversation.id, "assistant", answer);
          return {
            success: true, message: answer, conversationId: conversation.id,
            responseId: "", opportunityId: opportunity.id,
            lead: { shouldCapture: true, interest: business.name, status: "INTERESSADO" },
            action: {
              type: "SELECT_CAMPAIGN_BUSINESS", payload: {
                storeId: business.id, lojaId: business.id, storeName: business.name,
                storeSlug: business.slug, chatbotTipo, chatbotOwnerId: business.id,
                opportunityId: opportunity.id, opportunityToken: selection.token,
                origem: chatInput.origem, url, message,
              }
            },
          };
        }
        const answer = "Não consegui confirmar com segurança a opção escolhida. Peça para atualizar a busca e selecione o profissional novamente.";
        await this.saveUserMessage(conversation.id, chatInput, message);
        await this.persistence.saveMessage(conversation.id, "assistant", answer);
        return {
          success: true, message: answer, conversationId: conversation.id,
          responseId: "", lead: { shouldCapture: false, status: "NOVO" }, action: { type: "NONE" }
        };
      }
      // Saudação contextual somente para cumprimentos simples, sem inventar nome.
      if (/^(oi|ola|bom dia|boa tarde|boa noite)[!. ]*$/.test(selectionText) && chatInput.userId) {
        try {
          const rows: Array<{ name?: string | null }> = await AppDataSource.query(
            "SELECT name FROM usuarios WHERE id = ? LIMIT 1", [chatInput.userId],
          );
          const firstName = String(rows[0]?.name || "").trim().split(/\s+/)[0] ?? "";
          const safeName = /^[\p{L}][\p{L}'-]{0,39}$/u.test(firstName) ? firstName : "";
          const hasPriorSearch = history.some((entry) => entry.role === "assistant" &&
            entry.content.includes("Encontrei estas opções no GranConecta:\n"));
          const answer = `${selectionText.startsWith("boa noite") ? "Boa noite" : selectionText.startsWith("bom dia") ? "Bom dia" : selectionText.startsWith("ola") || selectionText.startsWith("oi") ? "Olá" : "Boa tarde"}${safeName ? `, ${safeName}` : ""}! ` +
            (hasPriorSearch
              ? "Que bom ter você de volta! Vi que você pesquisou profissionais anteriormente. Gostaria de continuar aquela pesquisa ou procurar outro serviço?"
              : "Bem-vinda ao GranConecta! Como posso ajudar?");
          await this.saveUserMessage(conversation.id, chatInput, message);
          await this.persistence.saveMessage(conversation.id, "assistant", answer);
          return {
            success: true, message: answer, conversationId: conversation.id,
            responseId: "", lead: { shouldCapture: false, status: "NOVO" }, action: { type: "NONE" }
          };
        } catch (error) {
          console.warn("[DOT] Não foi possível personalizar saudação:", error);
        }
      }
      // Para pedidos de novos profissionais, usar consulta estruturada.
      // Mensagens como "agendar" e "sábado às 9h" não disparam busca.
      const normalizedRequest = selectionText;
      const isDiscovery = /\b(preciso|procuro|buscar|encontrar|mostre|mostrar|indique|indicacao|quais|tem|temos|existem|oferecem|oferece|cadastrados|cadastradas|profissionais|prestadores|servicos|servico|eletricista|eletrecista|encanador|pedreiro|diarista|pintor|loja)\b/.test(normalizedRequest)
        && !/^(?:quero|escolho)\s+(?:o|a)?\s*(?:primeiro|segundo|terceiro|quarto|quinto)/.test(normalizedRequest);
      // Interpretar necessidades concretas antes de consultar o catálogo.
      // A profissão é uma pista de busca; a elegibilidade continua sendo
      // validada exclusivamente por ChatKnowledgeService no banco.
      const serviceHints: Array<{ pattern: RegExp; category: string }> = [
        { pattern: /\b(tomadas?|interruptores?|fios?|fiacao|disjuntores?|curto.circuito)\b/, category: "eletricista" },
        { pattern: /\b(torneiras?|vazamentos?|encanamentos?|canos?|descargas?|sifao)\b/, category: "encanador" },
        { pattern: /\b(pintar|pintura|repintar|paredes? descascando)\b/, category: "pintor" },
        { pattern: /\b(limpeza|faxina|diarista)\b/, category: "diarista" },
      ];
      const inferredCategory = serviceHints.find(({ pattern }) => pattern.test(normalizedRequest))?.category || "";
      const explicitRefresh = /\b(atualiz|refaz|nova busca|buscar de novo)\w*/.test(normalizedRequest);
      if (isDiscovery || explicitRefresh || Boolean(inferredCategory)) {
        // A lista anterior só é reutilizada quando a solicitação corresponde
        // à pesquisa que a originou. A seleção numerada continua apontando
        // para a última lista exibida, sem mudar a ordem silenciosamente.
        const wantsRefresh = /\b(atualiz|novamente pesquis|refaz|nova busca|pesquis.*de novo|buscar.*de novo)\w*/.test(normalizedRequest);
        const normalizedWords = (value: string): string[] =>
          value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
            .filter((word) => word.length >= 4 && ![
              "preciso", "procuro", "buscar", "encontrar", "perto",
              "mim", "quero", "mostre", "mostrar", "indique", "algum",
              "alguma", "profissional", "profissionais", "servico", "servicos",
              "novamente", "favor", "para", "aqui", "opcoes", "opcao",
            ].includes(word));
        const currentTerms = normalizedWords(message);
        const priorOptionsIndex = history.map((entry, index) => ({ entry, index })).filter(({ entry }) =>
          entry.role === "assistant" &&
          entry.content.includes("Encontrei estas opções no GranConecta:\n"),
        ).map(({ index }) => index).pop() ?? -1;
        const priorRequest = priorOptionsIndex >= 0
          ? [...history.slice(0, priorOptionsIndex)].reverse().find((entry) => entry.role === "user")
          : undefined;
        const priorTerms = priorRequest ? normalizedWords(priorRequest.content) : [];
        const sameSearch = currentTerms.length > 0 && priorTerms.length > 0 &&
          currentTerms.some((term) => priorTerms.includes(term)) &&
          currentTerms.every((term) => priorTerms.includes(term));
        if (!wantsRefresh && sameSearch && priorOptionsIndex >= 0) {
          const previousAnswer = history[priorOptionsIndex]?.content ?? "";
          const answer = "Você já havia pedido essa pesquisa. Estas são as opções da última consulta (as distâncias podem ter mudado):\n\n" +
            previousAnswer.slice(previousAnswer.indexOf("Encontrei estas opções no GranConecta:")) +
            "\n\nSe preferir, diga **atualizar a busca** para consultar novamente as distâncias.";
          await this.saveUserMessage(conversation.id, chatInput, message);
          await this.persistence.saveMessage(conversation.id, "assistant", answer);
          return {
            success: true, message: answer, conversationId: conversation.id,
            responseId: "", lead: { shouldCapture: false, status: "NOVO" }, action: { type: "NONE" }
          };
        }
        const searchMessage = explicitRefresh && currentTerms.length === 0 && priorRequest
          ? priorRequest.content : message;
        const normalizedSearch = searchMessage.normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const searchCategory = serviceHints.find(({ pattern }) => pattern.test(normalizedSearch))?.category || "";
        const effectiveSearchMessage = searchCategory
          ? `${searchCategory} ${searchMessage}`
          : searchMessage;
        console.log("[DOT DESCOBERTA] Busca por necessidade", {
          original: searchMessage,
          categoriaInferida: searchCategory || null,
          busca: effectiveSearchMessage,
        });
        const businesses = await this.knowledge.listDotBusinesses(
          effectiveSearchMessage,
          chatInput.condominioId,
          chatInput.userId || null,
          cepBusca,
        );
        if (!businesses.length && /\b(quais|cadastrad[oa]s?|listar|lista|tem|temos|voces)\b/.test(normalizedRequest)
          && /\b(profissionais?|prestadores?|lojas?|empreendedores?|negocios?)\b/.test(normalizedRequest)) {
          const answer = "Não encontrei negócios elegíveis para esta consulta neste momento. " +
            "Posso pesquisar uma especialidade específica ou ampliar a busca para outras regiões.";
          await this.saveUserMessage(conversation.id, chatInput, message);
          await this.persistence.saveMessage(conversation.id, "assistant", answer);
          return {
            success: true, message: answer, conversationId: conversation.id,
            responseId: "", lead: { shouldCapture: false, status: "NOVO" },
            action: { type: "NONE" },
          };
        }
        if (businesses.length) {
          const options = businesses.map((b, i) => {
            const kind = this.knowledge.resolveBusinessChatbotTipo(b);
            const label = kind === "LOJA" ? "Loja" : "Profissional";
            const description = b.descricao_loja
              ? ` — ${String(b.descricao_loja).replace(/\s+/g, " ").slice(0, 110)}`
              : "";
            const distance = b.distanciaKm != null && Number.isFinite(b.distanciaKm)
              ? ` — aproximadamente ${b.distanciaKm.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km em linha reta`
              : "";
            const channel = Number(b.possuiLandingPublicada) === 1 && b.slug
              ? " — vitrine disponível"
              : " — atendimento direto pelo GranConecta";
            return `${i + 1}. ${b.name} (${label}) — ${b.categoria || "categoria não informada"}${description}${distance}${channel}`;
          }).join("\n");
          const knownName = this.resolveCustomerName(chatInput, history);
          const greeting = knownName ? `${knownName}, encontrei` : "Encontrei";
          const hasVerifiedDistance = businesses.some((b) =>
            b.distanciaKm != null && Number.isFinite(b.distanciaKm),
          );
          // Manter o marcador exato: a seleção numerada do DOT depende dele.
          const answer = [
            `${greeting} estas lojas e profissionais cadastrados no GranConecta. Posso ajudar você a conhecer as opções e avançar com sua compra ou contratação.`,
            "",
            `Encontrei estas opções no GranConecta:\n${options}`,
            "",
            hasVerifiedDistance
              ? "As distâncias informadas são aproximadas, em linha reta; confirme com o profissional a área de atendimento e a disponibilidade."
              : "Ainda não tenho uma distância verificada para indicar qual profissional está mais perto de você. Podemos confirmar a região atendida diretamente com cada um.",
            "As lojas podem apresentar seus produtos, e os profissionais podem informar as condições de atendimento ou orçamento. Não vou inventar avaliações, preços ou disponibilidade.",
            "",
            "Qual loja ou profissional você gostaria de conhecer? Responda com o número ou nome da opção.",
          ].join("\n");
          await this.saveUserMessage(conversation.id, chatInput, message);
          await this.persistence.saveMessage(conversation.id, "assistant", answer);
          return {
            success: true, message: answer, conversationId: conversation.id,
            responseId: "", lead: { shouldCapture: false, status: "NOVO" }, action: { type: "NONE" },
            cards: businesses.map((business) => ({
              id: business.id,
              name: business.name,
              tipo: this.knowledge.resolveBusinessChatbotTipo(business),
              categoria: business.categoria,
              descricao: business.descricao_loja,
              capaUrl: business.capa_url,
              logoUrl: business.logo_url,
              slug: business.slug,
              possuiLandingPublicada: Number(business.possuiLandingPublicada) === 1,
            })),
          };
        }
      }
    }

    /**
     * ==========================================================
     * CONSULTA DE CONHECIMENTO
     * ==========================================================
     */
    const knowledgeSearchMessage =
      this.buildKnowledgeSearchMessage(
        message,
        history,
      );

    const platformContext =
      await this.knowledge
        .buildContext({
          ...chatInput,

          message:
            knowledgeSearchMessage,
        });

    // Diagnóstico do proprietário: somente DOT principal, usuário autenticado
    // e atendimento web. Não interfere em oportunidades ou chatbots de lojas.
    let businessOwnerSystemContext = "";
    const isMainDotOwnerContext =
      chatInput.chatbotTipo === "GRANCONECTA" &&
      Boolean(String(chatInput.userId || "").trim()) &&
      !chatInput.opportunityId &&
      !chatInput.opportunityBootstrap &&
      !chatInput.chatbotOwnerId &&
      !chatInput.selectedStoreId &&
      !conversation.selectedStoreId &&
      !["INSTAGRAM", "WHATSAPP", "FACEBOOK"].includes(
        String(chatInput.origem || "").toUpperCase(),
      );

    if (isMainDotOwnerContext) {
      try {
        const owner = await this.businessOwnerContext.build(
          String(chatInput.userId),
        );
        if (owner.isBusinessOwner) {
          const businesses = owner.businesses.map((business) => ({
            storeId: business.storeId,
            nome: business.name,
            nomeProvisorio: business.isProvisionalName,
            tipo: business.tipo,
            ativa: business.ativa,
            landingPath: business.landingPath,
            paginaPublicada: business.hasPublishedPage,
            possuiRascunho: business.hasDraft,
            pontuacaoCadastral: business.score,
            classificacao: business.status,
            verificacoes: business.checks,
            recomendacoes: business.recommendations,
          }));
          businessOwnerSystemContext = [
            "CONTEXTO PRIVADO DO PROPRIETÁRIO AUTENTICADO — SOMENTE DOT PRINCIPAL:",
            "O vínculo de propriedade foi verificado pela coluna stores.usuarioId no banco.",
            JSON.stringify(businesses),
            "Se a pessoa perguntar sobre seus negócios, sua landing page, divulgação ou melhorias, use SOMENTE estes dados verificados.",
            "Quando nomeProvisorio for true, esclareça que o nome cadastrado é provisório e pergunte qual nome comercial o proprietário deseja utilizar.",
            "Não assuma que o nome do usuário é o nome comercial. Não atualize o banco nem prometa que já atualizou: esta etapa é apenas consultiva.",
            "Ao apresentar o diagnóstico, explique que a pontuação é apenas cadastral, não uma auditoria visual.",
            "Não afirme que a página está visualmente aprovada nem que links, botões ou pagamentos foram testados.",
            "Não invente URLs de dashboard ou de atendimento. LandingPath é caminho de visualização, não autorização administrativa.",
            "Não confunda negócios de propriedade do usuário com os prestadores disponíveis para contratação.",
            "Não transforme perguntas de clientes em gestão administrativa; siga a intenção da mensagem.",
          ].join("\n");
        }
      } catch (ownerError) {
        console.warn("[DOT OWNER CONTEXT] Diagnóstico indisponível; atendimento preservado", {
          error: ownerError instanceof Error ? ownerError.message : String(ownerError),
        });
      }
    }

    // Região declarada voluntariamente nesta conversa: não confundir com GPS.
    // Captura apenas afirmações explícitas, evitando interpretar pedidos como endereço.
    const declaredRegion = [...history, { role: "user", content: message }]
      .filter((entry) => entry.role === "user")
      .reverse()
      .map((entry) => String(entry.content || "").match(
        /(?:\bmoro\s+(?:no|na|em)\s+|\bmeu\s+bairro\s+(?:e|é|fica\s+em)\s+|\bsou\s+do\s+bairro\s+)([\p{L}][\p{L}\s'-]{1,65}?)(?=[,.!?;]|\s+(?:e\s+(?:preciso|quero|estou|busco)|mas\s+)|$)/iu,
      )?.[1]?.trim() || null)
      .find((value) => value && !/\b(?:condominio|condomínio|apartamento|casa|cidade|sao paulo|são paulo)\b/i.test(value)) || null;

    // Radar de Demanda: falhas no registro não interrompem o atendimento.
    let radarResult: { missing: boolean; categoryName: string } | null = null;
    if (chatInput.chatbotTipo === "GRANCONECTA") {
      try {
        radarResult = await this.demandRadar.record({
          conversationId: conversation.id,
          userId: chatInput.userId || null,
          message,
          platformContext,
          canal: chatInput.channel || chatInput.origem || "CHAT_HOME",
          condominioId: chatInput.condominioId || null,
        });
      } catch (radarError) {
        console.warn("[RADAR DEMANDA] Registro não realizado", radarError);
      }
    }

    /**
     * ==========================================================
     * MEMÓRIA
     * ==========================================================
     */
    const rememberedFacts =
      this.extractRememberedFacts(
        history,
        chatInput,
      );

    /**
     * ==========================================================
     * SALVA MENSAGEM DO USUÁRIO
     * ==========================================================
     *
     * Para Instagram, grava também:
     *
     * external_message_id
     * channel
     */
    await this.saveUserMessage(
      conversation.id,
      chatInput,
      message,
    );

    /**
     * ==========================================================
     * OPENROUTER
     * ==========================================================
     */
    const response =
      await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method:
            "POST",

          headers: {
            Authorization:
              `Bearer ${this.apiKey}`,

            "Content-Type":
              "application/json",

            "HTTP-Referer":
              process.env
                .FRONTEND_URL ||
              "http://localhost:5173",

            "X-OpenRouter-Title":
              "GranConecta",
          },

          body:
            JSON.stringify({
              model:
                this.model,

              messages: [
                {
                  role:
                    "system",

                  content:
                    [
                      this.buildSystemPromptForRole(chatInput, conversation, Boolean(businessOwnerSystemContext)),
                      this.buildInstructions(
                      chatInput,
                      platformContext,
                      rememberedFacts,
                      opportunityQualificationContext,
                      businessCatalogContext,
                    ),
                    ].join("\n\n"),
                },

                ...(businessCatalogItems.length > 0
                  ? [
                    {
                      role: "system",
                      content:
                        this.buildAuthoritativeCatalogInstructions(
                          businessCatalogContext,
                          businessCatalogItems,
                        ),
                    },
                  ]
                  : []),

                ...(businessOwnerSystemContext
                  ? [{ role: "system", content: businessOwnerSystemContext }]
                  : []),

                ...history,

                {
                  role:
                    "user",

                  content:
                    message,
                },
              ],
            }),
        },
      );

    const data =
      (await response.json()) as
      OpenRouterResponse;

    if (!response.ok) {
      throw new Error(
        data.error?.message ||
        "Não foi possível consultar o atendimento.",
      );
    }

    let answer =
      data.choices?.[0]
        ?.message?.content
        ?.trim();

    if (!answer) {
      throw new Error(
        "A IA não retornou uma resposta.",
      );
    }

    // Atualiza a região apenas se houver um perfil de demanda vinculado à conversa.
    // Não cria perfil artificial e não altera consentimento de contato.
    if (declaredRegion && radarResult) {
      try {
        await this.demandRadar.updateRegion({ conversationId: conversation.id, bairro: declaredRegion });
      } catch (regionError) {
        console.warn("[RADAR DEMANDA] Não foi possível registrar bairro declarado", regionError);
      }
    }

    // Oferta opcional de aviso; não coletamos nem enviamos contato sem consentimento.
    if (radarResult?.missing && process.env.NODE_ENV === "local") {
      // Região vem do visitante; não pressupomos que sua localização seja conhecida.
      answer = answer.replace(/\n\nSe quiser, você pode deixar seu WhatsApp ou e-mail[\s\S]*$/i, "");
      answer += declaredRegion
        ? `\n\nConsiderei o bairro ${declaredRegion}, que você já informou. Quer que eu registre seu interesse para um possível aviso quando tivermos profissionais compatíveis? É opcional; os avisos automáticos ainda não estão ativos.`
        : "\n\nPara registrar seu interesse e verificar a cobertura, qual é o seu bairro? Se preferir, pode responder 'não'.";
    } else if (radarResult?.missing && !/whatsapp ou e-mail|whatsapp ou email/i.test(answer)) {
      answer += "\n\nSe quiser, você pode deixar seu WhatsApp ou e-mail para avisarmos quando houver um profissional cadastrado que atenda à sua região. Gostaria de receber esse aviso? O cadastro é opcional.";
    }

    /**
     * ==========================================================
     * CONTINUIDADE COMERCIAL DO INSTAGRAM -> NEGÓCIO
     * ==========================================================
     *
     * No chatbot geral do GranConecta, o ChatKnowledgeService pode
     * encontrar um negócio real e a IA responder com o link público.
     *
     * Para canais externos, especialmente Instagram Direct, o link
     * simples /pagina/:slug perde o contexto da conversa. Quando a
     * resposta da IA apontou de forma inequívoca para UM dos negócios
     * reais presentes no platformContext, criamos/reutilizamos uma
     * MarketingOpportunity, vinculamos o negócio e trocamos o link
     * simples por /pagina/:slug?o=TOKEN.
     *
     * Se houver mais de um negócio e a resposta não tiver escolhido
     * exatamente um deles, não selecionamos automaticamente.
     */
    if (
      !chatInput.opportunityId &&
      chatInput.chatbotTipo === "GRANCONECTA" &&
      (
        chatInput.origem === "INSTAGRAM" ||
        chatInput.channel === "INSTAGRAM"
      )
    ) {
      const referencedBusiness =
        this.resolveExternalBusinessReferencedByAnswer(
          answer,
          platformContext,
        );

      if (referencedBusiness) {
        try {
          const opportunity =
            await this.opportunity.getOrCreate({
              campanhaId: chatInput.campanhaId || null,
              playbookId: chatInput.playbook?.id || null,
              categoriaId: chatInput.categoriaId || null,
              sourceConversationId: conversation.id,
              userId: chatInput.userId || null,
              userType: chatInput.userType || null,
              condominioId: chatInput.condominioId || null,
              canalOrigem:
                chatInput.channel ||
                chatInput.origem ||
                "INSTAGRAM",
            });

          const selection =
            await this.opportunity.selectBusiness({
              opportunityId: opportunity.id,
              storeId: referencedBusiness.id,
              storeName: referencedBusiness.name,
              storeSlug: referencedBusiness.slug,
              chatbotTipo: referencedBusiness.chatbotTipo,
            });

          const frontendBaseUrl =
            String(
              process.env.FRONTEND_URL ||
              "http://localhost:5173",
            ).replace(/\/$/, "");

          const plainUrl =
            `${frontendBaseUrl}/pagina/${encodeURIComponent(
              referencedBusiness.slug,
            )}`;

          const opportunityUrl =
            `${plainUrl}?o=${encodeURIComponent(
              selection.token,
            )}`;

          // Substitui tanto o link absoluto gerado pelo contexto quanto
          // uma eventual ocorrência simples de /pagina/:slug.
          const escapedPlainUrl =
            plainUrl.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&",
            );

          const plainUrlRegex =
            new RegExp(
              `${escapedPlainUrl}(?!\\?o=)`,
              "g",
            );

          answer = answer.replace(
            plainUrlRegex,
            opportunityUrl,
          );

          // Caso a IA tenha mencionado o negócio sem reproduzir o link
          // do contexto, ainda entregamos a continuidade segura.
          if (!answer.includes(opportunityUrl)) {
            answer =
              `${answer}\n\nPara continuar sem perder o contexto desta conversa:\n${opportunityUrl}`;
          }

          chatInput.opportunityId =
            selection.opportunity.id;

          console.log(
            "[CHAT INSTAGRAM] Oportunidade criada/reutilizada para continuidade no negócio",
            {
              opportunityId:
                selection.opportunity.id,
              sourceConversationId:
                conversation.id,
              storeId:
                referencedBusiness.id,
              storeName:
                referencedBusiness.name,
              storeSlug:
                referencedBusiness.slug,
              chatbotTipo:
                referencedBusiness.chatbotTipo,
              categoriaNome:
                referencedBusiness.categoriaNome ||
                null,
              origem:
                chatInput.channel ||
                chatInput.origem ||
                "INSTAGRAM",
              hasOpportunityToken: true,
            },
          );
        } catch (instagramOpportunityError) {
          // Não derruba o atendimento do Instagram se a criação da
          // oportunidade falhar. Mantém a resposta original e deixa
          // um log explícito para diagnóstico.
          console.error(
            "[CHAT INSTAGRAM] Erro ao criar continuidade comercial",
            {
              conversationId:
                conversation.id,
              error:
                instagramOpportunityError instanceof Error
                  ? instagramOpportunityError.message
                  : instagramOpportunityError,
            },
          );
        }
      }
    }

    /**
     * Salva resposta da IA.
     *
     * Não recebe externalMessageId:
     * esse ID pertence à mensagem recebida,
     * não à resposta interna da IA.
     */
    await this.persistence
      .saveMessage(
        conversation.id,
        "assistant",
        answer,
      );

    /**
     * ==========================================================
     * LEAD
     * ==========================================================
     */
    const lead =
      this.detectLeadSignal(
        message,
      );

    console.log(
      "PLATFORM CONTEXT PARA CARRINHO:",
      platformContext,
    );

    console.log(
      "ANSWER PARA CARRINHO:",
      answer,
    );

    console.log(
      "MESSAGE PARA CARRINHO:",
      message,
    );

    /**
     * ==========================================================
     * AÇÃO DE CARRINHO
     * ==========================================================
     */
    let action =
      this.detectCartAction(
        message,
        answer,
        platformContext,
        chatInput,
      );

    if (
      action.type ===
      "NONE"
    ) {
      action =
        this.detectBotAction(
          message,
          chatInput,
        );
    }


    // Nunca abrir uma solicitação paralela quando existe catálogo comercial
    // ou um CommercialFlow ativo: esses casos pertencem ao motor existente.
    if (action.type === "OPEN_SOLICITACAO_MODAL") {
      const activeFlow = await this.commercialFlowState.findActiveByConversation(
        conversation.id,
      );
      if (businessCatalogItems.length > 0 || activeFlow) {
        action = { type: "NONE" };
      } else {
        const opportunityToken = chatInput.opportunityId
          ? await this.opportunity.issueAccessToken(chatInput.opportunityId)
          : undefined;
        action = {
          type: "OPEN_SOLICITACAO_MODAL",
          payload: {
            ...action.payload,
            opportunityId: chatInput.opportunityId || undefined,
            opportunityToken,
            storeId: chatInput.chatbotOwnerId || undefined,
            lojaId: chatInput.chatbotOwnerId || undefined,
            storeName: chatInput.storeName || undefined,
            chatbotTipo: chatInput.chatbotTipo,
            categoriaId: chatInput.categoriaId || undefined,
            categoriaNome: chatInput.categoriaNome || undefined,
            origem: chatInput.origem || "CHAT_HOME",
            message,
          },
        };
      }
    }

    // Cadastro assistido pelo DOT: somente após confirmação explícita e
    // identificação inequívoca de moradia. Não cria usuário nem aceita termos.
    if (action.type === "NONE" && chatInput.chatbotTipo === "GRANCONECTA" &&
      !chatInput.chatbotOwnerId && !chatInput.userId) {
      const registration = this.detectPartnerRegistrationAction(message, history);
      if (registration) action = registration;
    }

    if (action.type === "NONE") {
      const normalizedAnswer = this.normalize(answer);

      const aiSuggestedHuman =
        normalizedAnswer.includes("encaminhar para um atendente") ||
        normalizedAnswer.includes("encaminhada para um atendente") ||
        normalizedAnswer.includes("encaminhado para um atendente") ||
        normalizedAnswer.includes("falar com um atendente") ||
        normalizedAnswer.includes("atendimento humano") ||
        normalizedAnswer.includes("aguardando um atendente");

      if (aiSuggestedHuman) {
        action = {
          type: "HUMAN_HANDOFF",
          payload: {
            storeId:
              chatInput.chatbotOwnerId ??
              undefined,

            storeName:
              chatInput.storeName ??
              undefined,

            chatbotTipo:
              chatInput.chatbotTipo ??
              undefined,

            message,
          },
        };

        await this.persistence.markWaitingHuman(
          conversation.id,
        );

        await this.persistence.upsertLead(
          conversation.id,
          chatInput,
          {
            shouldCapture: true,
            interest: message,
            status: "ENCAMINHADO",
          },
        );

        console.log(
          "HANDOFF HUMANO EFETIVADO APÓS RESPOSTA DA IA:",
          {
            conversationId: conversation.id,
            chatbotTipo: chatInput.chatbotTipo,
            chatbotOwnerId: chatInput.chatbotOwnerId,
          },
        );
      }
    }

    await this.persistence
      .upsertLead(
        conversation.id,
        chatInput,
        lead,
      );

    console.log(
      "CHAT ACTION FINAL:",
      action,
    );

    return {
      success:
        true,

      message:
        answer,

      conversationId:
        conversation.id,

      responseId:
        data.id ||
        "",

      opportunityId:
        chatInput.opportunityId,

      lead,

      action,
    };
  }

  /**
   * ============================================================
   * SALVAR MENSAGEM DO USUÁRIO
   * ============================================================
   *
   * Centraliza toda persistência das mensagens recebidas.
   *
   * Isso é importante para:
   *
   * - chat normal;
   * - Instagram;
   * - WhatsApp;
   * - idempotência;
   * - futuros canais.
   */
  /**
   * Orienta o acesso a funcionalidades já existentes no Dashboard.
   * Não consulta anúncios, não concede permissões e não publica conteúdo.
   */
  private guideResidentFeature(message: string, input: ChatMessageInput): string | null {
    const normalized = this.normalize(message);
    const garage = /\b(vaga|vagas)\b/.test(normalized) &&
      /\b(garagem|garagens|estacionamento|carro|veiculo)\b/.test(normalized) ||
      /\bgaragem\b/.test(normalized) &&
      /\b(alugar|aluguel|anunciar|procurar|preciso|oferecer|disponivel)\b/.test(normalized);
    const donation = /\b(doar|doacao|doacoes|doando|gratuito|gratis)\b/.test(normalized) &&
      /\b(quero|preciso|anunciar|publicar|colocar|tenho|procurar|mural|item|roupa|sofa|movel)\b/.test(normalized);
    const classifieds = /\b(classificado|classificados)\b/.test(normalized) ||
      /\b(vender|venda|vendendo)\b/.test(normalized) &&
      /\b(meu|minha|um|uma|usado|usada|televisao|bicicleta|sofa|movel|celular|produto|objeto|anunciar|anuncio)\b/.test(normalized);
    const mural = /\bmural\b/.test(normalized) &&
      /\b(como|onde|acessar|entrar|publicar|anunciar|doar|doacao|funciona|ver|abrir)\b/.test(normalized);

    if (!garage && !donation && !classifieds && !mural) return null;

    const feature = garage ? "vaga de garagem" : donation ? "doação no Mural" : classifieds ? "Classificados" : "Mural";
    const guidance = garage
      ? "No Dashboard do Morador, acesse Mural e procure a opção Vaga de Garagem."
      : donation
        ? "No Dashboard do Morador, acesse Mural para anunciar uma doação gratuita."
        : classifieds
          ? "No Dashboard do Morador, acesse a aba Classificados. Anúncios de venda estão sujeitos à taxa de publicação apresentada pela plataforma."
          : "No Dashboard do Morador, acesse a aba Mural.";

    const role = String(input.userType || "").trim().toUpperCase();
    if (role === "VISITANTE") {
      return `A funcionalidade de ${feature} é exclusiva para moradores de condomínios cadastrados no GranConecta. Como visitante, você não pode publicar no Mural nem nos Classificados, mas pode contratar serviços e comprar produtos das lojas disponíveis. Você pode continuar usando seu cadastro de visitante para isso.`;
    }
    if (!String(input.userId || "").trim()) {
      return `O GranConecta oferece ${feature}! Para utilizar essa funcionalidade, entre na sua conta de morador. ${guidance} Se ainda não tem cadastro, cadastre-se como morador do condomínio. Visitantes podem contratar serviços e comprar produtos, mas não publicar no Mural ou nos Classificados.`;
    }
    if (role && role !== "MORADOR") {
      return `O GranConecta oferece ${feature}, mas a publicação nessas áreas é reservada aos moradores de condomínios cadastrados. Você pode utilizar os serviços e comprar produtos disponíveis na plataforma.`;
    }
    if (!role) {
      return `O GranConecta oferece ${feature}. Se sua conta for de morador de um condomínio cadastrado, ${guidance} Caso seu perfil seja de visitante, você pode contratar serviços e comprar produtos, mas não publicar nessas áreas.`;
    }
    return `Claro! ${guidance}`;
  }

  /**
   * Papel consultivo do DOT. Este complemento não substitui as instruções
   * existentes de segurança, catálogo, oportunidade e fluxos comerciais.
   * Papéis privilegiados só podem vir de contexto validado pelo servidor.
   */
  private buildSystemPromptForRole(
    chatInput: ChatMessageInput,
    conversation: any,
    verifiedBusinessOwner = false,
  ): string {
    const tipo = String(chatInput.chatbotTipo || "GRANCONECTA").toUpperCase();
    const role = String(conversation?.verifiedUserRole || "").toUpperCase();
    const storeName = chatInput.storeName || "negócio";

    if (role === "ADMIN") {
      return [
        "Você é o DOT, assistente estratégico do administrador do GranConecta.",
        "Ajude a estruturar oportunidades, campanhas, qualificação de leads e estratégias comerciais.",
        "Seja analítico, proativo e objetivo. Não invente métricas nem execute ações sem autorização.",
      ].join("\n");
    }

    if (
      (tipo === "LOJA" || tipo === "PRESTADOR") &&
      verifiedBusinessOwner
    ) {
      return [
        `Você é o DOT, assistente de suporte operacional de ${storeName}.`,
        "Oriente sobre catálogo, pedidos, agenda, configurações e fluxos comerciais.",
        "Não invente dados nem altere configurações sem autorização.",
      ].join("\n");
    }

    if (tipo === "GRANCONECTA") {
      return [
        "Você é o DOT, concierge consultivo e comercial oficial do GranConecta.",
        "Ajude moradores e visitantes a encontrar negócios elegíveis e empreendedores a aderir à plataforma.",
        "Preserve a intenção de cadastro entre as mensagens; morar em condomínio não muda empreendedor para morador.",
        "Antes de encaminhar ao cadastro, use a verificação autorizada de conta existente; se já houver conta, encaminhe ao login.",
        "Nunca peça senha no chat. Nunca invente lojas, preços, disponibilidade ou catálogos.",
        "Ações de login, cadastro e pagamento devem ser executadas apenas pelos fluxos reais do backend.",
      ].join("\n");
    }

    return [
      `Você é o DOT, assistente de vendas e atendimento de ${storeName}.`,
      "Receba o cliente, esclareça dúvidas e conduza à compra ou ao agendamento.",
      "Use exclusivamente catálogo e disponibilidade oficiais; não invente preços ou produtos.",
      "Nunca confirme pagamento ou agendamento sem retorno dos serviços autorizados.",
    ].join("\n");
  }

  private async saveUserMessage(
    conversationId: string,
    input: ChatMessageInput,
    message: string,
  ): Promise<void> {
    await this.persistence
      .saveMessage(
        conversationId,
        "user",
        message,
        {
          externalMessageId:
            input.externalMessageId,

          channel:
            input.channel,
        },
      );
  }

  /**
   * ============================================================
   * DETECTAR AÇÃO
   * ============================================================
   */
  private detectPartnerRegistrationAction(
    message: string,
    history: Array<{ role?: string; content?: string }>,
  ): ChatBotAction | null {
    const normalized = this.normalize(message);
    // Não navegar quando a pessoa está apenas pedindo explicações.
    if (!/(?:confirmo|pode abrir|abrir (?:meu |o )?cadastro|finalizar (?:meu |o )?cadastro|vamos (?:finalizar|cadastrar)|quero me cadastrar)/.test(normalized)) return null;

    const userMessages = [...history.filter((item) => item.role === "user").map((item) => String(item.content || "")), message];
    const all = userMessages.join("\n");
    const email = [...all.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)].map((m) => m[0]).pop();
    const phone = [...all.matchAll(/(?:\+?55\s*)?(?:\(?\d{2}\)?[\s.-]*)?9?\d{4}[\s.-]*\d{4}/g)].map((m) => m[0]).pop();
    const names = [...all.matchAll(/(?:^|[;\n])\s*(?:meu nome (?:e|é)|nome\s*:)\s*([^;\n,.]{3,90})/gim)];
    const name = names.length > 0
      ? (names[names.length - 1]?.[1]?.trim() ?? "")
      : "";
    const normalizedHistory = this.normalize(all);
    const isPartner = /(?:confeiteir|faco bolos|fazer bolos|vendo bolos|empreendedor|minha loja|meu negocio|prestador|manicure|eletricista|cabeleireir)/.test(normalizedHistory);
    if (!isPartner || !email || !name || !phone) return null;

    // Moradia precisa ser informada explicitamente. Endereço isolado não comprova condomínio.
    const residence = userMessages.map((entry) => this.normalize(entry)).filter((entry) =>
      /(?:moro|resido|sou morador|nao moro|nao sou morador)/.test(entry) &&
      /(?:condominio|condominio parceiro)/.test(entry));
    const lastResidence = residence[residence.length - 1] || "";
    if (!lastResidence) return null;
    const external = /(?:nao moro|nao sou morador|nao resido)/.test(lastResidence);
    const internal = !external && /(?:moro|resido|sou morador)/.test(lastResidence);
    if (!external && !internal) return null;
    const isShop = /(?:confeiteir|bolo|doce|loja|produto|empreendedor)/.test(normalizedHistory);
    return {
      type: "OPEN_PARTNER_REGISTRATION",
      payload: {
        nome: name, email, telefone: phone,
        tipo: internal ? "MORADOR" : "PRESTADOR",
        empreendedor: internal && isShop ? "1" : "0",
        moraEmCondominio: internal ? "1" : "0",
        ramo: isShop ? "loja" : "servico",
        categoria: /(?:confeiteir|bolo)/.test(normalizedHistory) ? "Bolos" : undefined,
      },
    };
  }

  private detectBotAction(
    message: string,
    input: ChatMessageInput,
  ): ChatBotAction {
    const normalized =
      this.normalize(
        message,
      );

    const isChatHandoffAllowed =
      input.chatbotTipo ===
      "GRANCONECTA" ||
      input.chatbotTipo ===
      "LOJA" ||
      input.chatbotTipo ===
      "PRESTADOR";

    const wantsHumanTerms =
      [
        "atendente",
        "falar com atendente",
        "falar com uma pessoa",
        "pessoa real",
        "humano",
        "atendente humano",
        "suporte",
        "falar com suporte",
        "quero falar",
        "falar com alguem",
        "falar com alguém",
        "atendimento humano"
      ];

    // Selecionar um profissional numerado no DOT não é pedir atendente humano.
    // A existência e a elegibilidade da opção são verificadas posteriormente
    // contra a última lista de profissionais salva no histórico.
    const isDotBusinessSelection =
      input.chatbotTipo === "GRANCONECTA" &&
      input.origem === "CHAT_HOME" &&
      !input.campanhaId &&
      (/\b(?:eletricista|eletrecista|encanador|pedreiro|diarista|pintor|profissional|prestador|loja|opcao|numero)\s+(?:[1-8]|primeiro|primeira|segundo|segunda|terceiro|terceira|quarto|quarta|quinto|quinta)\b/.test(normalized) ||
        /\b(?:quero|gostaria|prefiro|escolho)\s+(?:de\s+)?(?:falar\s+com\s+|conhecer\s+)?(?:o\s+|a\s+)?(?:eletricista|eletrecista|encanador|pedreiro|diarista|pintor|profissional|prestador)\s+[a-z]{3,}/.test(normalized));

    // No DOT, "quero falar com Kleber" é potencial seleção de negócio.
    // Não acionar handoff humano antes de consultar as opções do histórico.
    // Pedidos explícitos de suporte/atendente continuam sendo handoff.
    const explicitHumanRequest = /\b(?:atendente|humano|suporte|pessoa\s+real|falar\s+com\s+(?:uma?\s+)?pessoa)\b/.test(normalized);
    const possibleNamedBusinessSelection =
      input.chatbotTipo === "GRANCONECTA" &&
      input.origem === "CHAT_HOME" &&
      !input.campanhaId &&
      !explicitHumanRequest &&
      /\b(?:quero|gostaria|prefiro|escolho|falar|conhecer)\b/.test(normalized) &&
      /\b(?:falar\s+com|conhecer|escolho|prefiro)\s+(?:(?:o|a)\s+)?[a-z]{3,}/.test(normalized);

    if (isDotBusinessSelection || possibleNamedBusinessSelection) {
      return { type: "NONE" };
    }

    const wantsHuman =
      wantsHumanTerms.some(
        (
          term,
        ) =>
          normalized.includes(
            this.normalize(
              term,
            ),
          ),
      );

    if (
      isChatHandoffAllowed &&
      wantsHuman
    ) {
      return {
        type:
          "HUMAN_HANDOFF",

        payload: {
          storeId:
            input.chatbotOwnerId ??
            undefined,

          storeName:
            input.storeName ??
            undefined,

          chatbotTipo:
            input.chatbotTipo ??
            undefined,

          message,
        },
      };
    }

    const isBusinessChat =
      (
        input.chatbotTipo ===
        "LOJA" ||
        input.chatbotTipo ===
        "PRESTADOR"
      ) &&
      Boolean(
        input.chatbotOwnerId,
      );

    if (
      !isBusinessChat
    ) {
      return {
        type:
          "NONE",
      };
    }

    // A contratação com catálogo pertence ao CommercialConversionOrchestrator.
    // Este detector só sugere solicitação; a decisão final consulta o catálogo
    // e o estado do fluxo antes de abrir qualquer modal.
    const quoteTerms = [
      "orcamento", "orçamento", "abrir solicitacao", "abrir solicitação",
      "solicitar", "quero contratar", "contratar", "agendar",
      "quero fechar", "fazer pedido", "quero pedir",
    ];

    if (quoteTerms.some((term) => normalized.includes(this.normalize(term)))) {
      return {
        type: "OPEN_SOLICITACAO_MODAL",
        payload: {
          chatbotTipo: input.chatbotTipo ?? undefined,
          storeId: input.chatbotOwnerId ?? undefined,
          storeName: input.storeName ?? undefined,
          opportunityId: input.opportunityId ?? undefined,
          categoriaId: input.categoriaId ?? undefined,
          categoriaNome: input.categoriaNome ?? undefined,
          origem: input.origem ?? undefined,
          message,
        },
      };
    }

    return {
      type:
        "NONE",
    };
  }

  /**
   * Classifica a intenção comercial da mensagem sem executar nenhuma
   * conversão. É deliberadamente conservador para separar conversa
   * comercial de compromisso real de compra/contratação.
   */
  private detectCommercialIntent(
    message: string,
    items: BusinessCatalogItem[],
  ): CommercialIntentResult {
    const normalized =
      this.normalize(message);

    if (!normalized) {
      return {
        type: "NONE",
        commercialInterest: false,
      };
    }

    const containsAny =
      (terms: string[]) =>
        terms.some((term) =>
          normalized.includes(
            this.normalize(term),
          ),
        );

    if (
      this.isCommercialCommitmentIntent(
        message,
      )
    ) {
      if (
        containsAny([
          "agendar",
          "marcar",
          "horario",
          "agenda",
          "reservar",
        ])
      ) {
        return {
          type: "SCHEDULE_INTENT",
          commercialInterest: true,
        };
      }

      if (
        containsAny([
          "pagar",
          "pagamento",
          "pix",
          "cartao",
          "checkout",
        ])
      ) {
        return {
          type: "PAYMENT_INTENT",
          commercialInterest: true,
        };
      }

      return {
        type: "BUY_INTENT",
        commercialInterest: true,
      };
    }

    const selectedItem =
      this.resolveCatalogItemSelection(
        message,
        items,
      );

    if (selectedItem) {
      return {
        type: "SELECT_ITEM",
        commercialInterest: true,
      };
    }

    if (
      containsAny([
        "quanto custa",
        "quanto fica",
        "preco",
        "valor",
        "valores",
        "custa",
        "mensalidade",
      ])
    ) {
      return {
        type: "ASK_PRICE",
        commercialInterest: true,
      };
    }

    if (
      containsAny([
        "qual e melhor",
        "qual melhor",
        "qual a diferenca",
        "diferenca entre",
        "comparar",
        "qual voce recomenda",
        "o que recomenda",
      ])
    ) {
      return {
        type: "COMPARE_OPTIONS",
        commercialInterest: true,
      };
    }

    if (
      containsAny([
        "caro",
        "muito caro",
        "achei caro",
        "desconto",
        "mais barato",
        "nao sei se",
        "estou em duvida",
        "tenho duvida",
      ])
    ) {
      return {
        type: "OBJECTION",
        commercialInterest: true,
      };
    }

    const catalogWords =
      items.flatMap((item) =>
        this.normalize(item.nome)
          .split(/\s+/)
          .filter((word) =>
            word.length >= 5,
          ),
      );

    const mentionsCatalog =
      catalogWords.some((word) =>
        normalized.includes(word),
      );

    if (
      mentionsCatalog ||
      containsAny([
        "servico",
        "servicos",
        "sessao",
        "sessoes",
        "pacote",
        "pacotes",
        "avaliacao",
        "atendimento",
        "acompanhamento",
        "consulta",
        "produto",
        "produtos",
        "cardapio",
        "comprar",
        "compra",
        "como funciona",
        "como funciona o atendimento",
        "como funcionam",
      ])
    ) {
      return {
        type: "ASK_INFORMATION",
        commercialInterest: true,
      };
    }

    return {
      type: "NONE",
      commercialInterest: false,
    };
  }

  /**
   * Cria/reutiliza a oportunidade quando a conversa começou diretamente
   * no chatbot de uma Store, sem depender de campanha.
   *
   * O método NÃO cria solicitação, candidatura, pedido ou pagamento.
   */
  /**
   * Extrai os negócios reais do contexto geral do GranConecta e
   * identifica qual deles foi efetivamente citado pela resposta da IA.
   *
   * Formato atual do ChatKnowledgeService:
   * 1. Nome | Store ID: UUID | Tipo: PRESTADOR | Categoria: ... | ... | Link: URL
   */
  private resolveExternalBusinessReferencedByAnswer(
    answer: string,
    platformContext: string,
  ): {
    id: string;
    name: string;
    slug: string;
    chatbotTipo: "PRESTADOR" | "LOJA";
    categoriaNome: string | null;
  } | null {
    const context =
      String(platformContext || "");

    const response =
      String(answer || "");

    if (!context || !response) {
      return null;
    }

    const lines = context
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const businesses: Array<{
      id: string;
      name: string;
      slug: string;
      chatbotTipo: "PRESTADOR" | "LOJA";
      categoriaNome: string | null;
      publicUrl: string;
    }> = [];

    for (const line of lines) {
      const match = line.match(
        /^\d+\.\s*(.+?)\s*\|\s*Store ID:\s*([^|]+)\s*\|\s*Tipo:\s*([^|]+)(?:\s*\|\s*Categoria:\s*([^|]+))?.*?\|\s*Link:\s*(https?:\/\/\S+)\s*$/i,
      );

      if (!match) {
        continue;
      }

      const name = String(match[1] || "").trim();
      const id = String(match[2] || "").trim();
      const rawType =
        String(match[3] || "")
          .trim()
          .toUpperCase();
      const categoriaNome =
        String(match[4] || "").trim() ||
        null;
      const publicUrl =
        String(match[5] || "").trim();

      const slugMatch =
        publicUrl.match(
          /\/pagina\/([^/?#\s]+)/i,
        );

      const slug =
        slugMatch?.[1]
          ? decodeURIComponent(
            slugMatch[1],
          )
          : "";

      const chatbotTipo:
        "PRESTADOR" | "LOJA" =
        rawType === "PRESTADOR"
          ? "PRESTADOR"
          : "LOJA";

      if (
        !id ||
        !name ||
        !slug
      ) {
        continue;
      }

      businesses.push({
        id,
        name,
        slug,
        chatbotTipo,
        categoriaNome,
        publicUrl,
      });
    }

    if (!businesses.length) {
      return null;
    }

    const normalizedAnswer =
      this.normalize(response);

    const referenced = businesses.filter(
      (business) =>
        response.includes(
          business.publicUrl,
        ) ||
        normalizedAnswer.includes(
          this.normalize(
            business.name,
          ),
        ),
    );

    // Só escolhemos automaticamente quando a própria resposta da IA
    // apontou inequivocamente para um único negócio real.
    if (referenced.length !== 1) {
      return null;
    }

    const selected = referenced[0];

    if (!selected) {
      return null;
    }

    return {
      id: selected.id,
      name: selected.name,
      slug: selected.slug,
      chatbotTipo:
        selected.chatbotTipo,
      categoriaNome:
        selected.categoriaNome,
    };
  }

  private async ensureDirectBusinessOpportunity(
    input: ChatMessageInput,
    conversationId: string,
  ) {
    if (
      input.chatbotTipo !== "PRESTADOR" &&
      input.chatbotTipo !== "LOJA"
    ) {
      return null;
    }

    const storeId =
      String(
        input.chatbotOwnerId ||
        input.storeId ||
        input.lojaId ||
        "",
      ).trim();

    const storeName =
      String(
        input.storeName ||
        input.selectedStoreName ||
        "",
      ).trim();

    const storeSlug =
      String(
        input.storeSlug ||
        input.selectedStoreSlug ||
        "",
      ).trim();

    if (!storeId) {
      return null;
    }

    const opportunity =
      await this.opportunity.getOrCreate({
        campanhaId:
          input.campanhaId || null,
        playbookId:
          input.playbook?.id || null,
        categoriaId:
          input.categoriaId || null,
        sourceConversationId:
          conversationId,
        userId:
          input.userId || null,
        userType:
          input.userType || null,
        condominioId:
          input.condominioId || null,
        canalOrigem:
          input.channel ||
          input.origem ||
          null,
      });

    if (
      opportunity.selected_store_id ===
      storeId
    ) {
      return opportunity;
    }

    if (
      !storeName ||
      !storeSlug
    ) {
      console.warn(
        "[CHAT COMERCIAL] Store sem nome/slug para vincular oportunidade direta",
        {
          opportunityId:
            opportunity.id,
          conversationId,
          storeId,
          storeName:
            storeName || null,
          storeSlug:
            storeSlug || null,
        },
      );

      return null;
    }

    const selection =
      await this.opportunity.selectBusiness({
        opportunityId:
          opportunity.id,
        storeId,
        storeName,
        storeSlug,
        chatbotTipo:
          input.chatbotTipo,
      });

    await this.opportunity
      .attachDestinationConversation(
        selection.opportunity.id,
        conversationId,
      );

    return selection.opportunity;
  }

  /**
   * Intenção concreta de avançar para contratação.
   * Dúvidas genéricas sobre preço/serviço não criam solicitação sozinhas.
   */
  private isCommercialCommitmentIntent(
    message: string,
  ): boolean {
    const normalized =
      this.normalize(message);

    const phrases = [
      "quero contratar",
      "quero fechar",
      "vamos fechar",
      "pode fechar",
      "quero agendar",
      "quero marcar",
      "quero reservar",
      "quero pagar",
      "pode gerar o pagamento",
      "quero fazer a avaliacao",
      "quero fazer uma avaliacao",
      "quero esse atendimento",
      "quero este atendimento",
      "quero esse servico",
      "quero este servico",
      "quero iniciar o tratamento",
      "quero iniciar o atendimento",
      "pode marcar",
      "pode agendar",
    ];

    // Evita tratar "não quero contratar" como intenção de compra.
    if (
      /\b(nao|nunca|jamais)\s+(?:quero|vou|pode|vamos|pretendo)\b/.test(normalized) ||
      /\b(?:ainda nao|nao agora|sem contratar|sem agendar)\b/.test(normalized)
    ) {
      return false;
    }

    return phrases.some(
      (phrase) =>
        normalized.includes(
          this.normalize(phrase),
        ),
    );
  }

  private resolveConversionOrigin(
    origem?: string | null,
  ):
    | "WHATSAPP"
    | "INSTAGRAM"
    | "FACEBOOK"
    | "LANDING_PAGE"
    | "CHAT_HOME"
    | "OUTRO" {
    const value =
      String(origem || "")
        .trim()
        .toUpperCase();

    if (value === "WHATSAPP") {
      return "WHATSAPP";
    }

    if (value === "INSTAGRAM") {
      return "INSTAGRAM";
    }

    if (
      value === "FACEBOOK" ||
      value === "MESSENGER"
    ) {
      return "FACEBOOK";
    }

    if (value === "LANDING_PAGE") {
      return "LANDING_PAGE";
    }

    if (value === "CHAT_HOME") {
      return "CHAT_HOME";
    }

    return "OUTRO";
  }

  /**
   * ============================================================
   * CATÁLOGO COMERCIAL PARA O CHAT
   * ============================================================
   *
   * Centraliza a consulta para evitar:
   * - duplicação no bootstrap e no fluxo normal;
   * - catálogo carregado mas não enviado ao prompt;
   * - preço inventado pela IA.
   */
  private async loadBusinessCatalogData(
    input: ChatMessageInput,
  ): Promise<{
    context: string;
    items: BusinessCatalogItem[];
  }> {
    const storeId =
      String(
        input.chatbotOwnerId ||
        input.storeId ||
        input.lojaId ||
        "",
      ).trim();

    const isBusinessChat =
      input.chatbotTipo === "PRESTADOR" ||
      input.chatbotTipo === "LOJA";

    if (
      !storeId ||
      !isBusinessChat
    ) {
      return {
        context: "",
        items: [],
      };
    }

    try {
      /**
       * Não confiamos exclusivamente no chatbotTipo recebido da origem.
       *
       * Uma Store de PRESTADOR pode chegar como LOJA por configuração
       * antiga do frontend. Como o próprio BusinessCatalogItem possui
       * o tipo real (SERVICO, PACOTE, PRODUTO, CARDAPIO, PROMOCAO),
       * carregamos ambas as famílias e usamos o catálogo como verdade.
       */
      const [
        serviceItems,
        productItems,
      ] = await Promise.all([
        this.businessCatalog
          .listarOpcoesServico(
            storeId,
            {
              categoriaId:
                input.categoriaId ||
                undefined,
            },
          ),

        this.businessCatalog
          .listarProdutos(
            storeId,
          ),
      ]);

      /**
       * PROMOCAO pertence às duas famílias e pode vir duplicada.
       */
      const catalogById =
        new Map<string, BusinessCatalogItem>();

      for (
        const item of [
          ...serviceItems,
          ...productItems,
        ]
      ) {
        catalogById.set(
          String(item.id),
          item,
        );
      }

      const catalogItems =
        Array.from(
          catalogById.values(),
        );

      const onlyServiceCatalog =
        catalogItems.length > 0 &&
        catalogItems.every(
          (item) =>
            item.tipo === "SERVICO" ||
            item.tipo === "PACOTE" ||
            item.tipo === "PROMOCAO",
        ) &&
        catalogItems.some(
          (item) =>
            item.tipo === "SERVICO" ||
            item.tipo === "PACOTE",
        );

      if (
        onlyServiceCatalog &&
        input.chatbotTipo === "LOJA"
      ) {
        input.chatbotTipo = "PRESTADOR";

        console.warn(
          "[BUSINESS CATALOG] Tipo corrigido pelo catálogo oficial",
          {
            storeId,
            chatbotTipoRecebido: "LOJA",
            chatbotTipoResolvido: "PRESTADOR",
          },
        );
      }

      const context =
        this.businessCatalog
          .buildChatContext(
            catalogItems,
          );

      console.log(
        "[BUSINESS CATALOG] Contexto carregado para o chatbot",
        {
          storeId,

          chatbotTipoRecebido:
            input.chatbotTipo,

          categoriaId:
            input.categoriaId ||
            null,

          quantidadeServicos:
            serviceItems.length,

          quantidadeProdutos:
            productItems.length,

          quantidadeTotal:
            catalogItems.length,

          tipos:
            catalogItems.map(
              (item) => item.tipo,
            ),

          nomes:
            catalogItems.map(
              (item) => item.nome,
            ),

          ids:
            catalogItems.map(
              (item) => item.id,
            ),
        },
      );

      if (
        input.chatbotTipo === "LOJA" &&
        serviceItems.length > 0 &&
        productItems.length === 0
      ) {
        console.warn(
          "[BUSINESS CATALOG] Inconsistência detectada: chatbotTipo LOJA, mas a Store possui somente SERVICO/PACOTE.",
          {
            storeId,
            chatbotTipoRecebido:
              input.chatbotTipo,
            servicos:
              serviceItems.map(
                (item) => ({
                  id: item.id,
                  tipo: item.tipo,
                  nome: item.nome,
                }),
              ),
          },
        );
      }

      if (
        input.chatbotTipo === "PRESTADOR" &&
        productItems.length > 0 &&
        serviceItems.length === 0
      ) {
        console.warn(
          "[BUSINESS CATALOG] Inconsistência detectada: chatbotTipo PRESTADOR, mas a Store possui somente PRODUTO/CARDAPIO.",
          {
            storeId,
            chatbotTipoRecebido:
              input.chatbotTipo,
            produtos:
              productItems.map(
                (item) => ({
                  id: item.id,
                  tipo: item.tipo,
                  nome: item.nome,
                }),
              ),
          },
        );
      }

      return {
        context,
        items:
          catalogItems,
      };
    } catch (error: any) {
      console.error(
        "[BUSINESS CATALOG] Erro ao carregar catálogo",
        {
          storeId,
          chatbotTipo:
            input.chatbotTipo,
          erro:
            error?.message ||
            String(error),
        },
      );

      return {
        context: [
          "CATÁLOGO COMERCIAL DO NEGÓCIO",
          "Não foi possível consultar o catálogo neste momento.",
          "Não invente preço, pacote, promoção, produto ou condição comercial.",
        ].join("\n"),
        items: [],
      };
    }
  }

  /**
   * Resolve a escolha do usuário contra a mesma lista ordenada que foi
   * apresentada no contexto do chatbot.
   *
   * Não usa IA para escolher UUID.
   */
  private resolveCatalogItemSelection(
    message: string,
    items: BusinessCatalogItem[],
  ): BusinessCatalogItem | null {
    if (!items.length) {
      return null;
    }

    const normalized =
      this.normalize(message);

    if (!normalized) {
      return null;
    }

    const asksForEvaluation =
      normalized.includes("avaliacao") ||
      normalized.includes("avaliar");

    if (asksForEvaluation) {
      const evaluationItems =
        items.filter((item) =>
          this.normalize(item.nome).includes("avaliacao"),
        );

      if (evaluationItems.length === 1) {
        return evaluationItems[0] || null;
      }
    }

    /**
     * Escolha natural pelo TIPO do item.
     *
     * Cenário real:
     * - catálogo possui 1 SERVICO + 1 PACOTE;
     * - IA pergunta "avaliação inicial ou pacote?";
     * - cliente responde "quero um pacote".
     *
     * Antes, "pacote" era stop-word e por isso a escolha retornava null.
     * A IA dizia que o pacote havia sido escolhido, mas a oportunidade
     * nunca recebia catalog_item_id. Consequentemente o novo motor
     * comercial nem era acionado nas mensagens seguintes.
     *
     * Só selecionamos automaticamente quando existe EXATAMENTE UM
     * item ativo daquele tipo no catálogo, evitando ambiguidade.
     */
    const asksForPackage =
      /\bpacotes?\b/.test(normalized) ||
      normalized.includes("acompanhamento");

    if (asksForPackage) {
      const packageItems =
        items.filter(
          (item) =>
            String(item.tipo) === "PACOTE",
        );

      if (packageItems.length === 1) {
        return packageItems[0] || null;
      }
    }

    /**
     * Sessão avulsa / única.
     *
     * Não usamos apenas a palavra "sessão", porque um PACOTE também
     * contém sessões. Exigimos indicação clara de contratação avulsa.
     */
    const asksForStandaloneService =
      normalized.includes("sessao avulsa") ||
      normalized.includes("sessao unica") ||
      normalized.includes("uma unica sessao") ||
      normalized.includes("apenas uma sessao") ||
      normalized.includes("so uma sessao") ||
      normalized.includes("somente uma sessao") ||
      normalized.includes("atendimento avulso");

    if (asksForStandaloneService) {
      const serviceItems =
        items.filter(
          (item) =>
            String(item.tipo) === "SERVICO",
        );

      if (serviceItems.length === 1) {
        return serviceItems[0] || null;
      }
    }

    const ordinalMap: Array<{
      terms: string[];
      position: number;
    }> = [
        {
          terms: [
            "primeira opcao",
            "primeiro",
            "primeira",
            "opcao 1",
          ],
          position: 1,
        },
        {
          terms: [
            "segunda opcao",
            "segundo",
            "segunda",
            "opcao 2",
          ],
          position: 2,
        },
        {
          terms: [
            "terceira opcao",
            "terceiro",
            "terceira",
            "opcao 3",
          ],
          position: 3,
        },
        {
          terms: [
            "quarta opcao",
            "quarto",
            "quarta",
            "opcao 4",
          ],
          position: 4,
        },
        {
          terms: [
            "quinta opcao",
            "quinto",
            "quinta",
            "opcao 5",
          ],
          position: 5,
        },
        {
          terms: [
            "sexta opcao",
            "sexto",
            "sexta",
            "opcao 6",
          ],
          position: 6,
        },
        {
          terms: [
            "setima opcao",
            "setimo",
            "setima",
            "opcao 7",
          ],
          position: 7,
        },
        {
          terms: [
            "oitava opcao",
            "oitavo",
            "oitava",
            "opcao 8",
          ],
          position: 8,
        },
        {
          terms: [
            "nona opcao",
            "nono",
            "nona",
            "opcao 9",
          ],
          position: 9,
        },
        {
          terms: [
            "decima opcao",
            "decimo",
            "decima",
            "opcao 10",
          ],
          position: 10,
        },
      ];

    for (const entry of ordinalMap) {
      const matched =
        entry.terms.some(
          (term) =>
            normalized.includes(term),
        );

      if (matched) {
        return items[entry.position - 1] || null;
      }
    }

    const numericPatterns = [
      /(?:opcao|opção|numero|número|nº|n\.)\s*(\d{1,2})/i,
      /(?:quero|fico com|escolho|prefiro|vou de)\s+(?:a\s+)?(\d{1,2})(?:\b|$)/i,
      /^\s*(\d{1,2})\s*$/i,
    ];

    for (const pattern of numericPatterns) {
      const match =
        message.match(pattern);

      const position =
        match?.[1]
          ? Number(match[1])
          : 0;

      if (
        Number.isInteger(position) &&
        position >= 1 &&
        position <= items.length
      ) {
        return items[position - 1] ?? null;
      }
    }

    const byName =
      items.filter((item) => {
        const itemName =
          this.normalize(item.nome);

        return Boolean(
          itemName &&
          normalized.includes(itemName),
        );
      });

    if (byName.length === 1) {
      return byName[0] ?? null;
    }

    /**
     * Correspondência natural por palavras significativas.
     *
     * Exemplo:
     * mensagem: "gostaria de uma avaliação inicial"
     * item: "Avaliação psicopedagógica inicial"
     *
     * Não exigimos o nome comercial completo, mas também não
     * selecionamos por uma palavra genérica isolada.
     */
    const stopWords =
      new Set([
        "a",
        "o",
        "as",
        "os",
        "de",
        "da",
        "do",
        "das",
        "dos",
        "e",
        "para",
        "com",
        "uma",
        "um",
        "servico",
        "servicos",
        "pacote",
        "pacotes",
        "atendimento",
        "atendimentos",
      ]);

    const messageTokens =
      new Set(
        normalized
          .split(/\s+/)
          .map((token) => token.trim())
          .filter(
            (token) =>
              token.length >= 4 &&
              !stopWords.has(token),
          ),
      );

    const scored =
      items
        .map((item) => {
          const itemTokens =
            this.normalize(item.nome)
              .split(/\s+/)
              .map((token) => token.trim())
              .filter(
                (token) =>
                  token.length >= 4 &&
                  !stopWords.has(token),
              );

          const matchedTokens =
            itemTokens.filter(
              (token) =>
                messageTokens.has(token),
            );

          return {
            item,
            matched:
              matchedTokens.length,
            total:
              itemTokens.length,
          };
        })
        .filter(
          (entry) =>
            entry.matched >= 2,
        )
        .sort((a, b) => {
          if (
            b.matched !==
            a.matched
          ) {
            return (
              b.matched -
              a.matched
            );
          }

          const ratioA =
            a.total > 0
              ? a.matched / a.total
              : 0;

          const ratioB =
            b.total > 0
              ? b.matched / b.total
              : 0;

          return (
            ratioB -
            ratioA
          );
        });

    if (
      scored.length > 0 &&
      (
        scored.length === 1 ||
        scored[0]!.matched >
        scored[1]!.matched
      )
    ) {
      return scored[0]!.item;
    }

    return null;
  }

  /**
   * ============================================================
   * INSTRUÇÕES DO CHATBOT
   * ============================================================
   */
  /**
   * ============================================================
   * CATÁLOGO OFICIAL - SYSTEM MESSAGE DE ALTA PRIORIDADE
   * ============================================================
   *
   * O contexto legado pode conter frases antigas como
   * "nenhum produto ou serviço cadastrado". Quando o novo
   * BusinessCatalog possui itens, esta mensagem deixa explícito
   * para o modelo qual fonte deve prevalecer.
   */
  private buildAuthoritativeCatalogInstructions(
    businessCatalogContext: string,
    businessCatalogItems: BusinessCatalogItem[],
  ): string {
    if (
      !businessCatalogItems.length ||
      !String(businessCatalogContext || "").trim()
    ) {
      return "";
    }

    return `
ATENÇÃO — FONTE COMERCIAL OFICIAL DO NEGÓCIO

O catálogo abaixo foi consultado diretamente em business_catalog_items e é a fonte comercial prioritária desta resposta.

${businessCatalogContext}

REGRAS OBRIGATÓRIAS:
- existem ${businessCatalogItems.length} item(ns) comercial(is) ativo(s) neste catálogo;
- NÃO diga que não existem serviços, produtos, pacotes, sessões ou opções cadastradas quando o catálogo acima contiver item relacionado;
- ignore qualquer frase contraditória de contexto legado que diga "nenhum produto ou serviço cadastrado", "nenhuma informação sobre sessões" ou equivalente;
- responda à pergunta atual usando nome, descrição, preço, duração, quantidade de sessões e modalidade dos itens acima quando forem relevantes;
- se a pessoa disser "algumas sessões", "acompanhamento" ou expressão equivalente e houver PACOTE, explique naturalmente esse pacote;
- se houver mais de uma opção relevante, explique a diferença sem pressionar a pessoa;
- faça no máximo uma pergunta curta ao final, somente se ajudar a avançar a decisão;
- NÃO ofereça abrir solicitação apenas para obter uma informação que já está neste catálogo.
`.trim();
  }

  private buildInstructions(
    input: ChatMessageInput,
    platformContext: string,
    rememberedFacts: string,
    opportunityQualificationContext = "",
    businessCatalogContext = "",
  ): string {
    const userContext =
      [
        input.userName
          ? `Nome conhecido: ${input.userName}`
          : "",

        input.userType
          ? `Tipo de usuário: ${input.userType}`
          : "",

        input.condominioId
          ? `ID do condomínio: ${input.condominioId}`
          : "",

        input.chatbotTipo
          ? `Tipo de chatbot: ${input.chatbotTipo}`
          : "",

        input.origem
          ? `Origem do atendimento: ${input.origem}`
          : "",

        input.chatbotOwnerId
          ? `ID do negócio atendido: ${input.chatbotOwnerId}`
          : "",

        input.storeName
          ? `Nome do negócio atendido: ${input.storeName}`
          : "",

        input.cidade
          ? `Cidade do cliente: ${input.cidade}`
          : "",

        input.estado
          ? `Estado do cliente: ${input.estado}`
          : "",

        input.bairro
          ? `Bairro do cliente: ${input.bairro}`
          : "",

        input.latitude &&
          input.longitude
          ? `Coordenadas aproximadas: ${input.latitude}, ${input.longitude}`
          : "",
      ]
        .filter(
          Boolean,
        )
        .join(
          "\n",
        );

    const campaignContext =
      this.buildCampaignInstructions(
        input,
      );

    const now =
      new Date();

    const dataHoraBrasil =
      now.toLocaleString(
        "pt-BR",
        {
          timeZone:
            "America/Sao_Paulo",

          dateStyle:
            "full",

          timeStyle:
            "short",
        },
      );

    const horaBrasil =
      Number(
        now.toLocaleString(
          "pt-BR",
          {
            timeZone:
              "America/Sao_Paulo",

            hour:
              "2-digit",

            hour12:
              false,
          },
        ),
      );

    const periodo =
      horaBrasil >= 5 &&
        horaBrasil < 12
        ? "manhã"
        : horaBrasil >=
          12 &&
          horaBrasil < 18
          ? "tarde"
          : "noite";

    return `
Data e horário atual no Brasil/São Paulo:
${dataHoraBrasil}
Período atual: ${periodo}

Regras de saudação:
- use o período atual para responder cumprimentos;
- se o cliente disser "bom dia" mas já for tarde, responda de forma natural, por exemplo: "Boa tarde! Tudo bem?";
- não corrija o cliente de forma seca;
- adapte "bom dia", "boa tarde" e "boa noite" conforme o horário atual.

Você é o assistente oficial do GranConecta.

Objetivos:
- responder dúvidas sobre o funcionamento do GranConecta;
- ajudar moradores a encontrar lojas, produtos e prestadores;
- ajudar prestadores e empreendedores com cadastro, planos e divulgação;
- identificar oportunidades comerciais sem pressionar o usuário;
- fazer uma pergunta curta por vez quando precisar qualificar o interesse.

Regras:
- responda sempre em português do Brasil;
- seja objetivo, cordial e fácil de entender;
- não invente lojas, prestadores, preços, planos ou funcionalidades;
- NUNCA diga que um horário foi agendado, reservado ou confirmado sem uma confirmação explícita do backend;
- NUNCA diga que um pagamento foi realizado, aprovado ou recebido sem confirmação explícita do backend;
- NUNCA diga que criou Google Meet, enviou e-mail, notificou profissional ou confirmou agenda se a operação não foi realmente executada;
- NUNCA use termos técnicos internos como "backend", "API", "banco de dados", "endpoint" ou "aguardando resposta do backend" em mensagens ao cliente; prefira "nossa central", "sistema do GranConecta" ou uma frase simples de continuidade;
- nunca use o nome do prestador, responsável pela Store ou nome do negócio como se fosse o nome do cliente;
- só chame o cliente pelo nome quando esse nome vier de usuário autenticado, canal externo confiável ou tiver sido informado pelo próprio cliente nesta conversa;
- quando o backend estiver coletando preferência de agenda, trate dia e horário somente como preferência até confirmação real do profissional;
- quando o cliente quiser contratar, fechar, pagar ou agendar um serviço de um prestador já escolhido, conduza para o fluxo comercial do GranConecta; não simule a conclusão;
- você pode dizer "posso verificar os horários disponíveis", mas não pode inventar um horário disponível;
- não solicite senha, documento completo ou dados bancários;
- use as informações fornecidas voluntariamente pelo usuário;
- lembre e utilize fatos informados anteriormente na conversa;
- quando o usuário perguntar algo já informado, responda usando a memória;
- nunca diga que não sabe o nome se ele estiver nos fatos lembrados;
- use somente resultados reais fornecidos no contexto da plataforma;
- quando encontrar uma loja ou prestador, informe nome e link completo;
- se não encontrar resultados reais, diga claramente que não encontrou;
- nunca invente links, prestadores, lojas, condomínios ou categorias;
- escreva links como URLs completas em texto simples;
- nunca coloque links entre parênteses ou dentro de sintaxe Markdown;
- quando o usuário perguntar sobre termos, regras, responsabilidades, entregas, fretes, pagamentos, reembolsos, cancelamentos, LGPD ou obrigações de prestadores/empreendedores, responda com base nos documentos legais disponíveis no contexto;
- explique de forma simples, sem alterar o sentido jurídico dos documentos;
- não dê aconselhamento jurídico definitivo;
- quando necessário, informe que a resposta é uma explicação dos termos da plataforma e não substitui orientação jurídica;
- se os documentos indicarem que a responsabilidade é do prestador, empreendedor ou lojista, deixe isso claro;
- se os documentos indicarem que o GranConecta atua apenas como plataforma de conexão, explique isso claramente;
- se houver uma campanha contextual, preserve o assunto e o objetivo daquela campanha durante a conversa;
- se houver selectedStoreId/chatbotOwnerId definido, considere que o usuário já escolheu aquele negócio e continue exclusivamente no contexto dele;
- quando o usuário escolher uma opção real da lista por número, ordinal ou nome, confirme brevemente a escolha e prossiga com informações reais daquele negócio;
- se tipoDestino for CATEGORIA, não represente um negócio específico antes de o usuário escolher uma opção real;
- em campanha de CATEGORIA, use o playbook do nicho para qualificar o interesse com uma pergunta curta por vez;
- em campanha de CATEGORIA, não invente profissionais, lojas, preços, disponibilidade ou links; apresente apenas resultados reais fornecidos pelo contexto da plataforma;
- em campanha de LOJA ou PRESTADOR, atenda exclusivamente o anunciante indicado no contexto da campanha;
- se o tipo do chatbot for LOJA ou PRESTADOR, atenda exclusivamente o negócio informado no contexto;
- nunca misture produtos, serviços, preços, regras ou informações de outros negócios;
- o bloco "Catálogo comercial cadastrado pelo negócio" é a FONTE COMERCIAL PRIORITÁRIA para serviços, pacotes, produtos, cardápio, preços, duração, sessões e modalidade;
- se o catálogo comercial listar um ou mais itens, NUNCA diga que o negócio não possui serviços/produtos cadastrados apenas porque outro contexto legado disser que não encontrou produtos ou serviços;
- quando houver conflito entre uma mensagem genérica/legada do contexto da plataforma e um item explícito do catálogo comercial, prevalece o catálogo comercial;
- quando o cliente fizer uma pergunta aberta como "como funciona?", "quero algumas sessões", "o que vocês oferecem?" ou equivalente, explique de forma natural as opções relevantes realmente cadastradas, sem obrigar o cliente a escolher imediatamente;
- aja como um bom atendente comercial: entenda a necessidade, explique benefícios e diferenças usando apenas fatos reais, recomende quando houver base para isso e faça no máximo uma pergunta útil por resposta;
- não transforme toda dúvida em solicitação, cadastro ou pagamento; primeiro responda e ajude o cliente a decidir;
- não pressione o cliente e não repita menu/lista completa quando a conversa já indicar claramente o assunto de interesse;
- nunca diga "vou abrir uma solicitação", "vou processar", "aguarde enquanto faço" ou equivalente se nenhuma ação real tiver sido executada pelo sistema;
- se houver um item do catálogo compatível com o que o cliente descreveu, apresente esse item antes de dizer que faltam informações;
- se o tipo do chatbot for LOJA e o cliente quiser comprar um produto cadastrado, confirme o produto e pergunte se deseja adicionar ao carrinho;
- se o cliente responder "sim", "quero", "pode", "adicionar" ou equivalente, confirme que o produto será enviado ao carrinho;
- para LOJA, não diga que vai abrir solicitação quando o assunto for compra de produto cadastrado;
- use solicitação apenas para pedido personalizado, orçamento, serviço ou produto não cadastrado;
- quando o cliente pedir para falar com atendente, WhatsApp, zap ou pessoa real, diga que vai encaminhar para atendimento humano;
- não invente entrega, pagamento, promoções, cardápio ou normas;
- se a informação não estiver no contexto, diga que ela não está cadastrada;
- quando o usuário pedir atendimento humano, informe que a conversa será encaminhada para um atendente dentro do GranConecta;
- não diga que o WhatsApp será aberto automaticamente;
- não diga que já foi resolvido; diga que a conversa ficará aguardando um atendente;
- Período do dia: ${periodo}
- A IA deve adaptar saudações ao horário atual.
- Se o cliente disser "bom dia" durante a tarde, responda naturalmente com "Boa tarde".
- Se houver cidade ou estado informado, utilize para contextualizar entregas, atendimento e disponibilidade.

Contexto conhecido do usuário:
${userContext || "Visitante sem identificação."}

Contexto da campanha de origem:
${campaignContext || "Nenhuma campanha contextual identificada."}

Fatos lembrados desta conversa:
${rememberedFacts || "Nenhum fato pessoal informado ainda."}

Contexto comercial transferido da campanha para este negócio:
${opportunityQualificationContext || "Nenhuma oportunidade comercial transferida para este atendimento."}

Contexto complementar/legado consultado agora no banco do GranConecta:
${platformContext}

CATÁLOGO COMERCIAL OFICIAL E PRIORITÁRIO DO NEGÓCIO:
${businessCatalogContext || "Nenhum item comercial ativo cadastrado para este negócio."}

REGRA FINAL DE PRECEDÊNCIA:
- O CATÁLOGO COMERCIAL OFICIAL acima prevalece sobre qualquer bloco complementar/legado.
- Se o catálogo oficial listar um ou mais itens, é FALSO dizer que não há serviço, pacote, produto, cardápio ou informação comercial cadastrada sobre esses itens.
- Se o cliente perguntar sobre sessões, acompanhamento, avaliação, pacote, preço, duração, modalidade, produto ou cardápio, responda primeiro usando os itens explícitos do catálogo oficial.
- Nunca ofereça "abrir solicitação para obter informações" quando a informação solicitada já estiver presente no catálogo oficial.
`.trim();
  }

  private buildCampaignInstructions(
    input: ChatMessageInput,
  ): string {
    if (!input.campanhaId) {
      return "";
    }

    const linhas: string[] = [
      `Campanha ID: ${input.campanhaId}`,
    ];

    if (input.campanhaNome) {
      linhas.push(
        `Nome interno da campanha: ${input.campanhaNome}`,
      );
    }

    if (input.tipoDestino) {
      linhas.push(
        `Tipo de destino: ${input.tipoDestino}`,
      );
    }

    if (input.categoriaId) {
      linhas.push(
        `Categoria ID: ${input.categoriaId}`,
      );
    }

    if (input.categoriaNome) {
      linhas.push(
        `Categoria/nicho promovido: ${input.categoriaNome}`,
      );
    }

    const playbook = input.playbook;

    if (playbook) {
      if (playbook.id) {
        linhas.push(
          `Playbook ID: ${playbook.id}`,
        );
      }

      if (playbook.nome) {
        linhas.push(
          `Playbook: ${playbook.nome}`,
        );
      }

      if (playbook.mensagemAbertura) {
        linhas.push(
          `Mensagem de abertura sugerida: ${playbook.mensagemAbertura}`,
        );
      }

      const perguntas =
        Array.isArray(playbook.perguntas)
          ? playbook.perguntas
          : [];

      if (perguntas.length > 0) {
        linhas.push(
          "Perguntas de qualificação do playbook:",
        );

        for (
          const pergunta of perguntas
            .slice()
            .sort(
              (
                a: ChatPlaybookPergunta,
                b: ChatPlaybookPergunta,
              ) =>
                Number(a.ordem || 0) -
                Number(b.ordem || 0),
            )
        ) {
          const opcoes =
            Array.isArray(pergunta.opcoes)
              ? pergunta.opcoes
                .map((opcao) =>
                  typeof opcao === "string"
                    ? opcao
                    : opcao.label,
                )
                .filter(Boolean)
              : [];

          linhas.push(
            `- ${pergunta.pergunta}${opcoes.length > 0
              ? ` | Opções: ${opcoes.join(", ")}`
              : ""
            }`,
          );
        }
      }

      const faqs =
        Array.isArray(
          playbook.respostasFrequentes,
        )
          ? playbook.respostasFrequentes
          : [];

      if (faqs.length > 0) {
        linhas.push(
          "Perguntas e respostas do nicho:",
        );

        for (const item of faqs) {
          const faq =
            item as ChatPlaybookFAQ;

          linhas.push(
            `- Pergunta: ${faq.pergunta} | Resposta: ${faq.resposta}`,
          );
        }
      }

      if (playbook.instrucoesIa) {
        linhas.push(
          `Instruções específicas do playbook: ${playbook.instrucoesIa}`,
        );
      }

      if (playbook.ctaTexto) {
        linhas.push(
          `CTA do playbook: ${playbook.ctaTexto}`,
        );
      }
    }

    if (
      input.tipoDestino ===
      "CATEGORIA"
    ) {
      linhas.push(
        "Regra operacional: conduza a conversa dentro deste nicho, faça uma pergunta curta por vez e só apresente profissionais/lojas que existam de fato no contexto consultado.",
      );
      linhas.push(
        "Regra operacional: antes de o usuário escolher um negócio real, mantenha chatbotTipo GRANCONECTA e não assuma identidade de loja ou prestador.",
      );
    }

    return linhas.join("\n");
  }

  private formatPlaybookQuestion(
    pergunta: ChatPlaybookPergunta,
    index: number,
    total: number,
  ): string {
    const opcoes =
      Array.isArray(pergunta.opcoes)
        ? pergunta.opcoes
          .map((opcao) =>
            typeof opcao === "string"
              ? opcao
              : opcao.label,
          )
          .filter(Boolean)
        : [];

    const cabecalho =
      total > 1
        ? `Pergunta ${index + 1} de ${total}:`
        : "";

    const optionsText =
      opcoes.length > 0
        ? `\n\n${opcoes
          .map(
            (opcao, optionIndex) =>
              `${optionIndex + 1}. ${opcao}`,
          )
          .join("\n")}`
        : "";

    return [
      cabecalho,
      pergunta.pergunta,
      optionsText,
    ]
      .filter(Boolean)
      .join("\n")
      .trim();
  }

  private getLastAssistantMessage(
    history: Array<{
      role: "user" | "assistant";
      content: string;
    }>,
  ): string {
    for (let index = history.length - 1; index >= 0; index -= 1) {
      const item = history[index];

      if (
        item?.role === "assistant" &&
        item.content
      ) {
        return String(item.content).trim();
      }
    }

    return "";
  }

  private isAssistantAskingCustomerName(
    content?: string | null,
  ): boolean {
    const normalized =
      this.normalize(content || "");

    return (
      normalized.includes("como posso te chamar") ||
      normalized.includes("qual e o seu nome") ||
      normalized.includes("qual seu nome") ||
      normalized.includes("como voce se chama")
    );
  }

  private sanitizeCustomerName(
    value?: string | null,
  ): string | null {
    const raw = String(value || "")
      .replace(/\s+/g, " ")
      .trim();

    if (!raw || raw.length < 2 || raw.length > 80) {
      return null;
    }

    const cleaned = raw
      .replace(
        /^(?:meu nome e|meu nome é|me chamo|pode me chamar de)\s+/i,
        "",
      )
      .replace(/[.!?,;:]+$/g, "")
      .trim();

    if (
      !cleaned ||
      cleaned.length < 2 ||
      cleaned.length > 60
    ) {
      return null;
    }

    if (!/^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ' -]*$/.test(cleaned)) {
      return null;
    }

    const words = cleaned
      .split(/\s+/)
      .filter(Boolean);

    if (words.length > 5) {
      return null;
    }

    return words
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1).toLowerCase(),
      )
      .join(" ");
  }

  private resolveCustomerName(
    input: ChatMessageInput,
    history: Array<{
      role: "user" | "assistant";
      content: string;
    }>,
  ): string | null {
    const shouldTrustInputName =
      String(input.origem || "")
        .trim()
        .toUpperCase() !== "LANDING_PAGE";

    const inputName =
      shouldTrustInputName
        ? this.sanitizeCustomerName(
          input.userName || null,
        )
        : null;

    if (inputName) {
      return inputName;
    }

    for (let index = history.length - 2; index >= 0; index -= 1) {
      const assistant = history[index];
      const user = history[index + 1];

      if (
        assistant?.role === "assistant" &&
        user?.role === "user" &&
        this.isAssistantAskingCustomerName(
          assistant.content,
        )
      ) {
        const captured =
          this.sanitizeCustomerName(
            user.content,
          );

        if (captured) {
          return captured;
        }
      }
    }

    for (let index = history.length - 1; index >= 0; index -= 1) {
      const item = history[index];

      if (item?.role !== "user") {
        continue;
      }

      const match =
        String(item.content || "").match(
          /\b(?:meu nome é|meu nome e|me chamo|pode me chamar de)\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ' -]{1,60})/i,
        );

      const captured =
        this.sanitizeCustomerName(
          match?.[1] || null,
        );

      if (captured) {
        return captured;
      }
    }

    return null;
  }

  private buildCatalogPresentationAfterName(
    customerName: string,
    items: BusinessCatalogItem[],
  ): string {
    if (!items.length) {
      return `Prazer, ${customerName}! Ainda não há serviços com preços cadastrados neste perfil, mas podemos conversar sobre o que você precisa. Conte brevemente qual serviço deseja solicitar. O profissional poderá avaliar o pedido e apresentar uma proposta; nenhum preço ou agendamento está confirmado neste momento.`;
    }

    const options = items.map(
      (item, index) => {
        const price =
          this.businessCatalog.getPrecoVigente(
            item,
          );

        return `${index + 1}. ${item.nome} — R$ ${price.precoVigente
          .toFixed(2)
          .replace(".", ",")}`;
      },
    );

    return [
      `Prazer, ${customerName}! Estas são as opções disponíveis:`,
      ...options,
      "Qual opção você prefere? Você pode responder pelo número ou pelo nome.",
    ].join("\n");
  }

  private isAssistantAskingPreferredDay(
    content?: string | null,
  ): boolean {
    const normalized =
      this.normalize(content || "");

    return (
      normalized.includes("qual dia voce prefere") ||
      normalized.includes("qual dia prefere") ||
      normalized.includes("que dia voce prefere") ||
      normalized.includes("que dia prefere")
    );
  }

  private isAssistantAskingPreferredTime(
    content?: string | null,
  ): boolean {
    const normalized =
      this.normalize(content || "");

    return (
      normalized.includes("qual horario voce prefere") ||
      normalized.includes("qual horario prefere") ||
      normalized.includes("que horario voce prefere") ||
      normalized.includes("que horario prefere")
    );
  }

  /**
   * Extrai dia e horário quando o cliente informa ambos
   * na mesma mensagem.
   *
   * Exemplos:
   * - "sexta-feira às 14h"
   * - "sexta 14:30"
   * - "dia 28 às 9h"
   *
   * Retorna null quando há apenas dia ou apenas horário.
   */
  private formatDatePtBr(
    data: string,
  ): string {
    const [
      year,
      month,
      day,
    ] = String(data || "")
      .split("-")
      .map(Number);

    if (
      !year ||
      !month ||
      !day
    ) {
      return data;
    }

    return `${String(day).padStart(
      2,
      "0",
    )}/${String(month).padStart(
      2,
      "0",
    )}/${year}`;
  }

  /**
   * ============================================================
   * RESPOSTA AFIRMATIVA COMERCIAL
   * ============================================================
   *
   * Usado somente como apoio à seleção contextual do catálogo.
   *
   * Não significa "confirmar pagamento". O uso deste helper fica
   * restrito ao cenário em que a última mensagem da IA apresentou
   * exatamente um item do catálogo e perguntou se o cliente deseja
   * prosseguir.
   */
  private isAffirmativeCommercialAnswer(
    message: string,
  ): boolean {
    const normalized =
      this.normalize(
        String(message || "")
          .trim(),
      );

    if (!normalized) {
      return false;
    }

    const affirmativeAnswers = [
      "sim",
      "sim gostaria",
      "gostaria",
      "quero",
      "quero sim",
      "sim quero",
      "pode ser",
      "pode",
      "vamos",
      "vamos sim",
      "tenho interesse",
      "sim tenho interesse",
      "quero prosseguir",
      "sim quero prosseguir",
      "podemos prosseguir",
      "sim podemos",
      "sim pode",
      "pode prosseguir",
      "sim pode prosseguir",
    ];

    return affirmativeAnswers.some(
      (value) =>
        normalized ===
        this.normalize(
          value,
        ),
    );
  }

  private extractDayAndTimePreference(
    message: string,
  ): {
    day: string;
    time: string;
  } | null {
    const raw =
      String(message || "").trim();

    if (!raw) {
      return null;
    }

    const normalized =
      this.normalize(raw);

    /**
     * Aceita horário natural na mesma frase:
     *
     * - quarta às 15h
     * - quarta as 15
     * - quartas às 15h
     * - quartas-feiras às 15:30
     * - quinta 16h
     * - amanhã às 9
     * - dia 10 às 14
     *
     * O caso "as 15" sem "h" é aceito somente quando existe
     * preposição ("as/às") para não confundir o número do dia
     * com o horário.
     */
    const timeMatch =
      raw.match(
        /\b(?:as|às)\s*(\d{1,2})(?::(\d{2}))?\s*(?:h|horas?)?\b/i,
      ) ||
      raw.match(
        /\b(\d{1,2})(?::(\d{2}))\s*(?:h|horas?)?\b/i,
      ) ||
      raw.match(
        /\b(\d{1,2})\s*h(?:oras?)?\b/i,
      ) ||
      raw.match(
        /\b(\d{1,2})\s*horas?\b/i,
      );

    if (!timeMatch) {
      return null;
    }

    const hour =
      Number(timeMatch[1]);

    const minute =
      timeMatch[2] !== undefined
        ? Number(timeMatch[2])
        : 0;

    if (
      !Number.isInteger(hour) ||
      hour < 0 ||
      hour > 23 ||
      !Number.isInteger(minute) ||
      minute < 0 ||
      minute > 59
    ) {
      return null;
    }

    /**
     * Singular e plural.
     *
     * A forma plural ("quartas", "quartas-feiras") é interpretada
     * nesta contratação como a próxima ocorrência daquele dia.
     * A política de recorrência do pacote continua sendo tratada
     * pelo catálogo/commercial flow, não por este parser.
     */
    const dayTerms = [
      "segunda-feira",
      "segundas-feiras",
      "segunda",
      "segundas",

      "terca-feira",
      "tercas-feiras",
      "terca",
      "tercas",

      "terça-feira",
      "terças-feiras",
      "terça",
      "terças",

      "quarta-feira",
      "quartas-feiras",
      "quarta",
      "quartas",

      "quinta-feira",
      "quintas-feiras",
      "quinta",
      "quintas",

      "sexta-feira",
      "sextas-feiras",
      "sexta",
      "sextas",

      "sabado",
      "sabados",
      "sábado",
      "sábados",

      "domingo",
      "domingos",

      "hoje",

      "amanha",
      "amanhã",

      "depois de amanha",
      "depois de amanhã",
    ];

    const hasNamedDay =
      dayTerms.some(
        (term) =>
          normalized.includes(
            this.normalize(term),
          ),
      );

    /**
     * Datas numéricas:
     * - dia 10
     * - 10/09
     * - 10/09/2026
     *
     * IMPORTANTE:
     * quando a frase é "dia 10 às 14", o 10 é data e o 14 é hora.
     */
    const hasNumericDate =
      /\bdia\s+\d{1,2}\b/i.test(raw) ||
      /\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/i
        .test(raw);

    if (
      !hasNamedDay &&
      !hasNumericDate
    ) {
      return null;
    }

    /**
     * Remove SOMENTE o horário encontrado.
     * Assim preservamos a expressão completa do dia para
     * AgendaDisponibilidadeService.resolverDataPreferida().
     */
    let day =
      raw
        .replace(
          timeMatch[0],
          "",
        )
        .replace(
          /\s{2,}/g,
          " ",
        )
        .replace(
          /\s+(?:as|às)\s*$/i,
          "",
        )
        .replace(
          /[,.!?;:]+$/g,
          "",
        )
        .trim();

    /**
     * Remove conectivos que podem sobrar depois da retirada
     * do horário, sem alterar o dia propriamente dito.
     */
    day =
      day
        .replace(
          /\s+(?:por volta de|aproximadamente)\s*$/i,
          "",
        )
        .trim();

    if (!day) {
      return null;
    }

    const time =
      `${String(hour).padStart(
        2,
        "0",
      )}:${String(minute).padStart(
        2,
        "0",
      )}`;

    return {
      day,
      time,
    };
  }

  private extractTimePreference(
    message: string,
  ): string | null {
    const raw =
      String(message || "").trim();

    if (!raw) {
      return null;
    }

    const timeMatch =
      raw.match(
        /\b(?:as|às)\s*(\d{1,2})(?::(\d{2}))?\s*(?:h|horas?)?\b/i,
      ) ||
      raw.match(
        /\b(\d{1,2})(?::(\d{2}))\s*(?:h|horas?)?\b/i,
      ) ||
      raw.match(
        /\b(\d{1,2})\s*h(?:oras?)?\b/i,
      ) ||
      raw.match(
        /\b(\d{1,2})\s*horas?\b/i,
      ) ||
      raw.match(
        /^(\d{1,2})(?::(\d{2}))?$/,
      );

    if (!timeMatch) {
      return null;
    }

    const hour =
      Number(timeMatch[1]);

    const minute =
      timeMatch[2] !== undefined
        ? Number(timeMatch[2])
        : 0;

    if (
      !Number.isInteger(hour) ||
      hour < 0 ||
      hour > 23 ||
      !Number.isInteger(minute) ||
      minute < 0 ||
      minute > 59
    ) {
      return null;
    }

    return `${String(hour).padStart(
      2,
      "0",
    )}:${String(minute).padStart(
      2,
      "0",
    )}`;
  }

  private resolvePreferredDayFromHistory(
    history: Array<{
      role: "user" | "assistant";
      content: string;
    }>,
  ): string | null {
    for (let index = history.length - 2; index >= 0; index -= 1) {
      const assistant = history[index];
      const user = history[index + 1];

      if (
        assistant?.role === "assistant" &&
        user?.role === "user" &&
        this.isAssistantAskingPreferredDay(
          assistant.content,
        )
      ) {
        const value =
          String(user.content || "")
            .trim();

        return value || null;
      }
    }

    return null;
  }

  /**
   * ============================================================
   * MEMÓRIA
   * ============================================================
   */
  private extractRememberedFacts(
    history: Array<{
      role:
      | "user"
      | "assistant";

      content:
      string;
    }>,

    input:
      ChatMessageInput,
  ): string {
    const facts:
      string[] =
      [];

    if (
      input.userName
    ) {
      facts.push(
        `O nome do usuário é ${input.userName}.`,
      );
    }

    if (
      input.userType
    ) {
      facts.push(
        `O tipo do usuário é ${input.userType}.`,
      );
    }

    const userMessages =
      history
        .filter(
          (
            item,
          ) =>
            item.role ===
            "user",
        )
        .map(
          (
            item,
          ) =>
            item.content,
        );

    for (
      const content of
      userMessages
    ) {
      const nameMatch =
        content.match(
          /\b(?:meu nome é|meu nome e|me chamo|pode me chamar de)\s+([a-zA-ZÀ-ÿ][a-zA-ZÀ-ÿ\s'-]{1,60})/i,
        );

      if (
        nameMatch?.[1]
      ) {
        const name =
          nameMatch[1]
            .replace(
              /[.!?,;:].*$/,
              "",
            )
            .trim();

        facts.push(
          `O usuário informou que seu nome é ${name}.`,
        );
      }
    }

    return Array.from(
      new Set(
        facts,
      ),
    ).join(
      "\n",
    );
  }

  /**
   * ============================================================
   * LEAD
   * ============================================================
   */
  private detectLeadSignal(
    message: string,
  ): ChatLeadSignal {
    const normalized =
      this.normalize(
        message,
      );

    const interestedTerms =
      [
        "quero contratar",
        "quero comprar",
        "quero cadastrar",
        "quero anunciar",
        "tenho interesse",
        "preciso de",
        "orcamento",
        "orçamento",
        "agendar",
        "valor",
        "preco",
        "preço",
        "whatsapp",
        "telefone",
        "contato",
        "falar com",
        "atendente",
      ];

    const qualifyingTerms =
      [
        "como funciona",
        "plano",
        "prestador",
        "loja",
        "produto",
        "servico",
        "serviço",
        "landing page",
        "divulgar",
        "propaganda",
      ];

    if (
      interestedTerms.some(
        (
          term,
        ) =>
          normalized.includes(
            this.normalize(
              term,
            ),
          ),
      )
    ) {
      return {
        shouldCapture:
          true,

        interest:
          message,

        status:
          "INTERESSADO",
      };
    }

    if (
      qualifyingTerms.some(
        (
          term,
        ) =>
          normalized.includes(
            this.normalize(
              term,
            ),
          ),
      )
    ) {
      return {
        shouldCapture:
          true,

        interest:
          message,

        status:
          "QUALIFICANDO",
      };
    }

    return {
      shouldCapture:
        false,

      status:
        "NOVO",
    };
  }

  /**
   * ============================================================
   * CARRINHO
   * ============================================================
   */
  private detectCartAction(
    message: string,
    answer: string,
    platformContext: string,
    input: ChatMessageInput,
  ): ChatBotAction {
    const normalizedMessage =
      this.normalize(
        message,
      );

    const normalizedAnswer =
      this.normalize(
        answer,
      );

    const isLoja =
      input.chatbotTipo ===
      "LOJA" &&
      Boolean(
        input.chatbotOwnerId,
      );

    if (!isLoja) {
      return {
        type:
          "NONE",
      };
    }

    const confirmouCompra =
      [
        "sim",
        "quero",
        "pode",
        "pode sim",
        "adicionar",
        "adiciona",
        "colocar no carrinho",
        "comprar",
        "finalizar",
      ].some(
        (
          term,
        ) =>
          normalizedMessage ===
          this.normalize(
            term,
          ) ||
          normalizedMessage.includes(
            this.normalize(
              term,
            ),
          ),
      );

    const iaFalouDeProduto =
      normalizedAnswer.includes(
        "produto",
      ) ||
      normalizedAnswer.includes(
        "carrinho",
      ) ||
      normalizedAnswer.includes(
        "compra",
      ) ||
      normalizedAnswer.includes(
        "pedido",
      );

    if (
      !confirmouCompra ||
      !iaFalouDeProduto
    ) {
      return {
        type:
          "NONE",
      };
    }

    const produto =
      this.extractProductFromContext(
        platformContext,
      );

    if (
      !produto?.id
    ) {
      return {
        type:
          "NONE",
      };
    }

    return {
      type:
        "ADD_TO_CART",

      payload: {
        id:
          produto.id,

        productId:
          produto.id,

        name:
          produto.name,

        price:
          produto.price,

        image:
          produto.image,

        quantity:
          1,

        storeId:
          input.chatbotOwnerId ||
          undefined,

        lojaId:
          input.chatbotOwnerId ||
          undefined,

        chatbotOwnerId:
          input.chatbotOwnerId ||
          undefined,

        storeName:
          input.storeName,

        chatbotTipo:
          input.chatbotTipo,

        origem:
          input.origem ||
          "LANDING_PAGE",
      },
    };
  }

  /**
   * ============================================================
   * EXTRAÇÃO DE PRODUTO
   * ============================================================
   */
  private extractProductFromContext(
    context: string,
  ): {
    id?: string;
    name?: string;
    price?: number;
    image?: string;
  } | null {
    const text =
      String(
        context || "",
      );

    const productBlocks =
      text
        .split(
          /\n(?=\d+\.\s*Produto ID:)/i,
        )
        .filter(
          (
            block,
          ) =>
            /Produto ID:/i.test(
              block,
            ),
        );

    const block =
      productBlocks.find(
        (
          item,
        ) =>
          this.normalize(
            item,
          ).includes(
            "terco",
          ),
      ) ||
      productBlocks[0];

    if (!block) {
      return null;
    }

    const idMatch =
      block.match(
        /Produto ID:\s*([a-z0-9-]+)/i,
      );

    const nameMatch =
      block.match(
        /Nome:\s*(.+)/i,
      );

    const priceMatch =
      block.match(
        /Preço:\s*R?\$?\s*([\d.,]+)/i,
      );

    const imageMatch =
      block.match(
        /(?:Imagem|image_url|foto_url):\s*(https?:\/\/[^\s]+)/i,
      );

    const price =
      priceMatch?.[1]
        ? Number(
          priceMatch[1]
            .replace(
              /\./g,
              "",
            )
            .replace(
              ",",
              ".",
            ),
        )
        : undefined;

    return {
      id:
        idMatch?.[1],

      name:
        nameMatch?.[1]
          ?.trim(),

      price,

      image:
        imageMatch?.[1],
    };
  }

  /**
   * ============================================================
   * MENSAGEM PARA BUSCA DE CONTEXTO
   * ============================================================
   */
  private buildKnowledgeSearchMessage(
    currentMessage: string,

    history: Array<{
      role:
      | "user"
      | "assistant";

      content:
      string;
    }>,
  ): string {
    // A busca nova usa a mensagem atual. Concatenar mensagens anteriores
    // mistura especialidades diferentes e contamina a consulta ao banco.
    // O histórico segue disponível ao modelo conversacional separadamente.
    void history;
    return currentMessage;
  }

  /**
   * Detecta pedido para visualizar opções reais da agenda.
   * "Quero agendar" sozinho não entra aqui: continua como intenção
   * de contratação e é tratado pelo CommercialConversionOrchestrator.
   */
  private normalizeCommercialDot(input: {
    message: string;
    decision: GranConectaAgentDecision | null;
    catalogItem: BusinessCatalogItem;
    activeFlowState?: string | null;
    preferredDate?: string | null;
    preferredTime?: string | null;
  }): {
    commercialAction: GranConectaAgentDecision["commercialAction"];
    shouldAdvanceCommercialFlow: boolean;
    reason: string | null;
  } {
    const originalAction = input.decision?.commercialAction || "NONE";
    const originalAdvance =
      input.decision?.shouldAdvanceCommercialFlow === true;

    if (originalAction !== "NONE" || originalAdvance) {
      return {
        commercialAction: originalAction,
        shouldAdvanceCommercialFlow: originalAdvance,
        reason: null,
      };
    }

    const hasSchedulingPreference =
      Boolean(input.preferredDate) || Boolean(input.preferredTime);

    const schedulingFlowStates = [
      "AGUARDANDO_DATA",
      "AGUARDANDO_HORARIO",
      "HORARIO_INDISPONIVEL",
    ];

    const activeFlowAllowsSchedulingPreference =
      Boolean(input.activeFlowState) &&
      schedulingFlowStates.includes(
        String(input.activeFlowState || "").toUpperCase(),
      );

    if (
      activeFlowAllowsSchedulingPreference &&
      hasSchedulingPreference
    ) {
      return {
        commercialAction: "PROVIDE_SCHEDULING_PREFERENCE",
        shouldAdvanceCommercialFlow: true,
        reason: "ACTIVE_FLOW_WITH_SCHEDULING_PREFERENCE",
      };
    }

    if (
      activeFlowAllowsSchedulingPreference &&
      input.decision?.intent === "SCHEDULE_INTENT" &&
      input.decision.catalogItemId &&
      String(input.decision.catalogItemId) === String(input.catalogItem.id) &&
      hasSchedulingPreference
    ) {
      return {
        commercialAction: "PROVIDE_SCHEDULING_PREFERENCE",
        shouldAdvanceCommercialFlow: true,
        reason: "SCHEDULE_INTENT_WITH_OFFICIAL_ITEM_AND_PREFERENCE",
      };
    }

    const normalized = this.normalize(input.message);
    const explicitTerms = [
      "quero fazer",
      "quero contratar",
      "quero agendar",
      "quero marcar",
      "vamos fazer",
      "vamos contratar",
      "pode marcar",
      "pode agendar",
      "quero essa avaliacao",
      "quero esta avaliacao",
      "quero esse servico",
      "quero este servico",
      "quero esse pacote",
      "quero este pacote",
      "quero prosseguir com",
      "quero seguir com",
    ];

    // Uma negativa não autoriza avançar o fluxo, mesmo que contenha
    // expressões como "quero contratar" ou "pode agendar".
    const isNegatedCommitment =
      /\b(nao|nunca|jamais)\s+(?:quero|vou|pode|vamos|pretendo)\b/.test(normalized) ||
      /\b(?:ainda nao|nao agora|nao quero|nao pode|sem contratar|sem agendar)\b/.test(normalized);

    const explicitCommitment =
      !isNegatedCommitment &&
      explicitTerms.some((term) =>
        normalized.includes(this.normalize(term)),
      );

    const officialItem =
      Boolean(input.decision?.catalogItemId) &&
      String(input.decision?.catalogItemId) === String(input.catalogItem.id);

    if (explicitCommitment && officialItem) {
      return {
        commercialAction: "SELECT_ITEM",
        shouldAdvanceCommercialFlow: true,
        reason: "EXPLICIT_COMMITMENT_WITH_OFFICIAL_ITEM",
      };
    }

    return {
      commercialAction: originalAction,
      shouldAdvanceCommercialFlow: originalAdvance,
      reason: null,
    };
  }

  private isAvailabilityBrowseIntent(
    value?: string | null,
  ): boolean {
    const normalized =
      this.normalize(value || "");

    if (!normalized) {
      return false;
    }

    const browseTerms = [
      "quais horarios",
      "quais os horarios",
      "horarios disponiveis",
      "horarios livres",
      "que horarios tem",
      "que horario tem",
      "tem horarios",
      "tem horario disponivel",
      "tem agenda",
      "ver a agenda",
      "ver agenda",
      "mostrar a agenda",
      "mostra a agenda",
      "me mostra a agenda",
      "me mostre a agenda",
      "consultar agenda",
      "consultar a agenda",
      "dias disponiveis",
      "dias livres",
      "que dias tem",
      "quais dias",
      "opcoes de horario",
      "opcoes de horarios",
      "escolher o dia",
      "escolher dia",
      "escolher o horario",
      "escolher horario",
      "agenda para escolher",
    ];

    return browseTerms.some((term) =>
      normalized.includes(this.normalize(term)),
    );
  }

  /**
   * ============================================================
   * NORMALIZAÇÃO
   * ============================================================
   */
  /**
   * Detecta a pergunta determinística de e-mail usada no fluxo
   * de identificação/cadastro da oportunidade.
   */
  private isAssistantAskingOpportunityEmail(
    value?: string | null,
  ): boolean {
    const normalized =
      this.normalize(
        value || "",
      );

    if (!normalized) {
      return false;
    }

    return (
      normalized.includes(
        "qual e-mail voce usa ou gostaria de usar no granconecta",
      ) ||
      normalized.includes(
        "qual email voce usa ou gostaria de usar no granconecta",
      ) ||
      normalized.includes(
        "preciso verificar seu cadastro no granconecta",
      ) ||
      // A IA pode variar a frase ao solicitar o contato.
      // Reconhecer somente a pergunta anterior do assistente,
      // nunca inferir autenticação a partir de um e-mail isolado.
      (normalized.includes("e-mail") || normalized.includes("email")) &&
      (normalized.includes("poderia me informar") ||
        normalized.includes("informe seu") ||
        normalized.includes("qual e") ||
        normalized.includes("me diga")) &&
      (normalized.includes("encaminhar") ||
        normalized.includes("cadastro") ||
        normalized.includes("solicitacao") ||
        normalized.includes("contato"))
    );
  }

  /**
   * Extrai e normaliza um e-mail digitado pelo cliente.
   * Não tenta autenticar nem criar conta aqui.
   */
  private extractOpportunityEmail(
    value?: string | null,
  ): string | null {
    const raw =
      String(
        value || "",
      ).trim();

    if (!raw) {
      return null;
    }

    const match =
      raw.match(
        /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
      );

    if (!match?.[0]) {
      return null;
    }

    return match[0]
      .trim()
      .toLowerCase();
  }

  private normalize(
    value: string,
  ): string {
    return String(
      value || "",
    )
      .normalize(
        "NFD",
      )
      .replace(
        /[\u0300-\u036f]/g,
        "",
      )
      .toLowerCase()
      .trim();
  }

  /**
   * ============================================================
   * PUBLIC MESSAGES
   * ============================================================
   */
  async getPublicMessages(
    conversationId:
      string,
  ) {
    return this.persistence
      .getPublicMessages(
        conversationId,
      );
  }

  /**
   * ============================================================
   * UNREAD COUNT
   * ============================================================
   */
  async getUnreadCount(
    input: {
      chatbotTipo?: string;
      chatbotOwnerId?: string;
    },
  ) {
    return this.persistence
      .getUnreadCount(
        input,
      );
  }
}