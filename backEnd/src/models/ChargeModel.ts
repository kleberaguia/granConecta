// src/entities/Charge.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index
} from "typeorm";
import { Subscription } from "./SubscriptionModel";
import { Usuario } from "./UserModels";

export enum ChargeStatus {
  PENDING = "pending",   // Alterado para minúsculo para bater com seu banco
  PAID = "paid",
  FAILED = "failed",
  CANCELED = "canceled"
}

@Entity("charges")
export class Charge {
    @PrimaryGeneratedColumn('increment')
    id!: number;

    @Column()
    subscriptionId!: number;

    @ManyToOne(() => Subscription, (sub) => sub.charges)
    @JoinColumn({ name: "subscriptionId" })
    subscription!: Subscription;

    @Column()
    usuarioId!: string;

    @ManyToOne(() => Usuario)
    @JoinColumn({ name: "usuarioId" })
    usuario!: Usuario;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    amount!: number;

    @Column({ default: 'pending' })
    status!: string; // 'pending', 'paid', 'expired'

    @Column({ nullable: true })
    txid!: string; // ID da transação no Banco/Gateway

    @Column({ type: "text", nullable: true })
    pix_copia_cola!: string;

    @Column({ nullable: true })
    pago_em!: Date;

    @CreateDateColumn()
    createdAt!: Date;

}