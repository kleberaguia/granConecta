import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { PostTarget } from './PostTargetModels';
import { Endereco } from './EnderecoModel';

@Entity('condominios')
export class Condominio {

  // ✅ CORREÇÃO AQUI:
  // Mude de 'increment' para 'uuid'
  // Mude de 'id: number' para 'id: string'
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  nome!: string;

  // @Column()
  // endereco!: string;

  @Column({ unique: true })
  codigo_acesso!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @OneToMany(() => PostTarget, (target) => target.condominio)
  postTargets!: PostTarget[];

  @OneToMany(() => Endereco, (endereco) => endereco.condominio)
  endereco!: Endereco[];
}