import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Store } from './StoreModels'; // Ajuste conforme seu arquivo
import { Condominio } from './condominiosModels';

@Entity({ name: "marketplace_banners" })
export class MarketPlaceModel {
    @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
    id!: number;

    @Column({ type: 'varchar', length: 255 })
    loja_id!: string;

    @Column({ type: "varchar", length: 255, nullable: true }) // Remova o 'unsigned: true'
    condominio_id?: string;

    @Column()
    titulo!: string;

    @Column({ type: 'text', nullable: true })
    subtitulo!: string;

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

    @ManyToOne(() => Store)
    @JoinColumn({ name: 'loja_id' })
    loja!: Store;

    @ManyToOne(() => Condominio)
    @JoinColumn({ name: 'condominio_id' })
    condominio!: Condominio;
}