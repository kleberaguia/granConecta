"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_source_1 = require("../config/data-source");
const MenuModels_1 = require("../models/MenuModels");
const MenuItemModels_1 = require("../models/MenuItemModels");
class MenuService {
    constructor() {
        this.menuRepository = data_source_1.AppDataSource.getRepository(MenuModels_1.Menu);
    }
    async getMenu() {
        const menus = await this.menuRepository.find({
            relations: ['itens'],
            order: {
                ordem: 'ASC',
                itens: {
                    ordem: 'ASC'
                }
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
    async saveMenu(menuData) {
        // Iniciamos a transação. Se algo der errado aqui dentro, NADA é apagado.
        await data_source_1.AppDataSource.transaction(async (manager) => {
            await manager.createQueryBuilder().delete().from(MenuItemModels_1.MenuItem).execute();
            await manager.createQueryBuilder().delete().from(MenuModels_1.Menu).execute();
            for (const [index, item] of menuData.entries()) {
                const menu = new MenuModels_1.Menu();
                menu.nome = item.name;
                menu.caminho = item.path;
                menu.ordem = index;
                menu.icone = item.icon || "";
                menu.possuiSubmenu = item.submenu && item.submenu.length > 0 ? true : false;
                // Salva o pai usando o manager da transação
                const menuSalvo = await manager.save(MenuModels_1.Menu, menu);
                if (item.submenu && item.submenu.length > 0) {
                    const subItens = item.submenu.map((subItem, subIndex) => {
                        const novoSub = new MenuItemModels_1.MenuItem();
                        novoSub.nome = subItem.name;
                        novoSub.caminho = subItem.path;
                        novoSub.ordem = subIndex;
                        novoSub.menu = menuSalvo;
                        return novoSub;
                    });
                    // Salva os filhos usando o manager da transação
                    await manager.save(MenuItemModels_1.MenuItem, subItens);
                }
            }
        });
    }
}
exports.default = new MenuService();
