import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { MarketingLead } from "./MarketingLeadModel";

@Entity("whatsapp_lead_consentimentos")
@Index("IDX_whatsapp_lead", ["lead_id"], {
  unique: true,
})
@Index("IDX_whatsapp_lead_telefone", ["telefone"], {
  unique: true,
})
@Index("IDX_whatsapp_lead_marketing", [
  "aceita_marketing",
  "marketing_cancelado_em",
])
export class WhatsAppLeadConsentimento {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    type: "varchar",
    length: 36,
    charset: "utf8mb4",
    collation: "utf8mb4_0900_ai_ci",
  })
  lead_id!: string;

  @OneToOne(() => MarketingLead, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({
    name: "lead_id",
  })
  lead!: MarketingLead;

  @Column({
    type: "varchar",
    length: 20,
  })
  telefone!: string;

  @Column({
    type: "boolean",
    default: true,
  })
  aceita_utilidade!: boolean;

  @Column({
    type: "boolean",
    default: false,
  })
  aceita_marketing!: boolean;

  @Column({
    type: "timestamp",
    nullable: true,
    default: null,
  })
  marketing_aceito_em?: Date | null;

  @Column({
    type: "varchar",
    length: 100,
    nullable: true,
  })
  marketing_origem?: string | null;

  @Column({
    type: "timestamp",
    nullable: true,
    default: null,
  })
  marketing_cancelado_em?: Date | null;

  @CreateDateColumn({
    type: "timestamp",
    name: "created_at",
  })
  created_at!: Date;

  @UpdateDateColumn({
    type: "timestamp",
    name: "updated_at",
  })
  updated_at!: Date;
}

export default WhatsAppLeadConsentimento;