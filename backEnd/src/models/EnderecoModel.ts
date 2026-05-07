import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Usuario } from './UserModels';
import { Condominio } from './condominiosModels';


@Entity('enderecos')
export class Endereco {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  usuarioId!: string;

  @OneToOne(() => Usuario, (u) => u.endereco)
  @JoinColumn({ name: 'usuarioId' })
  usuario!: Usuario;

  @Column({ nullable: true })
  condominio_id?: string;

  @ManyToOne(() => Condominio, { nullable: true })
  @JoinColumn({ name: "condominio_id" })
  condominio?: Condominio;

  // Campos para Interno
  @Column({ nullable: true })
  bloco_torre?: string;

  @Column({ nullable: true })
  unidade_apto?: string;

  // Campos para Externo
  @Column({ nullable: true })
  logradouro?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bairro?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cidade?: string;

  @Column({ type: 'varchar', length: 2, nullable: true })
  uf?: string;

  @Column({ nullable: true })
  numero?: string;
}