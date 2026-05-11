"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routers/servicoCandidatura.routes.ts
const express_1 = require("express");
const ServicoCandidaturaController_1 = __importDefault(require("../controller/ServicoCandidaturaController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const routerServicoCandidatura = (0, express_1.Router)();
routerServicoCandidatura.post('/candidaturas', authMiddleware_1.authMiddleware, ServicoCandidaturaController_1.default.candidatar);
routerServicoCandidatura.get('/candidaturas/:solicitacaoId', authMiddleware_1.authMiddleware, ServicoCandidaturaController_1.default.listarPorSolicitacao);
routerServicoCandidatura.get('/candidaturas/minhas', authMiddleware_1.authMiddleware, ServicoCandidaturaController_1.default.listarMinhas);
routerServicoCandidatura.delete('/:candidaturaId', authMiddleware_1.authMiddleware, ServicoCandidaturaController_1.default.retirar);
routerServicoCandidatura.post("/candidaturas/aceitar", authMiddleware_1.authMiddleware, ServicoCandidaturaController_1.default.aceitarProposta);
routerServicoCandidatura.post('/candidaturas/proposta', authMiddleware_1.authMiddleware, ServicoCandidaturaController_1.default.enviarProposta);
routerServicoCandidatura.post('/candidaturas/recusar', authMiddleware_1.authMiddleware, ServicoCandidaturaController_1.default.recusarProposta);
exports.default = routerServicoCandidatura;
