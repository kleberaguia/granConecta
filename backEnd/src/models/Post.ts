import {
  Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index,
  OneToMany, OneToOne,
  ManyToOne,
  JoinColumn
} from "typeorm";
import { PostMidia } from "./PostMidia";
import { PostInteresse } from "./PostInteresse";
import { PostGaragem } from "./PostGaragem";
import { PostDesapega } from "./PostDesapega";
import { PostAnimal } from "./PostAnimal";
import { Usuario } from "./UserModels";
import { PostTarget } from "./PostTargetModels";

export enum PostCategoria {
  VAGA_GARAGEM = "VAGA_GARAGEM",
  DESAPEGA = "DESAPEGA",
  ANIMAIS = "ANIMAIS",
  SERVICOS = "SERVICOS",
  OUTROS = "OUTROS",
}

export enum PostStatus {
  ATIVO = "ATIVO",
  PAUSADO = "PAUSADO",
  FECHADO = "FECHADO",
  REMOVIDO = "REMOVIDO",
}

export enum PostVisibilidade {
  CONDOMINIO = "CONDOMINIO",
  REDE = "REDE",
  ALVO = "ALVO",
}

@Entity({ name: "posts" })
@Index(["condominio_id", "categoria", "status"])
@Index(["condominio_id", "createdAt"])
export class Post {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ name: "condominio_id", type: "varchar", length: 36 })
  condominio_id!: string;

  @Column({ name: "autor_id", type: "varchar", length: 36 })
  autor_id!: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: "autor_id" }) // Isso diz ao TypeORM que 'autor' se liga via 'autor_id'
  autor!: Usuario;

  @Column({ type: "enum", enum: PostCategoria })
  categoria!: PostCategoria;

  @Column({ type: "varchar", length: 255 })
  titulo!: string;

  @Column({ type: "text" })
  descricao!: string;

  @Column({ type: "enum", enum: PostStatus, default: PostStatus.ATIVO })
  status!: PostStatus;

  @Column({ type: "tinyint", width: 1, default: 0 })
  destaque!: number;

  @CreateDateColumn({ name: "createdAt", type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updatedAt", type: "timestamp" })
  updatedAt!: Date;

  @OneToMany(() => PostMidia, (m) => m.post, { cascade: true })
  midias!: PostMidia[];

  @OneToMany(() => PostInteresse, (i) => i.post)
  interesses!: PostInteresse[];

  @OneToOne(() => PostGaragem, (g) => g.post)
  garagem?: PostGaragem;

  @OneToOne(() => PostDesapega, (d) => d.post)
  desapega?: PostDesapega;

  @OneToOne(() => PostAnimal, (a) => a.post)
  animal?: PostAnimal;

  @OneToMany(() => PostTarget, (target) => target.post)
  targets!: PostTarget[];

  @Column({ type: "enum", enum: PostVisibilidade, default: PostVisibilidade.CONDOMINIO })
  visibilidade!: PostVisibilidade
}
