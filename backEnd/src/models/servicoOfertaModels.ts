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
  pagamento!: Pagamento[];

  @Column({
    type: "enum",
    enum: ["SERVICO", "PRODUTO", "DELIVERY", "RECORRENTE"],
    default: "SERVICO"
  })
  tipo_fluxo!: "SERVICO" | "PRODUTO" | "DELIVERY" | "RECORRENTE";


  @Column({ type: "int", default: 1 })
  total_sessoes!: number;

  @Column({ type: "int", default: 0, name: "sessoes_concluidas" })
  sessoes_concluidas!: number;

  // 🚀 NOVA COLUNA: Libera para o cliente agendar horários apenas após o prestador dar o "Start"
  @Column({ type: "boolean", default: false, name: "agenda_liberada" })
  agenda_liberada!: boolean;
}
