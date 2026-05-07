import { Router } from 'express';
import { CategoryController } from '../controller/categoryController';
import { authMiddleware } from '../middlewares/authMiddleware';

const routerCategory = Router();
const categoryController = new CategoryController();

routerCategory.get('/global', authMiddleware, categoryController.listAll); // Todos usam para preencher o Select
routerCategory.get('/store/:storeId', authMiddleware, categoryController.listByStore); // Categorias da loja
routerCategory.get('/:categoriaId', authMiddleware, categoryController.CategoriaById); 

// Rotas protegidas (Apenas Admin do App deve conseguir criar/deletar categorias globais)
routerCategory.post('/', authMiddleware, categoryController.create); 
routerCategory.delete('/:id', authMiddleware, categoryController.delete);

export default routerCategory;