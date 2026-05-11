"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_source_1 = require("../config/data-source");
const OrderItemModels_1 = require("../models/OrderItemModels");
const itemRepo = data_source_1.AppDataSource.getRepository(OrderItemModels_1.OrderItem);
exports.default = {
    async getAllOrderItems() {
        return await itemRepo.find({ relations: ["order", "produto"] });
    },
    async getOrderItemById(id) {
        return await itemRepo.findOne({ where: { id }, relations: ["order", "produto"] });
    },
    async createOrderItem(data) {
        const item = itemRepo.create(data);
        return await itemRepo.save(item);
    },
    async updateOrderItem(id, data) {
        const item = await itemRepo.findOne({ where: { id } });
        if (!item)
            return null;
        itemRepo.merge(item, data);
        return await itemRepo.save(item);
    },
    async deleteOrderItem(id) {
        const result = await itemRepo.delete(id);
        return result.affected && result.affected > 0;
    },
    async getOrderItemsByOrder(orderId) {
        return await itemRepo.find({ where: { order: { id: orderId } }, relations: ["produto"] });
    }
};
