// src/routers/servicoCandidatura.routes.ts
import { Router } from 'express';
import ServicoCandidaturaController from '../controller/ServicoCandidaturaController';
import { authMiddleware } from '../middlewares/authMiddleware';

const routerServicoCandidatura = Router();

routerServicoCandidatura.get("/candidaturas/:candidaturaId/sessoes", ServicoCandidaturaController.buscarTotalSessoesCandidatura);
routerServicoCandidatura.post('/candidaturas', authMiddleware, ServicoCandidaturaController.candidatar);
routerServicoCandidatura.get('/candidaturas/:solicitacaoId', authMiddleware, ServicoCandidaturaController.listarPorSolicitacao);
routerServicoCandidatura.get('/candidaturas/minhas', authMiddleware, ServicoCandidaturaController.listarMinhas);
routerServicoCandidatura.get('/negociacao/historico/:candidaturaId', ServicoCandidaturaController.getHistoricoMensagens);
routerServicoCandidatura.delete('/:candidaturaId', authMiddleware, ServicoCandidaturaController.retirar);
routerServicoCandidatura.post("/candidaturas/aceitar",  authMiddleware,  ServicoCandidaturaController.aceitarProposta)
routerServicoCandidatura.post('/candidaturas/:id/responder', authMiddleware, ServicoCandidaturaController.enviarProposta);
routerServicoCandidatura.post('/candidaturas/recusar', authMiddleware, ServicoCandidaturaController.recusarProposta);


export default routerServicoCandidatura;
