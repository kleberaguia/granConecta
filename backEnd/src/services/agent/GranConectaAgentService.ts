import { AppDataSource } from "../../config/data-source";

import GranConectaAgent, {
  GranConectaAgentAutonomyLevel,
  GranConectaAgentStatus,
  GranConectaAgentType,
} from "../../models/GranConectaAgentModel";

export type GranConectaAgentPermission =
  | "can_read_catalog"
  | "can_create_opportunity"
  | "can_advance_commercial_flow"
  | "can_request_human_handoff"
  | "can_propose_campaign"
  | "can_send_campaign"
  | "can_change_price"
  | "can_refund_payment";

export type GranConectaCommercialAgentConfig = {
  storeId: string;
  name?: string;
  responsibility?: string;
  objective?: string | null;
  autonomyLevel?: GranConectaAgentAutonomyLevel;
  provider?: string;
  model?: string | null;
  instructions?: string | null;
  metadata?: Record<string, any> | null;
};

export type GranConectaAgentPermissionSnapshot = {
  canReadCatalog: boolean;
  canCreateOpportunity: boolean;
  canAdvanceCommercialFlow: boolean;
  canRequestHumanHandoff: boolean;
  canProposeCampaign: boolean;
  canSendCampaign: boolean;
  canChangePrice: boolean;
  canRefundPayment: boolean;
};

export type GranConectaAgentRuntimeConfig = {
  id: string;
  storeId: string;
  name: string;
  type: GranConectaAgentType;
  responsibility: string;
  objective: string | null;
  status: GranConectaAgentStatus;
  autonomyLevel: GranConectaAgentAutonomyLevel;
  provider: string;
  model: string | null;
  instructions: string | null;
  metadata: Record<string, any> | null;
  permissions: GranConectaAgentPermissionSnapshot;
};

/**
 * GranConectaAgentService
 *
 * Camada responsável pela configuração e autorização
 * dos agentes do GranConecta.
 *
 * IMPORTANTE:
 *
 * O agente pode interpretar, decidir e solicitar ações.
 *
 * A autoridade transacional continua pertencendo aos
 * serviços de domínio, principalmente ao
 * CommercialConversionOrchestrator.
 */
export class GranConectaAgentService {
  private get repository() {
    return AppDataSource.getRepository(GranConectaAgent);
  }

  // ============================================================
  // NORMALIZAÇÃO
  // ============================================================

  private normalizeStoreId(storeId: string): string {
    return String(storeId || "").trim();
  }

  private ensureStoreId(storeId: string): string {
    const normalized = this.normalizeStoreId(storeId);

    if (!normalized) {
      throw new Error("GRANCONECTA_AGENT_STORE_ID_REQUIRED");
    }

    return normalized;
  }

  // ============================================================
  // BUSCA
  // ============================================================

  async getById(
    agentId: string
  ): Promise<GranConectaAgent | null> {
    const normalizedAgentId = String(agentId || "").trim();

    if (!normalizedAgentId) {
      return null;
    }

    return this.repository.findOne({
      where: {
        id: normalizedAgentId,
      },
    });
  }

  async getAgent(
    storeId: string,
    type: GranConectaAgentType
  ): Promise<GranConectaAgent | null> {
    const normalizedStoreId = this.ensureStoreId(storeId);

    return this.repository.findOne({
      where: {
        store_id: normalizedStoreId,
        type,
      },
    });
  }

  async getCommercialAgent(
    storeId: string
  ): Promise<GranConectaAgent | null> {
    return this.getAgent(
      storeId,
      GranConectaAgentType.COMMERCIAL
    );
  }

  async getActiveCommercialAgent(
    storeId: string
  ): Promise<GranConectaAgent | null> {
    const normalizedStoreId = this.ensureStoreId(storeId);

    return this.repository.findOne({
      where: {
        store_id: normalizedStoreId,
        type: GranConectaAgentType.COMMERCIAL,
        status: GranConectaAgentStatus.ACTIVE,
      },
    });
  }

  // ============================================================
  // CRIAÇÃO
  // ============================================================

  async getOrCreateCommercialAgent(
    config: GranConectaCommercialAgentConfig
  ): Promise<GranConectaAgent> {
    const storeId = this.ensureStoreId(config.storeId);

    const existing =
      await this.getCommercialAgent(storeId);

    if (existing) {
      return existing;
    }

    const agent = this.repository.create({
      store_id: storeId,

      name:
        config.name?.trim() ||
        "Agente Comercial GranConecta",

      type: GranConectaAgentType.COMMERCIAL,

      responsibility:
        config.responsibility?.trim() ||
        "Atender clientes, identificar necessidades e conduzir oportunidades comerciais utilizando os serviços autorizados do GranConecta.",

      objective:
        config.objective?.trim() ||
        "Transformar conversas qualificadas em oportunidades e conversões comerciais de forma segura, contextual e rastreável.",

      status: GranConectaAgentStatus.ACTIVE,

      autonomy_level:
        config.autonomyLevel ??
        GranConectaAgentAutonomyLevel.ASSISTED,

      // --------------------------------------------------------
      // PERMISSÕES INICIAIS
      // --------------------------------------------------------

      can_read_catalog: true,

      can_create_opportunity: true,

      can_advance_commercial_flow: true,

      can_request_human_handoff: true,

      can_propose_campaign: true,

      // Ações sensíveis permanecem bloqueadas.
      can_send_campaign: false,

      can_change_price: false,

      can_refund_payment: false,

      // --------------------------------------------------------
      // PROVIDER / MODELO
      // --------------------------------------------------------

      provider:
        config.provider?.trim() ||
        "OPENROUTER",

      model:
        config.model?.trim() ||
        null,

      instructions:
        config.instructions?.trim() ||
        null,

      metadata:
        config.metadata ?? null,
    });

    try {
      return await this.repository.save(agent);
    } catch (error: any) {
      /**
       * Proteção contra duas requisições tentando criar
       * simultaneamente o mesmo agente.
       *
       * A unique key store_id + type é a proteção final
       * no banco.
       */
      const duplicate =
        error?.code === "ER_DUP_ENTRY" ||
        error?.errno === 1062;

      if (duplicate) {
        const concurrentAgent =
          await this.getCommercialAgent(storeId);

        if (concurrentAgent) {
          return concurrentAgent;
        }
      }

      throw error;
    }
  }

  // ============================================================
  // STATUS
  // ============================================================

  isActive(
    agent: GranConectaAgent | null
  ): boolean {
    return (
      !!agent &&
      agent.status === GranConectaAgentStatus.ACTIVE
    );
  }

  async activateAgent(
    agentId: string
  ): Promise<GranConectaAgent> {
    const agent = await this.requireAgent(agentId);

    agent.status = GranConectaAgentStatus.ACTIVE;

    return this.repository.save(agent);
  }

  async pauseAgent(
    agentId: string
  ): Promise<GranConectaAgent> {
    const agent = await this.requireAgent(agentId);

    agent.status = GranConectaAgentStatus.PAUSED;

    return this.repository.save(agent);
  }

  async disableAgent(
    agentId: string
  ): Promise<GranConectaAgent> {
    const agent = await this.requireAgent(agentId);

    agent.status = GranConectaAgentStatus.DISABLED;

    return this.repository.save(agent);
  }

  // ============================================================
  // PERMISSÕES
  // ============================================================

  hasPermission(
    agent: GranConectaAgent | null,
    permission: GranConectaAgentPermission
  ): boolean {
    if (!agent) {
      return false;
    }

    if (
      agent.status !==
      GranConectaAgentStatus.ACTIVE
    ) {
      return false;
    }

    return agent[permission] === true;
  }

  assertPermission(
    agent: GranConectaAgent | null,
    permission: GranConectaAgentPermission
  ): void {
    if (!agent) {
      throw new Error(
        "GRANCONECTA_AGENT_NOT_FOUND"
      );
    }

    if (
      agent.status !==
      GranConectaAgentStatus.ACTIVE
    ) {
      throw new Error(
        "GRANCONECTA_AGENT_NOT_ACTIVE"
      );
    }

    if (
      !this.hasPermission(agent, permission)
    ) {
      throw new Error(
        `GRANCONECTA_AGENT_PERMISSION_DENIED:${permission}`
      );
    }
  }

  // ============================================================
  // RUNTIME
  // ============================================================

  /**
   * Converte a representação da Entity/banco
   * para uma configuração amigável para a aplicação.
   *
   * Entity:
   * store_id
   * autonomy_level
   * can_read_catalog
   *
   * Runtime:
   * storeId
   * autonomyLevel
   * canReadCatalog
   */
  toRuntimeConfig(
    agent: GranConectaAgent
  ): GranConectaAgentRuntimeConfig {
    return {
      id: agent.id,

      storeId: agent.store_id,

      name: agent.name,

      type: agent.type,

      responsibility: agent.responsibility,

      objective: agent.objective,

      status: agent.status,

      autonomyLevel: agent.autonomy_level,

      provider: agent.provider,

      model: agent.model,

      instructions: agent.instructions,

      metadata: agent.metadata,

      permissions: {
        canReadCatalog:
          agent.can_read_catalog,

        canCreateOpportunity:
          agent.can_create_opportunity,

        canAdvanceCommercialFlow:
          agent.can_advance_commercial_flow,

        canRequestHumanHandoff:
          agent.can_request_human_handoff,

        canProposeCampaign:
          agent.can_propose_campaign,

        canSendCampaign:
          agent.can_send_campaign,

        canChangePrice:
          agent.can_change_price,

        canRefundPayment:
          agent.can_refund_payment,
      },
    };
  }

  async getCommercialRuntimeConfig(
    storeId: string
  ): Promise<GranConectaAgentRuntimeConfig | null> {
    const agent =
      await this.getActiveCommercialAgent(
        storeId
      );

    if (!agent) {
      return null;
    }

    return this.toRuntimeConfig(agent);
  }

  // ============================================================
  // UTILITÁRIOS INTERNOS
  // ============================================================

  private async requireAgent(
    agentId: string
  ): Promise<GranConectaAgent> {
    const agent =
      await this.getById(agentId);

    if (!agent) {
      throw new Error(
        "GRANCONECTA_AGENT_NOT_FOUND"
      );
    }

    return agent;
  }
}

export default new GranConectaAgentService();