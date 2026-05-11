"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const NotificationController_1 = __importDefault(require("../controller/NotificationController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const routerNotificacao = (0, express_1.Router)();
routerNotificacao.post("/notificacoes", authMiddleware_1.authMiddleware, NotificationController_1.default.enviar);
routerNotificacao.get("/notificacoes", authMiddleware_1.authMiddleware, NotificationController_1.default.listar);
routerNotificacao.put("/marcar/:id", authMiddleware_1.authMiddleware, NotificationController_1.default.marcarComoLida);
routerNotificacao.put("/marcar-todas", authMiddleware_1.authMiddleware, NotificationController_1.default.marcarTodas);
routerNotificacao.delete("/:id", authMiddleware_1.authMiddleware, NotificationController_1.default.excluir);
exports.default = routerNotificacao;
