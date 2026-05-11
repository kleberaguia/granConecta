"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/adminRoutes.ts
const express_1 = require("express");
const AdminController_1 = __importDefault(require("../controller/AdminController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const isAdminMiddleware_1 = require("../middlewares/isAdminMiddleware");
// import { isAdmin } from '../middlewares/authMiddleware'; 
const routerAdmin = (0, express_1.Router)();
// Estatísticas e Listagem
routerAdmin.get('/stats', AdminController_1.default.getStats);
routerAdmin.get('/assinaturas', AdminController_1.default.getSubscriptions);
// Gestão de Reembolsos/Saques
routerAdmin.get('/refund-requests', AdminController_1.default.getRefundRequests);
routerAdmin.post('/refunds/:id/process', AdminController_1.default.processRefund);
// Rota para confirmar o pagamento (Botão BAIXA PAGO)
routerAdmin.patch('/prestadores/:id/pagamento', authMiddleware_1.authMiddleware, isAdminMiddleware_1.isAdminMiddleware, AdminController_1.default.confirmPayment);
routerAdmin.patch('/usuarios/:usuarioId/status_conta', authMiddleware_1.authMiddleware, isAdminMiddleware_1.isAdminMiddleware, AdminController_1.default.aprovarEmpreendedor);
routerAdmin.post('/refunds/:id/process', authMiddleware_1.authMiddleware, AdminController_1.default.processRefund);
routerAdmin.get('/prestadores/aprovacao', AdminController_1.default.listarPrestadoresParaAprovacao);
exports.default = routerAdmin;
