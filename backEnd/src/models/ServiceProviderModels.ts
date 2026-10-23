// src/entities/ServiceProvider.ts
import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    CreateDateColumn, 
    Index // <--- 1. Importe o Index aqui
} from "typeorm";

export enum ServicePlan {
    BASIC = "BASIC",             // Lista simples
    INTERMEDIATE = "INTERMEDIATE", // Cards médios
    PREMIUM = "PREMIUM"          // Hero + Carrossel Netflix
}

@Entity("service_providers")
export class ServiceProvider {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({ nullable: true })
    photoUrl!: string;

    @Column({ nullable: true })
    heroImage!: string; // Imagem de fundo para o plano Premium

    // A MÁGICA: Define se é 'pedreiro', 'encanador', 'jardineiro'
    // 2. Use o decorador @Index() separado, e remova { index: true } de dentro do @Column
    @Index() 
    @Column() 
    categoryTag!: string; 

    @Column({
        type: "enum",
        enum: ServicePlan,
        default: ServicePlan.BASIC
    })
    plan!: ServicePlan;

    // Coluna JSON para guardar dados específicos sem criar novas colunas
    // Ex Pedreiro: { "especialidade": "Acabamento" }
    // Ex Encanador: { "plantao_24h": true }
    @Column("json", { nullable: true })
    attributes!: Record<string, any>;

    @Column({ default: false })
    isHeroActive!: boolean; // Se pagou para ser o destaque principal da categoria

    @Column({ nullable: true })
    whatsapp!: string;

    @CreateDateColumn()
    createdAt!: Date;
}