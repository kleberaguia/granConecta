import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { MarketingOpportunityAnswer } from "./MarketingOpportunityAnswerModel";

export enum MarketingOpportunityStatus {
  CRIADA = "CRIADA",
  QUALIFICANDO = "QUALIFICANDO",
  QUALIFICADA = "QUALIFICADA",
  OPCOES_APRESENTADAS = "OPCOES_APRESENTADAS",
  NEGOCIO_SELECIONADO = "NEGOCIO_SELECIONADO",
  NEGOCIANDO = "NEGOCIANDO",
  CONVERTIDA = "CONVERTIDA",
  PERDIDA = "PERDIDA",
  EXPIRADA = "EXPIRADA",
}

@Entity("marketing_opportunities")
@Index("idx_marketing_opportunity_campanha", ["campanha_id"])
@Index("idx_marketing_opportunity_lead", ["lead_id"])
@Index("idx_marketing_opportunity_store", ["selected_store_id"])
@Index("idx_marketing_opportunity_status", ["status"])
@Index("idx_marketing_opportunity_conversation", [
  "source_conversation_id",
])
@Index("idx_marketing_opportunity_catalog_item", ["catalog_item_id"])
@Index("uk_marketing_opportunity_token_hash", ["token_hash"], {
  unique: true,
})
export class MarketingOpportunity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    type: "bigint",
    nullable: true,
  })
  campanha_id!: number | null;

  @Column({
    type: "bigint",
    nullable: true,
  })
  playbook_id!: number | null;

  @Column({
    type: "bigint",
    nullable: true,
  })
  categoria_id!: number | null;

  @Column({
    type: "varchar",
    length: 36,
    nullable: true,
  })
  lead_id!: string | null;

  @Column({
    type: "varchar",
    length: 36,
    nullable: false,
  })
  source_conversation_id!: string;

  @Column({
    type: "varchar",
    length: 36,
    nullable: true,
  })
  destination_conversation_id!: string | null;

  @Column({
    type: "varchar",
    length: 36,
    nullable: true,
  })
  user_id!: string | null;

  @Column({
    type: "varchar",
    length: 30,
    nullable: true,
  })
  user_type!: string | null;

  @Column({
    type: "varchar",
    length: 36,
    nullable: true,
  })
  condominio_id!: string | null;

  @Column({
    type: "varchar",
    length: 30,
    nullable: true,
  })
  canal_origem!: string | null;

  @Column({
    type: "varchar",
    length: 36,
    nullable: true,
  })
  selected_store_id!: string | null;

  @Column({
    type: "varchar",
    length: 160,
    nullable: true,
  })
  selected_store_name!: string | null;

  @Column({
    type: "varchar",
    length: 190,
    nullable: true,
  })
  selected_store_slug!: string | null;

  @Column({
    type: "varchar",
    length: 20,
    nullable: true,
  })
  selected_chatbot_tipo!: "LOJA" | "PRESTADOR" | null;

  /**
   * Item comercial escolhido pelo cliente.
   *
   * IMPORTANTE:
   * Este tipo pressupõe que business_catalog_items.id seja numérico/bigint.
   * Se o catálogo utilizar UUID, este campo deverá ser alterado para varchar(36).
   */
  @Column({
    type: "varchar",
    length: 36,
    nullable: true,
  })
  catalog_item_id!: string | null;

  /**
   * Snapshot comercial.
   *
   * Esses campos preservam os dados vigentes no momento em que o cliente
   * escolheu o item, mesmo que o catálogo seja alterado posteriormente.
   */
  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
  })
  catalog_item_name!: string | null;

  @Column({
    type: "varchar",
    length: 30,
    nullable: true,
  })
  catalog_item_type!: string | null;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    nullable: true,
  })
  catalog_item_price!: string | null;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    nullable: true,
  })
  catalog_item_promotional_price!: string | null;

  @Column({
    type: "int",
    nullable: true,
  })
  catalog_item_sessions!: number | null;

  @Column({
    type: "int",
    nullable: true,
  })
  catalog_item_duration_minutes!: number | null;

  @Column({
    type: "varchar",
    length: 50,
    nullable: true,
  })
  catalog_item_modality!: string | null;

  /**
   * Cópia completa dos dados comerciais utilizados na escolha.
   *
   * Exemplo:
   * {
   *   id: 10,
   *   name: "Pacote Psicopedagógico",
   *   type: "PACOTE",
   *   price: "650.00",
   *   sessions: 4,
   *   durationMinutes: 60,
   *   modality: "PRESENCIAL"
   * }
   */
  @Column({
    type: "json",
    nullable: true,
  })
  catalog_item_snapshot!: Record<string, any> | null;

  @Column({
    type: "datetime",
    nullable: true,
  })
  catalog_item_selected_at!: Date | null;

  @Column({
    type: "enum",
    enum: MarketingOpportunityStatus,
    default: MarketingOpportunityStatus.CRIADA,
  })
  status!: MarketingOpportunityStatus;

  @Column({
    type: "int",
    default: 0,
  })
  score!: number;

  @Column({
    type: "text",
    nullable: true,
  })
  resumo_qualificacao!: string | null;

  /**
   * Nunca armazenamos o token público puro.
   * O frontend recebe o token; o banco guarda apenas SHA-256.
   */
  @Column({
    type: "char",
    length: 64,
    nullable: true,
  })
  token_hash!: string | null;

  @Column({
    type: "datetime",
    nullable: true,
  })
  token_expires_at!: Date | null;

  @Column({
    type: "datetime",
    nullable: true,
  })
  qualificacao_iniciada_em!: Date | null;

  @Column({
    type: "datetime",
    nullable: true,
  })
  qualificacao_concluida_em!: Date | null;

  @Column({
    type: "datetime",
    nullable: true,
  })
  opcoes_apresentadas_em!: Date | null;

  @Column({
    type: "datetime",
    nullable: true,
  })
  negocio_selecionado_em!: Date | null;

  @Column({
    type: "datetime",
    nullable: true,
  })
  negocio_acessado_em!: Date | null;

  @Column({
    type: "datetime",
    nullable: true,
  })
  negociacao_iniciada_em!: Date | null;

  @Column({
    type: "datetime",
    nullable: true,
  })
  convertido_em!: Date | null;

  @Column({
    type: "datetime",
    nullable: true,
  })
  perdido_em!: Date | null;

  @OneToMany(
    () => MarketingOpportunityAnswer,
    (answer) => answer.opportunity,
  )
  answers!: MarketingOpportunityAnswer[];

  @CreateDateColumn({
    type: "datetime",
    name: "createdAt",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: "datetime",
    name: "updatedAt",
  })
  updatedAt!: Date;
}

export default MarketingOpportunity;