import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("lista_desejos")
export class ListaDesejos {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  loja_id!: string;

  @Column({ nullable: true })
  produto_id!: string;

  @Column()
  nome!: string;

  @Column()
  telefone!: string;

  @Column({ nullable: true })
  email!: string;

  @Column("text", { nullable: true })
  observacao!: string;

  @Column({ default: true })
  aceita_marketing!: boolean;

  @Column({
    default: "NOVO"
  })
  status!: string;

  @CreateDateColumn()
  created_at!: Date;
}