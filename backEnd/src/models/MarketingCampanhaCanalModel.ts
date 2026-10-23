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

export enum MarketingCanal {
  WHATSAPP = "WHATSAPP",
  EMAIL = "EMAIL",
  NOTIFICACAO = "NOTIFICACAO",
  BANNER = "BANNER",
  PUSH = "PUSH",
  FACEBOOK_ADS = "FACEBOOK_ADS",
  INSTAGRAM_ADS = "INSTAGRAM_ADS",
  FACEBOOK_ORGANICO = "FACEBOOK_ORGANICO",
  INSTAGRAM_ORGANICO = "INSTAGRAM_ORGANICO",
  SMS = "SMS",
  YOUTUBE_ORGANICO = "YOUTUBE_ORGANICO",
  YOUTUBE_ADS = "YOUTUBE_ADS",
  GRANCONECTA = "GRANCONECTA",
}

export enum MarketingCanalStatus {
  RASCUNHO = "RASCUNHO",
  CONFIGURADO = "CONFIGURADO",
  AGENDADO = "AGENDADO",
  PROCESSANDO = "PROCESSANDO",
  CONCLUIDO = "CONCLUIDO",
  FALHOU = "FALHOU",
  CANCELADO = "CANCELADO",
}

export type MarketingCanalConfiguracao = {
  titulo?: string;
  mensagem?: string;
  legenda?: string;
  imagemUrl?: string;
  linkDestino?: string;
  dataFim?: string;
  templateNome?: string;
  assunto?: string;
  institucional?: boolean;

  /** Contêiner de mídia criado antes da publicação no Instagram. */
  instagramContainerId?: string;

  /** Identificador definitivo da publicação no Instagram. */
  instagramMediaId?: string;

  /** Endereço público da publicação retornado pela Meta. */
  instagramPermalink?: string;

  /** Data de publicação retornada pela Meta. */
  instagramPublicadoEm?: string;

  [chave: string]: unknown;
};

@Entity("marketing_campanha_canais")
@Index("uk_campanha_canal", ["campanha_id", "canal"], {
  unique: true,
})
@Index("idx_campanha_canal_status", ["status"])
export class MarketingCampanhaCanal {
  @PrimaryGeneratedColumn({
    type: "bigint",
    unsigned: true,
  })
  id!: number;

  @Column({
    type: "bigint",
    unsigned: true,
  })
  campanha_id!: number;

  @ManyToOne(() => MarketingCampanha, (campanha) => campanha.canais, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({
    name: "campanha_id",
    foreignKeyConstraintName: "fk_marketing_canal_campanha",
  })
  campanha!: MarketingCampanha;

  @Column({
    type: "enum",
    enum: MarketingCanal,
  })
  canal!: MarketingCanal;

  @Column({
    type: "enum",
    enum: MarketingCanalStatus,
    default: MarketingCanalStatus.RASCUNHO,
  })
  status!: MarketingCanalStatus;

  @Column({
    type: "json",
    nullable: true,
  })
  configuracao?: MarketingCanalConfiguracao | null;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
  })
  external_id?: string | null;

  @Column({ type: "int", unsigned: true, default: 0 })
  total_destinatarios!: number;

  @Column({ type: "int", unsigned: true, default: 0 })
  total_enviados!: number;

  @Column({ type: "int", unsigned: true, default: 0 })
  total_entregues!: number;

  @Column({ type: "int", unsigned: true, default: 0 })
  total_abertos!: number;

  @Column({ type: "int", unsigned: true, default: 0 })
  total_visualizacoes!: number;

  @Column({ type: "int", unsigned: true, default: 0 })
  total_cliques!: number;

  @Column({ type: "int", unsigned: true, default: 0 })
  total_conversoes!: number;

  @Column({ type: "int", unsigned: true, default: 0 })
  total_falhas!: number;

  @Column({ type: "datetime", nullable: true })
  iniciado_em?: Date | null;

  @Column({ type: "datetime", nullable: true })
  concluido_em?: Date | null;

  @Column({ type: "text", nullable: true })
  ultimo_erro?: string | null;

  @CreateDateColumn({ type: "datetime", name: "createdAt" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime", name: "updatedAt" })
  updatedAt!: Date;
}

export default MarketingCampanhaCanal;
