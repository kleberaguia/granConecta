"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routers/servicoOferta.routes.ts
const express_1 = require("express");
const ServicoOfertaController_1 = __importDefault(require("../controller/ServicoOfertaController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const routerServicoOferta = (0, express_1.Router)();
routerServicoOferta.post('/por-candidatura', authMiddleware_1.authMiddleware, ServicoOfertaController_1.default.criarPorCandidatura);
routerServicoOferta.post('/:ofertaId/aceitar', authMiddleware_1.authMiddleware, ServicoOfertaController_1.default.aceitar);
routerServicoOferta.post('/:ofertaId/iniciar', authMiddleware_1.authMiddleware, ServicoOfertaController_1.default.iniciar);
routerServicoOferta.post('/:ofertaId/concluir', authMiddleware_1.authMiddleware, ServicoOfertaController_1.default.concluir);
routerServicoOferta.get('/listarOferta/meus', authMiddleware_1.authMiddleware, ServicoOfertaController_1.default.listarMinhasOfertas);
routerServicoOferta.get('/meus', authMiddleware_1.authMiddleware, ServicoOfertaController_1.default.listarPorPrestador);
exports.default = routerServicoOferta;
