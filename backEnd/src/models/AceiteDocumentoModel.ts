import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn
} from "typeorm";

@Entity("aceite_documentos")
export class AceiteDocumento {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ nullable: true })
  usuarioId?: string;

  @Column()
  email!: string;

  @Column()
  documentoId!: string;

  @Column()
  tipo_usuario!: string;

  @Column({ default: true })
  aceito!: boolean;

  @Column({ nullable: true })
  ip_aceite?: string;

  @Column("text", { nullable: true })
  user_agent?: string;

  @CreateDateColumn()
  data_aceite!: Date;

  @Column()
  versao_documento!: string;

  @Column({
    type: "varchar",
    length: 100,
    nullable: true,
  })
  ip_address?: string;

 
}