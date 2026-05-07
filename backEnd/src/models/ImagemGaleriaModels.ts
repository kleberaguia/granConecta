// /src/models/ImagemGaleria.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Secao } from './secaoModels';

@Entity('galeria_imagens')
export class ImagemGaleria {
  @PrimaryGeneratedColumn()
  id!: number;

 @Column({ type: 'int' }) // Garantindo que 'ordem' é lido como INT
  ordem!: number;

  @Column({ type: 'varchar', length: 255 }) // 👈 CORREÇÃO: Especificar o tipo
  url_imagem!: string;

  @Column({ type: 'varchar', length: 255 }) // 👈 CORREÇÃO: Especificar o tipo
  alt_text!: string;

  @Column({ type: 'varchar', length: 255, nullable: true }) // 👈 CORREÇÃO: Especificar o tipo e manter nullable
  legenda!: string | null;

  // RELACIONAMENTO N:1 com a tabela 'secoes'
  @Column()
  secao_id!: number;

  @ManyToOne(() => Secao, secao => secao.imagens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'secao_id' })
  secao!: Secao;
}