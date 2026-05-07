// src/models/CreditTransactions.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Usuario } from "./UserModels";

export enum TransactionType {
    REFUND = 'REFUND',       // Quando o usuário cancela e ganha crédito
    USAGE = 'USAGE',         // Quando o usuário usa o crédito para pagar um plano ✅
    WITHDRAWAL = 'WITHDRAWAL', // Quando o usuário saca o dinheiro (Resgate PIX)
    BONUS = 'BONUS',         // Caso você queira dar um bônus manual
    MANUAL_ADJUST = 'MANUAL_ADJUST' // Ajuste feito pelo Admin
}

@Entity("credit_transactions")
export class CreditTransactions {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    amount!: number;

    @Column({ type: "enum", enum: TransactionType })
    type!: TransactionType;

    @Column({ type: "text", nullable: true })
    description!: string;

    @ManyToOne(() => Usuario)
    @JoinColumn({ name: "usuarioId" })
    user!: Usuario;

    @Column()
    usuarioId!: string;

    @CreateDateColumn()
    created_at!: Date;
}