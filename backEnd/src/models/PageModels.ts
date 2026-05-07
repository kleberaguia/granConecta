import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    Index, 
    CreateDateColumn, 
    UpdateDateColumn 
} from "typeorm";

@Entity("page")
export class Page {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    slug!: string; 

    @Column()
    title!: string;

    // Campo essencial para a Vitrine
    @Column({ default: "Geral" }) 
    category!: string; 

    @Column({ type: "json", nullable: true }) 
    layout!: any[]; 

    @Column({ type: "text", nullable: true }) 
    content?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

// ✅ AQUI ESTÁ O QUE FALTAVA: A exportação da interface
export interface PageData {
    slug: string;
    title: string;
    category: string; // "Geral", "Vitrine", etc.
    layout: any[];
    content?: string;
}