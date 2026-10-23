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

import { MarketingCanal } from "./MarketingCampanhaCanalModel";
import { MarketingLead } from "./MarketingLeadModel";

export enum MarketingConsentimentoFonte {
  CADASTRO = "CADASTRO",
  LANDING_PAGE = "LANDING_PAGE",
  WHATSAPP = "WHATSAPP",
  INSTAGRAM = "INSTAGRAM",
  FACEBOOK = "FACEBOOK",
  YOUTUBE = "YOUTUBE",
  CHECKOUT = "CHECKOUT",
  FORMULARIO = "FORMULARIO",
  ADMIN = "ADMIN",
  IMPORTACAO = "IMPORTACAO",
}

@Entity("marketing_consentimentos")
@Index("uk_marketing_consentimento_lead_canal", ["lead_id", "canal"], {
  unique: true,
})
@Index("idx_marketing_consentimento_canal_permitido", ["canal", "permitido"])
export class MarketingConsentimento {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: number;

  @Column({
    type: "varchar",
    length: 36,
    charset: "utf8mb4",
    collation: "utf8mb4_unicode_ci",
  })
  lead_id!: string;

  @ManyToOne(() => MarketingLead, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({
    name: "lead_id",
    foreignKeyConstraintName: "fk_marketing_consentimento_lead",
  })
  lead!: MarketingLead;

  @Column({ type: "enum", enum: MarketingCanal })
  canal!: MarketingCanal;

  @Column({ type: "boolean", default: false })
  permitido!: boolean;

  @Column({
    type: "enum",
    enum: MarketingConsentimentoFonte,
    default: MarketingConsentimentoFonte.CADASTRO,
  })
  fonte!: MarketingConsentimentoFonte;

  @Column({ type: "varchar", length: 255, nullable: true })
  referencia?: string | null;

  @Column({ type: "datetime", nullable: true })
  consentido_em?: Date | null;

  @Column({ type: "datetime", nullable: true })
  revogado_em?: Date | null;

  @Column({ type: "varchar", length: 45, nullable: true })
  ip_origem?: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  user_agent?: string | null;

  @CreateDateColumn({ type: "datetime", name: "createdAt" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime", name: "updatedAt" })
  updatedAt!: Date;
}

export default MarketingConsentimento;
