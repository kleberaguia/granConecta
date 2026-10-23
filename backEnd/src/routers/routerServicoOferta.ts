// src/routers/servicoOferta.routes.ts
import { Router } from 'express';
import ServicoOfertaController from '../controller/ServicoOfertaController';
import { authMiddleware } from '../middlewares/authMiddleware';

const routerServicoOferta = Router();

routerServicoOferta.post('/por-candidatura', authMiddleware, ServicoOfertaController.criarPorCandidatura);
routerServicoOferta.post('/:ofertaId/aceitar', authMiddleware, ServicoOfertaController.aceitar);
routerServicoOferta.post('/:ofertaId/iniciar', authMiddleware, ServicoOfertaController.iniciar);
routerServicoOferta.post('/:ofertaId/concluir', authMiddleware, ServicoOfertaController.concluir);
routerServicoOferta.get('/listarOferta/meus', authMiddleware, ServicoOfertaController.listarMinhasOfertas);
routerServicoOferta.get('/meus', authMiddleware, ServicoOfertaController.listarPorPrestador);
routerServicoOferta.post('/servicos/ofertas/:id/:action', ServicoOfertaController.gerenciarAcaoKanban);

export default routerServicoOferta;
