import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("loja_interacoes")
export class LojaInteracao {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "uuid" })
    lojaId!: string;

    @Column({ type: "uuid", nullable: true })
    usuarioId!: string | null;

    @Column({ type: "varchar", length: 100 })
    tipoInteracao!: string;

    @Column({ type: "json", nullable: true })
    metaData!: Record<string, any>;

    @Column({ type: "uuid", nullable: true })
    condominioId!: string | null;

    @CreateDateColumn({ name: "createdAt" })
    createdAt?: Date;
}
