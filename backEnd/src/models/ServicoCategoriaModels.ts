import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    OneToMany, // <--- Importante
    CreateDateColumn, 
    UpdateDateColumn,
    Index
} from 'typeorm';

// 👇 VERIFIQUE SE O NOME DO ARQUIVO DA SOLICITAÇÃO ESTÁ CERTO
import { ServicoSolicitacao } from './servicoSolicitacaoModels';

@Entity('servico_tipo')
export class ServicoTipo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  @Index()
  slug!: string;

  @Column({ type: 'varchar', length: 150 })
  nome!: string; 

  @Column({ type: 'text', nullable: true })
  descricao?: string;

  @Column({ nullable: true })
  icone?: string;

  // 👇 A CORREÇÃO ESTÁ AQUI:
  // Use "() => ServicoSolicitacao" (com a setinha)
  @OneToMany(() => ServicoSolicitacao, (solicitacao) => solicitacao.category)
  servicos!: ServicoSolicitacao[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}