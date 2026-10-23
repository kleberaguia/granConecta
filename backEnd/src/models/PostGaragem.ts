import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from "typeorm";
import { Post } from "./Post";

export enum GaragemOperacao {
  OFERECO = "OFERECO",
  PRECISO = "PRECISO",
}
export enum GaragemTipoVaga {
  ALUGUEL = "ALUGUEL",
  EMPRESTIMO = "EMPRESTIMO",
}

@Entity({ name: "post_garagem" })
export class PostGaragem {
  @PrimaryColumn({ name: "post_id", type: "varchar", length: 36 })
  postId!: string;

  @OneToOne(() => Post, (p) => p.garagem, { onDelete: "CASCADE" })
  @JoinColumn({ name: "post_id" })
  post!: Post;

  @Column({ type: "enum", enum: GaragemOperacao })
  operacao!: GaragemOperacao;

  @Column({ name: "tipo_vaga", type: "enum", enum: GaragemTipoVaga })
  tipoVaga!: GaragemTipoVaga;

  @Column({ name: "valor_mensal", type: "decimal", precision: 10, scale: 2, nullable: true })
  valorMensal!: string | null; // TypeORM costuma trazer decimal como string

  @Column({ type: "varchar", length: 50, nullable: true })
  bloco!: string | null;

  @Column({ name: "vaga_codigo", type: "varchar", length: 50, nullable: true })
  vagaCodigo!: string | null;

  @Column({ type: "text", nullable: true })
  observacoes!: string | null;
}
