import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from "typeorm";
import { Usuario } from "./UserModels";

export enum RefundStatus {
  PENDING = "pending",
  PAID = "paid",
  REJECTED = "rejected"
}

@Entity("refund_requests")
export class RefundRequest {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  usuarioId!: string;

  // Relacionamento para podermos buscar o nome do usuário no AdminService
  @ManyToOne(() => Usuario)
  @JoinColumn({ name: "usuarioId" })
  usuario!: Usuario;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount!: number;

  @Column()
  pix_key!: string;

  @Column({
    type: "enum",
    enum: RefundStatus,
    default: RefundStatus.PENDING
  })
  status!: RefundStatus;

  @Column({ type: "text", nullable: true })
  admin_notes!: string; // Para você anotar por que rejeitou, por exemplo

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}