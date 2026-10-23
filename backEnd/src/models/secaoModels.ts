// /src/models/Secao.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index } from 'typeorm';
import { Card } from './CardModels';
import { ImagemGaleria } from './ImagemGaleriaModels';
import { Content } from './ContentModels';

@Entity('sec_secoes')
export class Secao {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'int' })
    @Index() // Adicionamos o índice para a ordem
    ordem!: number;

    @Column({ length: 50 })
    tipo_secao!: string;

    @Column({ type: 'varchar', length: 255 })
    titulo!: string;

    @Column({ type: 'varchar', length: 255, nullable: true }) // 👈 ADICIONE type: 'varchar'
    subtitulo!: string | null;

    @Column({ type: 'text', nullable: true })
    conteudo_principal!: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    imagem_principal!: string | null;

    // ... outros campos (layout, links, etc.) ...

    // TypeORM lida com JSONB (PostgreSQL) ou JSON (MySQL)
    @Column({ type: 'json' })
    style_overrides!: object;

    // RELACIONAMENTOS: Carrega cards se for 'info_grid'
    @OneToMany(() => Card, card => card.secao)
    cards!: Card[];

    // RELACIONAMENTOS: Carrega imagens se for 'gallery'
    @OneToMany(() => ImagemGaleria, imagem => imagem.secao)
    imagens!: ImagemGaleria[];

    @OneToMany(() => Content, content => content.section)
    contents!: Content[];
}