// src/models/PagamentoTransacaoModel.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

import { Pagamento } from "./PagamentoModel";

// =========================================================
// TIPOS DE TRANSAÇÃO
// =========================================================

export enum TipoPagamentoTransacao {
  INTEGRAL = "INTEGRAL",
  ENTRADA = "ENTRADA",
  SALDO = "SALDO",
  PARCELA = "PARCELA",
  REEMBOLSO = "REEMBOLSO",
}

// =========================================================
// MEIOS DE PAGAMENTO
// =========================================================

export enum MeioPagamentoTransacao {
  MERCADO_PAGO = "MERCADO_PAGO",
  PIX = "PIX",
  CARTAO = "CARTAO",
  PIX_DIRETO = "PIX_DIRETO",
  MAQUININHA = "MAQUININHA",
  LINK_EXTERNO = "LINK_EXTERNO",
  DINHEIRO = "DINHEIRO",
}

// =========================================================
// ORIGEM
// =========================================================

export enum OrigemPagamentoTransacao {
  INTEGRADO = "INTEGRADO",
  EXTERNO = "EXTERNO",
}

// =========================================================
// STATUS
// =========================================================

export enum StatusPagamentoTransacao {
  PENDENTE = "PENDENTE",
  AUTORIZADO = "AUTORIZADO",
  PAGO = "PAGO",
  PAGO_EXTERNAMENTE = "PAGO_EXTERNAMENTE",
  CANCELADO = "CANCELADO",
  REEMBOLSO_SOLICITADO = "REEMBOLSO_SOLICITADO",
  REEMBOLSADO = "REEMBOLSADO",
  FALHOU = "FALHOU",
}

// =========================================================
// GATILHO FINANCEIRO
// =========================================================

export enum GatilhoPagamentoTransacao {
  CONTRATACAO = "CONTRATACAO",
  SESSAO = "SESSAO",
  ETAPA = "ETAPA",
  CONCLUSAO = "CONCLUSAO",
}

// =========================================================
// ENTITY
// =========================================================

@Entity("pagamento_transacoes")
export class PagamentoTransacao {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  // =========================================================
  // PAGAMENTO PRINCIPAL
  // =========================================================

  @Column({
    name: "pagamento_id",
    type: "varchar",
    length: 36,
  })
  pagamentoId!: string;

  @ManyToOne(() => Pagamento, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "pagamento_id" })
  pagamento!: Pagamento;

  // =========================================================
  // TIPO DA MOVIMENTAÇÃO
  // =========================================================

  @Column({
    type: "enum",
    enum: TipoPagamentoTransacao,
  })
  tipo!: TipoPagamentoTransacao;

  // =========================================================
  // FORMA DE PAGAMENTO
  // =========================================================

  @Column({
    name: "meio_pagamento",
    type: "enum",
    enum: MeioPagamentoTransacao,
  })
  meioPagamento!: MeioPagamentoTransacao;

  @Column({
    type: "enum",
    enum: OrigemPagamentoTransacao,
  })
  origem!: OrigemPagamentoTransacao;

  // =========================================================
  // VALOR
  // =========================================================

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
  })
  valor!: number;

  // =========================================================
  // PLANO FINANCEIRO / PARCELA / ETAPA
  // =========================================================

  /**
   * Ordem da transação dentro do plano financeiro.
   *
   * Exemplos:
   *
   * Serviço simples:
   * 1 = Entrada
   * 2 = Saldo
   *
   * Pacote:
   * 1 = Sessão 1
   * 2 = Sessão 2
   * 3 = Sessão 3
   * 4 = Sessão 4
   *
   * Serviço por etapas:
   * 1 = Entrada
   * 2 = Etapa 1
   * 3 = Etapa 2
   * 4 = Saldo
   */
  @Column({
    type: "int",
    nullable: true,
  })
  ordem!: number | null;

  /**
   * Descrição amigável da transação.
   *
   * Exemplos:
   * "Entrada de 50%"
   * "Sessão 1 de 4"
   * "Conclusão da alvenaria"
   * "Saldo final"
   */
  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
  })
  descricao!: string | null;

  /**
   * Evento que está relacionado à cobrança/liberação.
   *
   * CONTRATACAO = cobrança inicial
   * SESSAO      = sessão de atendimento
   * ETAPA       = etapa/marco de um serviço
   * CONCLUSAO   = conclusão final do serviço
   */
  @Column({
    name: "gatilho_tipo",
    type: "enum",
    enum: GatilhoPagamentoTransacao,
    nullable: true,
  })
  gatilhoTipo!: GatilhoPagamentoTransacao | null;

  /**
   * ID da entidade relacionada ao gatilho.
   *
   * Exemplos:
   *
   * SESSAO:
   * gatilhoReferenciaId = agenda.id
   *
   * ETAPA:
   * gatilhoReferenciaId = etapa.id
   *
   * CONTRATACAO / CONCLUSAO:
   * pode ser null.
   */
  @Column({
    name: "gatilho_referencia_id",
    type: "varchar",
    length: 36,
    nullable: true,
  })
  gatilhoReferenciaId!: string | null;

  // =========================================================
  // STATUS
  // =========================================================

  @Column({
    type: "enum",
    enum: StatusPagamentoTransacao,
    default: StatusPagamentoTransacao.PENDENTE,
  })
  status!: StatusPagamentoTransacao;

  // =========================================================
  // GATEWAY
  // =========================================================

  @Column({
    type: "varchar",
    length: 50,
    nullable: true,
  })
  gateway!: string | null;

  /**
   * ID do pagamento real no gateway.
   *
   * Mercado Pago:
   * /v1/payments/{gatewayPaymentId}
   */
  @Column({
    name: "gateway_payment_id",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  gatewayPaymentId!: string | null;

  /**
   * ID da preferência/checkout.
   *
   * É diferente do gatewayPaymentId.
   */
  @Column({
    name: "gateway_preference_id",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  gatewayPreferenceId!: string | null;

  @Column({
    name: "link_pagamento",
    type: "varchar",
    length: 1000,
    nullable: true,
  })
  linkPagamento!: string | null;

  // =========================================================
  // CONFIRMAÇÃO DE PAGAMENTO EXTERNO
  // =========================================================

  /**
   * Utilizado principalmente para:
   *
   * PIX_DIRETO
   * MAQUININHA
   * LINK_EXTERNO
   * DINHEIRO
   */
  @Column({
    name: "confirmado_prestador_at",
    type: "datetime",
    nullable: true,
  })
  confirmadoPrestadorAt!: Date | null;

  @Column({
    name: "confirmado_cliente_at",
    type: "datetime",
    nullable: true,
  })
  confirmadoClienteAt!: Date | null;

  // =========================================================
  // DATAS
  // =========================================================

  @CreateDateColumn({
    name: "created_at",
    type: "datetime",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "datetime",
  })
  updatedAt!: Date;
}

export default PagamentoTransacao;