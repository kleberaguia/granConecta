"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.routerOrderItem = void 0;
const express_1 = __importDefault(require("express"));
const OrderItemController_1 = __importDefault(require("../controller/OrderItemController"));
exports.routerOrderItem = express_1.default.Router();
exports.routerOrderItem.get("/order-items", OrderItemController_1.default.getAll);
exports.routerOrderItem.get("/order-items/:id", OrderItemController_1.default.getById);
exports.routerOrderItem.post("/order-items", OrderItemController_1.default.create);
exports.routerOrderItem.put("/order-items/:id", OrderItemController_1.default.update);
exports.routerOrderItem.delete("/order-items/:id", OrderItemController_1.default.delete);
exports.routerOrderItem.get("/order-items/order/:orderId", OrderItemController_1.default.getByOrder);
