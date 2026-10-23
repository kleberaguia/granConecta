import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Aviso } from "./AvisoModels";

@Entity({ name: "aviso_targets" })
export class AvisoTarget {
  @PrimaryColumn({ name: "aviso_id", type: "varchar", length: 36 })
  avisoId!: string;

  @PrimaryColumn({ name: "condominio_id", type: "varchar", length: 36 })
  condominio_id!: string;

  @ManyToOne(() => Aviso, (a) => a.targets, { onDelete: "CASCADE" })
  @JoinColumn({ name: "aviso_id" })
  aviso!: Aviso;
}
