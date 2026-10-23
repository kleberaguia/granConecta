import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { Usuario } from "./UserModels";
import { Charge } from "./ChargeModel";

export enum SubscriptionStatus {
  ACTIVE = "active",
  CANCELED = "canceled",
  PAST_DUE = "past_due",
  PENDING = "pending"
}

export enum Frequencia {
  MONTHLY = "mensal",
  ANNUAL = "anual"
}

@Entity("subscriptions")
export class Subscription {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column()
  usuarioId!: string;

  @ManyToOne(() => Usuario, (u) => u.subscriptions)
  @JoinColumn({ name: 'usuarioId' })
  usuario!: Usuario;

  @Column({ type: "enum", enum: ['PRESTADOR', 'LOJA'] })
  tipo_objeto!: 'PRESTADOR' | 'LOJA';

  @Column({ type: "enum", enum: ["BASICO", "INTERMEDIARIO", "PREMIUM"] })
  plano!: string;

  @Column({ type: "enum", enum: ["mensal", "anual"] })
  frequencia!: string;

  @Column({ default: "pending" })
  status!: string;

  @Column({ type: "datetime" })
  createdAt!: Date;

  @Column({ type: "datetime" })
  end_date!: Date;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount!: number; // Valor fixo do plano (ex: 99.00)

  // @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  // total_price_paid!: number;

  @OneToMany(() => Charge, (charge) => charge.subscription)
  charges!: Charge[];
}