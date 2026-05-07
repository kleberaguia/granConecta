import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, Index, CreateDateColumn } from "typeorm";
import { Post } from "./Post";

@Entity({ name: "post_midias" })
@Index(["postId", "ordem"])
export class PostMidia {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ name: "post_id", type: "varchar", length: 36 })
  postId!: string;

  @ManyToOne(() => Post, (p) => p.midias, { onDelete: "CASCADE" })
  @JoinColumn({ name: "post_id" })
  post!: Post;

  @Column({ type: "text" })
  url!: string;

  @Column({ type: "int", default: 0 })
  ordem!: number;

  @CreateDateColumn({ name: "createdAt", type: "timestamp" })
  createdAt!: Date;
}
