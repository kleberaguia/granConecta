import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from "typeorm";

import { Usuario } from "./UserModels";
import { Product } from "./ProdutoModels";
import { PerfilPrestador } from "./PerfilPrestadorModel";
import { ServicoTipo } from "./ServicoTipoModels";
import { Estilo } from "./EstiloModels";
import { Category } from "./CategoryModels";
import { Order } from "./OrderModels";
import { DeliveryConfig } from "./DeliveryConfig";
import { StorePaymentConfig } from "./StorePaymentConfigModels";

@Entity("stores")
export class Store {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "char", length: 36 })
  usuarioId!: string;


  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "varchar", length: 100, unique: true })
  slug!: string;

  @Column({ type: "text", nullable: true })
  descricao_loja?: string;

  @Column({ type: "tinyint", width: 1, default: () => "1" })
  ativa!: boolean;

  @CreateDateColumn({ type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime" })
  updatedAt!: Date;

  @Column({ type: "varchar", length: 50, default: "modern" })
  preset!: string;

  @Column({ type: "json", nullable: true })
  layoutConfig?: any;

  @Column({ name: "chave_pix", type: "varchar", length: 255, nullable: true })
  chave_pix?: string;

  @Column({ name: "qrcode_pix_url", type: "varchar", length: 255, nullable: true })
  qrcode_pix_url?: string;

  @OneToMany(() => Product, (product) => product.store)
  products!: Product[];

  @Column({ type: "varchar", length: 36, nullable: true })
  condominio_id?: string;

  @OneToOne(() => PerfilPrestador) // ou ManyToOne
  @JoinColumn({ name: "usuarioId" })
  owner!: PerfilPrestador;

  @Column({ type: "varchar", length: 50, default: "CLEAN_MINIMAL" })
  templateId!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  logo_url?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  capa_url?: string;

  @Column({ type: "longtext", nullable: true })
  pageHtmlDraft?: string;

  @Column({ type: "longtext", nullable: true })
  pageHtmlPublished?: string | null;

  @Column({ type: "longtext", nullable: true })
  pageCssDraft?: string;

  @Column({ type: "varchar", length: 20, default: "loja" })
  tipo!: string;

  @Column({ type: "longtext", nullable: true })
  pageCssPublished?: string | null;

  @Column({ type: "json", nullable: true })
  pageSpecDraft?: any;

  @Column({ type: "json", nullable: true })
  pageSpecPublished?: any;

  @Column({ type: "varchar", length: 20, nullable: true })
  bodyBgColor?: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  footerBgColor?: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  footerTextColor?: string;

  // NOVAS COLUNAS
  @ManyToOne(() => Category, (category) => category.stores, { nullable: true })
  @JoinColumn({ name: "categoriaid" })
  category?: Category;

  @Column({ type: "int", nullable: true })// Permite NULL no Banco de Dados
  categoriaid?: number | null; // Permite NULL no TypeScript

  @OneToMany(() => Category, (category) => category.store)
  categories?: Category[];

  @Column({ type: "varchar", length: 150, nullable: true })
  categoria!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  categoria_tag?: string;

  @ManyToOne(() => Estilo)
  @JoinColumn({ name: "estilo_id" })
  estilo!: Estilo;

  @OneToMany(() => Order, order => order.store)
  orders!: Order[];

  @OneToOne(() => DeliveryConfig, (deliveryConfig) => deliveryConfig.store)
  deliveryConfig!: DeliveryConfig;

  @OneToOne(() => StorePaymentConfig, (config) => config.store)
  paymentConfig!: StorePaymentConfig;
}