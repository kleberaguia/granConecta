// src/controllers/MenuController.ts
import { Request, Response } from 'express';
import MenuService from '../services/MenuService';

class MenuController {
    
    async index(req: Request, res: Response) {
        try {
            const tree = await MenuService.getMenu();
            return res.json(tree);
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao buscar menu' });
        }
    }

    async store(req: Request, res: Response) {
        try {
            // O req.body.items vem do frontend { items: [...] }
            await MenuService.saveMenu(req.body.items);
            return res.status(201).json({ message: 'Menu atualizado com sucesso' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao salvar menu' });
        }
    }
}


export default new MenuController();
