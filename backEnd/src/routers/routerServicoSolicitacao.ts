// src/routers/servicoSolicitacao.routes.ts

import { Router } from 'express';
import { ServicoSolicitacaoController } from '../controller/ServicoSolicitacaoController'; 
import { authMiddleware } from '../middlewares/authMiddleware';
import { isAdminMiddleware } from '../middlewares/isAdminMiddleware';
import { ServicoIgnoradoController } from '../controller/ServicoIgnoradoController';

const routerServicoSolicitacao = Router();
const solicitacaoController = new ServicoSolicitacaoController();

// 1. Mova o Dashboard para as primeiras posições (Importante!)
routerServicoSolicitacao.get(
    "/prestador/dashboard", 
    authMiddleware, 
    solicitacaoController.getDashboardPrestador
);

// 2. Outras rotas fixas
routerServicoSolicitacao.post('/', authMiddleware, solicitacaoController.criar);
routerServicoSolicitacao.get('/minhas-solicitacoes', authMiddleware, solicitacaoController.minhasSolicitacoes);
routerServicoSolicitacao.get('/disponiveis', authMiddleware, solicitacaoController.disponiveis); 
routerServicoSolicitacao.get('/todas', authMiddleware, isAdminMiddleware, solicitacaoController.listarTodas);
routerServicoSolicitacao.get('/quantidade', authMiddleware, solicitacaoController.listarMinhasSolicitacoes);
routerServicoSolicitacao.get("/detalhes-completos/:id", authMiddleware, solicitacaoController.buscarDetalhesCompletos);


// 3. Rotas com parâmetros dinâmicos (SEMPRE POR ÚLTIMO)
routerServicoSolicitacao.get('/:id', authMiddleware, solicitacaoController.buscarPorId);
routerServicoSolicitacao.patch('/:id/escolher-prestador', authMiddleware, solicitacaoController.escolherPrestador);
routerServicoSolicitacao.patch('/:id/status', authMiddleware, solicitacaoController.atualizarStatus);
routerServicoSolicitacao.patch('/:id/progresso', authMiddleware, solicitacaoController.atualizarProgresso);

routerServicoSolicitacao.post('/ignorar', authMiddleware, ServicoIgnoradoController.ignorar);



export default routerServicoSolicitacao;