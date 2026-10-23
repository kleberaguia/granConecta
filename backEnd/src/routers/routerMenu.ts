import { Router } from 'express';
// Ajuste os caminhos dos imports conforme sua estrutura
import { authMiddleware } from '../middlewares/authMiddleware'; 
import menuController from '../controller/menuController';

const routerMenu = Router();

// 1. Rota GET (Para ler o menu)
// Caminho final: /api/menu
routerMenu.get('/', menuController.index);

// 2. Rota POST (Para salvar) - OPÇÃO 1: Com /store
// Caminho final: /api/menu/store
routerMenu.post('/store', authMiddleware, menuController.store);

// 3. Rota POST (Para salvar) - OPÇÃO 2: Raiz (Backup)
// Caminho final: /api/menu
// Isso garante que se você tirar o /store do front, continua funcionando
routerMenu.post('/', authMiddleware, menuController.store);

export default routerMenu;