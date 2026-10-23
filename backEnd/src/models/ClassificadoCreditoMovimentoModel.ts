import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

/**
 * ============================================================
 * TIPOS DE MOVIMENTAÇÃO
 * ============================================================
 *
 * O saldo nunca deverá mudar silenciosamente.
 *
 * Toda operação relevante será registrada nesta tabela.
 */
export enum ClassificadoCreditoMovimentoTipo {
  CREDITO_CRIADO = "CREDITO_CRIADO",

  PAGAMENTO_APROVADO = "PAGAMENTO_APROVADO",

  ANUNCIO_INICIADO = "ANUNCIO_INICIADO",

  DIAS_CONSUMIDOS = "DIAS_CONSUMIDOS",

  SALDO_DEVOLVIDO = "SALDO_DEVOLVIDO",

  ANUNCIO_VENDIDO = "ANUNCIO_VENDIDO",

  ANUNCIO_CANCELADO = "ANUNCIO_CANCELADO",

  CREDITO_ESGOTADO = "CREDITO_ESGOTADO",

  CREDITO_EXPIRADO = "CREDITO_EXPIRADO",

  CREDITO_BLOQUEADO = "CREDITO_BLOQUEADO",
}

/**
 * ============================================================
 * CLASSIFICADO CRÉDITO MOVIMENTO
 * ============================================================
 *
 * Livro razão/auditoria da carteira de classificados.
 *
 * Exemplo:
 *
 * PAGAMENTO_APROVADO
 * saldoAnterior = 0
 * saldoPosterior = 30
 *
 * ANUNCIO_INICIADO
 * classificadoId = celular
 *
 * ANUNCIO_VENDIDO
 * classificadoId = celular
 *
 * DIAS_CONSUMIDOS
 * dias = 3
 * saldoAnterior = 30
 * saldoPosterior = 27
 */
@Entity({
  name: "classificado_credito_movimentos",
})
@Index(
  "IDX_credito_mov_credito",
  ["creditoId"]
)
@Index(
  "IDX_credito_mov_classificado",
  ["classificadoId"]
)
@Index(
  "IDX_credito_mov_usuario",
  ["usuarioId"]
)
@Index(
  "IDX_credito_mov_tipo",
  ["tipo"]
)
export class ClassificadoCreditoMovimento {
  /**
   * BIGINT AUTO_INCREMENT.
   *
   * Utilizamos string no TypeScript porque BIGINT pode
   * ultrapassar o limite seguro de integer do JavaScript.
   */
  @PrimaryGeneratedColumn({
    type: "bigint",
  })
  id!: string;

  /**
   * Crédito que originou a movimentação.
   */
  @Column({
    name: "credito_id",
    type: "varchar",
    length: 36,
  })
  creditoId!: string;

  /**
   * Classificado relacionado à movimentação.
   *
   * Pode ser NULL para eventos que pertencem somente ao
   * crédito, como PAGAMENTO_APROVADO.
   */
  @Column({
    name: "classificado_id",
    type: "varchar",
    length: 36,
    nullable: true,
  })
  classificadoId!: string | null;

  /**
   * Proprietário do crédito.
   *
   * Mantemos também aqui para facilitar auditoria e consultas.
   */
  @Column({
    name: "usuario_id",
    type: "varchar",
    length: 36,
  })
  usuarioId!: string;

  /**
   * Tipo da movimentação.
   */
  @Column({
    type: "enum",
    enum: ClassificadoCreditoMovimentoTipo,
  })
  tipo!: ClassificadoCreditoMovimentoTipo;

  /**
   * Quantidade de dias relacionada ao movimento.
   *
   * Exemplo:
   *
   * DIAS_CONSUMIDOS
   * dias = 3
   *
   * Outros eventos podem utilizar 0.
   */
  @Column({
    type: "int",
    default: 0,
  })
  dias!: number;

  /**
   * Saldo imediatamente anterior ao movimento.
   */
  @Column({
    name: "saldo_anterior",
    type: "int",
    nullable: true,
  })
  saldoAnterior!: number | null;

  /**
   * Saldo imediatamente posterior ao movimento.
   */
  @Column({
    name: "saldo_posterior",
    type: "int",
    nullable: true,
  })
  saldoPosterior!: number | null;

  /**
   * Informações complementares.
   *
   * Exemplos:
   *
   * {
   *   "motivo": "ANUNCIO_VENDIDO",
   *   "diasUtilizados": 3
   * }
   *
   * ou:
   *
   * {
   *   "paymentId": "123456789"
   * }
   */
  @Column({
    type: "json",
    nullable: true,
  })
  detalhes!: Record<string, unknown> | null;

  @CreateDateColumn({
    name: "created_at",
    type: "datetime",
    precision: 6,
  })
  createdAt!: Date;
}

export default ClassificadoCreditoMovimento;