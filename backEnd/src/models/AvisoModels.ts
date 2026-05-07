import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index
} from "typeorm";
import { Usuario } from "./UserModels";
import { AvisoTarget } from "./AvisoTarget";

export enum AvisoTipo {
  GERAL = "GERAL",
  ASSEMBLEIA = "ASSEMBLEIA",
  MANUTENCAO = "MANUTENCAO",
  CLASSIFICADOS = "CLASSIFICADOS",
}

export enum AvisoVisibilidade {
  CONDOMINIO = "CONDOMINIO",
  REDE = "REDE",
  ALVO = "ALVO",
}

@Entity("avisos")
@Index(["condominio_id", "status"])
@Index(["visibilidade", "status"])
export class Aviso {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  titulo!: string;

  @Column("text")
  conteudo!: string;

  @Column({
    type: "enum",
    enum: AvisoTipo,
    default: AvisoTipo.CLASSIFICADOS,
  })
  tipo!: AvisoTipo;

  @Column({ default: "ATIVO" }) // ATIVO, ENCERRADO, ARQUIVADO
  status!: string;

  // você usa boolean, ok. No SQL original era tinyint. Mantém boolean.
  @Column({ type: "tinyint", width: 1, default: 0 })
  prioridade!: boolean;

  @Column()
  condominio_id!: string;

  @Column()
  autor_id!: string;

  // ✅ NOVO: visibilidade (CONDOMINIO | REDE | ALVO)
  @Column({
    type: "enum",
    enum: AvisoVisibilidade,
    default: AvisoVisibilidade.CONDOMINIO,
  })
  visibilidade!: AvisoVisibilidade;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: "autor_id" })
  autor!: Usuario;

  // ✅ NOVO: targets (só faz sentido quando visibilidade = ALVO)
  @OneToMany(() => AvisoTarget, (t) => t.aviso, { cascade: true })
  targets!: AvisoTarget[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
