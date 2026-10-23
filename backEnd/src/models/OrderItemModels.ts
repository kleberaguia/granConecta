import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn
} from "typeorm";

import { Order } from "./OrderModels";
import { Product } from "./ProdutoModels";

@Entity("order_items")
export class OrderItem {

  @PrimaryGeneratedColumn()
  id!: number;

  // =========================
  // RELAÇÃO COM PEDIDO
  // =========================
  @ManyToOne(() => Order, (order) => order.items, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: "orderId" })
  order!: Order;

  @Column()
  orderId!: number;

  // =========================
  // RELAÇÃO COM PRODUTO
  // =========================
  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: "productId" })
  product?: Product;

  @Column({ nullable: true })
  productId?: string;

  // =========================
  // SNAPSHOT DO PRODUTO
  // (CRÍTICO PRA HISTÓRICO)
  // =========================
  @Column()
  name!: string;

  @Column({ nullable: true })
  image?: string;

  // =========================
  // QUANTIDADE E PREÇO
  // =========================
  @Column("int")
  quantity!: number;

  @Column("decimal", { precision: 10, scale: 2 })
  price!: number; // preço no momento da compra

}