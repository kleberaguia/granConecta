// src/models/PagamentoModel.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from "typeorm";
import { Usuario } from "./UserModels";
import { ServicoOferta } from "./servicoOfertaModels";

@Entity("pagamentos")
export class Pagamento {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  ofertaId!: string;

  @ManyToOne(() => ServicoOferta)
  @JoinColumn({ name: "ofertaId" })
  oferta!: ServicoOferta;

  @Column()
  prestadorId!: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: "prestadorId" })
  prestador!: Usuario;

  @Column({ name: "moradorId" }) // ✅ ADICIONE O NAME AQUI
  usuarioId!: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: "moradorId" }) // ✅ MUDE DE usuarioId PARA moradorId AQUI TAMBÉM
  morador!: Usuario;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  valor!: number;

  @Column({
    type: "enum",
    enum: ["PENDENTE", "PAGO", "CANCELADO", "ESTORNADO"],
    default: "PENDENTE",
  })
  status!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  link_pagamento!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  transacao_gateway_id!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
