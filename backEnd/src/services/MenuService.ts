import { AppDataSource } from '../config/data-source'; 
import { Menu } from '../models/MenuModels';
import { MenuItem } from '../models/MenuItemModels';

interface CreateMenuDTO {
    name: string;
    path: string;
    icon?: string;
    order?: number;
    submenu?: CreateMenuDTO[];
}

class MenuService {
    private menuRepository = AppDataSource.getRepository(Menu);

    async getMenu(): Promise<any[]> {
        const menus = await this.menuRepository.find({
            relations: ['itens'],
            order: {
                ordem: 'ASC',
                itens: {
                    ordem: 'ASC'
                } as any
            }
        });

        return menus.map(menu => ({
            id: menu.id,
            name: menu.nome,
            path: menu.caminho,
            submenu: menu.itens ? menu.itens.map(item => ({
                id: item.id,
                name: item.nome,
                path: item.caminho
            })) : []
        }));
    }

    async saveMenu(menuData: CreateMenuDTO[]): Promise<void> {        
        // Iniciamos a transação. Se algo der errado aqui dentro, NADA é apagado.
        await AppDataSource.transaction(async (manager) => {           
            await manager.createQueryBuilder().delete().from(MenuItem).execute()
            await manager.createQueryBuilder().delete().from(Menu).execute();    
            for (const [index, item] of menuData.entries()) {
                const menu = new Menu();
                menu.nome = item.name;
                menu.caminho = item.path;
                menu.ordem = index;
                menu.icone = item.icon || "";
                menu.possuiSubmenu = item.submenu && item.submenu.length > 0 ? true : false;

                // Salva o pai usando o manager da transação
                const menuSalvo = await manager.save(Menu, menu);

                if (item.submenu && item.submenu.length > 0) {
                    const subItens = item.submenu.map((subItem, subIndex) => {
                        const novoSub = new MenuItem();
                        novoSub.nome = subItem.name;
                        novoSub.caminho = subItem.path;
                        novoSub.ordem = subIndex;
                        novoSub.menu = menuSalvo;
                        return novoSub;
                    });
                    // Salva os filhos usando o manager da transação
                    await manager.save(MenuItem, subItens);
                }
            }
        });
    }

   
}

export default new MenuService();