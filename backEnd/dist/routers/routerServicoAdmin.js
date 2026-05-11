"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routers/routerServicoAdmin.ts
const express_1 = require("express");
const ServicoAdminController_1 = __importDefault(require("../controller/ServicoAdminController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const isAdminMiddleware_1 = require("../middlewares/isAdminMiddleware");
const SubscriptionController_1 = require("../controller/SubscriptionController");
const routerServicoAdmin = (0, express_1.Router)();
const subController = new SubscriptionController_1.SubscriptionController();
routerServicoAdmin.get("/servicos", authMiddleware_1.authMiddleware, isAdminMiddleware_1.isAdminMiddleware, ServicoAdminController_1.default.listar);
routerServicoAdmin.get("/servicos/:id", authMiddleware_1.authMiddleware, isAdminMiddleware_1.isAdminMiddleware, ServicoAdminController_1.default.detalhe);
routerServicoAdmin.get('/servicos/prestador/:id', authMiddleware_1.authMiddleware, isAdminMiddleware_1.isAdminMiddleware, ServicoAdminController_1.default.buscarPrestador);
routerServicoAdmin.patch('/servicos/prestador/:id/aprovar', authMiddleware_1.authMiddleware, isAdminMiddleware_1.isAdminMiddleware, ServicoAdminController_1.default.aprovarPrestador);
routerServicoAdmin.post('/admin/subscriptions/process-renewals', subController.triggerManualRenewal);
routerServicoAdmin.get("/credits/my-balance", authMiddleware_1.authMiddleware, subController.getMyBalance);
routerServicoAdmin.post("/subscriptions/request-refund", authMiddleware_1.authMiddleware, subController.requestWithdrawal);
exports.default = routerServicoAdmin;
