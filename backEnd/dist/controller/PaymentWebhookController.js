"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentWebhookController = void 0;
const data_source_1 = require("../config/data-source");
const OrderModels_1 = require("../models/OrderModels");
const socket_1 = require("../socket/socket");
const orderRepo = data_source_1.AppDataSource.getRepository(OrderModels_1.Order);
class PaymentWebhookController {
    static async handleWebhook(req, res) {
        try {
            const { orderId, status } = req.body;
            if (!orderId) {
                return res.status(400).json({ message: "orderId obrigatório" });
            }
            const order = await orderRepo.findOne({
                where: { id: Number(orderId) }
            });
            if (!order) {
                return res.status(404).json({ message: "Pedido não encontrado" });
            }
            // Atualiza status
            order.status = status || "PAID";
            await orderRepo.save(order);
            // 🚀 SOCKET
            const io = (0, socket_1.getIO)();
            io.to(`order_${order.id}`).emit("order_updated", {
                orderId: order.id,
                status: order.status
            });
            return res.json({ success: true });
        }
        catch (error) {
            console.error("Webhook error:", error);
            return res.status(500).json({ message: "Erro no webhook" });
        }
    }
}
exports.PaymentWebhookController = PaymentWebhookController;
