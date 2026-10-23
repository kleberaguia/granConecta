// Content.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Secao } from "./secaoModels";
import { Usuario } from "./UserModels";

@Entity()
export class Content {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ unique: true })
  slug!: string; // URL amigável, ex: "sobre-nos"

  @Column("text")
  body!: string;

  @ManyToOne(() => Secao, section => section.contents)
  section!: Secao;

  @ManyToOne(() => Usuario, user => user.id)
  createdBy!: Usuario;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
