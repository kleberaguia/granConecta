import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn
} from "typeorm";
import { ServicoSolicitacao } from "./servicoSolicitacaoModels";
import { ServicoOferta } from "./servicoOfertaModels";
import { Usuario } from "./UserModels";

export enum StatusAgenda {
  SUGERIDO = "SUGERIDO",
  CONFIRMADO = "CONFIRMADO",
  AGENDADO = "AGENDADO",
  LIBERADO_CLIENTE = "LIBERADO_CLIENTE",
  FILA_ASSINATURA = "FILA_ASSINATURA",
  CONCLUIDO = "CONCLUIDO",
  CANCELADO = "CANCELADO",
}

@Entity("agenda")
export class Agenda {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  // Mantido para compatibilidade com histórico
  @ManyToOne(() => ServicoSolicitacao, { nullable: true })
  servico?: ServicoSolicitacao;

  // 🚀 CRUCIAL: Vinculo com o contrato/oferta fechada para controle do pacote financeiro
  @Column({ nullable: true })
  ofertaId?: string;

  @ManyToOne(() => ServicoOferta)
  @JoinColumn({ name: "ofertaId" })
  oferta!: ServicoOferta;

  @ManyToOne(() => Usuario)
  morador!: Usuario;

  @ManyToOne(() => Usuario)
  prestador!: Usuario;

  // 🚀 NOVO: Descrição da sessão/etapa digitada pelo prestador no front-end
  @Column({ type: "varchar", default: "Sessão de Atendimento" })
  descricao!: string;

  @Column()
  data!: string;

  @Column()
  hora!: string;

  @Column({
    name: "duracao_minutos",
    type: "int",
    default: 60,
  })
  duracaoMinutos!: number;

  @Column({
    type: "enum",
    enum: StatusAgenda,
    default: StatusAgenda.AGENDADO
  })
  status!: StatusAgenda;

  // 🚀 NOVO: Guarda o valor proporcional desta sessão (Valor Total / total_sessoes)
  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  valor_parcela!: number;
  @CreateDateColumn({
    type: "datetime",
    precision: 6,
    default: () => "CURRENT_TIMESTAMP(6)",
  })
  createdAt!: Date;
}