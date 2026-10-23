import { RequestHandler, Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware'; // Seu middleware de JWT
import EncomendaController from '../controller/EncomendaController';

const routerEncomenda = Router()
routerEncomenda.get('/meus-pacotes', authMiddleware,((req, res) => EncomendaController.getMeusPacotes(req as any, res)
) as RequestHandler);
routerEncomenda.post('/newEncomenda', authMiddleware, ((req, res) =>EncomendaController.store(req as any, res)
) as RequestHandler);
routerEncomenda.patch('/:id/retirada', authMiddleware, ((req, res) =>EncomendaController.darBaixa(req as any, res)
) as RequestHandler);

export default routerEncomenda;