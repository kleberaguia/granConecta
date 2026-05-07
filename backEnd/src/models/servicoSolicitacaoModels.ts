import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany
} from 'typeorm';

import { Usuario } from './UserModels';
import { Avaliacao } from './AvaliacaoModel';
import { ServicoOferta } from './servicoOfertaModels';
import { Condominio } from './condominiosModels';

// ✅ CORREÇÃO: O import tem que bater com o nome do arquivo 1
import { ServicoTipo } from './ServicoTipoModels';
import { ServicoCandidatura } from './servicoCandidatura';
import { Category } from './CategoryModels';


@Entity("servico_solicitacao")
export class ServicoSolicitacao {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

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

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // --- RELAÇÕES ---

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: "usuarioId" })
  morador!: Usuario;

  @Column()
  usuarioId!: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.servicosComoPrestador, { nullable: true })
  @JoinColumn({ name: 'prestadorId' })
  prestador?: Usuario;

  @Column({ nullable: true })
  prestadorId?: string;


  // @Column({ nullable: true })
  // categoryId?: number;

  @OneToMany(() => Avaliacao, (avaliacao) => avaliacao.servico)
  avaliacao?: Avaliacao;

  // @OneToMany(() => ServicoOferta, (oferta) => oferta.solicitacao)
  // candidaturas!: ServicoOferta[];

  @OneToMany(() => ServicoCandidatura, (candidatura) => candidatura.solicitacao)
  candidaturas!: ServicoCandidatura[]; // O Service agora vai achar essa propriedade!

  @OneToMany(() => ServicoOferta, (oferta) => oferta.solicitacao)
  ofertas!: ServicoOferta[];

  @Column({ type: "int", default: 0 })
  progresso!: number; // Para o gráfico: 10, 40, 70, 100

  @Column({ name: 'condominio_id', type: 'varchar', nullable: true }) // 👈 nullable: true é a chave
  condominio_id?: string | null;

  @ManyToOne(() => Condominio)
  @JoinColumn({ name: "condominio_id" })
  condominio!: Condominio;

  @Column({ name: "categoriaId" }) // Mapeia o nome físico da coluna no MySQL
  categoriaId!: number;

  @ManyToOne(() => Category)
  @JoinColumn({ name: "categoriaId" }) // Vincula a relação à nova coluna
  category!: Category;


  @Column({ type: 'json', nullable: true })
  metadata: any;



}