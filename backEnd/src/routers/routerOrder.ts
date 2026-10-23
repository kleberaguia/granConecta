import express from 'express';
import { OrderController } from "../controller/OrderController";
import { authMiddleware } from '../middlewares/authMiddleware';
import { ensureIsStoreOwner } from '../middlewares/ensureIsStoreOwner';

export const routerOrder = express.Router();
const orderController = new OrderController();

// =========================
// CLIENTE
// =========================

// Meus pedidos (cliente)
routerOrder.get("/orders/my", authMiddleware, orderController.getMyOrders);

// Criar pedido
routerOrder.post(
  "/orders",
 
  orderController.create
);


// =========================
// LOJISTA / PRESTADOR
// =========================

// Pedidos da minha loja
routerOrder.get(
  "/orders/store",
  authMiddleware,
  ensureIsStoreOwner,
  orderController.getMyStoreOrders
);

routerOrder.get(
  "/orders/:id",
  authMiddleware,
  orderController.getOrderDetail
);

// Atualizar status do pedido
routerOrder.patch(
  "/orders/:id/status",
  authMiddleware,
  ensureIsStoreOwner,
  orderController.updateStatus
);