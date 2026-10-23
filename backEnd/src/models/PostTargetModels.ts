import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { Post } from "./Post";
import { Condominio } from "./condominiosModels";

@Entity("post_targets")
export class PostTarget {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Post, (post) => post.targets, { onDelete: "CASCADE" })
  @JoinColumn({ name: "post_id" })
  post!: Post;

  @ManyToOne(() => Condominio, (condominio) => condominio.postTargets, { onDelete: "CASCADE" })
  @JoinColumn({ name: "condominio_id" })
  condominio!: Condominio;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
