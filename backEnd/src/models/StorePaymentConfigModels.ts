import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn
} from "typeorm";

import { Store } from "./StoreModels";

@Entity("store_payment_config")
export class StorePaymentConfig {

  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  store_id!: string;

  @OneToOne(() => Store)
  @JoinColumn({ name: "store_id" })
  store!: Store;

  @Column({ default: false })
  pix_enabled!: boolean;

  @Column({ nullable: true })
  pix_key!: string;

  @Column({ default: true })
  cash_enabled!: boolean;

  @Column({ default: false })
  card_terminal_enabled!: boolean;

  @Column({ default: false })
  mercado_pago_enabled!: boolean;

  @Column({ default: false })
  stripe_enabled!: boolean;

  @Column({ type: "json", nullable: true })
  accepted_methods!: string[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @Column({ nullable: true })
  mercadoPagoAccessToken!: string;

  @Column({ default: false })
  mercadoPagoEnabled!: boolean;

  @Column({ type: "varchar", length: 255, nullable: true })
  stripe_secret_key!: string;
}