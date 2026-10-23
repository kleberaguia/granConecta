import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { Usuario } from "./UserModels";

@Entity("whatsapp_consentimentos")
export class WhatsAppConsentimento {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    type: "varchar",
    length: 36,
    charset: "utf8mb4",
    collation: "utf8mb4_0900_ai_ci",
    unique: true,
  })
  usuarioId!: string;

  @OneToOne(() => Usuario, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({
    name: "usuarioId",
  })
  usuario!: Usuario;

  @Column({
    type: "varchar",
    length: 20,
  })
  telefone!: string;

  @Column({
    type: "boolean",
    default: true,
  })
  aceita_utilidade!: boolean;

  @Column({
    type: "boolean",
    default: false,
  })
  aceita_marketing!: boolean;

  @Column({
    type: "timestamp",
    nullable: true,
    default: null,
  })
  marketing_aceito_em?: Date | null;

  @Column({
    type: "varchar",
    length: 100,
    nullable: true,
  })
  marketing_origem?: string | null;

  @Column({
    type: "timestamp",
    nullable: true,
    default: null,
  })
  marketing_cancelado_em?: Date | null;

  @CreateDateColumn({
    type: "timestamp",
    name: "created_at",
  })
  created_at!: Date;

  @UpdateDateColumn({
    type: "timestamp",
    name: "updated_at",
  })
  updated_at!: Date;
}