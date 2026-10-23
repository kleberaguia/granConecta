import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { MarketingCampanha } from "./MarketingCampanhaModel";
import { MarketingCampanhaCanal } from "./MarketingCampanhaCanalModel";
import { MarketingLead } from "./MarketingLeadModel";
import { Store } from "./StoreModels";
import { Usuario } from "./UserModels";

export enum MarketingStatus {
  PENDENTE = "PENDENTE",
  PROCESSANDO = "PROCESSANDO",
  ENVIADO = "ENVIADO",
  ENTREGUE = "ENTREGUE",
  LIDO = "LIDO",
  CANCELADO = "CANCELADO",
  FALHA = "FALHA",
}

export enum MarketingTipo {
  LEMBRETE_RECOMPRA = "LEMBRETE_RECOMPRA",
  RECUPERACAO_SERVICO = "RECUPERACAO_SERVICO",
  FEEDBACK_POS_VENDA = "FEEDBACK_POS_VENDA",
  PROMO_SAZONAL = "PROMO_SAZONAL",
  RECUPERACAO_INTERACAO = "RECUPERACAO_INTERACAO",
  CAMPANHA_LOJA = "CAMPANHA_LOJA",
  CAMPANHA_PRESTADOR = "CAMPANHA_PRESTADOR",
}

export type MarketingAgendamentoMetadata = {
  produto_id?: number;
  solicitacao_id?: number;
  categoria_nome?: string;
  valor_estimado?: number;
  banner_id?: number;
  condominio_id?: string;
  [chave: string]: unknown;
};

@Entity("marketing_agendamentos")
@Index("idx_marketing_data_status", [
  "data_execucao",
  "status",
])
@Index("idx_agendamento_campanha_status", [
  "campanha_id",
  "status",
])
@Index("idx_agendamento_canal_status", [
  "canal_id",
  "status",
])
@Index("idx_agendamento_meta_message", [
  "meta_message_id",
])
export class MarketingAgendamento {
  @PrimaryGeneratedColumn({
    type: "bigint",
    unsigned: true,
  })
  id!: number;

  @Column({
    type: "bigint",
    unsigned: true,
    nullable: true,
  })
  campanha_id?: number | null;

  @ManyToOne(() => MarketingCampanha, {
    nullable: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "campanha_id",
    foreignKeyConstraintName: "fk_agendamento_campanha",
  })
  campanha?: MarketingCampanha | null;

  @Column({
    type: "bigint",
    unsigned: true,
    nullable: true,
  })
  canal_id?: number | null;

  @ManyToOne(() => MarketingCampanhaCanal, {
    nullable: true,
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  @JoinColumn({
    name: "canal_id",
    foreignKeyConstraintName:
      "fk_agendamento_campanha_canal",
  })
  canal?: MarketingCampanhaCanal | null;

  @Column({
    type: "varchar",
    length: 36,
    charset: "utf8mb4",
    collation: "utf8mb4_unicode_ci",
    nullable: true,
  })
  usuario_id?: string | null;

  @ManyToOne(() => Usuario, {
    nullable: true,
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  @JoinColumn({
    name: "usuario_id",
    foreignKeyConstraintName: "fk_usuario_marketing",
  })
  usuario?: Usuario | null;

  @Column({
    type: "varchar",
    length: 36,
    charset: "utf8mb4",
    collation: "utf8mb4_unicode_ci",
    nullable: true,
  })
  lead_id?: string | null;

  @ManyToOne(() => MarketingLead, {
    nullable: true,
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  @JoinColumn({
    name: "lead_id",
    foreignKeyConstraintName: "fk_agendamento_lead",
  })
  lead?: MarketingLead | null;

  @Column({
    type: "varchar",
    length: 20,
    nullable: true,
  })
  telefone?: string | null;

  @Column({
    type: "varchar",
    length: 36,
    charset: "utf8mb4",
    collation: "utf8mb4_unicode_ci",
    nullable: true,
  })
  loja_id?: string | null;

  @ManyToOne(() => Store, {
    nullable: true,
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  @JoinColumn({
    name: "loja_id",
    foreignKeyConstraintName: "fk_loja_marketing",
  })
  store?: Store | null;

  @Column({
    type: "varchar",
    length: 50,
  })
  tipo!: MarketingTipo;

  @Column({
    type: "varchar",
    length: 20,
    default: MarketingStatus.PENDENTE,
  })
  status!: MarketingStatus;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
  })
  template_nome?: string | null;

  @Column({
    type: "json",
    nullable: true,
  })
  template_parametros?: Array<string | number> | null;

  @Column({
    type: "timestamp",
  })
  data_execucao!: Date;

  @Column({
    type: "text",
    nullable: true,
  })
  mensagem_customizada?: string | null;

  @Column({
    type: "json",
    nullable: true,
  })
  metadata?: MarketingAgendamentoMetadata | null;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
  })
  meta_message_id?: string | null;

  @Column({
    type: "int",
    unsigned: true,
    default: 0,
  })
  tentativas!: number;

  @Column({
    type: "text",
    nullable: true,
  })
  ultimo_erro?: string | null;

  @Column({
    type: "datetime",
    nullable: true,
  })
  enviado_em?: Date | null;

  @Column({
    type: "datetime",
    nullable: true,
  })
  entregue_em?: Date | null;

  @Column({
    type: "datetime",
    nullable: true,
  })
  lido_em?: Date | null;

  @Column({
    type: "datetime",
    nullable: true,
  })
  falhou_em?: Date | null;

  @CreateDateColumn({
    type: "timestamp",
    name: "createdAt",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: "timestamp",
    name: "updatedAt",
  })
  updatedAt!: Date;
}

export default MarketingAgendamento;