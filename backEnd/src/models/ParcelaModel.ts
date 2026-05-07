// src/models/ParcelaModel.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn
} from "typeorm";
import { ServicoOferta } from "./servicoOfertaModels";

@Entity("parcelas")
export class Parcela {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  servicoOfertaId!: string;

  @ManyToOne(() => ServicoOferta)
  @JoinColumn({ name: "servicoOfertaId" })
  servicoOferta!: ServicoOferta;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  valor!: number;

  @Column()
  data_vencimento!: Date;

  @Column({ default: false })
  paga!: boolean;
}
