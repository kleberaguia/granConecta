import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn
} from "typeorm";
import { ServicoSolicitacao } from "./servicoSolicitacaoModels";
import { Usuario } from "./UserModels";

export enum StatusAgenda {
  SUGERIDO = "SUGERIDO",
  CONFIRMADO = "CONFIRMADO",
  CANCELADO = "CANCELADO"
}

@Entity("agenda")
export class Agenda {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => ServicoSolicitacao)
  servico!: ServicoSolicitacao;

  @ManyToOne(() => Usuario)
  morador!: Usuario;

  @ManyToOne(() => Usuario)
  prestador!: Usuario;

  @Column()
  data!: string;

  @Column()
  hora!: string;

  @Column({
    type: "enum",
    enum: StatusAgenda,
    default: StatusAgenda.SUGERIDO
  })
  status!: StatusAgenda;

  @CreateDateColumn()
  criadoEm!: Date;
}
