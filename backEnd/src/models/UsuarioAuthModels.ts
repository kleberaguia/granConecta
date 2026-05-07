// models/UsuarioAuthModels.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Usuario } from './UserModels';
import { Condominio } from './condominiosModels'// Certifique-se de ter este model

@Entity('usuarios_auth')
export class UsuarioAuth {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ name: 'password_hash' })
  password_hash!: string;

  @Column({ default: 'MORADOR' })
  role!: 'USER' | 'ADMIN' | 'MORADOR' | 'PRESTADOR';

  @Column({ default: true })
  isActive!: boolean;

  @Column({ nullable: true })
  usuarioId!: string | null;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'usuarioId' })
  usuario!: Promise<Usuario | null>;

  @Column({ default: false })
  emailVerificado!: boolean;

  @Column({ type: 'varchar', length: 10, nullable: true })
  codigoVerificacao?: string | null;


  @Column({ name: "reset_token", type: "varchar", nullable: true })
  reset_token?: string | null;

  @Column({ name: "reset_token_expires", type: "timestamp", nullable: true })
  reset_token_expires?: Date | null;
}