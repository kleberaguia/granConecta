import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

export enum BusinessCatalogItemType {
  SERVICO = "SERVICO",
  PACOTE = "PACOTE",
  PRODUTO = "PRODUTO",
  CARDAPIO = "CARDAPIO",
  PROMOCAO = "PROMOCAO",
}

export enum BusinessCatalogModality {
  PRESENCIAL = "PRESENCIAL",
  ONLINE = "ONLINE",
  AMBOS = "AMBOS",
  NAO_APLICA = "NAO_APLICA",
}

export enum BusinessCatalogSchedulingPolicy {
  ONE_PER_WEEK = "ONE_PER_WEEK",
  DAILY_ALLOWED = "DAILY_ALLOWED",
  MULTIPLE_PER_DAY = "MULTIPLE_PER_DAY",
  NO_SCHEDULING = "NO_SCHEDULING",
}

export enum BusinessCatalogDuplicatePurchasePolicy {
  CONFIRM_IDENTICAL_PAID_ORDER = "CONFIRM_IDENTICAL_PAID_ORDER",
  ALLOW_REPEAT = "ALLOW_REPEAT",
}

@Entity("business_catalog_items")
@Index("idx_business_catalog_store_ativo", ["storeId", "ativo"])
@Index("idx_business_catalog_store_tipo", ["storeId", "tipo"])
@Index("idx_business_catalog_categoria", ["categoriaId"])
export class BusinessCatalogItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    name: "store_id",
    type: "varchar",
    length: 36,
  })
  storeId!: string;

  @Column({
    name: "owner_user_id",
    type: "varchar",
    length: 36,
    nullable: true,
  })
  ownerUserId!: string | null;

  @Column({
    type: "enum",
    enum: BusinessCatalogItemType,
  })
  tipo!: BusinessCatalogItemType;

  @Column({
    type: "varchar",
    length: 180,
  })
  nome!: string;

  @Column({
    type: "text",
    nullable: true,
  })
  descricao!: string | null;

  @Column({
    name: "categoria_id",
    type: "bigint",
    nullable: true,
  })
  categoriaId!: number | null;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
  })
  preco!: number;

  @Column({
    name: "preco_promocional",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  precoPromocional!: number | null;

  @Column({
    name: "duracao_minutos",
    type: "int",
    nullable: true,
  })
  duracaoMinutos!: number | null;

  @Column({
    name: "total_sessoes",
    type: "int",
    default: 1,
  })
  totalSessoes!: number;

  @Column({
    name: "scheduling_policy",
    type: "enum",
    enum: BusinessCatalogSchedulingPolicy,
    default: BusinessCatalogSchedulingPolicy.DAILY_ALLOWED,
  })
  schedulingPolicy!: BusinessCatalogSchedulingPolicy;

  @Column({
    name: "max_sessions_per_week",
    type: "int",
    nullable: true,
  })
  maxSessionsPerWeek!: number | null;

  @Column({
    name: "allow_standalone_purchase",
    type: "boolean",
    default: true,
  })
  allowStandalonePurchase!: boolean;

  @Column({
    name: "duplicate_purchase_policy",
    type: "enum",
    enum: BusinessCatalogDuplicatePurchasePolicy,
    default: BusinessCatalogDuplicatePurchasePolicy.CONFIRM_IDENTICAL_PAID_ORDER,
  })
  duplicatePurchasePolicy!: BusinessCatalogDuplicatePurchasePolicy;

  @Column({
    type: "enum",
    enum: BusinessCatalogModality,
    default: BusinessCatalogModality.NAO_APLICA,
  })
  modalidade!: BusinessCatalogModality;

  @Column({
    name: "validade_inicio",
    type: "datetime",
    nullable: true,
  })
  validadeInicio!: Date | null;

  @Column({
    name: "validade_fim",
    type: "datetime",
    nullable: true,
  })
  validadeFim!: Date | null;

  @Column({
    type: "boolean",
    default: true,
  })
  ativo!: boolean;

  @Column({
    type: "boolean",
    default: false,
  })
  destaque!: boolean;

  @Column({
    type: "json",
    nullable: true,
  })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({
    type: "datetime",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: "datetime",
  })
  updatedAt!: Date;
}

export default BusinessCatalogItem;