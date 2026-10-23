// src/models/Card.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Secao } from './secaoModels'; // Supondo que você tenha a entidade Secao

@Entity('cards')
export class Card {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    ordem!: number;

    @Column()
    icone!: string;

    // --- NOVOS CAMPOS ---
    @Column({ nullable: true })
    titulo!: string;

    @Column({ name: 'link_url', nullable: true }) // Mapeia para link_url no banco
    linkUrl!: string;

    @Column({ name: 'texto_botao', default: 'Saiba Mais' })
    textoBotao!: string;
    // --------------------

    @Column({ name: 'secao_id' })
    secaoId!: number;

    @ManyToOne(() => Secao, secao => secao.cards)
    @JoinColumn({ name: 'secao_id' })
    secao!: Secao;
}