import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, Index, CreateDateColumn } from "typeorm";
import { Post } from "./Post";

export enum InteresseStatus {
  ENVIADO = "ENVIADO",
  LIDO = "LIDO",
  RESPONDIDO = "RESPONDIDO",
  CANCELADO = "CANCELADO",
}

@Entity({ name: "post_interesses" })
@Index(["postId", "createdAt"])
export class PostInteresse {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ name: "post_id", type: "varchar", length: 36 })
  postId!: string;

  @ManyToOne(() => Post, (p) => p.interesses, { onDelete: "CASCADE" })
  @JoinColumn({ name: "post_id" })
  post!: Post;

  @Column({ name: "interessado_id", type: "varchar", length: 36 })
  interessadoId!: string;

  @Column({ type: "text", nullable: true })
  mensagem!: string | null;

  @Column({ type: "enum", enum: InteresseStatus, default: InteresseStatus.ENVIADO })
  status!: InteresseStatus;

  @CreateDateColumn({ name: "createdAt", type: "timestamp" })
  createdAt!: Date;
}
