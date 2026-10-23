// src/entities/Menu.ts
import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    OneToMany
     
} from 'typeorm';
import { MenuItem } from './MenuItemModels'; // Importa a entidade filha

@Entity('menus') // Nome da tabela no banco de dados
export class Menu {
    
    @PrimaryGeneratedColumn('increment') // Mapeia BIGINT UNSIGNED AUTO_INCREMENT
    id!: number;

    @Column()
    ordem!: number;

    @Column({ length: 100 })
    nome!: string;

    @Column({ length: 255, nullable: true })
    caminho!: string;

    @Column({ length: 50, nullable: true })
    icone!: string;

    @Column({ name: 'possui_submenu', default: false })
    possuiSubmenu!: boolean;

    // Relação: UM item de menu principal TEM MUITOS itens de submenu (MenuItem)
    @OneToMany(() => MenuItem, menuItem => menuItem.menu, { 
        cascade: true, // Permite salvar/excluir itens filhos ao manipular o pai
        eager: false    // CRUCIAL: Busca automaticamente os submenus ao buscar o Menu
    })
 
    itens!: MenuItem[]; // Nome da propriedade que conterá o array de submenus
}