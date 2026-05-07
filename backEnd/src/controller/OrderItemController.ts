import { Request, Response } from "express";
import OrderItemService from "../services/OrderItemService";

class OrderItemController {
  // GET: Listar todos os itens de pedido
  async getAll(req: Request, res: Response) {
    try {
      const items = await OrderItemService.getAllOrderItems();
      return res.json(items);
    } catch (error) {
      console.error("Erro ao listar itens de pedido:", error);
      return res.status(500).json({ message: "Erro interno ao listar itens de pedido." });
    }
  }

  // GET: Buscar item de pedido por ID
  async getById(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }

    try {
      const item = await OrderItemService.getOrderItemById(id);
      if (!item) {
        return res.status(404).json({ message: "Item de pedido não encontrado." });
      }
      return res.json(item);
    } catch (error) {
      console.error(`Erro ao buscar item de pedido ID ${id}:`, error);
      return res.status(500).json({ message: "Erro interno ao buscar item de pedido." });
    }
  }

  // POST: Criar novo item de pedido
  async create(req: Request, res: Response) {
    try {
      const newItem = await OrderItemService.createOrderItem(req.body);
      return res.status(201).json(newItem);
    } catch (error) {
      console.error("Erro ao criar item de pedido:", error);
      return res.status(500).json({ message: "Erro interno ao criar item de pedido." });
    }
  }

  // PUT: Atualizar item de pedido existente
  async update(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }

    try {
      const updatedItem = await OrderItemService.updateOrderItem(id, req.body);
      if (!updatedItem) {
        return res.status(404).json({ message: "Item de pedido não encontrado." });
      }
      return res.json(updatedItem);
    } catch (error) {
      console.error("Erro ao atualizar item de pedido:", error);
      return res.status(500).json({ message: "Erro interno ao atualizar item de pedido." });
    }
  }

  // DELETE: Remover item de pedido
  async delete(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }

    try {
      const deleted = await OrderItemService.deleteOrderItem(id);
      if (!deleted) {
        return res.status(404).json({ message: "Item de pedido não encontrado." });
      }
      return res.json({ message: "Item de pedido removido com sucesso." });
    } catch (error) {
      console.error("Erro ao deletar item de pedido:", error);
      return res.status(500).json({ message: "Erro interno ao deletar item de pedido." });
    }
  }

  // GET: Listar itens de um pedido específico
  async getByOrder(req: Request, res: Response) {
    const orderId = Number(req.params.orderId);
    if (isNaN(orderId)) {
      return res.status(400).json({ message: "ID de pedido inválido." });
    }

    try {
      const items = await OrderItemService.getOrderItemsByOrder(orderId);
      return res.json(items);
    } catch (error) {
      console.error(`Erro ao buscar itens do pedido ${orderId}:`, error);
      return res.status(500).json({ message: "Erro interno ao buscar itens do pedido." });
    }
  }
}

export default new OrderItemController();
