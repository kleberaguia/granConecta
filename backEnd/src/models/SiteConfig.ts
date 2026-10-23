import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  Index
} from 'typeorm';

@Entity('site_configs')
export class SiteConfig {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index({ unique: true })
  @Column()
  key!: string;

  // --- AQUI ESTÁ A MUDANÇA ---
  // "simple-json" funciona em MySQL, SQLite, Postgres, etc.
  // Ele grava como texto no banco, mas entrega como Objeto no código.
  @Column('simple-json') 
  data: any; 

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;
}