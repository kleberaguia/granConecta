import express from 'express'
import OrderItemController from "../controller/OrderItemController";

export const routerOrderItem =  express.Router()

routerOrderItem.get("/order-items", OrderItemController.getAll);
routerOrderItem.get("/order-items/:id", OrderItemController.getById);
routerOrderItem.post("/order-items", OrderItemController.create);
routerOrderItem.put("/order-items/:id", OrderItemController.update);
routerOrderItem.delete("/order-items/:id", OrderItemController.delete);
routerOrderItem.get("/order-items/order/:orderId", OrderItemController.getByOrder);