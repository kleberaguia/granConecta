import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { MarketPlaceModel } from "./MarketPlaceModel";
import { Store } from "./StoreModels";
import { Category } from "./CategoryModels";
import { MarketingCampanhaCanal } from "./MarketingCampanhaCanalModel";

export enum MarketingCampanhaStatus {
  RASCUNHO = "RASCUNHO",
  AGUARDANDO_PAGAMENTO = "AGUARDANDO_PAGAMENTO",
  AGUARDANDO_APROVACAO = "AGUARDANDO_APROVACAO",
  AGENDADA = "AGENDADA",
  PROCESSANDO = "PROCESSANDO",
  CONCLUIDA = "CONCLUIDA",
  CANCELADA = "CANCELADA",
  FALHOU = "FALHOU",
}

export enum MarketingCampanhaTipo {
  INSTITUCIONAL = "INSTITUCIONAL",
  CONTRATADA = "CONTRATADA",
  AUTOMATICA = "AUTOMATICA",
}

export enum MarketingCampanhaDestinoTipo {
  GRANCONECTA = "GRANCONECTA",
  CATEGORIA = "CATEGORIA",
  LOJA = "LOJA",
  PRESTADOR = "PRESTADOR",
}

export type MarketingTemplateParametros =
  | Array<string | number>
  | Record<string, string | number | boolean | null>;

export type MarketingPublicoTipo =
  | "MORADOR"
  | "VISITANTE"
  | "DESCONHECIDO";

export type MarketingSegmentacao = {
  condominioIds?: string[];
  usuarioTipos?: string[];
  somenteUsuariosAtivos?: boolean;
  origemLeads?: string[];

  /** Público elegível para a campanha. */
  publico?: MarketingPublicoTipo[];

  /** Categorias/interesses usados na seleção futura da audiência. */
  interesseCategorias?: string[];

  /** Mantidos por compatibilidade com o fluxo atual de geração de fila. */
  todosLeadsComConsentimento?: boolean;
  somenteComConsentimento?: boolean;

  /** Permite evolução gradual sem quebrar campanhas já persistidas. */
  [chave: string]: unknown;
};

@Entity("marketing_campanhas")
@Index("idx_campanha_status_data", [
  "status",
  "data_agendamento",
])
@Index("idx_campanha_loja", ["loja_id"])
@Index("idx_campanha_banner", ["banner_id"])
@Index("idx_marketing_campanhas_tipo_destino", ["tipo_destino"])
@Index("idx_marketing_campanhas_categoria_id", ["categoria_id"])
export class MarketingCampanha {
  @PrimaryGeneratedColumn({
    type: "bigint",
    unsigned: true,
  })
  id!: number;

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
    foreignKeyConstraintName: "fk_campanha_loja",
  })
  loja?: Store | null;

  @Column({
    type: "varchar",
    length: 36,
    charset: "utf8mb4",
    collation: "utf8mb4_unicode_ci",
    nullable: true,
  })
  prestador_id?: string | null;

  @Column({
    type: "enum",
    enum: MarketingCampanhaTipo,
    default: MarketingCampanhaTipo.CONTRATADA,
  })
  tipo_campanha!: MarketingCampanhaTipo;

  @Column({
    type: "enum",
    enum: MarketingCampanhaDestinoTipo,
    default: MarketingCampanhaDestinoTipo.GRANCONECTA,
  })
  tipo_destino!: MarketingCampanhaDestinoTipo;

  @Column({
    type: "int",
    nullable: true,
  })
  categoria_id?: number | null;

  @ManyToOne(() => Category, {
    nullable: true,
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  @JoinColumn({
    name: "categoria_id",
    foreignKeyConstraintName: "fk_marketing_campanhas_categoria",
  })
  categoria?: Category | null;

  @Column({
    type: "varchar",
    length: 36,
    charset: "utf8mb4",
    collation: "utf8mb4_unicode_ci",
    nullable: true,
  })
  criado_por?: string | null;

  @Column({
    type: "int",
    unsigned: true,
    nullable: true,
  })
  banner_id?: number | null;

  @ManyToOne(() => MarketPlaceModel, {
    nullable: true,
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  @JoinColumn({
    name: "banner_id",
    foreignKeyConstraintName: "fk_campanha_banner",
  })
  banner?: MarketPlaceModel | null;

  @OneToMany(
    () => MarketingCampanhaCanal,
    (canal) => canal.campanha,
  )
  canais?: MarketingCampanhaCanal[];

  @Column({
    type: "varchar",
    length: 255,
  })
  nome!: string;

  @Column({
    type: "text",
    nullable: true,
  })
  descricao?: string | null;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
  })
  template_nome?: string | null;

  @Column({
    type: "varchar",
    length: 20,
    default: "pt_BR",
  })
  template_idioma!: string;

  @Column({
    type: "json",
    nullable: true,
  })
  parametros_template?: MarketingTemplateParametros | null;

  @Column({
    type: "json",
    nullable: true,
  })
  segmentacao?: MarketingSegmentacao | null;

  @Column({
    type: "datetime",
  })
  data_agendamento!: Date;

  @Column({
    type: "enum",
    enum: MarketingCampanhaStatus,
    default: MarketingCampanhaStatus.RASCUNHO,
  })
  status!: MarketingCampanhaStatus;

  @Column({
    type: "boolean",
    default: false,
  })
  pago!: boolean;

  @Column({
    type: "boolean",
    default: false,
  })
  aprovado!: boolean;

  @Column({
    type: "int",
    unsigned: true,
    default: 0,
  })
  total_destinatarios!: number;

  @Column({
    type: "int",
    unsigned: true,
    default: 0,
  })
  total_enviados!: number;

  @Column({
    type: "int",
    unsigned: true,
    default: 0,
  })
  total_falhas!: number;

  @Column({
    type: "int",
    unsigned: true,
    default: 0,
  })
  total_entregues!: number;

  @Column({
    type: "int",
    unsigned: true,
    default: 0,
  })
  total_lidos!: number;

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

export default MarketingCampanha;