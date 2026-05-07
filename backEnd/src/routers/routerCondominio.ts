import { Router } from 'express';
import CondominioController from '../controller/CondominioController'; // Ajuste o caminho se necessário
import { authMiddleware } from '../middlewares/authMiddleware';
import { isAdminMiddleware } from '../middlewares/isAdminMiddleware';

const routerCondominio = Router();
const condominioController = new CondominioController();

routerCondominio.get('/', condominioController.index);

routerCondominio.get('/:id', condominioController.getIdCondominio);
routerCondominio.post("/validar-codigo", condominioController.validarCodigo);

routerCondominio.post('/novo', 
  authMiddleware, 
  isAdminMiddleware, 
  condominioController.create
);

export default routerCondominio;