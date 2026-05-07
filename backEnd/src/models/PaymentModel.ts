// src/models/PaymentModel.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from "typeorm";
import { Usuario } from "./UserModels";

export enum PaymentStatus {
  PENDING     = "PENDING",
  PAID        = "PAID",
  FAILED      = "FAILED",
  CANCELED    = "CANCELED",
  REFUNDED    = 'REFUNDED',
  IN_PROCESS  = 'IN_PROCESS'
}

@Entity("payments")
export class Payment {

  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  usuarioId!: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: "usuarioId" })
  usuario!: Usuario;

  @Column({ nullable: true })
  stripeSessionId!: string;

  @Column({
    type: "enum",
    enum: PaymentStatus,
    default: PaymentStatus.PENDING
  })
  status!: PaymentStatus;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount!: number;

  @Column({ nullable: true })
  paymentMethod!: string; // card | pix

  @Column({ nullable: true })
  plano!: string;

  @Column({ nullable: true })
  tipo!: string; // PRESTADOR | EMPREENDEDOR

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}