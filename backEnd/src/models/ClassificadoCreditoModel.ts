import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

/**
 * ============================================================
 * PLANO DO CRÉDITO
 * ============================================================
 */
export enum ClassificadoCreditoPlano {
  SIMPLES = "SIMPLES",
  DESTAQUE = "DESTAQUE",
  PREMIUM = "PREMIUM",
}

/**
 * ============================================================
 * STATUS DO CRÉDITO
 * ============================================================
 *
 * PENDENTE
 *   Crédito criado, mas o pagamento ainda não foi confirmado.
 *
 * DISPONIVEL
 *   Pagamento confirmado e crédito disponível para utilização.
 *
 * EM_USO
 *   Crédito atualmente vinculado a um classificado ativo.
 *
 * ESGOTADO
 *   Todos os dias disponíveis foram consumidos.
 *
 * EXPIRADO
 *   O prazo máximo para utilização do crédito terminou.
 *
 * CANCELADO
 *   Crédito cancelado.
 *
 * BLOQUEADO
 *   Crédito bloqueado administrativamente ou por violação.
 */
export enum ClassificadoCreditoStatus {
  PENDENTE = "PENDENTE",
  DISPONIVEL = "DISPONIVEL",
  EM_USO = "EM_USO",
  ESGOTADO = "ESGOTADO",
  EXPIRADO = "EXPIRADO",
  CANCELADO = "CANCELADO",
  BLOQUEADO = "BLOQUEADO",
}

/**
 * ============================================================
 * CLASSIFICADO CRÉDITO
 * ============================================================
 *
 * Representa o benefício comprado pelo usuário.
 *
 * IMPORTANTE:
 * O crédito pertence ao USUÁRIO e não ao anúncio.
 *
 * Exemplo:
 *
 * Compra:
 *   DESTAQUE
 *   30 dias
 *
 * Primeiro anúncio:
 *   celular
 *
 * Vendido após:
 *   3 dias
 *
 * Resultado:
 *   3 dias consumidos
 *   27 dias restantes
 *
 * Os 27 dias podem posteriormente ser utilizados em outro
 * classificado pessoal, desde que passe novamente pela
 * moderação.
 */
@Entity({
  name: "classificado_creditos",
})
@Index(
  "IDX_classificado_creditos_usuario",
  ["usuarioId"]
)
@Index(
  "IDX_classificado_creditos_status",
  ["status"]
)
@Index(
  "IDX_classificado_creditos_validade",
  ["validadeEm"]
)
@Index(
  "IDX_classificado_creditos_usuario_status",
  ["usuarioId", "status"]
)
export class ClassificadoCredito {
  /**
   * UUID.
   */
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /**
   * Proprietário do crédito.
   */
  @Column({
    name: "usuario_id",
    type: "varchar",
    length: 36,
  })
  usuarioId!: string;

  /**
   * Plano adquirido.
   */
  @Column({
    type: "enum",
    enum: ClassificadoCreditoPlano,
  })
  plano!: ClassificadoCreditoPlano;

  /**
   * Quantidade original de dias adquiridos.
   *
   * Exemplo:
   * 30
   */
  @Column({
    name: "dias_comprados",
    type: "int",
  })
  diasComprados!: number;

  /**
   * Total de dias efetivamente utilizados.
   */
  @Column({
    name: "dias_consumidos",
    type: "int",
    default: 0,
  })
  diasConsumidos!: number;

  /**
   * Saldo atualmente disponível.
   */
  @Column({
    name: "dias_restantes",
    type: "int",
  })
  diasRestantes!: number;

  /**
   * Valor efetivamente pago.
   *
   * Decimal é retornado pelo MySQL/TypeORM normalmente como
   * string, evitando perda de precisão monetária.
   */
  @Column({
    name: "valor_pago",
    type: "decimal",
    precision: 10,
    scale: 2,
  })
  valorPago!: string;

  /**
   * ID do pagamento no gateway.
   */
  @Column({
    name: "payment_id",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  paymentId!: string | null;

  /**
   * ID da sessão/preferência de checkout.
   */
  @Column({
    name: "checkout_session_id",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  checkoutSessionId!: string | null;

  /**
   * Estado atual do crédito.
   */
  @Column({
    type: "enum",
    enum: ClassificadoCreditoStatus,
    default: ClassificadoCreditoStatus.PENDENTE,
  })
  status!: ClassificadoCreditoStatus;

  /**
   * Momento em que o crédito passou a existir como benefício
   * efetivamente adquirido.
   *
   * Normalmente será preenchido após confirmação do pagamento.
   */
  @Column({
    name: "adquirido_em",
    type: "datetime",
    nullable: true,
  })
  adquiridoEm!: Date | null;

  /**
   * Data limite para utilização do saldo.
   *
   * Não é a expiração do anúncio.
   *
   * É a validade da carteira/crédito.
   */
  @Column({
    name: "validade_em",
    type: "datetime",
    nullable: true,
  })
  validadeEm!: Date | null;

  @CreateDateColumn({
    name: "created_at",
    type: "datetime",
    precision: 6,
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "datetime",
    precision: 6,
  })
  updatedAt!: Date;
}

export default ClassificadoCredito;