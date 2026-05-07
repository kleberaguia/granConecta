import {
    Entity,
    PrimaryColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity("plans")
export class Plan {
    @PrimaryColumn()
    id!: string; // BASICO, INTERMEDIARIO, PREMIUM

    @Column()
    titulo!: string;

    @Column("decimal", { precision: 10, scale: 2 })
    preco_mensal!: number;

    @Column("decimal", { precision: 10, scale: 2 })
    preco_anual!: number;

    @Column("json")
    vantagens!: string[];

    @Column({ default: false })
    destaque!: boolean;

    @Column({ default: true })
    ativo!: boolean;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;

    @Column({ nullable: true })
    stripe_price_id!: string;

    @Column({ nullable: true })
    mercado_pago_plan_id!: string;
}