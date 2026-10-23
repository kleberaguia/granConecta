import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

import { Condominio } from "./condominiosModels";

export enum CondominioUnidadeStatusValidacao {
  DECLARADA = "DECLARADA",
  VERIFICADA = "VERIFICADA",
  INVALIDA = "INVALIDA",
}

@Entity("condominio_unidades")
@Index(
  "UQ_condominio_unidade",
  ["condominio_id", "bloco_torre", "unidade_apto"],
  { unique: true }
)
@Index("IDX_condominio_unidades_codigo", ["codigo_unidade"], {
  unique: true,
})
export class CondominioUnidade {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    type: "varchar",
    length: 36,
  })
  condominio_id!: string;

  @ManyToOne(() => Condominio, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "condominio_id",
  })
  condominio!: Condominio;

  @Column({
    type: "varchar",
    length: 80,
  })
  bloco_torre!: string;

  @Column({
    type: "varchar",
    length: 30,
  })
  unidade_apto!: string;

  /**
   * Identificação permanente da unidade.
   *
   * Exemplos:
   * CHF-T2-1801
   * GRP-T35-104
   */
  @Column({
    type: "varchar",
    length: 80,
  })
  codigo_unidade!: string;

  @Column({
    type: "enum",
    enum: CondominioUnidadeStatusValidacao,
    default: CondominioUnidadeStatusValidacao.DECLARADA,
  })
  status_validacao!: CondominioUnidadeStatusValidacao;

  @CreateDateColumn({
    type: "datetime",
    name: "created_at",
  })
  created_at!: Date;

  @UpdateDateColumn({
    type: "datetime",
    name: "updated_at",
  })
  updated_at!: Date;
}

export default CondominioUnidade;