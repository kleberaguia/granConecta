import { Entity, PrimaryColumn, Column, CreateDateColumn, Index } from "typeorm";

@Entity({ name: "aviso_views" })
@Index(["avisoId", "usuarioId"], { unique: true })
export class AvisoView {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ name: "aviso_id", type: "varchar", length: 36 })
  avisoId!: string;

  @Column({ name: "usuario_id", type: "varchar", length: 36 })
  usuarioId!: string;

  @CreateDateColumn({ name: "visto_em", type: "timestamp" })
  vistoEm!: Date;
}
