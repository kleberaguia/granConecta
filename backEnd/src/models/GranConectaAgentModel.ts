import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

/**
 * ============================================================
 * TIPOS DO AGENTE
 * ============================================================
 */

export enum GranConectaAgentType {
  COMMERCIAL = "COMMERCIAL",
}

export enum GranConectaAgentStatus {
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  DISABLED = "DISABLED",
}

export enum GranConectaAgentAutonomyLevel {
  /**
   * Apenas observa e recomenda.
   * Não executa ações comerciais.
   */
  ADVISORY = "ADVISORY",

  /**
   * Pode executar ações comerciais previamente autorizadas,
   * respeitando todas as regras do backend.
   *
   * Este será o padrão do lançamento.
   */
  ASSISTED = "ASSISTED",

  /**
   * Reservado para evolução futura.
   * Mesmo neste nível, ações críticas continuarão sujeitas
   * às permissões específicas.
   */
  AUTONOMOUS = "AUTONOMOUS",
}

/**
 * ============================================================
 * GRAN CONECTA AGENT
 * ============================================================
 *
 * Representa o agente persistente de IA associado a um negócio.
 *
 * IMPORTANTE:
 *
 * O agente NÃO substitui:
 *
 * - CommercialConversionOrchestrator
 * - CommercialFlowStateService
 * - MarketingOpportunityService
 * - BusinessCatalogService
 * - serviços de pagamento
 * - serviços de agenda
 *
 * O agente interpreta contexto, objetivo e intenção e decide
 * qual ferramenta autorizada deve ser utilizada.
 *
 * A execução transacional continua sendo responsabilidade
 * dos serviços oficiais do backend.
 */
@Entity("granconecta_agents")
@Index("idx_granconecta_agent_store", ["store_id"])
@Index("idx_granconecta_agent_status", ["status"])
@Index("idx_granconecta_agent_type", ["type"])
@Index(
  "uk_granconecta_agent_store_type",
  ["store_id", "type"],
  {
    unique: true,
  },
)
export class GranConectaAgent {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /**
   * Store à qual o agente pertence.
   *
   * Usamos Store.id como identidade principal do negócio.
   */
  @Column({
    type: "varchar",
    length: 36,
    nullable: false,
  })
  store_id!: string;

  /**
   * Nome amigável apresentado internamente.
   *
   * Exemplo:
   * Agente Comercial GranConecta
   */
  @Column({
    type: "varchar",
    length: 120,
    nullable: false,
    default: "Agente Comercial GranConecta",
  })
  name!: string;

  @Column({
    type: "enum",
    enum: GranConectaAgentType,
    default: GranConectaAgentType.COMMERCIAL,
  })
  type!: GranConectaAgentType;

  /**
   * Responsabilidade principal.
   *
   * Exemplo:
   * Converter oportunidades em vendas e agendamentos.
   */
  @Column({
    type: "varchar",
    length: 255,
    nullable: false,
  })
  responsibility!: string;

  /**
   * Objetivo operacional do agente.
   *
   * Pode futuramente ser personalizado por negócio.
   */
  @Column({
    type: "text",
    nullable: true,
  })
  objective!: string | null;

  @Column({
    type: "enum",
    enum: GranConectaAgentStatus,
    default: GranConectaAgentStatus.ACTIVE,
  })
  status!: GranConectaAgentStatus;

  @Column({
    type: "enum",
    enum: GranConectaAgentAutonomyLevel,
    default: GranConectaAgentAutonomyLevel.ASSISTED,
  })
  autonomy_level!: GranConectaAgentAutonomyLevel;

  /**
   * ==========================================================
   * PERMISSÕES
   * ==========================================================
   *
   * Essas permissões são verificadas pelo backend.
   *
   * Nunca devemos confiar apenas no prompt da IA para impedir
   * uma ação sensível.
   */

  @Column({
    type: "boolean",
    default: true,
  })
  can_read_catalog!: boolean;

  @Column({
    type: "boolean",
    default: true,
  })
  can_create_opportunity!: boolean;

  @Column({
    type: "boolean",
    default: true,
  })
  can_advance_commercial_flow!: boolean;

  @Column({
    type: "boolean",
    default: true,
  })
  can_request_human_handoff!: boolean;

  /**
   * Pode sugerir uma campanha ao proprietário,
   * mas não necessariamente dispará-la.
   */
  @Column({
    type: "boolean",
    default: true,
  })
  can_propose_campaign!: boolean;

  /**
   * V1:
   * false.
   *
   * Campanhas precisam de aprovação humana.
   */
  @Column({
    type: "boolean",
    default: false,
  })
  can_send_campaign!: boolean;

  /**
   * V1:
   * false.
   *
   * Preço vem do BusinessCatalog.
   */
  @Column({
    type: "boolean",
    default: false,
  })
  can_change_price!: boolean;

  /**
   * V1:
   * false.
   *
   * Agente nunca executará estorno automaticamente.
   */
  @Column({
    type: "boolean",
    default: false,
  })
  can_refund_payment!: boolean;

  /**
   * ==========================================================
   * PROVIDER / MODELO
   * ==========================================================
   *
   * Não amarramos o GranConecta a um único fornecedor.
   *
   * Exemplos futuros:
   *
   * OPENROUTER
   * OPENAI
   * GEMINI
   */
  @Column({
    type: "varchar",
    length: 50,
    nullable: false,
    default: "OPENROUTER",
  })
  provider!: string;

  /**
   * Se null, utiliza o modelo padrão configurado no backend.
   */
  @Column({
    type: "varchar",
    length: 120,
    nullable: true,
  })
  model!: string | null;

  /**
   * Instruções específicas do agente.
   *
   * Não devem conter regras transacionais críticas.
   * Essas regras pertencem ao backend.
   */
  @Column({
    type: "text",
    nullable: true,
  })
  instructions!: string | null;

  /**
   * Dados flexíveis para evolução sem exigir coluna nova
   * para cada pequena configuração.
   *
   * Exemplos:
   *
   * {
   *   "firstSaleGoal": true,
   *   "tone": "consultivo",
   *   "priority": "conversion"
   * }
   */
  @Column({
    type: "json",
    nullable: true,
  })
  metadata!: Record<string, any> | null;

  @CreateDateColumn({
    type: "datetime",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: "datetime",
  })
  updatedAt!: Date;
}

export default GranConectaAgent;