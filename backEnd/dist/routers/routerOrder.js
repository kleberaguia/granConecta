"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.routerOrder = void 0;
const express_1 = __importDefault(require("express"));
const OrderController_1 = require("../controller/OrderController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const ensureIsStoreOwner_1 = require("../middlewares/ensureIsStoreOwner");
exports.routerOrder = express_1.default.Router();
const orderController = new OrderController_1.OrderController();
// =========================
// CLIENTE
// =========================
// Meus pedidos (cliente)
exports.routerOrder.get("/orders/my", authMiddleware_1.authMiddleware, orderController.getMyOrders);
// Criar pedido
exports.routerOrder.post("/orders", authMiddleware_1.authMiddleware, orderController.create);
// =========================
// LOJISTA / PRESTADOR
// =========================
// Pedidos da minha loja
exports.routerOrder.get("/orders/store", authMiddleware_1.authMiddleware, ensureIsStoreOwner_1.ensureIsStoreOwner, orderController.getMyStoreOrders);
exports.routerOrder.get("/orders/:id", authMiddleware_1.authMiddleware, orderController.getOrderDetail);
// Atualizar status do pedido
exports.routerOrder.patch("/orders/:id/status", authMiddleware_1.authMiddleware, ensureIsStoreOwner_1.ensureIsStoreOwner, orderController.updateStatus);
