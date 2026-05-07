import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn

} from 'typeorm';
import { ServicoSolicitacao } from './servicoSolicitacaoModels';
import { Usuario } from './UserModels';


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
    enum: ["PENDENTE", "RECUSADO", "PROPOSTA_MORADOR", "ACORDO_FECHADO"],
    default: "PENDENTE"
  })
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
