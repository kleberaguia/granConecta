import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    OneToMany, 
    CreateDateColumn, 
    UpdateDateColumn, 
    Index 
} from 'typeorm';

// Importação circular resolvida usando Arrow Function abaixo
import { ServicoSolicitacao } from './servicoSolicitacaoModels';
import { Usuario } from './UserModels';
import { Store } from './StoreModels';

@Entity('servico_tipo')
export class ServicoTipo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 150 })
  nome!: string; 

  @Column({ type: 'text', nullable: true })
  descricao?: string;

  @Column({ nullable: true })
  icone?: string;

  // ✅ CORREÇÃO: Arrow function () => evita erro de metadata
  @OneToMany(() => ServicoSolicitacao, (solicitacao) => solicitacao.category)
  servicos!: ServicoSolicitacao[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;


  // @OneToMany(() => Store, (store: Store) => store.servicoTipo)
  // stores!: Store[];

}