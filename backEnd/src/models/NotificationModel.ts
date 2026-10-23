import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn
} from "typeorm";
import { Usuario } from "./UserModels";

@Entity("notificacoes")
export class Notificacao {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.notificacoes, { onDelete: "CASCADE" })
  usuario!: Usuario;

  @Column()
  usuarioId!: string;

  @Column()
  titulo!: string;

  @Column("text")
  mensagem!: string;

  @Column({ default: false })
  lido!: boolean;

  @CreateDateColumn()
  dataCriacao!: Date;
}
