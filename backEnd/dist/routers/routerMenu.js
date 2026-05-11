"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// Ajuste os caminhos dos imports conforme sua estrutura
const authMiddleware_1 = require("../middlewares/authMiddleware");
const menuController_1 = __importDefault(require("../controller/menuController"));
const routerMenu = (0, express_1.Router)();
// 1. Rota GET (Para ler o menu)
// Caminho final: /api/menu
routerMenu.get('/', menuController_1.default.index);
// 2. Rota POST (Para salvar) - OPÇÃO 1: Com /store
// Caminho final: /api/menu/store
routerMenu.post('/store', authMiddleware_1.authMiddleware, menuController_1.default.store);
// 3. Rota POST (Para salvar) - OPÇÃO 2: Raiz (Backup)
// Caminho final: /api/menu
// Isso garante que se você tirar o /store do front, continua funcionando
routerMenu.post('/', authMiddleware_1.authMiddleware, menuController_1.default.store);
exports.default = routerMenu;
