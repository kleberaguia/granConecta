import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

/**
 * Tipo de conversão que está acontecendo.
 *
 * Não depende do tipo do chatbot.
 * Depende do que o cliente está efetivamente comprando/contratando.
 */
export enum CommercialFlowType {
  SERVICO = "SERVICO",
  PACOTE = "PACOTE",
  PRODUTO = "PRODUTO",
  CARDAPIO = "CARDAPIO",
  PROMOCAO = "PROMOCAO",
}

/**
 * Objeto transacional criado pelo fluxo.
 *
 * SERVICO_OFERTA:
 *   ServicoSolicitacao -> ServicoCandidatura -> ServicoOferta
 *
 * ORDER:
 *   venda de produto/cardápio.
 *
 * PACKAGE:
 *   contratação/recontratação de pacote.
 */
export enum CommercialFlowSourceType {
  SERVICE_OFFER = "SERVICE_OFFER",
  ORDER = "ORDER",
  PACKAGE = "PACKAGE",
  NONE = "NONE",
}

/**
 * Máquina de estados oficial da conversão.
 *
 * IMPORTANTE:
 * A IA não deve inventar transições.
 * Somente o CommercialConversionOrchestrator poderá alterar estes estados.
 */
export enum CommercialFlowState {
  INICIADO = "INICIADO",

  // Catálogo
  AGUARDANDO_ITEM = "AGUARDANDO_ITEM",
  ITEM_SELECIONADO = "ITEM_SELECIONADO",

  // Agenda / disponibilidade
  AGUARDANDO_DATA = "AGUARDANDO_DATA",
  AGUARDANDO_HORARIO = "AGUARDANDO_HORARIO",
  VERIFICANDO_DISPONIBILIDADE = "VERIFICANDO_DISPONIBILIDADE",
  HORARIO_DISPONIVEL = "HORARIO_DISPONIVEL",
  HORARIO_INDISPONIVEL = "HORARIO_INDISPONIVEL",

  // Identificação
  IDENTIFICANDO_CLIENTE = "IDENTIFICANDO_CLIENTE",
  AGUARDANDO_CADASTRO_RAPIDO = "AGUARDANDO_CADASTRO_RAPIDO",
  AGUARDANDO_LOGIN = "AGUARDANDO_LOGIN",
  CLIENTE_IDENTIFICADO = "CLIENTE_IDENTIFICADO",

  // Pacotes existentes
  VERIFICANDO_PACOTE = "VERIFICANDO_PACOTE",
  PACOTE_ATIVO = "PACOTE_ATIVO",
  AGUARDANDO_DECISAO_PACOTE = "AGUARDANDO_DECISAO_PACOTE",
  USANDO_PACOTE_EXISTENTE = "USANDO_PACOTE_EXISTENTE",
  NOVO_PACOTE_SOLICITADO = "NOVO_PACOTE_SOLICITADO",

  // Motor de serviço
  SOLICITACAO_CRIADA = "SOLICITACAO_CRIADA",
  CANDIDATURA_CRIADA = "CANDIDATURA_CRIADA",
  OFERTA_CRIADA = "OFERTA_CRIADA",

  // Produtos / loja / cardápio
  CARRINHO_ABERTO = "CARRINHO_ABERTO",
  PEDIDO_CRIADO = "PEDIDO_CRIADO",

  // Pagamento
  AGUARDANDO_CONFIRMACAO_COMPRA =
    "AGUARDANDO_CONFIRMACAO_COMPRA",

  PAGAMENTO_CRIADO = "PAGAMENTO_CRIADO",
  AGUARDANDO_PAGAMENTO = "AGUARDANDO_PAGAMENTO",
  PAGAMENTO_APROVADO = "PAGAMENTO_APROVADO",
  PAGAMENTO_FALHOU = "PAGAMENTO_FALHOU",

  // Execução
  AGUARDANDO_AGENDAMENTO = "AGUARDANDO_AGENDAMENTO",
  AGENDADO = "AGENDADO",

  // Loja
  PEDIDO_PAGO = "PEDIDO_PAGO",
  EM_PREPARACAO = "EM_PREPARACAO",
  PRONTO = "PRONTO",
  ENTREGUE = "ENTREGUE",

  // Saídas
  RETORNANDO_IA = "RETORNANDO_IA",
  AGUARDANDO_HUMANO = "AGUARDANDO_HUMANO",

  FINALIZADO = "FINALIZADO",
  CANCELADO = "CANCELADO",
  ERRO = "ERRO",
}

@Entity("commercial_flows")
@Index(
  "idx_commercial_flow_conversation",
  ["conversationId"],
)
@Index(
  "idx_commercial_flow_opportunity",
  ["opportunityId"],
)
@Index(
  "idx_commercial_flow_store",
  ["storeId"],
)
@Index(
  "idx_commercial_flow_customer",
  ["customerUserId"],
)
@Index(
  "idx_commercial_flow_state",
  ["state"],
)
@Index(
  "idx_commercial_flow_catalog_item",
  ["catalogItemId"],
)
@Index(
  "idx_commercial_flow_active",
  ["conversationId", "ativo"],
)
export class CommercialFlow {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /**
   * Conversa que originou a conversão.
   */
  @Column({
    name: "conversation_id",
    type: "varchar",
    length: 36,
  })
  conversationId!: string;

  /**
   * MarketingOpportunity continua sendo o elo
   * entre campanha/chat/negócio.
   *
   * Pode ser null no instante inicial,
   * mas deverá ser preenchida quando existir.
   */
  @Column({
    name: "opportunity_id",
    type: "varchar",
    length: 36,
    nullable: true,
  })
  opportunityId!: string | null;

  /**
   * Store onde a conversão acontece.
   */
  @Column({
    name: "store_id",
    type: "varchar",
    length: 36,
  })
  storeId!: string;

  /**
   * Usuário GranConecta do cliente/paciente/comprador.
   *
   * Continua null enquanto visitante não estiver
   * identificado/cadastrado/logado.
   */
  @Column({
    name: "customer_user_id",
    type: "varchar",
    length: 36,
    nullable: true,
  })
  customerUserId!: string | null;

  /**
   * Item oficial do BusinessCatalog.
   */
  @Column({
    name: "catalog_item_id",
    type: "varchar",
    length: 36,
    nullable: true,
  })
  catalogItemId!: string | null;

  @Column({
    name: "catalog_item_type",
    type: "enum",
    enum: CommercialFlowType,
    nullable: true,
  })
  catalogItemType!: CommercialFlowType | null;

  /**
   * Snapshot de preço.
   *
   * O preço do catálogo poderá mudar depois.
   * A conversão precisa preservar o valor acordado.
   */
  @Column({
    name: "amount",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  amount!: number | null;

  /**
   * Quantidade de itens.
   *
   * Produto/cardápio usam normalmente > 1.
   * Serviço geralmente = 1.
   */
  @Column({
    name: "quantity",
    type: "int",
    default: 1,
  })
  quantity!: number;

  /**
   * Número de sessões contratado.
   */
  @Column({
    name: "total_sessions",
    type: "int",
    nullable: true,
  })
  totalSessions!: number | null;

  /**
   * Estado atual da máquina comercial.
   */
  @Column({
    type: "enum",
    enum: CommercialFlowState,
    default: CommercialFlowState.INICIADO,
  })
  state!: CommercialFlowState;

  /**
   * Define a origem transacional depois
   * que o funil comercial cria seu objeto real.
   */
  @Column({
    name: "source_type",
    type: "enum",
    enum: CommercialFlowSourceType,
    default: CommercialFlowSourceType.NONE,
  })
  sourceType!: CommercialFlowSourceType;

  /**
   * ID do objeto transacional principal.
   *
   * Exemplos:
   *
   * SERVICE_OFFER -> ServicoOferta.id
   * ORDER         -> Order.id
   * PACKAGE       -> contrato/oferta do pacote
   */
  @Column({
    name: "source_id",
    type: "varchar",
    length: 36,
    nullable: true,
  })
  sourceId!: string | null;

  /**
   * IDs do motor de serviços.
   *
   * Mantemos explícitos porque ajudam muito em:
   * - rastreamento;
   * - suporte;
   * - idempotência;
   * - métricas de conversão.
   */
  @Column({
    name: "solicitacao_id",
    type: "varchar",
    length: 36,
    nullable: true,
  })
  solicitacaoId!: string | null;

  @Column({
    name: "candidatura_id",
    type: "varchar",
    length: 36,
    nullable: true,
  })
  candidaturaId!: string | null;

  @Column({
    name: "oferta_id",
    type: "varchar",
    length: 36,
    nullable: true,
  })
  ofertaId!: string | null;

  /**
   * Para produto/cardápio.
   */
  @Column({
    name: "order_id",
    type: "varchar",
    length: 36,
    nullable: true,
  })
  orderId!: string | null;

  /**
   * Pagamento associado.
   */
  @Column({
    name: "payment_id",
    type: "varchar",
    length: 36,
    nullable: true,
  })
  paymentId!: string | null;

  /**
   * Agenda efetivamente criada.
   *
   * Não preencher apenas porque existe preferência.
   */
  @Column({
    name: "agenda_id",
    type: "varchar",
    length: 36,
    nullable: true,
  })
  agendaId!: string | null;

  /**
   * Pacote/contrato existente que poderá
   * fornecer sessões sem nova cobrança.
   */
  @Column({
    name: "active_package_id",
    type: "varchar",
    length: 36,
    nullable: true,
  })
  activePackageId!: string | null;

  /**
   * Preferência comercial de agenda.
   *
   * IMPORTANTE:
   * preferredDate/preferredTime NÃO significam
   * que existe agendamento.
   */
  @Column({
    name: "preferred_date",
    type: "date",
    nullable: true,
  })
  preferredDate!: string | null;

  @Column({
    name: "preferred_time",
    type: "varchar",
    length: 5,
    nullable: true,
  })
  preferredTime!: string | null;

  /**
   * Para serviços de múltiplos dias:
   * pedreiro, pintor, reforma etc.
   *
   * Exemplo:
   * [
   *   { data: "2026-09-02", inicio: "08:00", fim: "17:00" },
   *   { data: "2026-09-03", inicio: "08:00", fim: "17:00" }
   * ]
   */
  @Column({
    name: "schedule_plan",
    type: "json",
    nullable: true,
  })
  schedulePlan!:
    | Array<{
        data: string;
        inicio?: string;
        fim?: string;
        agendaId?: string;
      }>
    | null;

  /**
   * Dados temporários necessários durante o fluxo.
   *
   * Exemplos:
   * - nome/e-mail/telefone informados no cadastro rápido;
   * - alternativas de agenda;
   * - modalidade;
   * - endereço/retirada;
   * - carrinho;
   * - parâmetros específicos do negócio.
   */
  @Column({
    type: "json",
    nullable: true,
  })
  metadata!: Record<string, unknown> | null;

  /**
   * Permite existir histórico de conversões,
   * mantendo somente um fluxo ativo sendo conduzido.
   */
  @Column({
    type: "boolean",
    default: true,
  })
  ativo!: boolean;

  /**
   * Último erro do motor.
   *
   * Não deve ser usado como mensagem direta ao cliente.
   */
  @Column({
    name: "last_error",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  lastError!: string | null;

  @Column({
    name: "completed_at",
    type: "datetime",
    nullable: true,
  })
  completedAt!: Date | null;

  @CreateDateColumn({
    type: "datetime",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: "datetime",
  })
  updatedAt!: Date;
}

export default CommercialFlow;