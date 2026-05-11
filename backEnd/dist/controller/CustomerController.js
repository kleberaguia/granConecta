"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CustomerService_1 = __importDefault(require("../services/CustomerService"));
class CustomerController {
    // GET: Listar todos os clientes
    async getAll(req, res) {
        try {
            const customers = await CustomerService_1.default.getAllCustomers();
            return res.json(customers);
        }
        catch (error) {
            console.error("Erro ao listar clientes:", error);
            return res.status(500).json({ message: "Erro interno ao listar clientes." });
        }
    }
    // GET: Buscar cliente por ID
    async getById(req, res) {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: "ID inválido." });
        }
        try {
            const customer = await CustomerService_1.default.getCustomerById(id);
            if (!customer) {
                return res.status(404).json({ message: "Cliente não encontrado." });
            }
            return res.json(customer);
        }
        catch (error) {
            console.error(`Erro ao buscar cliente ID ${id}:`, error);
            return res.status(500).json({ message: "Erro interno ao buscar cliente." });
        }
    }
    // POST: Criar novo cliente
    async create(req, res) {
        try {
            const newCustomer = await CustomerService_1.default.createCustomer(req.body);
            return res.status(201).json(newCustomer);
        }
        catch (error) {
            console.error("Erro ao criar cliente:", error);
            return res.status(500).json({ message: "Erro interno ao criar cliente." });
        }
    }
    // PUT: Atualizar cliente existente
    async update(req, res) {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: "ID inválido." });
        }
        try {
            const updatedCustomer = await CustomerService_1.default.updateCustomer(id, req.body);
            if (!updatedCustomer) {
                return res.status(404).json({ message: "Cliente não encontrado." });
            }
            return res.json(updatedCustomer);
        }
        catch (error) {
            console.error("Erro ao atualizar cliente:", error);
            return res.status(500).json({ message: "Erro interno ao atualizar cliente." });
        }
    }
    // DELETE: Remover cliente
    async delete(req, res) {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: "ID inválido." });
        }
        try {
            const deleted = await CustomerService_1.default.deleteCustomer(id);
            if (!deleted) {
                return res.status(404).json({ message: "Cliente não encontrado." });
            }
            return res.json({ message: "Cliente removido com sucesso." });
        }
        catch (error) {
            console.error("Erro ao deletar cliente:", error);
            return res.status(500).json({ message: "Erro interno ao deletar cliente." });
        }
    }
}
exports.default = new CustomerController();
