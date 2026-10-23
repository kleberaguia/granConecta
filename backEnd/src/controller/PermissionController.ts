import { Request, Response } from "express";
import PermissionService from "../services/PermissionService";

class PermissionController {
  // GET: Listar todas as permissões
  async getAll(req: Request, res: Response) {
    try {
      const permissions = await PermissionService.getAllPermissions();
      return res.json(permissions);
    } catch (error) {
      console.error("Erro ao listar permissões:", error);
      return res.status(500).json({ message: "Erro interno ao listar permissões." });
    }
  }

  // GET: Buscar permissão por ID
  async getById(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }

    try {
      const permission = await PermissionService.getPermissionById(id);
      if (!permission) {
        return res.status(404).json({ message: "Permissão não encontrada." });
      }
      return res.json(permission);
    } catch (error) {
      console.error(`Erro ao buscar permissão ID ${id}:`, error);
      return res.status(500).json({ message: "Erro interno ao buscar permissão." });
    }
  }

  // POST: Criar nova permissão
  async create(req: Request, res: Response) {
    try {
      const newPermission = await PermissionService.createPermission(req.body);
      return res.status(201).json(newPermission);
    } catch (error) {
      console.error("Erro ao criar permissão:", error);
      return res.status(500).json({ message: "Erro interno ao criar permissão." });
    }
  }

  // PUT: Atualizar permissão existente
  async update(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }

    try {
      const updatedPermission = await PermissionService.updatePermission(id, req.body);
      if (!updatedPermission) {
        return res.status(404).json({ message: "Permissão não encontrada." });
      }
      return res.json(updatedPermission);
    } catch (error) {
      console.error("Erro ao atualizar permissão:", error);
      return res.status(500).json({ message: "Erro interno ao atualizar permissão." });
    }
  }

  // DELETE: Remover permissão
  async delete(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }

    try {
      const deleted = await PermissionService.deletePermission(id);
      if (!deleted) {
        return res.status(404).json({ message: "Permissão não encontrada." });
      }
      return res.json({ message: "Permissão removida com sucesso." });
    } catch (error) {
      console.error("Erro ao deletar permissão:", error);
      return res.status(500).json({ message: "Erro interno ao deletar permissão." });
    }
  }
}

export default new PermissionController();
