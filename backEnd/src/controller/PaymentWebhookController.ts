import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Order } from "../models/OrderModels";
import { getIO } from "../socket/socket";

const orderRepo = AppDataSource.getRepository(Order);

export class PaymentWebhookController {

  static async handleWebhook(req: Request, res: Response) {
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
      const io = getIO();

      io.to(`order_${order.id}`).emit("order_updated", {
        orderId: order.id,
        status: order.status
      });

      return res.json({ success: true });

    } catch (error) {
      console.error("Webhook error:", error);
      return res.status(500).json({ message: "Erro no webhook" });
    }
  }
}