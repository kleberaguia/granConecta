import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  OneToOne, 
  JoinColumn, 
  CreateDateColumn, 
  UpdateDateColumn 
} from "typeorm";
import { Store } from "./StoreModels"; // Importe sua entidade de Loja

@Entity("delivery_configs")
export class DeliveryConfig {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ default: true })
  acceptDelivery!: boolean;

  @Column({ default: true })
  acceptPickup!: boolean;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  deliveryFee!: number;

  @Column({ nullable: true })
  estimatedTime!: string; // Ex: "30-60 min" ou "1 dia útil"

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  minOrderValue!: number;

  @Column({ type: "int", nullable: true })
  storeId!: string;

  @OneToOne(() => Store, (store) => store.deliveryConfig)
  @JoinColumn({ name: "storeId" })
  store!: Store;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}