import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from "typeorm";

import { Usuario } from "./UserModels";
import { Classificado } from "./ClassificadoModel";

/**
 * ============================================================
 * TIPOS DE EVENTO
 * ============================================================
 *
 * Mantém o histórico das ações relacionadas aos Classificados.
 *
 * IMPORTANTE:
 * O histórico não deve ser apagado simplesmente porque um
 * anúncio foi cancelado, vendido ou expirou.
 *
 * Ele também será utilizado futuramente pela política comercial
 * para identificar recorrência de vendas.
 */
export enum ClassificadoEventoTipo {
  CRIADO = "CRIADO",
  EDITADO = "EDITADO",
  ANALISADO = "ANALISADO",

  PAGAMENTO_INICIADO = "PAGAMENTO_INICIADO",
  PAGAMENTO_APROVADO = "PAGAMENTO_APROVADO",
  PAGAMENTO_FALHOU = "PAGAMENTO_FALHOU",

  PUBLICADO = "PUBLICADO",
  RESERVADO = "RESERVADO",
  VENDIDO = "VENDIDO",
  EXPIRADO = "EXPIRADO",
  CANCELADO = "CANCELADO",
  REJEITADO = "REJEITADO",

  BLOQUEADO_COMERCIAL = "BLOQUEADO_COMERCIAL",

  ENCAMINHADO_EMPREENDEDOR = "ENCAMINHADO_EMPREENDEDOR",
  ENCAMINHADO_PRESTADOR = "ENCAMINHADO_PRESTADOR",
}

/**
 * Origem da ação que gerou o evento.
 */
export enum ClassificadoEventoOrigem {
  CLASSIFICADOS = "CLASSIFICADOS",
  MURAL = "MURAL",
  SISTEMA = "SISTEMA",
  PAGAMENTO = "PAGAMENTO",
  ADMIN = "ADMIN",
}

/**
 * Estrutura flexível para informações adicionais.
 *
 * Como a coluna é JSON, não devemos engessar os detalhes
 * em um único formato.
 *
 * Exemplos:
 *
 * {
 *   plano: "SIMPLES",
 *   valor: 9.90
 * }
 *
 * {
 *   motivo: "ATIVIDADE_COMERCIAL",
 *   destino: "EMPREENDEDOR"
 * }
 *
 * {
 *   paymentId: "123456789"
 * }
 */
export type ClassificadoEventoDetalhes =
  Record<string, unknown>;

@Entity("classificado_eventos")
@Index(
  "IDX_classificado_eventos_classificado",
  ["classificadoId"]
)
@Index(
  "IDX_classificado_eventos_usuario",
  ["usuarioId"]
)
@Index(
  "IDX_classificado_eventos_usuario_data",
  ["usuarioId", "createdAt"]
)
@Index(
  "IDX_classificado_eventos_tipo",
  ["tipo"]
)
export class ClassificadoEvento {
  /**
   * BIGINT AUTO_INCREMENT no MySQL.
   */
  @PrimaryGeneratedColumn({
    type: "bigint",
  })
  id!: number;

  /**
   * Pode ser NULL propositalmente.
   *
   * Isso permite manter o evento mesmo caso o registro do
   * classificado seja removido fisicamente.
   *
   * Também poderá ser útil para registrar uma tentativa
   * comercial detectada antes da criação definitiva do anúncio.
   */
  @Column({
    name: "classificado_id",
    type: "varchar",
    length: 36,
    nullable: true,
  })
  classificadoId!: string | null;

  @ManyToOne(
    () => Classificado,
    {
      nullable: true,
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    }
  )
  @JoinColumn({
    name: "classificado_id",
  })
  classificado!: Classificado | null;

  /**
   * Usuário responsável pela ação/tentativa.
   *
   * É este campo que permitirá analisar o histórico dos
   * últimos 30 dias independentemente do estado atual
   * dos anúncios.
   */
  @Column({
    name: "usuario_id",
    type: "varchar",
    length: 36,
  })
  usuarioId!: string;

  @ManyToOne(
    () => Usuario,
    {
      nullable: false,
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    }
  )
  @JoinColumn({
    name: "usuario_id",
  })
  usuario!: Usuario;

  @Column({
    type: "enum",
    enum: ClassificadoEventoTipo,
  })
  tipo!: ClassificadoEventoTipo;

  @Column({
    type: "enum",
    enum: ClassificadoEventoOrigem,
    default: ClassificadoEventoOrigem.CLASSIFICADOS,
  })
  origem!: ClassificadoEventoOrigem;

  /**
   * Dados complementares do evento.
   *
   * Exemplos:
   *
   * PAGAMENTO_INICIADO:
   * {
   *   plano: "DESTAQUE",
   *   valor: 19.90
   * }
   *
   * BLOQUEADO_COMERCIAL:
   * {
   *   motivo: "VENDA_RECORRENTE",
   *   destino: "EMPREENDEDOR"
   * }
   *
   * ENCAMINHADO_PRESTADOR:
   * {
   *   motivo: "OFERTA_SERVICO"
   * }
   */
  @Column({
    type: "json",
    nullable: true,
  })
  detalhes!: ClassificadoEventoDetalhes | null;

  @CreateDateColumn({
    name: "created_at",
    type: "datetime",
    precision: 6,
  })
  createdAt!: Date;
}

export default ClassificadoEvento;