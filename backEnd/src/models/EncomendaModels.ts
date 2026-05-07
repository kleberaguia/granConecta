import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';

// Importe as suas entidades de Usuário e Condomínio
// Ajuste os caminhos conforme a estrutura das suas pastas
import { Usuario } from '../models/UserModels'; 
import { Condominio } from '../models/condominiosModels'; 

@Entity('encomendas')
export class Encomenda {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  codigoRastreio!: string;

  @Column()
  transportadora!: string;

  @Column({ type: 'text', nullable: true })
  descricao!: string;

  @Column({ default: 'PENDENTE' }) // PENDENTE ou ENTREGUE
  status!: string;

  // --- COLUNAS DE ID (CHAVES ESTRANGEIRAS) ---

  @Column()
  condominio_id!: string;

  @Column()
  morador_id!: string;

  @Column()
  porteiro_id!: string;

  // --- RELAÇÕES (PARA BUSCAR OS NOMES E DADOS COMPLETOS) ---

  @ManyToOne(() => Condominio)
  @JoinColumn({ name: 'condominio_id' })
  condominio!: Condominio;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'morador_id' })
  morador!: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'porteiro_id' })
  porteiro!: Usuario;

  // --- CONTROLE DE RETIRADA ---

  @Column({ nullable: true })
  quemRetirou!: string; // Nome de quem pegou o pacote (ex: "O próprio", "Esposa", etc)

  @Column({ type: 'timestamp', nullable: true })
  dataRetirada!: Date;

  // --- TIMESTAMPS AUTOMÁTICOS ---

  @CreateDateColumn()
  dataRecebimento!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}