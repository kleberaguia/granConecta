// src/models/servicoSolicitacaoModels.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn
} from 'typeorm';
import { Usuario } from './UserModels';
import { ServicoTipo } from './ServicoCategoriaModels'; // Assumindo que você tem esta entity

@Entity("servico_solicitacao")
export class ServicoSolicitacao {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  // ----------------------
  // RELAÇÃO MORADOR
  // ----------------------
  @ManyToOne(() => Usuario, (usuario) => usuario.servicosSolicitados)
  @JoinColumn({ name: "usuarioId" })
  morador!: Usuario;

  @Column()
  usuarioId!: string;

  // ----------------------
  // RELAÇÃO TIPO/CATEGORIA
  // ----------------------
  @ManyToOne(() => ServicoTipo)
  @JoinColumn({ name: "tipoId" })
  tipo!: ServicoTipo;

  @Column()
  tipoId!: string;

  // ----------------------
  // RELAÇÃO PRESTADOR ESCOLHIDO
  // ----------------------
  @ManyToOne(() => Usuario, (usuario) => usuario.servicosComoPrestador)
  @JoinColumn({ name: "prestadorEscolhidoId" })
  prestador?: Usuario; // Pode ser opcional até a escolha

  @Column({ nullable: true })
  prestadorEscolhidoId?: string; // Coluna de FK

  // ----------------------
  // DADOS DA SOLICITAÇÃO
  // ----------------------
  @Column()
  titulo!: string;

  @Column("text")
  descricao!: string;

  @Column({
    type: "enum",
    enum: [
      "BUSCANDO_PRESTADOR",
      "CANDIDATOS",
      "PRESTADOR_ESCOLHIDO",
      "EM_ANDAMENTO",
      "CONCLUIDO",
      "CANCELADO",
    ],
    default: "BUSCANDO_PRESTADOR",
  })
  status!: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  valor_sugerido?: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  valor_final?: number;
  
  // Coluna obrigatória para ordenação
  @CreateDateColumn() 
  createdAt!: Date; 
}