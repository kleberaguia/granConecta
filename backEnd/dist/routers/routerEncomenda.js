"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware"); // Seu middleware de JWT
const EncomendaController_1 = __importDefault(require("../controller/EncomendaController"));
const routerEncomenda = (0, express_1.Router)();
routerEncomenda.get('/meus-pacotes', authMiddleware_1.authMiddleware, ((req, res) => EncomendaController_1.default.getMeusPacotes(req, res)));
routerEncomenda.post('/newEncomenda', authMiddleware_1.authMiddleware, ((req, res) => EncomendaController_1.default.store(req, res)));
routerEncomenda.patch('/:id/retirada', authMiddleware_1.authMiddleware, ((req, res) => EncomendaController_1.default.darBaixa(req, res)));
exports.default = routerEncomenda;
