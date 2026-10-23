import { Entity, PrimaryColumn, Column, CreateDateColumn, Index } from "typeorm";

@Entity({ name: "post_views" })
@Index(["postId", "usuarioId"], { unique: true })
export class PostView {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ name: "post_id", type: "varchar", length: 36 })
  postId!: string;

  @Column({ name: "usuario_id", type: "varchar", length: 36 })
  usuarioId!: string;

  @CreateDateColumn({ name: "visto_em", type: "timestamp" })
  vistoEm!: Date;

}
