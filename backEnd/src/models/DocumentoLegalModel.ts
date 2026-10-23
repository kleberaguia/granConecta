import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn
} from "typeorm";

@Entity("documentos_legais")
export class DocumentoLegal {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  tipo!: string; // TERMOS_USO, PRIVACIDADE, PRESTADOR, EMPREENDEDOR

  @Column()
  titulo!: string;

  @Column()
  versao!: string;

  @Column("longtext")
  conteudo!: string;

  @Column({ nullable: true })
  arquivo_url?: string;

  @Column({ default: true })
  ativo!: boolean;

  @Column({ default: true })
  obrigatorio!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}