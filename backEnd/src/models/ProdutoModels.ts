import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from "typeorm";
import { Store } from "./StoreModels";
import { Category } from "./CategoryModels";
// Importe a entidade Store se ela existir para criar o relacionamento
// import { Store } from "./Store"; 

@Entity("product")
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column({ type: "text", nullable: true })
  description!: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price!: number;

  @Column({ default: 0 })
  stock!: number;

  // Adicionado o campo status que o seu Controller tenta enviar
  @Column({ default: true })
  status!: boolean;

  @Column({ name: 'usuarioId' }) // ✅ Nova coluna mapeada
  usuarioId!: string;

  @Column({ name: "image_url", nullable: true })
  imageUrl!: string;

  @Column({ name: "store_id" })
  storeId!: string;

  @ManyToOne(() => Store, (store) => store.products)
  @JoinColumn({ name: "store_id" })
  store!: Store;

  @Column({ name: "category_id", nullable: true })
  categoryId!: string;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: "category_id" })
  category!: Category;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @Column({ name: 'foto_perfil', nullable: true })
  fotoPerfil!: string;

  @Column({ name: 'foto_hero', nullable: true })
  heroUrl!: string;

  @Column({ name: 'hero_video', nullable: true })
  videoUrl!: string;

  @Column({ name: 'section_image', nullable: true })
  sectionImageUrl!: string;

  // Importante: Mudado para 'simple-json' para o TypeORM converter o array automaticamente
  @Column({ name: 'hero_carousel', type: 'text', nullable: true })
  carouselImages!: string;

  @Column({ name: 'galeria', type: 'text', nullable: true })
  galeriaImages!: string;

  @Column({ name: 'layoutConfig', type: 'text', nullable: true })
  layoutConfig!: string;

  @Column({ nullable: true })
  link_contato!: string;

  @Column({ default: false })
  is_recorrente?: boolean;

  @Column({ nullable: true, default: 30 }) // Padrão 30 dias, mas editável
  dias_recorrencia?: number;
}