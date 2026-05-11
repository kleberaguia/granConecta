"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const PermissionService_1 = __importDefault(require("../services/PermissionService"));
class PermissionController {
    // GET: Listar todas as permissões
    async getAll(req, res) {
        try {
            const permissions = await PermissionService_1.default.getAllPermissions();
            return res.json(permissions);
        }
        catch (error) {
            console.error("Erro ao listar permissões:", error);
            return res.status(500).json({ message: "Erro interno ao listar permissões." });
        }
    }
    // GET: Buscar permissão por ID
    async getById(req, res) {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: "ID inválido." });
        }
        try {
            const permission = await PermissionService_1.default.getPermissionById(id);
            if (!permission) {
                return res.status(404).json({ message: "Permissão não encontrada." });
            }
            return res.json(permission);
        }
        catch (error) {
            console.error(`Erro ao buscar permissão ID ${id}:`, error);
            return res.status(500).json({ message: "Erro interno ao buscar permissão." });
        }
    }
    // POST: Criar nova permissão
    async create(req, res) {
        try {
            const newPermission = await PermissionService_1.default.createPermission(req.body);
            return res.status(201).json(newPermission);
        }
        catch (error) {
            console.error("Erro ao criar permissão:", error);
            return res.status(500).json({ message: "Erro interno ao criar permissão." });
        }
    }
    // PUT: Atualizar permissão existente
    async update(req, res) {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: "ID inválido." });
        }
        try {
            const updatedPermission = await PermissionService_1.default.updatePermission(id, req.body);
            if (!updatedPermission) {
                return res.status(404).json({ message: "Permissão não encontrada." });
            }
            return res.json(updatedPermission);
        }
        catch (error) {
            console.error("Erro ao atualizar permissão:", error);
            return res.status(500).json({ message: "Erro interno ao atualizar permissão." });
        }
    }
    // DELETE: Remover permissão
    async delete(req, res) {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: "ID inválido." });
        }
        try {
            const deleted = await PermissionService_1.default.deletePermission(id);
            if (!deleted) {
                return res.status(404).json({ message: "Permissão não encontrada." });
            }
            return res.json({ message: "Permissão removida com sucesso." });
        }
        catch (error) {
            console.error("Erro ao deletar permissão:", error);
            return res.status(500).json({ message: "Erro interno ao deletar permissão." });
        }
    }
}
exports.default = new PermissionController();
