import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from "typeorm";
import { Post } from "./Post";

export enum DesapegaCondicao {
  NOVO = "NOVO",
  SEMINOVO = "SEMINOVO",
  USADO = "USADO",
  PARA_REPARO = "PARA_REPARO",
}

@Entity({ name: "post_desapega" })
export class PostDesapega {
  @PrimaryColumn({ name: "post_id", type: "varchar", length: 36 })
  postId!: string;

  @OneToOne(() => Post, (p) => p.desapega, { onDelete: "CASCADE" })
  @JoinColumn({ name: "post_id" })
  post!: Post;

  @Column({ type: "enum", enum: DesapegaCondicao, default: DesapegaCondicao.USADO })
  condicao!: DesapegaCondicao;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  preco!: string | null;

  @Column({ name: "e_doacao", type: "tinyint", width: 1, default: 1 })
  eDoacao!: number;

  @Column({ name: "categoria_item", type: "varchar", length: 80, nullable: true })
  categoriaItem!: string | null;
}
