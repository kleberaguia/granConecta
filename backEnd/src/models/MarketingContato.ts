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
import {
  MarketingCampanhaCanal,
  MarketingCanal,
} from "./MarketingCampanhaCanalModel";
import { MarketingLead } from "./MarketingLeadModel";

export enum MarketingContatoResultado {
  AGENDADO = "AGENDADO",
  ENVIADO = "ENVIADO",
  ENTREGUE = "ENTREGUE",
  VISUALIZADO = "VISUALIZADO",
  LIDO = "LIDO",
  CLICOU = "CLICOU",
  RESPONDEU = "RESPONDEU",
  CONVERTEU = "CONVERTEU",
  FALHOU = "FALHOU",
  CANCELADO = "CANCELADO",
}

@Entity("marketing_contatos")
@Index("idx_marketing_contato_lead_data", ["lead_id", "contato_em"])
@Index("idx_marketing_contato_lead_canal_data", ["lead_id", "canal", "contato_em"])
@Index("idx_marketing_contato_campanha", ["campanha_id"])
export class MarketingContato {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: number;

  @Column({
    type: "varchar",
    length: 36,
    charset: "utf8mb4",
    collation: "utf8mb4_unicode_ci",
  })
  lead_id!: string;

  @ManyToOne(() => MarketingLead, { onDelete: "CASCADE", onUpdate: "CASCADE" })
  @JoinColumn({ name: "lead_id", foreignKeyConstraintName: "fk_marketing_contato_lead" })
  lead!: MarketingLead;

  @Column({ type: "bigint", unsigned: true, nullable: true })
  campanha_id?: number | null;

  @ManyToOne(() => MarketingCampanha, { nullable: true, onDelete: "SET NULL", onUpdate: "CASCADE" })
  @JoinColumn({ name: "campanha_id", foreignKeyConstraintName: "fk_marketing_contato_campanha" })
  campanha?: MarketingCampanha | null;

  @Column({ type: "bigint", unsigned: true, nullable: true })
  canal_id?: number | null;

  @ManyToOne(() => MarketingCampanhaCanal, { nullable: true, onDelete: "SET NULL", onUpdate: "CASCADE" })
  @JoinColumn({ name: "canal_id", foreignKeyConstraintName: "fk_marketing_contato_canal" })
  campanha_canal?: MarketingCampanhaCanal | null;

  @Column({ type: "enum", enum: MarketingCanal })
  canal!: MarketingCanal;

  @Column({ type: "enum", enum: MarketingContatoResultado })
  resultado!: MarketingContatoResultado;

  @Column({ type: "datetime" })
  contato_em!: Date;

  @Column({ type: "varchar", length: 36, charset: "utf8mb4", collation: "utf8mb4_unicode_ci", nullable: true })
  anunciante_id?: string | null;

  @Column({ type: "varchar", length: 20, nullable: true })
  anunciante_tipo?: "LOJA" | "PRESTADOR" | "GRANCONECTA" | null;

  @Column({ type: "json", nullable: true })
  metadata?: Record<string, unknown> | null;

  @CreateDateColumn({ type: "datetime", name: "createdAt" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime", name: "updatedAt" })
  updatedAt!: Date;
}

export default MarketingContato;
