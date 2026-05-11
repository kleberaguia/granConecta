"use strict";
// src/routers/servicoSolicitacao.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ServicoSolicitacaoController_1 = require("../controller/ServicoSolicitacaoController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const isAdminMiddleware_1 = require("../middlewares/isAdminMiddleware");
const ServicoIgnoradoController_1 = require("../controller/ServicoIgnoradoController");
const routerServicoSolicitacao = (0, express_1.Router)();
const solicitacaoController = new ServicoSolicitacaoController_1.ServicoSolicitacaoController();
// 1. Mova o Dashboard para as primeiras posições (Importante!)
routerServicoSolicitacao.get("/prestador/dashboard", authMiddleware_1.authMiddleware, solicitacaoController.getDashboardPrestador);
// 2. Outras rotas fixas
routerServicoSolicitacao.post('/', authMiddleware_1.authMiddleware, solicitacaoController.criar);
routerServicoSolicitacao.get('/minhas-solicitacoes', authMiddleware_1.authMiddleware, solicitacaoController.minhasSolicitacoes);
routerServicoSolicitacao.get('/disponiveis', authMiddleware_1.authMiddleware, solicitacaoController.disponiveis);
routerServicoSolicitacao.get('/todas', authMiddleware_1.authMiddleware, isAdminMiddleware_1.isAdminMiddleware, solicitacaoController.listarTodas);
routerServicoSolicitacao.get('/quantidade', authMiddleware_1.authMiddleware, solicitacaoController.listarMinhasSolicitacoes);
// 3. Rotas com parâmetros dinâmicos (SEMPRE POR ÚLTIMO)
routerServicoSolicitacao.get('/:id', authMiddleware_1.authMiddleware, solicitacaoController.buscarPorId);
routerServicoSolicitacao.patch('/:id/escolher-prestador', authMiddleware_1.authMiddleware, solicitacaoController.escolherPrestador);
routerServicoSolicitacao.patch('/:id/status', authMiddleware_1.authMiddleware, solicitacaoController.atualizarStatus);
routerServicoSolicitacao.patch('/:id/progresso', authMiddleware_1.authMiddleware, solicitacaoController.atualizarProgresso);
routerServicoSolicitacao.post('/ignorar', authMiddleware_1.authMiddleware, ServicoIgnoradoController_1.ServicoIgnoradoController.ignorar);
exports.default = routerServicoSolicitacao;
