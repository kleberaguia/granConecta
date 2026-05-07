// src/routers/servicoCandidatura.routes.ts
import { Router } from 'express';
import ServicoCandidaturaController from '../controller/ServicoCandidaturaController';
import { authMiddleware } from '../middlewares/authMiddleware';

const routerServicoCandidatura = Router();

routerServicoCandidatura.post('/candidaturas', authMiddleware, ServicoCandidaturaController.candidatar);
routerServicoCandidatura.get('/candidaturas/:solicitacaoId', authMiddleware, ServicoCandidaturaController.listarPorSolicitacao);
routerServicoCandidatura.get('/candidaturas/minhas', authMiddleware, ServicoCandidaturaController.listarMinhas);
routerServicoCandidatura.delete('/:candidaturaId', authMiddleware, ServicoCandidaturaController.retirar);
routerServicoCandidatura.post("/candidaturas/aceitar",  authMiddleware,  ServicoCandidaturaController.aceitarProposta)
routerServicoCandidatura.post('/candidaturas/proposta', authMiddleware, ServicoCandidaturaController.enviarProposta)
routerServicoCandidatura.post('/candidaturas/recusar', authMiddleware, ServicoCandidaturaController.recusarProposta);

export default routerServicoCandidatura;
