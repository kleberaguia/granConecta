"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const OrderItemService_1 = __importDefault(require("../services/OrderItemService"));
class OrderItemController {
    // GET: Listar todos os itens de pedido
    async getAll(req, res) {
        try {
            const items = await OrderItemService_1.default.getAllOrderItems();
            return res.json(items);
        }
        catch (error) {
            console.error("Erro ao listar itens de pedido:", error);
            return res.status(500).json({ message: "Erro interno ao listar itens de pedido." });
        }
    }
    // GET: Buscar item de pedido por ID
    async getById(req, res) {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: "ID inválido." });
        }
        try {
            const item = await OrderItemService_1.default.getOrderItemById(id);
            if (!item) {
                return res.status(404).json({ message: "Item de pedido não encontrado." });
            }
            return res.json(item);
        }
        catch (error) {
            console.error(`Erro ao buscar item de pedido ID ${id}:`, error);
            return res.status(500).json({ message: "Erro interno ao buscar item de pedido." });
        }
    }
    // POST: Criar novo item de pedido
    async create(req, res) {
        try {
            const newItem = await OrderItemService_1.default.createOrderItem(req.body);
            return res.status(201).json(newItem);
        }
        catch (error) {
            console.error("Erro ao criar item de pedido:", error);
            return res.status(500).json({ message: "Erro interno ao criar item de pedido." });
        }
    }
    // PUT: Atualizar item de pedido existente
    async update(req, res) {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: "ID inválido." });
        }
        try {
            const updatedItem = await OrderItemService_1.default.updateOrderItem(id, req.body);
            if (!updatedItem) {
                return res.status(404).json({ message: "Item de pedido não encontrado." });
            }
            return res.json(updatedItem);
        }
        catch (error) {
            console.error("Erro ao atualizar item de pedido:", error);
            return res.status(500).json({ message: "Erro interno ao atualizar item de pedido." });
        }
    }
    // DELETE: Remover item de pedido
    async delete(req, res) {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: "ID inválido." });
        }
        try {
            const deleted = await OrderItemService_1.default.deleteOrderItem(id);
            if (!deleted) {
                return res.status(404).json({ message: "Item de pedido não encontrado." });
            }
            return res.json({ message: "Item de pedido removido com sucesso." });
        }
        catch (error) {
            console.error("Erro ao deletar item de pedido:", error);
            return res.status(500).json({ message: "Erro interno ao deletar item de pedido." });
        }
    }
    // GET: Listar itens de um pedido específico
    async getByOrder(req, res) {
        const orderId = Number(req.params.orderId);
        if (isNaN(orderId)) {
            return res.status(400).json({ message: "ID de pedido inválido." });
        }
        try {
            const items = await OrderItemService_1.default.getOrderItemsByOrder(orderId);
            return res.json(items);
        }
        catch (error) {
            console.error(`Erro ao buscar itens do pedido ${orderId}:`, error);
            return res.status(500).json({ message: "Erro interno ao buscar itens do pedido." });
        }
    }
}
exports.default = new OrderItemController();
