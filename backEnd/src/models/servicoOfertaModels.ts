// src/models/servicoOfertaModels.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToMany
} from "typeorm";

import { ServicoSolicitacao } from "./servicoSolicitacaoModels";
import { Usuario } from "./UserModels";
import { Parcela } from "./ParcelaModel";
import { Pagamento } from "./PagamentoModel";
@Entity("servico_oferta")
export class ServicoOferta {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  solicitacaoId!: string;

  @ManyToOne(() => ServicoSolicitacao, solicitacao => solicitacao.candidaturas)
  @JoinColumn({ name: "solicitacaoId" })
  solicitacao!: ServicoSolicitacao;

  @Column()
  prestadorId!: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: "prestadorId" })
  prestador!: Usuario;

  @Column()
  usuarioId!: string;

  @Column({ nullable: true })
  mensagem?: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  valor?: number;

  @Column({
    type: "enum",
    enum: ["PENDENTE", "ACEITA", "RECUSADA", "EM_ANDAMENTO", "CONCLUIDA"],
    default: "PENDENTE"
  })
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => Parcela, parcela => parcela.servicoOferta)
  parcelas!: Parcela[];

  @OneToMany(() => Pagamento, (pagamento) => pagamento.oferta)
  pagamentos!: Pagamento[];
}
