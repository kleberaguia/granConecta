"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const MenuService_1 = __importDefault(require("../services/MenuService"));
class MenuController {
    async index(req, res) {
        try {
            const tree = await MenuService_1.default.getMenu();
            return res.json(tree);
        }
        catch (error) {
            return res.status(500).json({ error: 'Erro ao buscar menu' });
        }
    }
    async store(req, res) {
        try {
            // O req.body.items vem do frontend { items: [...] }
            await MenuService_1.default.saveMenu(req.body.items);
            return res.status(201).json({ message: 'Menu atualizado com sucesso' });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao salvar menu' });
        }
    }
}
exports.default = new MenuController();
