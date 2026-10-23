import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("plans")
export class Plan {
  @PrimaryColumn({
    type: "varchar",
    length: 50,
  })
  id!: string; // PREMIUM

  @Column({
    type: "varchar",
    length: 100,
  })
  titulo!: string;

  /*
   * Valores das três periodicidades
   */

  @Column("decimal", {
    precision: 10,
    scale: 2,
  })
  preco_mensal!: number;

  /*
   * Temporariamente nullable para permitir
   * a atualização dos registros existentes.
   */
  @Column("decimal", {
    precision: 10,
    scale: 2,
    nullable: true,
  })
  preco_trimestral!: number | null;

  @Column("decimal", {
    precision: 10,
    scale: 2,
  })
  preco_anual!: number;

  /*
   * Recursos disponíveis no plano
   */

  @Column("json")
  vantagens!: string[];

  @Column({
    type: "boolean",
    default: false,
  })
  destaque!: boolean;

  @Column({
    type: "boolean",
    default: true,
  })
  ativo!: boolean;

  /*
   * Stripe
   */

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
  })
  stripe_product_id!: string | null;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
  })
  stripe_price_mensal_id!: string | null;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
  })
  stripe_price_trimestral_id!: string | null;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
  })
  stripe_price_anual_id!: string | null;

  /*
   * Mercado Pago
   */

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
  })
  mercado_pago_plan_mensal_id!: string | null;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
  })
  mercado_pago_plan_trimestral_id!: string | null;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
  })
  mercado_pago_plan_anual_id!: string | null;

  /*
   * Datas
   */

  @CreateDateColumn({
    type: "timestamp",
  })
  created_at!: Date;

  @UpdateDateColumn({
    type: "timestamp",
  })
  updated_at!: Date;
}