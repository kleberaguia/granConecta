import { Request, Response } from "express";
import RoleService from "../services/RoleService";

class RoleController {
  // GET: Listar todos os roles
  async getAll(req: Request, res: Response) {
    try {
      const roles = await RoleService.getAllRoles();
      return res.json(roles);
    } catch (error) {
      console.error("Erro ao listar roles:", error);
      return res.status(500).json({ message: "Erro interno ao listar roles." });
    }
  }

  // GET: Buscar role por ID
  async getById(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }

    try {
      const role = await RoleService.getRoleById(id);
      if (!role) {
        return res.status(404).json({ message: "Role não encontrado." });
      }
      return res.json(role);
    } catch (error) {
      console.error(`Erro ao buscar role ID ${id}:`, error);
      return res.status(500).json({ message: "Erro interno ao buscar role." });
    }
  }

  // POST: Criar novo role
  async create(req: Request, res: Response) {
    try {
      const newRole = await RoleService.createRole(req.body);
      return res.status(201).json(newRole);
    } catch (error) {
      console.error("Erro ao criar role:", error);
      return res.status(500).json({ message: "Erro interno ao criar role." });
    }
  }

  // PUT: Atualizar role existente
  async update(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }

    try {
      const updatedRole = await RoleService.updateRole(id, req.body);
      if (!updatedRole) {
        return res.status(404).json({ message: "Role não encontrado." });
      }
      return res.json(updatedRole);
    } catch (error) {
      console.error("Erro ao atualizar role:", error);
      return res.status(500).json({ message: "Erro interno ao atualizar role." });
    }
  }

  // DELETE: Remover role
  async delete(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }

    try {
      const deleted = await RoleService.deleteRole(id);
      if (!deleted) {
        return res.status(404).json({ message: "Role não encontrado." });
      }
      return res.json({ message: "Role removido com sucesso." });
    } catch (error) {
      console.error("Erro ao deletar role:", error);
      return res.status(500).json({ message: "Erro interno ao deletar role." });
    }
  }
}

export default new RoleController();
