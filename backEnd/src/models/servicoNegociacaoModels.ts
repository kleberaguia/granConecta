import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from "typeorm";
import { ServicoCandidatura } from "./servicoCandidatura";
import { Usuario } from "./UserModels";

@Entity("servico_negociacao")
export class ServicoNegociacao {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  candidaturaId!: string;

  @Column()
  usuarioId!: string;

  @Column("decimal", { precision: 10, scale: 2 })
  valor!: number;

  @Column("text", { nullable: true })
  mensagem!: string;

  @CreateDateColumn()
  createdAt!: Date;

  // RELAÇÕES
  @ManyToOne(() => ServicoCandidatura, (candidatura) => candidatura.negociacoes)
  @JoinColumn({ name: "candidaturaId" })
  candidatura!: ServicoCandidatura;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: "usuarioId" })
  autor!: Usuario;
}