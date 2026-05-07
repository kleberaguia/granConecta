import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn
} from "typeorm";

import { Product } from "./ProdutoModels";
import { Store } from "./StoreModels";
import { GrupoHome } from "./GrupoHomeModel";

@Entity("categories")
export class Category {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ default: 'PRODUTO' })
  tipo!: string;

  @Column({ nullable: true })
  storeId?: string | null;

  // 🔗 Categoria pertence a uma loja (opcional)
  @ManyToOne(() => Store, (store) => store.categories, { nullable: true })
  @JoinColumn({ name: "storeId" })
  store?: Store;

  // 🔗 Produtos da categoria
  @OneToMany(() => Product, (product) => product.category)
  products?: Product[];

  // 🔗 Lojas que usam essa categoria
  @OneToMany(() => Store, (store) => store.category)
  stores?: Store[];

  @ManyToOne(() => GrupoHome, (grupo) => grupo.categorias)
  @JoinColumn({ name: "grupo_id" })
  grupo?: GrupoHome;

  @Column({ nullable: true })
  grupo_id?: number;

  @Column({ name: "urlCategoria", nullable: true })
  urlCategoria?: string;
}