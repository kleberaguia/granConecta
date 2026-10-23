import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ServicoSolicitacao } from './servicoSolicitacaoModels';
import { Usuario } from './UserModels';

@Entity('avaliacoes')
export class Avaliacao {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToOne("ServicoSolicitacao", (servico: ServicoSolicitacao) => servico.avaliacao)
  @JoinColumn({ name: 'servicoId' })
  servico!: ServicoSolicitacao;

  @Column({ unique: true })
  servicoId!: string;

  // Relações com Usuários
  @ManyToOne(() => Usuario, (usuario) => usuario.avaliacoesFeitas)
  @JoinColumn({ name: 'usuarioId' })
  morador!: Usuario;

  @Column()
  usuarioId!: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.avaliacoesRecebidas)
  @JoinColumn({ name: 'prestadorId' })
  prestador!: Usuario;

  @Column()
  prestadorId!: string;

  @Column()
  nota!: number;

  @Column({ type: 'text', nullable: true })
  comentario?: string;
}