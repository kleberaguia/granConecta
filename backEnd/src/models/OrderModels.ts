import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn
} from "typeorm";

import { OrderItem } from "./OrderItemModels";
import { Usuario } from "./UserModels";
import { Store } from "./StoreModels";

// =========================
// STATUS (EXPANDIDO)
// =========================
export enum OrderStatus {
  PENDING = "pendente",
  PAID = "pago",
  PREPARING = "em_preparo",
  DELIVERING = "em_transporte",
  DELIVERED = "entregue",
  CANCELED = "cancelado"
}

// =========================
// TIPO DE PEDIDO
// =========================
export enum OrderType {
  PRODUCT = "produto",
  SERVICE = "servico"
}

// =========================
// ENTREGA
// =========================
export enum DeliveryMode {
  DELIVERY = "entrega",
  PICKUP = "retirada"
}

@Entity("orders")
export class Order {

  @PrimaryGeneratedColumn()
  id!: number;

  // =========================
  // RELAÇÕES
  // =========================
  @ManyToOne(() => Usuario, (user) => user.orders, { nullable: true })
  @JoinColumn({ name: "customerId" })
  customer?: Usuario;

  @Column({ nullable: true })
  customerId?: string;

  @ManyToOne(() => Store, store => store.orders)
  @JoinColumn({ name: "storeId" })
  store?: Store;

  @Column({ nullable: true })
  storeId?: string;


  // =========================
  // ITENS
  // =========================
  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true
  })
  items!: OrderItem[];

  // =========================
  // VALORES
  // =========================
  @Column("decimal", { precision: 10, scale: 2 })
  totalAmount!: number;

  // =========================
  // STATUS
  // =========================
  @Column({
    type: "enum",
    enum: OrderStatus,
    default: OrderStatus.PENDING
  })
  status!: OrderStatus;

  // =========================
  // PAGAMENTO
  // =========================
  @Column()
  paymentMethod!: string;

  @Column({ type: "json", nullable: true })
  payment_data?: any;

  // =========================
  // ENTREGA
  // =========================
  @Column({ nullable: true })
  deliveryAddress?: string;

  @Column({
    type: "enum",
    enum: DeliveryMode,
    default: DeliveryMode.DELIVERY
  })
  deliveryMode!: DeliveryMode;

  // =========================
  // TIPO DO PEDIDO
  // =========================
  @Column({
    type: "enum",
    enum: OrderType,
    default: OrderType.PRODUCT
  })
  orderType!: OrderType;

  // =========================
  // TEMPO ESTIMADO
  // =========================
  @Column({ default: 30 })
  estimatedTime!: number;

  // =========================
  // OBSERVAÇÃO
  // =========================
  @Column({ type: "text", nullable: true })
  customerNotes?: string;

  // =========================
  // DATAS
  // =========================
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: "varchar", name: "condominio_id", nullable: true }) // 👈 Adicionado o type: "varchar" explicitamente
  condominio_Id?: string | null;
  @Column({ nullable: true })
  deliveryCode?: string;

  @Column({ nullable: true })
  deliveryValidationIp?: string;

  @Column({ type: "timestamp", nullable: true })
  deliveredAt?: Date;

}