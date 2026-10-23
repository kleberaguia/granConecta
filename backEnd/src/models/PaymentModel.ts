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
  PENDING = "PENDING",
  PAID = "PAID",
  FAILED = "FAILED",
  CANCELED = "CANCELED",
  REFUNDED = 'REFUNDED',
  IN_PROCESS = 'IN_PROCESS'
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

  @Column({ type: "enum", enum: ["MENSAL", "TRIMESTRAL", "ANUAL"], nullable: true })
  frequencia?: "MENSAL" | "TRIMESTRAL" | "ANUAL" | null;

  @Column({ nullable: true })
  tipo!: string; // PRESTADOR | EMPREENDEDOR

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
  @Column({ nullable: true })
  mercado_pago_preference_id?: string;
  @Column({ nullable: true })
  mercado_pago_payment_id?: string;
  @Column({ nullable: true })
  mercado_pago_merchant_order_id?: string;
}