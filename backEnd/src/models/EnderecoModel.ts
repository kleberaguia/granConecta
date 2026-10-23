import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from "typeorm";

import { Usuario } from "./UserModels";
import { Condominio } from "./condominiosModels";

export enum EnderecoGeocodingStatus {
  PENDENTE = "PENDENTE",
  LOCALIZADO = "LOCALIZADO",
  FALHOU = "FALHOU",
}

export enum EnderecoGeocodingPrecision {
  NENHUMA = "NENHUMA",
  CEP = "CEP",
  VIA = "VIA",
  ENDERECO = "ENDERECO",
}

@Entity("enderecos")
export class Endereco {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  usuarioId!: string;

  @OneToOne(() => Usuario, (u) => u.endereco)
  @JoinColumn({ name: "usuarioId" })
  usuario!: Usuario;

  @Column({ nullable: true })
  condominio_id?: string;

  @ManyToOne(() => Condominio, { nullable: true })
  @JoinColumn({ name: "condominio_id" })
  condominio?: Condominio;

  // Campos para Interno
  @Column({ nullable: true })
  bloco_torre?: string;

  @Column({ nullable: true })
  unidade_apto?: string;

  // Campos para Externo
  @Column({ nullable: true })
  logradouro?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  bairro?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  cidade?: string;

  @Column({ type: "varchar", length: 2, nullable: true })
  uf?: string;

  @Column({ nullable: true })
  numero?: string;

  @Column({
    type: "varchar",
    length: 8,
    nullable: true,
  })
  cep?: string | null;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 7,
    nullable: true,
  })
  latitude?: string | null;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 7,
    nullable: true,
  })
  longitude?: string | null;

  @Column({
    type: "enum",
    enum: EnderecoGeocodingStatus,
    default: EnderecoGeocodingStatus.PENDENTE,
  })
  geocoding_status!: EnderecoGeocodingStatus;

  @Column({
    type: "enum",
    enum: EnderecoGeocodingPrecision,
    default: EnderecoGeocodingPrecision.NENHUMA,
  })
  geocoding_precision!: EnderecoGeocodingPrecision;

  /**
   * Controla se a localização/endereço poderá ser exibida
   * publicamente. O cálculo interno de distância não depende
   * deste campo.
   */
  @Column({
    type: "boolean",
    default: false,
  })
  localizacao_publica!: boolean;
}
