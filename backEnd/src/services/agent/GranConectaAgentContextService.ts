import { AppDataSource } from "../../config/data-source";

import { Store } from "../../models/StoreModels";
import { PerfilPrestador } from "../../models/PerfilPrestadorModel";

import {
    BusinessCatalogItem,
} from "../../models/BusinessCatalogItemModel";

import {
    MarketingOpportunity,
} from "../../models/MarketingOpportunityModel";

import {
    CommercialFlow,
} from "../../models/CommercialFlowModel";

import BusinessCatalogService from "../BusinessCatalogService";

import MarketingOpportunityService from "../MarketingOpportunityService";

import {
    CommercialFlowStateService,
} from "../commercial/CommercialFlowStateService";

import GranConectaAgentService, {
    GranConectaAgentRuntimeConfig,
} from "./GranConectaAgentService";

// ============================================================
// INPUT
// ============================================================

export type GranConectaAgentContextInput = {
    storeId: string;

    conversationId?: string | null;

    opportunityId?: string | null;

    customerUserId?: string | null;
};

// ============================================================
// STORE
// ============================================================

export type GranConectaAgentStoreContext = {
    id: string;

    name: string | null;

    slug: string | null;

    type: string | null;

    ativa: boolean;

    usuarioId: string | null;
    description: string | null;
    professional: {
        name: string | null;
        biography: string | null;
    } | null;
};

// ============================================================
// CATALOG
// ============================================================

export type GranConectaAgentCatalogItemContext = {
    id: string;

    type: string;

    name: string;

    description: string | null;

    categoryId: number | null;

    price: number;

    promotionalPrice: number | null;

    currentPrice: number;

    promotionActive: boolean;

    durationMinutes: number | null;

    totalSessions: number;

    modality: string | null;

    schedulingPolicy: string | null;

    maxSessionsPerWeek: number | null;

    allowStandalonePurchase: boolean;

    highlighted: boolean;

    metadata: Record<string, unknown> | null;
};

// ============================================================
// OPPORTUNITY
// ============================================================

export type GranConectaAgentOpportunityContext = {
    id: string;

    status: string;

    campaignId: number | null;

    playbookId: number | null;

    categoryId: number | null;

    leadId: string | null;

    sourceConversationId: string | null;

    destinationConversationId: string | null;

    userId: string | null;

    userType: string | null;

    condominiumId: string | null;

    originChannel: string | null;

    selectedStoreId: string | null;

    selectedStoreName: string | null;

    selectedStoreSlug: string | null;

    selectedChatbotType: string | null;

    score: number;

    qualificationSummary: string | null;
};

// ============================================================
// COMMERCIAL FLOW
// ============================================================

export type GranConectaAgentCommercialFlowContext = {
    id: string;

    conversationId: string;

    opportunityId: string | null;

    storeId: string;

    customerUserId: string | null;

    catalogItemId: string | null;

    catalogItemType: string | null;

    state: string;

    amount: number | null;

    quantity: number;

    totalSessions: number | null;

    preferredDate: string | null;

    preferredTime: string | null;

    paymentId: string | null;

    agendaId: string | null;

    orderId: string | null;

    activePackageId: string | null;

    active: boolean;

    lastError: string | null;

    metadata: Record<string, unknown> | null;
};

// ============================================================
// RESULT
// ============================================================

export type GranConectaAgentContext = {
    generatedAt: string;

    agent: GranConectaAgentRuntimeConfig;

    store: GranConectaAgentStoreContext;

    catalog: GranConectaAgentCatalogItemContext[];

    opportunity:
    | GranConectaAgentOpportunityContext
    | null;

    commercialFlow:
    | GranConectaAgentCommercialFlowContext
    | null;

    customer: {
        userId: string | null;

        identified: boolean;
    };

    conversation: {
        id: string | null;
    };
};

/**
 * ============================================================
 * GRANCONECTA AGENT CONTEXT SERVICE
 * ============================================================
 *
 * Responsabilidade:
 *
 * montar uma fotografia confiável do estado atual do negócio
 * para o Agente GranConecta.
 *
 * Este serviço SOMENTE LÊ.
 *
 * NÃO:
 *
 * - cria oportunidade;
 * - cria commercial flow;
 * - altera estado;
 * - seleciona item;
 * - cria pagamento;
 * - agenda;
 * - altera preço;
 * - chama IA;
 * - executa handoff.
 *
 * O resultado deste serviço poderá ser entregue posteriormente
 * ao GranConectaAgentDecisionService.
 */
export class GranConectaAgentContextService {


    private readonly businessCatalogService =  new BusinessCatalogService();

    private readonly marketingOpportunityService =  new MarketingOpportunityService();

    private readonly commercialFlowStateService =      new CommercialFlowStateService();



    // ============================================================
    // REPOSITORY
    // ============================================================

    private get storeRepository() {
        return AppDataSource.getRepository(Store);
    }

    // ============================================================
    // NORMALIZAÇÃO
    // ============================================================

    private normalizeOptionalId(
        value?: string | null
    ): string | null {
        const normalized =
            String(value || "").trim();

        return normalized || null;
    }

    private requireStoreId(
        storeId: string
    ): string {
        const normalized =
            String(storeId || "").trim();

        if (!normalized) {
            throw new Error(
                "GRANCONECTA_AGENT_CONTEXT_STORE_ID_REQUIRED"
            );
        }

        return normalized;
    }

    // ============================================================
    // BUILD
    // ============================================================

    async build(
        input: GranConectaAgentContextInput
    ): Promise<GranConectaAgentContext> {
        const storeId =
            this.requireStoreId(
                input.storeId
            );

        const conversationId =
            this.normalizeOptionalId(
                input.conversationId
            );

        const requestedOpportunityId =
            this.normalizeOptionalId(
                input.opportunityId
            );

        const requestedCustomerUserId =
            this.normalizeOptionalId(
                input.customerUserId
            );

        // ==========================================================
        // 1. AGENTE
        // ==========================================================

        const agent =
            await GranConectaAgentService
                .getCommercialRuntimeConfig(
                    storeId
                );

        if (!agent) {
            throw new Error(
                "GRANCONECTA_AGENT_CONTEXT_ACTIVE_AGENT_NOT_FOUND"
            );
        }

        // ==========================================================
        // 2. STORE
        // ==========================================================

        const store =
            await this.storeRepository.findOne({
                where: {
                    id: storeId,
                },
            });

        if (!store) {
            throw new Error(
                "GRANCONECTA_AGENT_CONTEXT_STORE_NOT_FOUND"
            );
        }

        // Perfil profissional vinculado à própria Store; nunca consultar outro negócio.
        const professionalProfiles = await AppDataSource
            .getRepository(PerfilPrestador)
            .find({ where: { usuarioId: store.usuarioId } });
        const matchingProfiles = professionalProfiles.filter(
            (profile) => String(profile.tipo || "").toLowerCase() ===
                String(store.tipo || "").toLowerCase()
        );
        // Se houver mais de um perfil sem correspondência clara, não atribuir
        // credenciais de um nicho a outro.
        const professional = matchingProfiles.length === 1
            ? matchingProfiles[0]
            : professionalProfiles.length === 1
                ? professionalProfiles[0]
                : null;

        // ==========================================================
        // 3. CATÁLOGO
        // ==========================================================

        let catalogItems:
            BusinessCatalogItem[] = [];

        if (
            agent.permissions.canReadCatalog
        ) {
            catalogItems =
                await this.businessCatalogService.listar({
                    storeId,

                    somenteAtivos: true,

                    somenteVigentes: true,
                });
        }

        // ==========================================================
        // 4. OPORTUNIDADE
        // ==========================================================

        let opportunity:
            | MarketingOpportunity
            | null = null;

        /**
         * Prioridade:
         *
         * 1. opportunityId explícito;
         * 2. oportunidade aberta da conversa.
         *
         * IMPORTANTE:
         *
         * aqui NÃO usamos getOrCreate().
         *
         * ContextService é somente leitura.
         */
        if (requestedOpportunityId) {
            opportunity =
                await this.marketingOpportunityService
                    .findById(
                        requestedOpportunityId
                    );
        } else if (conversationId) {
            opportunity =
                await this.marketingOpportunityService
                    .findOpenBySourceConversation(
                        conversationId
                    );
        }

        // ==========================================================
        // 5. SEGURANÇA DA OPORTUNIDADE
        // ==========================================================

        if (
            opportunity?.selected_store_id &&
            opportunity.selected_store_id !==
            storeId
        ) {
            throw new Error(
                "GRANCONECTA_AGENT_CONTEXT_OPPORTUNITY_STORE_DIVERGENT"
            );
        }

        // ==========================================================
        // 6. COMMERCIAL FLOW
        // ==========================================================

        let commercialFlow:
            | CommercialFlow
            | null = null;

        /**
         * Primeiro procuramos um fluxo ativo
         * diretamente pela conversa.
         */
        if (conversationId) {
            commercialFlow =
                await this
                    .commercialFlowStateService
                    .findActiveByConversation(
                        conversationId
                    );
        }

        /**
         * Se a conversa ainda não possuir
         * fluxo ativo, procuramos através
         * da oportunidade encontrada.
         *
         * Isso é importante para cenários
         * de login, redirecionamento ou
         * continuação em outra conversa.
         */
        if (
            !commercialFlow &&
            opportunity?.id
        ) {
            commercialFlow =
                await this
                    .commercialFlowStateService
                    .findActiveByOpportunity(
                        opportunity.id
                    );
        }

        /**
         * Pode existir um opportunityId
         * explícito sem que a oportunidade
         * tenha sido localizada acima.
         *
         * Ainda assim podemos verificar se
         * existe um fluxo ativo ligado a ela.
         */
        if (
            !commercialFlow &&
            requestedOpportunityId
        ) {
            commercialFlow =
                await this
                    .commercialFlowStateService
                    .findActiveByOpportunity(
                        requestedOpportunityId
                    );
        }

        // ==========================================================
        // 7. SEGURANÇA DO COMMERCIAL FLOW
        // ==========================================================

        /**
         * Um agente de uma Store jamais
         * poderá receber contexto comercial
         * pertencente a outra Store.
         */
        if (
            commercialFlow?.storeId &&
            commercialFlow.storeId !==
            storeId
        ) {
            throw new Error(
                "GRANCONECTA_AGENT_CONTEXT_FLOW_STORE_DIVERGENT"
            );
        }

        // ==========================================================
        // 8. CUSTOMER
        // ==========================================================

        /**
         * Ordem de confiança:
         *
         * 1. customerUserId recebido;
         * 2. customerUserId do commercial flow;
         * 3. user_id da oportunidade.
         */
        const customerUserId =
            requestedCustomerUserId ||
            commercialFlow?.customerUserId ||
            opportunity?.user_id ||
            null;

        // ==========================================================
        // 9. RESULT
        // ==========================================================

        return {
            generatedAt:
                new Date().toISOString(),

            agent,

            store:
                this.mapStore(
                    store,
                    professional ?? null
                ),

            catalog:
                catalogItems.map(
                    (item) =>
                        this.mapCatalogItem(
                            item
                        )
                ),

            opportunity:
                opportunity
                    ? this.mapOpportunity(
                        opportunity
                    )
                    : null,

            commercialFlow:
                commercialFlow
                    ? this.mapCommercialFlow(
                        commercialFlow
                    )
                    : null,

            customer: {
                userId:
                    customerUserId,

                identified:
                    Boolean(
                        customerUserId
                    ),
            },

            conversation: {
                id:
                    conversationId,
            },
        };
    }

    // ============================================================
    // STORE MAPPER
    // ============================================================

    private mapStore(
        store: Store,
        professional: PerfilPrestador | null
    ): GranConectaAgentStoreContext {
        return {
            id:
                store.id,

            name:
                store.name || null,

            slug:
                store.slug || null,

            type:
                store.tipo || null,
            ativa:
                Boolean(
                    store.ativa
                ),

            usuarioId:
                store.usuarioId || null,
            description: store.descricao_loja?.trim() || null,
            professional: professional ? {
                name: professional.nome_profissional?.trim() || null,
                biography: professional.descricao_bio?.trim() || null,
            } : null,
        };
    }

    // ============================================================
    // CATALOG MAPPER
    // ============================================================

    private mapCatalogItem(
        item: BusinessCatalogItem
    ): GranConectaAgentCatalogItemContext {
        /**
         * IMPORTANTE:
         *
         * O agente não calcula preço.
         *
         * Sempre utilizamos a regra oficial
         * do BusinessCatalogService.
         */
        const price =
            this.businessCatalogService
                .getPrecoVigente(
                    item
                );

        return {
            id:
                item.id,

            type:
                String(
                    item.tipo
                ),

            name:
                item.nome,

            description:
                item.descricao || null,

            categoryId:
                item.categoriaId ??
                null,

            price:
                Number(
                    price.precoBase || 0
                ),

            promotionalPrice:
                price.precoPromocional ===
                    null ||
                    price.precoPromocional ===
                    undefined
                    ? null
                    : Number(
                        price.precoPromocional
                    ),

            currentPrice:
                Number(
                    price.precoVigente || 0
                ),

            promotionActive:
                Boolean(
                    price.promocaoAtiva
                ),

            durationMinutes:
                item.duracaoMinutos ??
                null,

            totalSessions:
                Number(
                    item.totalSessoes || 1
                ),

            modality:
                item.modalidade
                    ? String(
                        item.modalidade
                    )
                    : null,

            schedulingPolicy:
                item.schedulingPolicy
                    ? String(
                        item.schedulingPolicy
                    )
                    : null,

            maxSessionsPerWeek:
                item.maxSessionsPerWeek ??
                null,

            allowStandalonePurchase:
                Boolean(
                    item.allowStandalonePurchase
                ),

            highlighted:
                Boolean(
                    item.destaque
                ),

            metadata:
                (
                    item.metadata as
                    | Record<
                        string,
                        unknown
                    >
                    | null
                ) ?? null,
        };
    }

    // ============================================================
    // OPPORTUNITY MAPPER
    // ============================================================

    private mapOpportunity(
        opportunity: MarketingOpportunity
    ): GranConectaAgentOpportunityContext {
        return {
            id:
                opportunity.id,

            status:
                String(
                    opportunity.status
                ),

            campaignId:
                opportunity.campanha_id ??
                null,

            playbookId:
                opportunity.playbook_id ??
                null,

            categoryId:
                opportunity.categoria_id ??
                null,

            leadId:
                opportunity.lead_id ||
                null,

            sourceConversationId:
                opportunity
                    .source_conversation_id ||
                null,

            destinationConversationId:
                opportunity
                    .destination_conversation_id ||
                null,

            userId:
                opportunity.user_id ||
                null,

            userType:
                opportunity.user_type ||
                null,

            condominiumId:
                opportunity.condominio_id ||
                null,

            originChannel:
                opportunity.canal_origem ||
                null,

            selectedStoreId:
                opportunity.selected_store_id ||
                null,

            selectedStoreName:
                opportunity.selected_store_name ||
                null,

            selectedStoreSlug:
                opportunity.selected_store_slug ||
                null,

            selectedChatbotType:
                opportunity
                    .selected_chatbot_tipo ||
                null,

            score:
                Number(
                    opportunity.score || 0
                ),

            qualificationSummary:
                opportunity
                    .resumo_qualificacao ||
                null,
        };
    }

    // ============================================================
    // COMMERCIAL FLOW MAPPER
    // ============================================================

    private mapCommercialFlow(
        flow: CommercialFlow
    ): GranConectaAgentCommercialFlowContext {
        return {
            id:
                flow.id,

            conversationId:
                flow.conversationId,

            opportunityId:
                flow.opportunityId ||
                null,

            storeId:
                flow.storeId,

            customerUserId:
                flow.customerUserId ||
                null,

            catalogItemId:
                flow.catalogItemId ||
                null,

            catalogItemType:
                flow.catalogItemType
                    ? String(
                        flow.catalogItemType
                    )
                    : null,

            state:
                String(
                    flow.state
                ),

            amount:
                flow.amount === null ||
                    flow.amount === undefined
                    ? null
                    : Number(
                        flow.amount
                    ),

            quantity:
                Number(
                    flow.quantity || 1
                ),

            totalSessions:
                flow.totalSessions ??
                null,

            preferredDate:
                flow.preferredDate ||
                null,

            preferredTime:
                flow.preferredTime ||
                null,

            paymentId:
                flow.paymentId ||
                null,

            agendaId:
                flow.agendaId ||
                null,

            orderId:
                flow.orderId ||
                null,

            activePackageId:
                flow.activePackageId ||
                null,

            active:
                Boolean(
                    flow.ativo
                ),

            lastError:
                flow.lastError ||
                null,

            metadata:
                (
                    flow.metadata as
                    | Record<
                        string,
                        unknown
                    >
                    | null
                ) ?? null,
        };
    }
}

export default new GranConectaAgentContextService();