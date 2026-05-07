import { AppDataSource } from "../config/data-source";
import { OrderItem } from "../models/OrderItemModels";

const itemRepo = AppDataSource.getRepository(OrderItem);

export default {
  async getAllOrderItems() {
    return await itemRepo.find({ relations: ["order", "produto"] });
  },

  async getOrderItemById(id: number) {
    return await itemRepo.findOne({ where: { id }, relations: ["order", "produto"] });
  },

  async createOrderItem(data: Partial<OrderItem>) {
    const item = itemRepo.create(data);
    return await itemRepo.save(item);
  },

  async updateOrderItem(id: number, data: Partial<OrderItem>) {
    const item = await itemRepo.findOne({ where: { id } });
    if (!item) return null;
    itemRepo.merge(item, data);
    return await itemRepo.save(item);
  },

  async deleteOrderItem(id: number) {
    const result = await itemRepo.delete(id);
    return result.affected && result.affected > 0;
  },

  async getOrderItemsByOrder(orderId: number) {
    return await itemRepo.find({ where: { order: { id: orderId } }, relations: ["produto"] });
  }
};
