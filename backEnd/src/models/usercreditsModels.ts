// src/models/UserCredits.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, UpdateDateColumn } from "typeorm";
import { Usuario } from "./UserModels";

@Entity("user_credits")
export class UserCredits {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
    balance!: number;

    @OneToOne(() => Usuario)
    @JoinColumn({ name: "usuarioId" }) // Vincula a propriedade abaixo à coluna do banco
    usuario!: Usuario;

    @Column()
    usuarioId!: string;

    @UpdateDateColumn()
    updated_at!: Date;
}