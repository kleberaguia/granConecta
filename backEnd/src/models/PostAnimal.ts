import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from "typeorm";
import { Post } from "./Post";

export enum AnimalTipo {
  DOACAO = "DOACAO",
  ACHADO = "ACHADO",
  PERDIDO = "PERDIDO",
}
export enum AnimalEspecie {
  CAO = "CAO",
  GATO = "GATO",
  OUTRO = "OUTRO",
}
export enum AnimalSexo {
  M = "M",
  F = "F",
  NAO_INFORMADO = "NAO_INFORMADO",
}
export enum AnimalPorte {
  PEQUENO = "PEQUENO",
  MEDIO = "MEDIO",
  GRANDE = "GRANDE",
  NAO_INFORMADO = "NAO_INFORMADO",
}

@Entity({ name: "post_animais" })
export class PostAnimal {
  @PrimaryColumn({ name: "post_id", type: "varchar", length: 36 })
  postId!: string;

  @OneToOne(() => Post, (p) => p.animal, { onDelete: "CASCADE" })
  @JoinColumn({ name: "post_id" })
  post!: Post;

  @Column({ type: "enum", enum: AnimalTipo })
  tipo!: AnimalTipo;

  @Column({ type: "enum", enum: AnimalEspecie, default: AnimalEspecie.OUTRO })
  especie!: AnimalEspecie;

  @Column({ type: "enum", enum: AnimalSexo, default: AnimalSexo.NAO_INFORMADO })
  sexo!: AnimalSexo;

  @Column({ type: "enum", enum: AnimalPorte, default: AnimalPorte.NAO_INFORMADO })
  porte!: AnimalPorte;

  @Column({ type: "tinyint", width: 1, nullable: true })
  vacinado!: number | null;

  @Column({ type: "tinyint", width: 1, nullable: true })
  castrado!: number | null;
}
