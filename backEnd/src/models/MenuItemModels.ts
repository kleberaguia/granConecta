// src/entities/MenuItem.ts
import { Entity,PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Menu } from './MenuModels';

@Entity('menu_itens') // Nome da tabela no banco de dados
export class MenuItem {
    
    @PrimaryGeneratedColumn('increment') // Mapeia BIGINT UNSIGNED AUTO_INCREMENT
    id!: number;

    @Column()
    ordem!: number;

    @Column({ length: 100 })
    nome!: string;

    @Column({ length: 255 })
    caminho!: string;

    // Coluna para a Chave Estrangeira (FK)
    // O nome da coluna no banco é 'menu_id'
    @Column({ name: 'menu_id' }) 
    menuId!: number; 

    // Relação: MUITOS itens de menu pertencem a UM item de menu principal (Menu)
    @ManyToOne(() => Menu, menu => menu.itens, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'menu_id' }) // Especifica qual coluna é a FK
    menu!: Menu;

    
}