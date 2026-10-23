import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Store } from './StoreModels'; // Ajuste conforme seu arquivo
import { Condominio } from './condominiosModels';

export enum BannerLocalExibicao {
    MARKETPLACE = 'MARKETPLACE',
    SERVICOS = 'SERVICOS',
    AMBOS = 'AMBOS',
}

@Entity({ name: "marketplace_banners" })
export class MarketPlaceModel {
    @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
    id!: number;

    @Column({
        type: 'varchar',
        length: 36,
        charset: 'utf8mb4',
        collation: 'utf8mb4_0900_ai_ci',
        nullable: true
    })
    loja_id?: string | null;

    @Column({ type: "varchar", length: 255, nullable: true }) // Remova o 'unsigned: true'
    condominio_id?: string | null;

    @Column({
        type: 'enum',
        enum: BannerLocalExibicao,
        default: BannerLocalExibicao.MARKETPLACE,
    })
    local_exibicao!: BannerLocalExibicao;

    @Column()
    titulo!: string;

    @Column({ type: 'text', nullable: true })
    subtitulo?: string | null;

    @Column()
    imagem_url!: string;

    @Column({ default: '#3b82f6' })
    cor_destaque!: string;

    @Column()
    link_destino!: string;

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    data_inicio!: Date;

    @Column({ type: 'datetime' })
    data_fim!: Date;

    @Column({ type: 'enum', enum: ['pendente', 'aprovado', 'recusado'], default: 'pendente' })
    status!: string;

    @Column({ default: false })
    pago!: boolean;

    @Column({ default: true })
    ativo!: boolean;

    @ManyToOne(() => Store, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'loja_id' })
    loja?: Store | null;

    @ManyToOne(() => Condominio, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'condominio_id' })
    condominio?: Condominio | null;
}