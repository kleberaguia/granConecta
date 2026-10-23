// src/models/PagamentoModel.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  RelationId
} from "typeorm";
import { Usuario } from "./UserModels";
import { ServicoOferta } from "./servicoOfertaModels";

@Entity("pagamentos")
export class Pagamento {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => ServicoOferta, { nullable: true })
  @JoinColumn({ name: "ofertaId" })
  oferta?: ServicoOferta;

  @Column({ nullable: true })
  ofertaId?: string;

  @Column()
  prestadorId!: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: "prestadorId" })
  prestador!: Usuario;

  @RelationId((pag: Pagamento) => pag.prestador)
  prestadorIdRelation!: string;

  @Column()
  moradorId!: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: "moradorId" })
  morador!: Usuario;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  valor!: number;

 @Column({
  type: "enum",
  enum: [
    "PENDENTE",
    "PARCIALMENTE_PAGO",
    "PAGO",
    "CANCELADO",
    "ESTORNADO",
  ],
  default: "PENDENTE",
})
status!:
  | "PENDENTE"
  | "PARCIALMENTE_PAGO"
  | "PAGO"
  | "CANCELADO"
  | "ESTORNADO";

  @Column({ type: "varchar", length: 500, nullable: true })
  link_pagamento!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  transacao_gateway_id!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({
    type: "enum",
    enum: ["RETIDO", "LIBERADO", "EM_DISPUTA"],
    default: "RETIDO",
  })
  status_liberacao!: string;

  @Column({ type: "timestamp", nullable: true })
  data_entrega_confirmada!: Date;

  @Column({ type: "varchar", nullable: true })
  codigo_verificacao!: string;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  valor_liberado!: number;

  @Column({ nullable: true })
  pedidoId?: number;
}

