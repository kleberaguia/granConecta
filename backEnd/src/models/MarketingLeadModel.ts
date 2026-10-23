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

import { Condominio } from "./condominiosModels";
import { Usuario } from "./UserModels";

export enum MarketingPublicoTipo {
  MORADOR = "MORADOR",
  VISITANTE = "VISITANTE",
  DESCONHECIDO = "DESCONHECIDO",
}

export enum MarketingLeadOrigem {
  CADASTRO = "CADASTRO",
  LANDING_PAGE = "LANDING_PAGE",
  BANNER = "BANNER",
  QR_CODE = "QR_CODE",
  CHECKOUT = "CHECKOUT",
  FORMULARIO = "FORMULARIO",
  WHATSAPP = "WHATSAPP",
  INSTAGRAM = "INSTAGRAM",
  FACEBOOK = "FACEBOOK",
  YOUTUBE = "YOUTUBE",
}

@Entity("marketing_leads")
@Index("uk_marketing_lead_telefone", ["telefone"], {
  unique: true,
})
@Index("idx_lead_condominio", ["condominio_id", "ativo"])
export class MarketingLead {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

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
    foreignKeyConstraintName: "fk_marketing_lead_usuario",
  })
  usuario?: Usuario | null;

  @Column({
    type: "varchar",
    length: 36,
    charset: "utf8mb4",
    collation: "utf8mb4_unicode_ci",
    nullable: true,
  })
  condominio_id?: string | null;

  @ManyToOne(() => Condominio, {
    nullable: true,
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  @JoinColumn({
    name: "condominio_id",
    foreignKeyConstraintName: "fk_marketing_lead_condominio",
  })
  condominio?: Condominio | null;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
  })
  nome?: string | null;

  @Column({
    type: "varchar",
    length: 20,
  })
  telefone!: string;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
  })
  email?: string | null;

  @Column({
    type: "enum",
    enum: MarketingLeadOrigem,
  })
  origem!: MarketingLeadOrigem;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
  })
  origem_referencia?: string | null;

  @Column({
    type: "enum",
    enum: MarketingPublicoTipo,
    default: MarketingPublicoTipo.DESCONHECIDO,
  })
  tipo_publico!: MarketingPublicoTipo;

  @Column({
    type: "boolean",
    default: true,
  })
  ativo!: boolean;

  @Column({
    type: "datetime",
    nullable: true,
  })
  ultima_interacao_em?: Date | null;

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

export default MarketingLead;