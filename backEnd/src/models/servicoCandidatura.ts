import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToMany,
  OneToOne

} from 'typeorm';
import { ServicoSolicitacao } from './servicoSolicitacaoModels';
import { Usuario } from './UserModels';
import { ServicoNegociacao } from './servicoNegociacaoModels';
import { Pagamento } from './PagamentoModel';


@Entity("servico_candidatura")
export class ServicoCandidatura {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => ServicoSolicitacao)
  @JoinColumn({ name: "solicitacaoId" })
  solicitacao!: ServicoSolicitacao;

  @Column()
  solicitacaoId!: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: "prestadorId" })
  prestador!: Usuario;

  @Column()
  prestadorId!: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  valor_proposto?: number;

  @Column({ default: false })
  escolhido!: boolean;

  @Column({ type: "text", nullable: true })
  mensagem?: string;

  @Column({
    type: "enum",
    enum: [
      "PENDENTE",
      "RECUSADO",
      "PROPOSTA_PRESTADOR", // Novo: Prestador enviou a primeira oferta
      "PROPOSTA_MORADOR",   // Cliente enviou contraproposta
      "ACEITO_PRESTADOR",   // Novo: Prestador aceitou o valor do cliente
      "ACORDO_FECHADO",     // Final: Negócio fechado
      "ENCERRADA"           // Novo: Quando a solicitação fecha com outro
    ],
    default: "PENDENTE"
  })
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;
  
  
  @OneToMany(() => ServicoNegociacao, (negociacao) => negociacao.candidatura)
  negociacoes!: ServicoNegociacao[]

  
  @Column({ type: 'int', default: 1 })
  total_sessoes!: number;

}
