import { Request, Response } from "express";
import CustomerService from "../services/CustomerService";

class CustomerController {
  // GET: Listar todos os clientes
  async getAll(req: Request, res: Response) {
    try {
      const customers = await CustomerService.getAllCustomers();
      return res.json(customers);
    } catch (error) {
      console.error("Erro ao listar clientes:", error);
      return res.status(500).json({ message: "Erro interno ao listar clientes." });
    }
  }

  // GET: Buscar cliente por ID
  async getById(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }

    try {
      const customer = await CustomerService.getCustomerById(id);
      if (!customer) {
        return res.status(404).json({ message: "Cliente não encontrado." });
      }
      return res.json(customer);
    } catch (error) {
      console.error(`Erro ao buscar cliente ID ${id}:`, error);
      return res.status(500).json({ message: "Erro interno ao buscar cliente." });
    }
  }

  // POST: Criar novo cliente
  async create(req: Request, res: Response) {
    try {
      const newCustomer = await CustomerService.createCustomer(req.body);
      return res.status(201).json(newCustomer);
    } catch (error) {
      console.error("Erro ao criar cliente:", error);
      return res.status(500).json({ message: "Erro interno ao criar cliente." });
    }
  }

  // PUT: Atualizar cliente existente
  async update(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }

    try {
      const updatedCustomer = await CustomerService.updateCustomer(id, req.body);
      if (!updatedCustomer) {
        return res.status(404).json({ message: "Cliente não encontrado." });
      }
      return res.json(updatedCustomer);
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);
      return res.status(500).json({ message: "Erro interno ao atualizar cliente." });
    }
  }

  // DELETE: Remover cliente
  async delete(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }

    try {
      const deleted = await CustomerService.deleteCustomer(id);
      if (!deleted) {
        return res.status(404).json({ message: "Cliente não encontrado." });
      }
      return res.json({ message: "Cliente removido com sucesso." });
    } catch (error) {
      console.error("Erro ao deletar cliente:", error);
      return res.status(500).json({ message: "Erro interno ao deletar cliente." });
    }
  }
}

export default new CustomerController();
