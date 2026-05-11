"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CondominioController_1 = __importDefault(require("../controller/CondominioController")); // Ajuste o caminho se necessário
const authMiddleware_1 = require("../middlewares/authMiddleware");
const isAdminMiddleware_1 = require("../middlewares/isAdminMiddleware");
const routerCondominio = (0, express_1.Router)();
const condominioController = new CondominioController_1.default();
routerCondominio.get('/', condominioController.index);
routerCondominio.get('/:id', condominioController.getIdCondominio);
routerCondominio.post("/validar-codigo", condominioController.validarCodigo);
routerCondominio.post('/novo', authMiddleware_1.authMiddleware, isAdminMiddleware_1.isAdminMiddleware, condominioController.create);
exports.default = routerCondominio;
