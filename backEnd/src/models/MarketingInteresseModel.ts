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

import { MarketingLead } from "./MarketingLeadModel";

export enum MarketingInteresseOrigem {
  LANDING_PAGE = "LANDING_PAGE",
  BANNER = "BANNER",
  BUSCA = "BUSCA",
  CHAT = "CHAT",
  WHATSAPP = "WHATSAPP",
  INSTAGRAM = "INSTAGRAM",
  FACEBOOK = "FACEBOOK",
  YOUTUBE = "YOUTUBE",
  PEDIDO = "PEDIDO",
  MANUAL = "MANUAL",
}

@Entity("marketing_interesses")
@Index("uk_marketing_interesse_lead_categoria", ["lead_id", "categoria"], {
  unique: true,
})
@Index("idx_marketing_interesse_categoria_pontuacao", ["categoria", "pontuacao"])
export class MarketingInteresse {
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
    foreignKeyConstraintName: "fk_marketing_interesse_lead",
  })
  lead!: MarketingLead;

  @Column({ type: "varchar", length: 120 })
  categoria!: string;

  @Column({ type: "enum", enum: MarketingInteresseOrigem })
  origem!: MarketingInteresseOrigem;

  @Column({ type: "int", unsigned: true, default: 1 })
  pontuacao!: number;

  @Column({ type: "datetime", nullable: true })
  ultima_interacao_em?: Date | null;

  @CreateDateColumn({ type: "datetime", name: "createdAt" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime", name: "updatedAt" })
  updatedAt!: Date;
}

export default MarketingInteresse;
