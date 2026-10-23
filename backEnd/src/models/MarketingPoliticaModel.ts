import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { MarketingCanal } from "./MarketingCampanhaCanalModel";

@Entity("marketing_politicas")
@Index("uk_marketing_politica_escopo", ["escopo"], { unique: true })
export class MarketingPolitica {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: number;

  /** GLOBAL ou o nome do canal, por exemplo WHATSAPP. */
  @Column({ type: "varchar", length: 40 })
  escopo!: "GLOBAL" | MarketingCanal;

  @Column({ type: "enum", enum: MarketingCanal, nullable: true })
  canal?: MarketingCanal | null;

  @Column({ type: "boolean", default: true })
  ativo!: boolean;

  @Column({ type: "int", unsigned: true, default: 7 })
  intervalo_minimo_horas!: number;

  @Column({ type: "int", unsigned: true, default: 2 })
  maximo_7_dias!: number;

  @Column({ type: "int", unsigned: true, default: 6 })
  maximo_30_dias!: number;

  @Column({ type: "int", unsigned: true, default: 14 })
  intervalo_mesmo_anunciante_dias!: number;

  @Column({ type: "json", nullable: true })
  configuracao?: Record<string, unknown> | null;

  @CreateDateColumn({ type: "datetime", name: "createdAt" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime", name: "updatedAt" })
  updatedAt!: Date;
}

export default MarketingPolitica;
